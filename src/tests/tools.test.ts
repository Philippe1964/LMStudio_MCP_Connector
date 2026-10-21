import test from "node:test";
import assert from "node:assert/strict";
import { MCP_TOOLS, executeTool } from "../tools.js";
import { LmStudioClient } from "../lmstudio-client.js";

test("MCP_TOOLS contains all 4 standard tools", () => {
  const toolNames = MCP_TOOLS.map((t) => t.name);
  assert.ok(toolNames.includes("lmstudio_chat"));
  assert.ok(toolNames.includes("lmstudio_list_models"));
  assert.ok(toolNames.includes("lmstudio_embeddings"));
  assert.ok(toolNames.includes("lmstudio_health"));
  assert.equal(MCP_TOOLS.length, 4);

  const chatTool = MCP_TOOLS.find((t) => t.name === "lmstudio_chat");
  assert.ok(chatTool?.inputSchema.required?.includes("prompt"));
});

test("executeTool executes lmstudio_health via mock client", async () => {
  const fakeClient = {
    getBaseUrl: () => "http://mock-host:1234",
    checkHealth: async () => ({
      status: "ONLINE" as const,
      endpoint: "http://mock-host:1234",
      latencyMs: 12,
      activeModelsCount: 1,
      modelNames: ["mock-model"],
    }),
  } as unknown as LmStudioClient;

  const result = await executeTool(fakeClient, "lmstudio_health", {});
  assert.equal(result.isError, false);
  assert.equal(result.content.length, 1);
  assert.match(result.content[0]!.text, /Status: ONLINE/);
  assert.match(result.content[0]!.text, /mock-model/);
});

test("executeTool executes lmstudio_chat via mock client", async () => {
  const fakeClient = {
    getBaseUrl: () => "http://mock-host:1234",
    getDefaultModel: async () => "mock-model",
    chatCompletion: async () => ({
      model: "mock-model",
      choices: [{ message: { content: "Bonjour du modèle local!" } }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    }),
  } as unknown as LmStudioClient;

  const result = await executeTool(fakeClient, "lmstudio_chat", { prompt: "Dis bonjour" });
  assert.equal(result.content.length, 1);
  assert.match(result.content[0]!.text, /Bonjour du modèle local!/);
  assert.match(result.content[0]!.text, /Tokens: 10 prompt/);
});

test("executeTool executes lmstudio_list_models via mock client", async () => {
  const fakeClient = {
    getBaseUrl: () => "http://mock-host:1234",
    listModels: async () => ({
      data: [{ id: "model-alpha", object: "model", owned_by: "tester" }],
    }),
  } as unknown as LmStudioClient;

  const result = await executeTool(fakeClient, "lmstudio_list_models", {});
  assert.equal(result.content.length, 1);
  assert.match(result.content[0]!.text, /model-alpha/);
});

test("executeTool executes lmstudio_embeddings via mock client", async () => {
  const fakeClient = {
    getBaseUrl: () => "http://mock-host:1234",
    getDefaultModel: async () => "mock-embed",
    generateEmbedding: async () => ({
      data: [{ embedding: [0.1234, 0.5678, -0.9999], index: 0 }],
      model: "mock-embed",
    }),
  } as unknown as LmStudioClient;

  const result = await executeTool(fakeClient, "lmstudio_embeddings", { input: "Test vector" });
  assert.equal(result.content.length, 1);
  assert.match(result.content[0]!.text, /3 dimensions/);
});

test("executeTool throws for unknown tool name", async () => {
  const fakeClient = {} as unknown as LmStudioClient;
  await assert.rejects(
    async () => {
      await executeTool(fakeClient, "unknown_tool", {});
    },
    { message: "Unknown tool: unknown_tool" }
  );
});
