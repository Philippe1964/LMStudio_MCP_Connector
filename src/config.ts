/**
 * Server Configuration & CLI Arguments Parser
 */

export interface ServerConfig {
  baseUrl: string;
  fallbackChatModel: string;
  fallbackEmbedModel: string;
  timeoutMs: number;
}

export const DEFAULT_BASE_URL = "http://127.0.0.1:1234";
export const DEFAULT_FALLBACK_CHAT_MODEL = "default";
export const DEFAULT_FALLBACK_EMBED_MODEL = "text-embedding-nomic-embed-text-v1.5";
export const DEFAULT_TIMEOUT_MS = 60000;

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

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg) continue;

    // Base URL flags: --url <val>, -u <val>, --url=<val>, -u=<val>
    if ((arg === "--url" || arg === "-u") && argv[i + 1]) {
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

  return {
    baseUrl,
    fallbackChatModel,
    fallbackEmbedModel,
    timeoutMs,
  };
}
