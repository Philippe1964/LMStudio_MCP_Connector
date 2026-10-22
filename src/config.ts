/**
 * [AI-GENERATED FILE]
 * This file was generated and architected with the assistance of AI
 * (Google Antigravity / Gemini 3.8 Flash & LM Studio local).
 * Verified and validated by automated strict Quality Gate (TypeScript strict, test suites).
 *
 * Server Configuration & CLI Arguments Parser
 */

import type { InstanceConfig } from "./types.js";

export interface ServerConfig {
  baseUrl: string;
  fallbackChatModel: string;
  fallbackEmbedModel: string;
  timeoutMs: number;
  daemon: boolean;
  daemonPort: number;
  daemonUrl?: string | undefined;
  autoProxy: boolean;
  instances: InstanceConfig[];
  healthCheckIntervalMs: number;
  maxConsecutiveFailures: number;
}

export const DEFAULT_BASE_URL = "http://127.0.0.1:1234";
export const DEFAULT_FALLBACK_CHAT_MODEL = "default";
export const DEFAULT_FALLBACK_EMBED_MODEL = "text-embedding-nomic-embed-text-v1.5";
export const DEFAULT_TIMEOUT_MS = 60000;
export const DEFAULT_DAEMON_PORT = 9123;
export const DEFAULT_HEALTH_CHECK_INTERVAL_MS = 15000;
export const DEFAULT_MAX_CONSECUTIVE_FAILURES = 3;

export function parseInstancesString(raw: string): InstanceConfig[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown[];
      const result: InstanceConfig[] = [];
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (item && typeof item === "object") {
          const obj = item as Record<string, unknown>;
          const url = typeof obj["url"] === "string" ? obj["url"].replace(/\/+$/, "") : "";
          if (url) {
            result.push({
              id: typeof obj["id"] === "string" ? obj["id"] : `instance-${i + 1}`,
              name: typeof obj["name"] === "string" ? obj["name"] : undefined,
              url,
              roles: Array.isArray(obj["roles"])
                ? (obj["roles"] as InstanceConfig["roles"])
                : ["all"],
              priority: typeof obj["priority"] === "number" ? obj["priority"] : 1,
            });
          }
        }
      }
      if (result.length > 0) return result;
    } catch {
      // Fallback to comma-separated
    }
  }

  return trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((url, idx) => ({
      id: `instance-${idx + 1}`,
      url: url.replace(/\/+$/, ""),
      roles: ["all"],
      priority: 1,
    }));
}

