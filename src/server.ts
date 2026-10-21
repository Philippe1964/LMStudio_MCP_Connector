/**
 * Model Context Protocol (MCP) Server with Stdio JSON-RPC Transport
 */

import readline from "node:readline";
import type { LmStudioClient } from "./lmstudio-client.js";
import { MCP_TOOLS, executeTool } from "./tools.js";
import type {
  JsonRpcErrorObject,
  JsonRpcNotification,
  JsonRpcRequest,
  JsonRpcResponse,
} from "./types.js";

export class McpServer {
  private readonly client: LmStudioClient;
  private inFlightCount = 0;
  private isClosed = false;

  constructor(client: LmStudioClient) {
    this.client = client;
  }

  public sendResponse(id: string | number, result: unknown): void {
    const response: JsonRpcResponse = {
      jsonrpc: "2.0",
      id,
      result,
    };
    process.stdout.write(JSON.stringify(response) + "\n");
  }

  public sendError(id: string | number | null, code: number, message: string, data?: unknown): void {
    const error: JsonRpcErrorObject = {
      code,
      message,
      ...(data !== undefined ? { data } : {}),
    };
    const response: JsonRpcResponse = {
      jsonrpc: "2.0",
      id,
      error,
    };
    process.stdout.write(JSON.stringify(response) + "\n");
  }

  public async handleRequest(request: JsonRpcRequest): Promise<void> {
    const { id, method, params } = request;

    try {
      switch (method) {
        case "initialize":
          this.sendResponse(id, {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: "lmstudio-mcp-connector",
              version: "1.0.0",
            },
          });
          break;

        case "ping":
          this.sendResponse(id, {});
          break;

        case "tools/list":
          this.sendResponse(id, {
            tools: MCP_TOOLS,
          });
          break;

        case "tools/call": {
          const toolName = typeof params?.["name"] === "string" ? params["name"] : "";
          const toolArgs =
            params?.["arguments"] && typeof params["arguments"] === "object"
              ? (params["arguments"] as Record<string, unknown>)
              : {};

          const result = await executeTool(this.client, toolName, toolArgs);
          this.sendResponse(id, result);
          break;
        }

        default:
          this.sendError(id, -32601, `Method not found: ${method}`);
          break;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[lmstudio-mcp] Error handling RPC method ${method}:`, msg);
      this.sendResponse(id, {
        content: [
          {
            type: "text",
            text: `Error: ${msg}`,
          },
        ],
        isError: true,
      });
    }
  }

  public start(): void {
    console.error(
      `[lmstudio-mcp] Server starting with LM Studio target: ${this.client.getBaseUrl()}...`
    );

    const checkExit = () => {
      if (this.isClosed && this.inFlightCount === 0) {
        console.error("[lmstudio-mcp] Stdio stream closed, exiting.");
        process.exit(0);
      }
    };

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    rl.on("line", async (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let parsed: unknown;
      try {
        parsed = JSON.parse(trimmed);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[lmstudio-mcp] JSON parse error:", msg);
        this.sendError(null, -32700, "Parse error");
        return;
      }

      if (!parsed || typeof parsed !== "object") {
        this.sendError(null, -32600, "Invalid Request");
        return;
      }

      const req = parsed as Partial<JsonRpcRequest & JsonRpcNotification>;

      // Notifications (no id)
      if (req.id === undefined || req.id === null) {
        if (req.method === "notifications/initialized") {
          console.error("[lmstudio-mcp] Client initialized notification received.");
        }
        return;
      }

      this.inFlightCount++;
      try {
        await this.handleRequest(req as JsonRpcRequest);
      } finally {
        this.inFlightCount--;
        checkExit();
      }
    });

    rl.on("close", () => {
      this.isClosed = true;
      checkExit();
    });

    process.on("SIGINT", () => {
      console.error("[lmstudio-mcp] Received SIGINT, shutting down...");
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      console.error("[lmstudio-mcp] Received SIGTERM, shutting down...");
      process.exit(0);
    });
  }
}

