import test from "node:test";
import assert from "node:assert/strict";
import { DaemonServer } from "../daemon-server.js";
import { PoolManager } from "../pool-manager.js";
import { McpServer } from "../server.js";
import { parseCliAndEnvConfig } from "../config.js";

test("DaemonServer exposes Web GUI, REST status API and JSON-RPC /mcp endpoint", async () => {
  const testPort = 19123;
  const config = parseCliAndEnvConfig([
    "--daemon-port",
    String(testPort),
    "--instances",
    "http://127.0.0.1:1234",
    "--timeout",
    "100",
  ]);

  const pool = new PoolManager(config);
  const mcpServer = new McpServer(pool);
  const daemon = new DaemonServer(testPort, pool, mcpServer);

  await daemon.start();

  try {
    // 1. Web GUI Dashboard
    const guiRes = await fetch(`http://127.0.0.1:${testPort}/`);
    assert.equal(guiRes.status, 200);
    assert.match(guiRes.headers.get("content-type") || "", /text\/html/);
    const html = await guiRes.text();
    assert.ok(html.includes("LM Studio MCP Connector"));
    assert.ok(html.includes("ALERTE REPLI"));

    // 2. REST API /api/status
    const statusRes = await fetch(`http://127.0.0.1:${testPort}/api/status`);
    assert.equal(statusRes.status, 200);
    const statusJson = (await statusRes.json()) as { totalCount: number; instances: unknown[] };
    assert.equal(statusJson.totalCount, 1);
    assert.equal(statusJson.instances.length, 1);

    // 3. MCP JSON-RPC over HTTP /mcp
    const rpcRes = await fetch(`http://127.0.0.1:${testPort}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "test-init",
        method: "initialize",
      }),
    });
    assert.equal(rpcRes.status, 200);
    const rpcJson = (await rpcRes.json()) as {
      jsonrpc: string;
      id: string;
      result: { serverInfo: { name: string; version: string } };
    };
    assert.equal(rpcJson.jsonrpc, "2.0");
    assert.equal(rpcJson.id, "test-init");
    assert.equal(rpcJson.result.serverInfo.version, "2.0.0");

    // 4. Add instance dynamically via /api/instances
    const addRes = await fetch(`http://127.0.0.1:${testPort}/api/instances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "dynamic-node",
        url: "http://192.168.1.88:1234",
        roles: ["chat"],
      }),
    });
    assert.equal(addRes.status, 201);
    assert.equal(pool.getInstances().length, 2);

    // 5. Delete instance via DELETE /api/instances/:id
    const delRes = await fetch(`http://127.0.0.1:${testPort}/api/instances/dynamic-node`, {
      method: "DELETE",
    });
    assert.equal(delRes.status, 200);
    assert.equal(pool.getInstances().length, 1);
  } finally {
    await daemon.stop();
    pool.destroy();
  }
});
