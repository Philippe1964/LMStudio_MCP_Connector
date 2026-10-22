/**
 * [AI-GENERATED FILE]
 * This test suite was generated with the assistance of AI
 * (Google Antigravity / Gemini 3.8 Flash & LM Studio local).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { PoolManager, AllInstancesUnavailableError } from "../pool-manager.js";
import { parseCliAndEnvConfig } from "../config.js";

test("PoolManager initializes instances from config", () => {
  const config = parseCliAndEnvConfig([
    "--instances",
    "http://127.0.0.1:1234,http://192.168.1.50:1234",
  ]);
  const pool = new PoolManager(config);
  assert.equal(pool.getInstances().length, 2);

  const report = pool.getPoolReport();
  assert.equal(report.totalCount, 2);
  assert.equal(report.activeCount, 0); // UNKNOWN before check
  pool.destroy();
});

test("PoolManager selectCandidates filters by role and sorts by least-connections", () => {
  const json = JSON.stringify([
    { id: "inst-chat", url: "http://10.0.0.1:1234", roles: ["chat"], priority: 1 },
    { id: "inst-embed", url: "http://10.0.0.2:1234", roles: ["embeddings"], priority: 1 },
    { id: "inst-all-busy", url: "http://10.0.0.3:1234", roles: ["all"], priority: 1 },
    { id: "inst-all-idle", url: "http://10.0.0.4:1234", roles: ["all"], priority: 1 },
  ]);
  const config = parseCliAndEnvConfig(["--instances", json]);
  const pool = new PoolManager(config);

  const busy = pool.getInstance("inst-all-busy")!;
  const idle = pool.getInstance("inst-all-idle")!;
  busy.metrics.inFlightRequests = 3;
  idle.metrics.inFlightRequests = 0;

  // For chat role: inst-chat, inst-all-idle, inst-all-busy should match. inst-embed should NOT.
  const chatCandidates = pool.selectCandidates("chat");
  const ids = chatCandidates.map((c) => c.config.id);
  assert.ok(ids.includes("inst-chat"));
  assert.ok(ids.includes("inst-all-idle"));
  assert.ok(ids.includes("inst-all-busy"));
  assert.ok(!ids.includes("inst-embed"));

  // Least connections: inst-all-idle (0) should come before inst-all-busy (3)
  assert.ok(ids.indexOf("inst-all-idle") < ids.indexOf("inst-all-busy"));

  pool.destroy();
});

test("PoolManager executeWithFailover falls over to second instance on first error", async () => {
  const config = parseCliAndEnvConfig([
    "--instances",
    "http://10.0.0.1:1234,http://10.0.0.2:1234",
  ]);
  const pool = new PoolManager(config);

  const callOrder: string[] = [];

  const result = await pool.executeWithFailover("chat", async (_client, instance) => {
    callOrder.push(instance.config.id);
    if (instance.config.id === "instance-1") {
      throw new Error("Instance 1 connection refused");
    }
    return "Success from instance 2";
  });

  assert.equal(result, "Success from instance 2");
  assert.deepEqual(callOrder, ["instance-1", "instance-2"]);

  const inst1 = pool.getInstance("instance-1")!;
  const inst2 = pool.getInstance("instance-2")!;
  assert.equal(inst1.metrics.failedRequests, 1);
  assert.equal(inst2.metrics.totalRequests, 1);
  assert.equal(inst2.health, "ONLINE");

  pool.destroy();
});

test("PoolManager executeWithFailover throws AllInstancesUnavailableError when all fail", async () => {
  const config = parseCliAndEnvConfig([
    "--instances",
    "http://10.0.0.1:1234,http://10.0.0.2:1234",
  ]);
  const pool = new PoolManager(config);

  await assert.rejects(
    async () => {
      await pool.executeWithFailover("chat", async (_client, instance) => {
        throw new Error(`Instance ${instance.config.id} offline`);
      });
    },
    (err: unknown) => {
      assert.ok(err instanceof AllInstancesUnavailableError);
      assert.ok(err.message.includes("failed for role 'chat'"));
      assert.ok(err.fallbackDirective.includes("REMOTE FALLBACK REQUIRED"));
      return true;
    }
  );

  pool.destroy();
});

test("PoolManager allows dynamic addition and removal of instances", () => {
  const config = parseCliAndEnvConfig(["--instances", "http://127.0.0.1:1234"]);
  const pool = new PoolManager(config);

  assert.equal(pool.getInstances().length, 1);

  pool.addOrUpdateInstance({
    id: "new-gpu",
    url: "http://192.168.1.77:1234",
    roles: ["chat"],
    priority: 5,
  });

  assert.equal(pool.getInstances().length, 2);
  assert.equal(pool.getInstance("new-gpu")?.config.priority, 5);

  const removed = pool.removeInstance("new-gpu");
  assert.equal(removed, true);
  assert.equal(pool.getInstances().length, 1);

  pool.destroy();
});

