/**
 * [AI-GENERATED FILE]
 * Ce fichier de tests a été généré avec l'assistance d'une Intelligence Artificielle
 * (Google Antigravity / Gemini 3.8 Flash & LM Studio local).
 */

import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { McpServer } from "../server.js";
import { LmStudioClient } from "../lmstudio-client.js";
import type { JsonRpcResponseSuccess, JsonRpcRequest } from "../types.js";

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
    assert.equal((toolsResp.result as { tools: unknown[] }).tools.length, 5);
  } finally {
    process.stdout.write = origStdoutWrite;
  }
});

test("McpServer probeDaemon detects unreachable and reachable daemon", async () => {
  const unreachable = await McpServer.probeDaemon("http://127.0.0.1:59999", 100);
  assert.equal(unreachable, false);

  const testServer = http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  });

  await new Promise<void>((resolve) => testServer.listen(19998, () => resolve()));

  try {
    const reachable = await McpServer.probeDaemon("http://127.0.0.1:19998", 500);
    assert.equal(reachable, true);
  } finally {
    await new Promise<void>((resolve) => testServer.close(() => resolve()));
  }
});

test("McpServer forwards RPC requests to daemonUrl when configured", async () => {
  let receivedMethod = "";
  const mockDaemon = http.createServer(async (req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const parsed = JSON.parse(body) as JsonRpcRequest;
      receivedMethod = parsed.method;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          jsonrpc: "2.0",
          id: parsed.id,
          result: { proxied: true, method: parsed.method },
        })
      );
    });
  });

  await new Promise<void>((resolve) => mockDaemon.listen(19997, () => resolve()));

  try {
    const fakeClient = {} as unknown as LmStudioClient;
    const server = new McpServer(fakeClient, "http://127.0.0.1:19997");

    const res = await server.processRpcRequest({
      jsonrpc: "2.0",
      id: "proxy-test",
      method: "ping",
    });

    assert.equal(receivedMethod, "ping");
    assert.equal(
      (res as JsonRpcResponseSuccess).result &&
        ((res as JsonRpcResponseSuccess).result as { proxied: boolean }).proxied,
      true
    );
  } finally {
    await new Promise<void>((resolve) => mockDaemon.close(() => resolve()));
  }
});
