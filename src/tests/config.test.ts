import test from "node:test";
import assert from "node:assert/strict";
import { parseCliAndEnvConfig } from "../config.js";

test("parseCliAndEnvConfig uses defaults when no args or env provided", () => {
  const origEnv = process.env.LMSTUDIO_API_URL;
  delete process.env.LMSTUDIO_API_URL;

  const config = parseCliAndEnvConfig([]);
  assert.equal(config.baseUrl, "http://192.168.0.108:1234");
  assert.equal(config.fallbackChatModel, "google/gemma-4-e4b");
  assert.equal(config.fallbackEmbedModel, "text-embedding-nomic-embed-text-v1.5");
  assert.equal(config.timeoutMs, 60000);

  if (origEnv !== undefined) {
    process.env.LMSTUDIO_API_URL = origEnv;
  }
});

test("parseCliAndEnvConfig parses CLI --url argument and strips trailing slash", () => {
  const config = parseCliAndEnvConfig(["--url", "http://127.0.0.1:1234///"]);
  assert.equal(config.baseUrl, "http://127.0.0.1:1234");
});

test("parseCliAndEnvConfig parses CLI --url=value argument format", () => {
  const config = parseCliAndEnvConfig(["--url=http://custom-host:8080/"]);
  assert.equal(config.baseUrl, "http://custom-host:8080");
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
