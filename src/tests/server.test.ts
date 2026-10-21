import test from "node:test";
import assert from "node:assert/strict";
import { McpServer } from "../server.js";
import { LmStudioClient } from "../lmstudio-client.js";
import type { JsonRpcResponseSuccess } from "../types.js";

test("McpServer handles initialize, ping and tools/list requests", async () => {
  const responses: string[] = [];
  const fakeClient = {
    getBaseUrl: () => "http://test-server:1234",
  } as unknown as LmStudioClient;

  const server = new McpServer(fakeClient);

  // Hook sendResponse by mocking process.stdout.write
  const origStdoutWrite = process.stdout.write;
  try {
    process.stdout.write = ((chunk: unknown) => {
      responses.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;

    await server.handleRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
    });

    const initResp = JSON.parse(responses[0]!) as JsonRpcResponseSuccess;
    assert.equal(initResp.id, 1);
    assert.equal(
      (initResp.result as { serverInfo: { name: string } }).serverInfo.name,
      "lmstudio-mcp-connector"
    );

    await server.handleRequest({
      jsonrpc: "2.0",
      id: 2,
      method: "ping",
    });

    const pingResp = JSON.parse(responses[1]!) as JsonRpcResponseSuccess;
    assert.equal(pingResp.id, 2);

    await server.handleRequest({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/list",
    });

    const toolsResp = JSON.parse(responses[2]!) as JsonRpcResponseSuccess;
    assert.equal(toolsResp.id, 3);
    assert.ok(Array.isArray((toolsResp.result as { tools: unknown[] }).tools));
    assert.equal((toolsResp.result as { tools: unknown[] }).tools.length, 4);
  } finally {
    process.stdout.write = origStdoutWrite;
  }
});
