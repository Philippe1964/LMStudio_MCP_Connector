#!/usr/bin/env node
/**
 * LM Studio MCP Connector - Main Executable Entry Point
 */

import { parseCliAndEnvConfig } from "./config.js";
import { LmStudioClient } from "./lmstudio-client.js";
import { McpServer } from "./server.js";

const VERSION = "1.0.0";

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
LM Studio MCP Connector v${VERSION}
Model Context Protocol (MCP) server bridging AI clients to a local LM Studio instance.

Usage:
  lmstudio-mcp-connector [options]
  node dist/index.js [options]

Options:
  --url <url>                    LM Studio API Base URL (default: http://192.168.0.108:1234 or $LMSTUDIO_API_URL)
  --fallback-chat-model <name>   Fallback chat model (default: google/gemma-4-e4b or $LMSTUDIO_FALLBACK_CHAT_MODEL)
  --fallback-embed-model <name>  Fallback embedding model (default: text-embedding-nomic-embed-text-v1.5 or $LMSTUDIO_FALLBACK_EMBED_MODEL)
  --timeout <ms>                 HTTP Request timeout in ms (default: 60000 or $LMSTUDIO_TIMEOUT_MS)
  --check-health                 Perform a quick one-off health check and exit
  --version, -v                  Display version number
  --help, -h                     Show this help message

Environment Variables:
  LMSTUDIO_API_URL               Base URL of LM Studio (e.g. http://192.168.0.108:1234)
  LMSTUDIO_FALLBACK_CHAT_MODEL   Default chat model if auto-detection fails
  LMSTUDIO_FALLBACK_EMBED_MODEL  Default embedding model if auto-detection fails
  LMSTUDIO_TIMEOUT_MS            Request timeout in milliseconds

Examples:
  # Start standard MCP stdio server:
  npx lmstudio-mcp-connector --url http://192.168.0.108:1234

  # Check LM Studio connectivity:
  node dist/index.js --check-health
`);
    process.exit(0);
  }

  if (args.includes("--version") || args.includes("-v")) {
    console.log(`v${VERSION}`);
    process.exit(0);
  }

  const config = parseCliAndEnvConfig(args);
  const client = new LmStudioClient(config);

  if (args.includes("--check-health")) {
    console.log(`Checking LM Studio instance at ${config.baseUrl}...`);
    const health = await client.checkHealth();
    console.log(`Status: ${health.status}`);
    console.log(`Latency: ${health.latencyMs}ms`);
    console.log(`Active Models (${health.activeModelsCount}): ${health.modelNames.join(", ") || "None"}`);
    process.exit(health.status === "ONLINE" ? 0 : 1);
  }

  const server = new McpServer(client);
  server.start();
}

main().catch((err) => {
  console.error("[lmstudio-mcp] Fatal server startup error:", err);
  process.exit(1);
});

