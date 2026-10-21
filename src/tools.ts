/**
 * MCP Tools Definitions & Execution Handlers
 */

import type { LmStudioClient } from "./lmstudio-client.js";
import type { McpTool, McpToolResult, LmStudioChatMessage } from "./types.js";

export const MCP_TOOLS: McpTool[] = [
  {
    name: "lmstudio_chat",
    description:
      "Send a prompt or instruction to the local LM Studio model (e.g. google/gemma-4-e4b) and get the generated completion.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "The prompt or instruction to send to the local model",
        },
        system_prompt: {
          type: "string",
          description: "Optional system instructions guiding the model behavior",
        },
        model: {
          type: "string",
          description: "Optional model identifier (defaults to currently loaded model in LM Studio)",
        },
        temperature: {
          type: "number",
          description: "Sampling temperature between 0.0 and 2.0 (default: 0.7)",
        },
        max_tokens: {
          type: "integer",
          description: "Maximum tokens to generate in response (default: 2048)",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "lmstudio_list_models",
    description: "List all AI models currently loaded and available in the local LM Studio instance.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "lmstudio_embeddings",
    description: "Generate vector embeddings for input text using the local LM Studio embedding model.",
    inputSchema: {
      type: "object",
      properties: {
        input: {
          type: "string",
          description: "The text to compute embeddings for",
        },
        model: {
          type: "string",
          description: "Optional embedding model identifier (defaults to loaded embedding model)",
        },
      },
      required: ["input"],
    },
  },
  {
    name: "lmstudio_health",
    description: "Check the health, status, latency, and loaded models of the local LM Studio instance.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

export async function executeTool(
  client: LmStudioClient,
  name: string,
  args: Record<string, unknown>
): Promise<McpToolResult> {
  switch (name) {
    case "lmstudio_chat": {
      const prompt = typeof args.prompt === "string" ? args.prompt : "";
      const systemPrompt = typeof args.system_prompt === "string" ? args.system_prompt : null;
      const model =
        typeof args.model === "string" && args.model.trim().length > 0
          ? args.model
          : await client.getDefaultModel("chat");
      const temperature = typeof args.temperature === "number" ? args.temperature : 0.7;
      const maxTokens = typeof args.max_tokens === "number" ? args.max_tokens : 2048;

      const messages: LmStudioChatMessage[] = [];
      if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
      }
      messages.push({ role: "user", content: prompt });

      const response = await client.chatCompletion({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      });

      const choice = response.choices && response.choices[0];
      const assistantText = choice?.message?.content || "(no text generated)";
      const usage = response.usage
        ? `\n\n[Tokens: ${response.usage.prompt_tokens} prompt + ${response.usage.completion_tokens} completion = ${response.usage.total_tokens} total | Model: ${response.model || model}]`
        : `\n\n[Model: ${response.model || model}]`;

      return {
        content: [
          {
            type: "text",
            text: assistantText + usage,
          },
        ],
      };
    }

    case "lmstudio_list_models": {
      const data = await client.listModels();
      const models = data.data || [];
      const summary =
        models.length === 0
          ? "No models currently loaded in LM Studio."
          : `Available models in LM Studio (${client.getBaseUrl()}):\n` +
            models.map((m, idx) => `${idx + 1}. ${m.id} (owned by: ${m.owned_by || "user"})`).join("\n");

      return {
        content: [
          {
            type: "text",
            text: summary,
          },
        ],
      };
    }

    case "lmstudio_embeddings": {
      const input = typeof args.input === "string" ? args.input : "";
      const model =
        typeof args.model === "string" && args.model.trim().length > 0
          ? args.model
          : await client.getDefaultModel("embedding");

      const result = await client.generateEmbedding({ model, input });
      const embedding = result.data && result.data[0]?.embedding;
      const dimensions = embedding ? embedding.length : 0;
      const preview = embedding
        ? `[${embedding.slice(0, 5).map((v) => v.toFixed(4)).join(", ")}, ... (${dimensions} dimensions)]`
        : "None";

      return {
        content: [
          {
            type: "text",
            text: `Generated embedding using model "${model}" (${dimensions} dimensions):\n${preview}`,
          },
        ],
      };
    }

    case "lmstudio_health": {
      const health = await client.checkHealth();
      const summary =
        health.status === "ONLINE"
          ? `LM Studio Status: ONLINE\nEndpoint: ${health.endpoint}\nLatency: ${health.latencyMs}ms\nActive Models (${health.activeModelsCount}): ${health.modelNames.join(", ")}`
          : `LM Studio Status: OFFLINE\nEndpoint: ${health.endpoint}\nLatency: ${health.latencyMs}ms\nError: Unable to reach LM Studio API. Please ensure LM Studio is running.`;

      return {
        content: [
          {
            type: "text",
            text: summary,
          },
        ],
        isError: health.status === "OFFLINE",
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

