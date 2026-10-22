/**
 * [AI-GENERATED FILE]
 * This test suite was generated with the assistance of AI
 * (Google Antigravity / Gemini 3.8 Flash & LM Studio local).
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
// @ts-expect-error importing JavaScript module from scripts
import { getAvailableClients, configureClient } from "../../scripts/setup.js";

test("getAvailableClients resolves macOS paths correctly", () => {
  const fakeHome = "/Users/testuser";
  const clients = getAvailableClients("darwin", fakeHome);
  assert.equal(clients.length, 3);

  const claude = clients.find((c: any) => c.id === "claude");
  assert.ok(claude);
  assert.equal(
    claude.configPath,
    path.join(fakeHome, "Library", "Application Support", "Claude", "claude_desktop_config.json")
  );

  const cursor = clients.find((c: any) => c.id === "cursor");
  assert.ok(cursor);
  assert.equal(cursor.configPath, path.join(fakeHome, ".cursor", "mcp.json"));

  const gemini = clients.find((c: any) => c.id === "gemini");
  assert.ok(gemini);
  assert.equal(gemini.configPath, path.join(fakeHome, ".gemini", "config", "mcp_config.json"));
});

test("getAvailableClients resolves Linux paths correctly", () => {
  const fakeHome = "/home/testuser";
  const clients = getAvailableClients("linux", fakeHome);
  assert.equal(clients.length, 3);

  const claude = clients.find((c: any) => c.id === "claude");
  assert.ok(claude);
  assert.equal(claude.configPath, path.join(fakeHome, ".config", "Claude", "claude_desktop_config.json"));

  const cursor = clients.find((c: any) => c.id === "cursor");
  assert.ok(cursor);
  assert.equal(cursor.configPath, path.join(fakeHome, ".cursor", "mcp.json"));
});

test("getAvailableClients resolves Windows paths correctly", () => {
  const fakeHome = "C:\\Users\\testuser";
  const clients = getAvailableClients("win32", fakeHome);
  assert.equal(clients.length, 3);

  const cursor = clients.find((c: any) => c.id === "cursor");
  assert.ok(cursor);
  assert.equal(cursor.configPath, path.join(fakeHome, ".cursor", "mcp.json"));
});

test("configureClient safely writes and merges MCP configuration", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-test-"));
  const tempConfigFile = path.join(tempDir, "claude_test_config.json");

  // Initial config with an existing third-party server
  fs.writeFileSync(
    tempConfigFile,
    JSON.stringify({
      mcpServers: {
        existingServer: { command: "custom-tool", args: [] },
      },
    }),
    "utf-8"
  );

  const client = {
    id: "claude",
    name: "Claude Desktop",
    configPath: tempConfigFile,
    format: "claude" as const,
  };

  const result = configureClient(client, "http://127.0.0.1:1234", "test-model");
  assert.equal(result.success, true);

  const updated = JSON.parse(fs.readFileSync(tempConfigFile, "utf-8"));
  assert.ok(updated.mcpServers.existingServer);
  assert.ok(updated.mcpServers.lmstudio);
  assert.equal(updated.mcpServers.lmstudio.command, "node");
  assert.ok(updated.mcpServers.lmstudio.args.includes("--url"));
  assert.ok(updated.mcpServers.lmstudio.args.includes("http://127.0.0.1:1234"));
  assert.ok(updated.mcpServers.lmstudio.args.includes("--model"));
  assert.ok(updated.mcpServers.lmstudio.args.includes("test-model"));

  // Clean up
  fs.rmSync(tempDir, { recursive: true, force: true });
});