export function parseCliAndEnvConfig(argv: string[] = process.argv.slice(2)): ServerConfig {
  let baseUrl = process.env.LMSTUDIO_API_URL || process.env.LMSTUDIO_URL || DEFAULT_BASE_URL;
  let fallbackChatModel =
    process.env.LMSTUDIO_MODEL ||
    process.env.LMSTUDIO_CHAT_MODEL ||
    process.env.LMSTUDIO_FALLBACK_CHAT_MODEL ||
    DEFAULT_FALLBACK_CHAT_MODEL;
  let fallbackEmbedModel =
    process.env.LMSTUDIO_EMBED_MODEL ||
    process.env.LMSTUDIO_FALLBACK_EMBED_MODEL ||
    DEFAULT_FALLBACK_EMBED_MODEL;
  let timeoutMs = process.env.LMSTUDIO_TIMEOUT_MS
    ? parseInt(process.env.LMSTUDIO_TIMEOUT_MS, 10)
    : DEFAULT_TIMEOUT_MS;
  let daemon =
    process.env.LMSTUDIO_DAEMON === "true" ||
    process.env.LMSTUDIO_DAEMON === "1";
  let daemonPort = process.env.LMSTUDIO_DAEMON_PORT
    ? parseInt(process.env.LMSTUDIO_DAEMON_PORT, 10)
    : DEFAULT_DAEMON_PORT;
  let daemonUrl = process.env.LMSTUDIO_DAEMON_URL || undefined;
  let autoProxy = process.env.LMSTUDIO_AUTO_PROXY !== "false" && process.env.LMSTUDIO_AUTO_PROXY !== "0";
  let healthCheckIntervalMs = process.env.LMSTUDIO_HEALTH_INTERVAL_MS
    ? parseInt(process.env.LMSTUDIO_HEALTH_INTERVAL_MS, 10)
    : DEFAULT_HEALTH_CHECK_INTERVAL_MS;
  let maxConsecutiveFailures = DEFAULT_MAX_CONSECUTIVE_FAILURES;

  let instances: InstanceConfig[] = [];
  if (process.env.LMSTUDIO_INSTANCES) {
    instances = parseInstancesString(process.env.LMSTUDIO_INSTANCES);
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg) continue;

    // Daemon flag
    if (arg === "--daemon" || arg === "-d") {
      daemon = true;
    }
    // No-proxy / standalone flag
    else if (arg === "--no-proxy" || arg === "--standalone" || arg === "--no-daemon-proxy") {
      autoProxy = false;
    }
    // Explicit daemon URL flag
    else if (arg === "--daemon-url" && argv[i + 1]) {
      daemonUrl = argv[++i]!;
    } else if (arg.startsWith("--daemon-url=")) {
      daemonUrl = arg.split("=")[1] ?? daemonUrl;
    }
    // Daemon port flags: --daemon-port, --port, -p
    else if ((arg === "--daemon-port" || arg === "--port" || arg === "-p") && argv[i + 1]) {
      const parsed = parseInt(argv[++i]!, 10);
      if (!Number.isNaN(parsed) && parsed > 0) daemonPort = parsed;
    } else if (arg.startsWith("--daemon-port=")) {
      const parsed = parseInt(arg.split("=")[1] ?? "", 10);
      if (!Number.isNaN(parsed) && parsed > 0) daemonPort = parsed;
    } else if (arg.startsWith("--port=")) {
      const parsed = parseInt(arg.split("=")[1] ?? "", 10);
      if (!Number.isNaN(parsed) && parsed > 0) daemonPort = parsed;
    } else if (arg.startsWith("-p=")) {
      const parsed = parseInt(arg.split("=")[1] ?? "", 10);
      if (!Number.isNaN(parsed) && parsed > 0) daemonPort = parsed;
    }
    // Instances flag: --instances <list>
    else if (arg === "--instances" && argv[i + 1]) {
      instances = parseInstancesString(argv[++i]!);
    } else if (arg.startsWith("--instances=")) {
      instances = parseInstancesString(arg.split("=")[1] ?? "");
    }
    // Base URL flags: --url <val>, -u <val>, --url=<val>, -u=<val>
    else if ((arg === "--url" || arg === "-u") && argv[i + 1]) {
      baseUrl = argv[++i]!;
    } else if (arg.startsWith("--url=")) {
      baseUrl = arg.split("=")[1] ?? baseUrl;
    } else if (arg.startsWith("-u=")) {
      baseUrl = arg.split("=")[1] ?? baseUrl;
    }
    // Chat model flags: --fallback-chat-model, --model, -m
    else if ((arg === "--fallback-chat-model" || arg === "--model" || arg === "-m") && argv[i + 1]) {
      fallbackChatModel = argv[++i]!;
    } else if (arg.startsWith("--fallback-chat-model=")) {
      fallbackChatModel = arg.split("=")[1] ?? fallbackChatModel;
    } else if (arg.startsWith("--model=")) {
      fallbackChatModel = arg.split("=")[1] ?? fallbackChatModel;
    } else if (arg.startsWith("-m=")) {
      fallbackChatModel = arg.split("=")[1] ?? fallbackChatModel;
    }
    // Embed model flags: --fallback-embed-model, --embed-model
    else if ((arg === "--fallback-embed-model" || arg === "--embed-model") && argv[i + 1]) {
      fallbackEmbedModel = argv[++i]!;
    } else if (arg.startsWith("--fallback-embed-model=")) {
      fallbackEmbedModel = arg.split("=")[1] ?? fallbackEmbedModel;
    } else if (arg.startsWith("--embed-model=")) {
      fallbackEmbedModel = arg.split("=")[1] ?? fallbackEmbedModel;
    }
    // Timeout flags: --timeout, -t
    else if ((arg === "--timeout" || arg === "-t") && argv[i + 1]) {
      const parsed = parseInt(argv[++i]!, 10);
      if (!Number.isNaN(parsed) && parsed > 0) timeoutMs = parsed;
    } else if (arg.startsWith("--timeout=")) {
      const parsed = parseInt(arg.split("=")[1] ?? "", 10);
      if (!Number.isNaN(parsed) && parsed > 0) timeoutMs = parsed;
    } else if (arg.startsWith("-t=")) {
      const parsed = parseInt(arg.split("=")[1] ?? "", 10);
      if (!Number.isNaN(parsed) && parsed > 0) timeoutMs = parsed;
    }
  }

  // Clean trailing slashes
  baseUrl = baseUrl.replace(/\/+$/, "");

  // If no instances explicitly defined, register default baseUrl as primary instance
  if (instances.length === 0) {
    instances.push({
      id: "primary",
      name: "Primary LM Studio",
      url: baseUrl,
      roles: ["all"],
      priority: 1,
    });
  }

  return {
    baseUrl,
    fallbackChatModel,
    fallbackEmbedModel,
    timeoutMs,
    daemon,
    daemonPort,
    daemonUrl,
    autoProxy,
    instances,
    healthCheckIntervalMs,
    maxConsecutiveFailures,
  };
}
