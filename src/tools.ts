/**
 * [AI-GENERATED FILE]
 * This file was generated and architected with the assistance of AI
 * (Google Antigravity / Gemini 3.8 Flash & LM Studio local).
 * Verified and validated by automated strict Quality Gate (TypeScript strict, test suites).
 *
 * MCP Tools Definitions & Execution Handlers
 */

import type { LmStudioClient } from "./lmstudio-client.js";
import { AllInstancesUnavailableError, type PoolManager } from "./pool-manager.js";
import type { McpTool, McpToolResult, LmStudioChatMessage } from "./types.js";
import { REMOTE_FALLBACK_DIRECTIVE } from "./types.js";

export const MCP_TOOLS: McpTool[] = [
  {
    name: "lmstudio_chat",
    description:
      "Send a prompt or instruction to the local LM Studio model and get the generated completion. " +
      "If all local instances are offline, returns a directive instructing the agent to fallback to remote LLMs.",
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
    description: "List all AI models currently loaded and available across LM Studio instances.",
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
    description: "Check the health, status, latency, and loaded models of configured LM Studio instances.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "lmstudio_pool_status",
    description: "Inspect multi-instance pool metrics, load balancing distribution, and failover status.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

export async function executeTool(
  target: LmStudioClient | PoolManager,
  name: string,
  args: Record<string, unknown>
): Promise<McpToolResult> {
  const isPool = "executeWithFailover" in target;

  switch (name) {
    case "lmstudio_chat": {
      const prompt = typeof args.prompt === "string" ? args.prompt : "";
      const systemPrompt = typeof args.system_prompt === "string" ? args.system_prompt : null;
      const requestedModel =
        typeof args.model === "string" && args.model.trim().length > 0 ? args.model : undefined;
      const temperature = typeof args.temperature === "number" ? args.temperature : 0.7;
      const maxTokens = typeof args.max_tokens === "number" ? args.max_tokens : 2048;

      const messages: LmStudioChatMessage[] = [];
      if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
      }
      messages.push({ role: "user", content: prompt });

      try {
        const response = isPool
          ? await (target as PoolManager).executeWithFailover("chat", async (client) => {
              const model = requestedModel || (await client.getDefaultModel("chat"));
              return client.chatCompletion({
                model,
                messages,
                temperature,
                max_tokens: maxTokens,
              });
            })
          : await (async () => {
              const client = target as LmStudioClient;
              const model = requestedModel || (await client.getDefaultModel("chat"));
              return client.chatCompletion({
                model,
                messages,
                temperature,
                max_tokens: maxTokens,
              });
            })();

        const choice = response.choices && response.choices[0];
        const assistantText =
          choice?.message?.content || choice?.message?.reasoning_content || "(no text generated)";
        const usage = response.usage
          ? `\n\n[Tokens: ${response.usage.prompt_tokens} prompt + ${response.usage.completion_tokens} completion = ${response.usage.total_tokens} total | Model: ${response.model || requestedModel || "default"}]`
          : `\n\n[Model: ${response.model || requestedModel || "default"}]`;

        return {
          content: [
            {
              type: "text",
              text: assistantText + usage,
            },
          ],
        };
      } catch (err: unknown) {
        if (err instanceof AllInstancesUnavailableError) {
          return {
            content: [
              {
                type: "text",
                text: `${REMOTE_FALLBACK_DIRECTIVE}\n\nTechnical Cause:\n${err.message}`,
              },
            ],
            isError: true,
          };
        }

        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text",
              text: `${REMOTE_FALLBACK_DIRECTIVE}\n\nTechnical Error:\n${msg}`,
            },
          ],
          isError: true,
        };
      }
    }

    case "lmstudio_list_models": {
      try {
        if (isPool) {
          const pool = target as PoolManager;
          const instances = pool.getInstances();
          const lines: string[] = [`Configured LM Studio Instances (${instances.length}):`];

          for (const inst of instances) {
            lines.push(
              `\n[Instance: ${inst.config.id}] (${inst.config.url}) - Status: ${inst.health}`
            );
            if (inst.health === "ONLINE" && inst.metrics.loadedModels.length > 0) {
              lines.push(`  Loaded Models (${inst.metrics.loadedModels.length}):`);
              inst.metrics.loadedModels.forEach((m, i) => lines.push(`    ${i + 1}. ${m}`));
            } else if (inst.health === "ONLINE") {
              lines.push("  (No models loaded or model list empty)");
            } else {
              lines.push("  (Instance unreachable)");
            }
          }

          return {
            content: [
              {
                type: "text",
                text: lines.join("\n"),
              },
            ],
          };
        } else {
          const client = target as LmStudioClient;
          const data = await client.listModels();
          const models = data.data || [];
          const summary =
            models.length === 0
              ? "No models currently loaded in LM Studio."
              : `Available models in LM Studio (${client.getBaseUrl()}):\n` +
                models
                  .map((m, idx) => `${idx + 1}. ${m.id} (owned by: ${m.owned_by || "user"})`)
                  .join("\n");

          return {
            content: [
              {
                type: "text",
                text: summary,
              },
            ],
          };
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text",
              text: `${REMOTE_FALLBACK_DIRECTIVE}\n\nFailed to list models: ${msg}`,
            },
          ],
          isError: true,
        };
      }
    }

    case "lmstudio_embeddings": {
      const input = typeof args.input === "string" ? args.input : "";
      const requestedModel =
        typeof args.model === "string" && args.model.trim().length > 0 ? args.model : undefined;

      try {
        const result = isPool
          ? await (target as PoolManager).executeWithFailover("embeddings", async (client) => {
              const model = requestedModel || (await client.getDefaultModel("embedding"));
              return client.generateEmbedding({ model, input });
            })
          : await (async () => {
              const client = target as LmStudioClient;
              const model = requestedModel || (await client.getDefaultModel("embedding"));
              return client.generateEmbedding({ model, input });
            })();

        const embedding = result.data && result.data[0]?.embedding;
        const dimensions = embedding ? embedding.length : 0;
        const preview = embedding
          ? `[${embedding.slice(0, 5).map((v) => v.toFixed(4)).join(", ")}, ... (${dimensions} dimensions)]`
          : "None";

        return {
          content: [
            {
              type: "text",
              text: `Generated embedding (${dimensions} dimensions):\n${preview}`,
            },
          ],
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text",
              text: `${REMOTE_FALLBACK_DIRECTIVE}\n\nFailed to generate embedding: ${msg}`,
            },
          ],
          isError: true,
        };
      }
    }

    case "lmstudio_health": {
      if (isPool) {
        const pool = target as PoolManager;
        const report = await pool.forceCheckAll();
        const lines: string[] = [
          `LM Studio Pool Status: ${report.allOffline ? "OFFLINE (All instances down)" : "ONLINE"}`,
          `Active Instances: ${report.activeCount} / ${report.totalCount}`,
          "",
        ];

        for (const inst of report.instances) {
          lines.push(`• [${inst.config.id}] ${inst.config.url}`);
          lines.push(`  Status: ${inst.health} | Latency: ${inst.metrics.latencyMs}ms`);
          lines.push(`  Roles: ${inst.config.roles.join(", ")}`);
          lines.push(
            `  Requests: ${inst.metrics.totalRequests} OK / ${inst.metrics.failedRequests} errors`
          );
          lines.push(
            `  Models: ${inst.metrics.loadedModels.length > 0 ? inst.metrics.loadedModels.join(", ") : "None"}`
          );
        }

        if (report.allOffline) {
          lines.push("");
          lines.push(REMOTE_FALLBACK_DIRECTIVE);
        }

        return {
          content: [
            {
              type: "text",
              text: lines.join("\n"),
            },
          ],
          isError: report.allOffline,
        };
      } else {
        const client = target as LmStudioClient;
        const health = await client.checkHealth();
        const summary =
          health.status === "ONLINE"
            ? `LM Studio Status: ONLINE\nEndpoint: ${health.endpoint}\nLatency: ${health.latencyMs}ms\nActive Models (${health.activeModelsCount}): ${health.modelNames.join(", ")}`
            : `LM Studio Status: OFFLINE\nEndpoint: ${health.endpoint}\nLatency: ${health.latencyMs}ms\nError: Unable to reach LM Studio API.\n\n${REMOTE_FALLBACK_DIRECTIVE}`;

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
    }

    case "lmstudio_pool_status": {
      if (!isPool) {
        return {
          content: [
            {
              type: "text",
              text: "Connector is running in standalone single-client mode (no pool manager active).",
            },
          ],
        };
      }

      const pool = target as PoolManager;
      const report = pool.getPoolReport();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(report, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
