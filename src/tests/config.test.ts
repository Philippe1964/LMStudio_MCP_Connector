/**
 * [AI-GENERATED FILE]
 * This test suite was generated with the assistance of AI
 * (Google Antigravity / Gemini 3.8 Flash & LM Studio local).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { parseCliAndEnvConfig, DEFAULT_BASE_URL, DEFAULT_FALLBACK_CHAT_MODEL } from "../config.js";

test("parseCliAndEnvConfig uses generic defaults when no args or env provided", () => {
  const origUrl = process.env.LMSTUDIO_API_URL;
  const origChat = process.env.LMSTUDIO_CHAT_MODEL;
  const origFallbackChat = process.env.LMSTUDIO_FALLBACK_CHAT_MODEL;
  delete process.env.LMSTUDIO_API_URL;
  delete process.env.LMSTUDIO_URL;
  delete process.env.LMSTUDIO_CHAT_MODEL;
  delete process.env.LMSTUDIO_FALLBACK_CHAT_MODEL;
  delete process.env.LMSTUDIO_MODEL;

  const config = parseCliAndEnvConfig([]);
  assert.equal(config.baseUrl, DEFAULT_BASE_URL);
  assert.equal(config.baseUrl, "http://127.0.0.1:1234");
  assert.equal(config.fallbackChatModel, DEFAULT_FALLBACK_CHAT_MODEL);
  assert.equal(config.fallbackChatModel, "default");
  assert.equal(config.fallbackEmbedModel, "text-embedding-nomic-embed-text-v1.5");
  assert.equal(config.timeoutMs, 60000);

  if (origUrl !== undefined) process.env.LMSTUDIO_API_URL = origUrl;
  if (origChat !== undefined) process.env.LMSTUDIO_CHAT_MODEL = origChat;
  if (origFallbackChat !== undefined) process.env.LMSTUDIO_FALLBACK_CHAT_MODEL = origFallbackChat;
});

test("parseCliAndEnvConfig parses CLI --url argument and strips trailing slash", () => {
  const config = parseCliAndEnvConfig(["--url", "http://127.0.0.1:1234///"]);
  assert.equal(config.baseUrl, "http://127.0.0.1:1234");
});

test("parseCliAndEnvConfig parses CLI short flag -u and -m", () => {
  const config = parseCliAndEnvConfig(["-u", "http://10.0.0.5:1234", "-m", "qwen2.5-coder-7b", "-t", "30000"]);
  assert.equal(config.baseUrl, "http://10.0.0.5:1234");
  assert.equal(config.fallbackChatModel, "qwen2.5-coder-7b");
  assert.equal(config.timeoutMs, 30000);
});

test("parseCliAndEnvConfig parses CLI --url=value and --model=value argument format", () => {
  const config = parseCliAndEnvConfig(["--url=http://custom-host:8080/", "--model=mistral-nemo"]);
  assert.equal(config.baseUrl, "http://custom-host:8080");
  assert.equal(config.fallbackChatModel, "mistral-nemo");
});

test("parseCliAndEnvConfig parses CLI timeout and model overrides", () => {
  const config = parseCliAndEnvConfig([
    "--timeout",
    "15000",
    "--fallback-chat-model",
    "llama-3.3-70b",
    "--fallback-embed-model",
    "bge-m3",
  ]);
  assert.equal(config.timeoutMs, 15000);
  assert.equal(config.fallbackChatModel, "llama-3.3-70b");
  assert.equal(config.fallbackEmbedModel, "bge-m3");
});

test("parseCliAndEnvConfig parses --daemon and --port flags", () => {
  const config = parseCliAndEnvConfig(["--daemon", "--port", "9876"]);
  assert.equal(config.daemon, true);
  assert.equal(config.daemonPort, 9876);
});

test("parseCliAndEnvConfig parses multi-instance comma-separated list", () => {
  const config = parseCliAndEnvConfig([
    "--instances",
    "http://127.0.0.1:1234,http://192.168.1.100:1234",
  ]);
  assert.equal(config.instances.length, 2);
  assert.equal(config.instances[0]!.url, "http://127.0.0.1:1234");
  assert.equal(config.instances[1]!.url, "http://192.168.1.100:1234");
});

test("parseCliAndEnvConfig parses multi-instance JSON string with roles", () => {
  const json = JSON.stringify([
    { id: "gpu-chat", url: "http://10.0.0.1:1234", roles: ["chat"], priority: 2 },
    { id: "cpu-embed", url: "http://10.0.0.2:1234", roles: ["embeddings"], priority: 1 },
  ]);
  const config = parseCliAndEnvConfig(["--instances", json]);
  assert.equal(config.instances.length, 2);
  assert.equal(config.instances[0]!.id, "gpu-chat");
  assert.deepEqual(config.instances[0]!.roles, ["chat"]);
  assert.equal(config.instances[1]!.id, "cpu-embed");
  assert.deepEqual(config.instances[1]!.roles, ["embeddings"]);
});

