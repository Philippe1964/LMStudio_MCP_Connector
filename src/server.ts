/**
 * [AI-GENERATED FILE]
 * Ce fichier a été généré et structuré avec l'assistance d'une Intelligence Artificielle
 * (Google Antigravity / Gemini 3.8 Flash & LM Studio local).
 * Vérifié et validé par le Quality Gate strict (TypeScript strict, suites de tests).
 *
 * Model Context Protocol (MCP) Server with Stdio JSON-RPC Transport
 */

import readline from "node:readline";
import type { LmStudioClient } from "./lmstudio-client.js";
import type { PoolManager } from "./pool-manager.js";
import { MCP_TOOLS, executeTool } from "./tools.js";
import type {
  JsonRpcErrorObject,
  JsonRpcNotification,
  JsonRpcRequest,
  JsonRpcResponse,
} from "./types.js";

export class McpServer {
  private readonly target: LmStudioClient | PoolManager;
  private daemonUrl: string | null = null;
  private inFlightCount = 0;
  private isClosed = false;

  constructor(target: LmStudioClient | PoolManager, daemonUrl?: string | null) {
    this.target = target;
    this.daemonUrl = daemonUrl ?? null;
  }

  public getTarget(): LmStudioClient | PoolManager {
    return this.target;
  }

  public setDaemonUrl(url: string | null): void {
    this.daemonUrl = url ? url.replace(/\/+$/, "") : null;
  }

  public getDaemonUrl(): string | null {
    return this.daemonUrl;
  }

  public static async probeDaemon(url: string, timeoutMs = 300): Promise<boolean> {
    try {
      const cleanUrl = url.replace(/\/+$/, "");
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(`${cleanUrl}/api/status`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      return res.ok;
    } catch {
      return false;
    }
  }

  public async processRpcRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    // If daemon URL is configured and active, forward RPC request to daemon
    if (this.daemonUrl) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 60000);
        const res = await fetch(`${this.daemonUrl}/mcp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (res.ok) {
          return (await res.json()) as JsonRpcResponse;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(
          `[lmstudio-mcp] Forwarding to daemon (${this.daemonUrl}) failed (${msg}). Falling back to local execution.`
        );
      }
    }

    const { id, method, params } = request;

    try {
      switch (method) {
        case "initialize":
          return {
            jsonrpc: "2.0",
            id,
            result: {
              protocolVersion: "2024-11-05",
              capabilities: {
                tools: {},
              },
              serverInfo: {
                name: "lmstudio-mcp-connector",
                version: "2.0.0",
              },
            },
          };

        case "ping":
          return {
            jsonrpc: "2.0",
            id,
            result: {},
          };

        case "tools/list":
          return {
            jsonrpc: "2.0",
            id,
            result: {
              tools: MCP_TOOLS,
            },
          };

        case "tools/call": {
          const toolName = typeof params?.["name"] === "string" ? params["name"] : "";
          const toolArgs =
            params?.["arguments"] && typeof params["arguments"] === "object"
              ? (params["arguments"] as Record<string, unknown>)
              : {};

          const result = await executeTool(this.target, toolName, toolArgs);
          return {
            jsonrpc: "2.0",
            id,
            result,
          };
        }

        default:
          return {
            jsonrpc: "2.0",
            id,
            error: {
              code: -32601,
              message: `Method not found: ${method}`,
            },
          };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[lmstudio-mcp] Error handling RPC method ${method}:`, msg);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: `Error: ${msg}`,
            },
          ],
          isError: true,
        },
      };
    }
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
    const response = await this.processRpcRequest(request);
    process.stdout.write(JSON.stringify(response) + "\n");
  }

  public start(): void {
    const isPool = "getPoolReport" in this.target;
    if (isPool) {
      (this.target as PoolManager).startHealthCheck();
      console.error("[lmstudio-mcp] Stdio MCP Server running with Multi-Instance Pool Manager.");
    } else {
      console.error(
        `[lmstudio-mcp] Stdio MCP Server running with target: ${(this.target as LmStudioClient).getBaseUrl()}...`
      );
    }

    const checkExit = () => {
      if (this.isClosed && this.inFlightCount === 0) {
        console.error("[lmstudio-mcp] Stdio stream closed, exiting.");
        if (isPool) {
          (this.target as PoolManager).destroy();
        }
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
      if (isPool) {
        (this.target as PoolManager).destroy();
      }
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      console.error("[lmstudio-mcp] Received SIGTERM, shutting down...");
      if (isPool) {
        (this.target as PoolManager).destroy();
      }
      process.exit(0);
    });
  }
}
