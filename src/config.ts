/**
 * Server Configuration & CLI Arguments Parser
 */

export interface ServerConfig {
  baseUrl: string;
  fallbackChatModel: string;
  fallbackEmbedModel: string;
  timeoutMs: number;
}

const DEFAULT_BASE_URL = "http://192.168.0.108:1234";
const DEFAULT_FALLBACK_CHAT_MODEL = "google/gemma-4-e4b";
const DEFAULT_FALLBACK_EMBED_MODEL = "text-embedding-nomic-embed-text-v1.5";
const DEFAULT_TIMEOUT_MS = 60000;

export function parseCliAndEnvConfig(argv: string[] = process.argv.slice(2)): ServerConfig {
  let baseUrl = process.env.LMSTUDIO_API_URL || DEFAULT_BASE_URL;
  let fallbackChatModel = process.env.LMSTUDIO_FALLBACK_CHAT_MODEL || DEFAULT_FALLBACK_CHAT_MODEL;
  let fallbackEmbedModel = process.env.LMSTUDIO_FALLBACK_EMBED_MODEL || DEFAULT_FALLBACK_EMBED_MODEL;
  let timeoutMs = process.env.LMSTUDIO_TIMEOUT_MS
    ? parseInt(process.env.LMSTUDIO_TIMEOUT_MS, 10)
    : DEFAULT_TIMEOUT_MS;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg) continue;

    if (arg === "--url" && argv[i + 1]) {
      baseUrl = argv[++i]!;
    } else if (arg.startsWith("--url=")) {
      baseUrl = arg.split("=")[1] ?? baseUrl;
    } else if (arg === "--fallback-chat-model" && argv[i + 1]) {
      fallbackChatModel = argv[++i]!;
    } else if (arg.startsWith("--fallback-chat-model=")) {
      fallbackChatModel = arg.split("=")[1] ?? fallbackChatModel;
    } else if (arg === "--fallback-embed-model" && argv[i + 1]) {
      fallbackEmbedModel = argv[++i]!;
    } else if (arg.startsWith("--fallback-embed-model=")) {
      fallbackEmbedModel = arg.split("=")[1] ?? fallbackEmbedModel;
    } else if (arg === "--timeout" && argv[i + 1]) {
      const parsed = parseInt(argv[++i]!, 10);
      if (!Number.isNaN(parsed) && parsed > 0) timeoutMs = parsed;
    } else if (arg.startsWith("--timeout=")) {
      const parsed = parseInt(arg.split("=")[1] ?? "", 10);
      if (!Number.isNaN(parsed) && parsed > 0) timeoutMs = parsed;
    }
  }

  // Clean trailing slashes
  baseUrl = baseUrl.replace(/\/+$/, "");

  return {
    baseUrl,
    fallbackChatModel,
    fallbackEmbedModel,
    timeoutMs,
  };
}

