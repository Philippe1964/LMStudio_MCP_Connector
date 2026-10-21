#!/usr/bin/env node
/**
 * LM Studio MCP Connector - Main Executable Entry Point
 */

import { parseCliAndEnvConfig } from "./config.js";
import { DaemonServer } from "./daemon-server.js";
import { PoolManager } from "./pool-manager.js";
import { McpServer } from "./server.js";

const VERSION = "2.0.0";

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
LM Studio MCP Connector v${VERSION}
Model Context Protocol (MCP) server & Daemon with Multi-Instance Load Balancing,
Automatic Failover, Web Monitoring GUI and Remote LLM Fallback Directives.

Usage:
  lmstudio-mcp-connector [options]
  node dist/index.js [options]

Core Options:
  --daemon, -d                   Run as persistent HTTP & SSE Daemon with embedded Web GUI
  --port, --daemon-port, -p <n>  Port for HTTP Daemon & Web GUI (default: 9123 or $LMSTUDIO_DAEMON_PORT)
  --instances <urls/json>        Multi-instance list (e.g. "http://127.0.0.1:1234,http://192.168.1.50:1234")
  --url, -u <url>                Default primary LM Studio URL (default: http://127.0.0.1:1234)
  --model, -m <name>             Model to use or fallback chat model (default: auto-detected)
  --fallback-chat-model <name>   Alias for --model
  --fallback-embed-model <name>  Fallback embedding model (default: text-embedding-nomic-embed-text-v1.5)
  --timeout, -t <ms>             HTTP Request timeout in ms (default: 60000 or $LMSTUDIO_TIMEOUT_MS)
  --check-health                 Perform a quick one-off health check and exit
  --version, -v                  Display version number
  --help, -h                     Show this help message

Environment Variables:
  LMSTUDIO_DAEMON                Run daemon if "true" or "1"
  LMSTUDIO_DAEMON_PORT           Daemon HTTP port (default: 9123)
  LMSTUDIO_INSTANCES             JSON array or comma-separated list of LM Studio instances
  LMSTUDIO_API_URL               Base URL of primary LM Studio instance (default: http://127.0.0.1:1234)
  LMSTUDIO_CHAT_MODEL            Default chat model name or fallback
  LMSTUDIO_FALLBACK_CHAT_MODEL   Alias for LMSTUDIO_CHAT_MODEL
  LMSTUDIO_FALLBACK_EMBED_MODEL  Default embedding model if auto-detection fails
  LMSTUDIO_TIMEOUT_MS            Request timeout in milliseconds (default: 60000)

Examples:
  # Start standard MCP stdio server with multi-instance support:
  npx lmstudio-mcp-connector

  # Start HTTP Daemon with real-time Web Dashboard on port 9123:
  npx lmstudio-mcp-connector --daemon --port 9123

  # Configure multiple LM Studio machines with automatic load balancing & failover:
  npx lmstudio-mcp-connector --instances "http://127.0.0.1:1234,http://192.168.1.50:1234"

  # Quick health check:
  node dist/index.js --check-health
`);
    process.exit(0);
  }

  if (args.includes("--version") || args.includes("-v")) {
    console.log(`v${VERSION}`);
    process.exit(0);
  }

  const config = parseCliAndEnvConfig(args);
  const pool = new PoolManager(config);

  if (args.includes("--check-health")) {
    console.log(`Checking LM Studio instances (${config.instances.length} configured)...`);
    const report = await pool.forceCheckAll();
    console.log(`Pool Status: ${report.allOffline ? "ALL OFFLINE" : "ONLINE"}`);
    console.log(`Active: ${report.activeCount} / ${report.totalCount}`);
    for (const inst of report.instances) {
      console.log(
        `• [${inst.config.id}] ${inst.config.url} => ${inst.health} (${inst.metrics.latencyMs}ms) - Models: ${inst.metrics.loadedModels.join(", ") || "None"}`
      );
    }
    process.exit(report.allOffline ? 1 : 0);
  }

  const server = new McpServer(pool);

  if (config.daemon) {
    const daemon = new DaemonServer(config.daemonPort, pool, server);
    await daemon.start();
    pool.startHealthCheck();

    console.log(`\n========================================================`);
    console.log(`  🚀 LM Studio MCP Connector Daemon v${VERSION}`);
    console.log(`  📊 Web Dashboard:       http://127.0.0.1:${config.daemonPort}/`);
    console.log(`  📡 MCP HTTP/RPC Endpoint: http://127.0.0.1:${config.daemonPort}/mcp`);
    console.log(`  🔄 Instances:           ${config.instances.length} configured`);
    console.log(`========================================================\n`);

    const shutdown = async () => {
      console.log("\n[lmstudio-daemon] Shutting down daemon...");
      pool.destroy();
      await daemon.stop();
      process.exit(0);
    };

    process.on("SIGINT", () => void shutdown());
    process.on("SIGTERM", () => void shutdown());
    return;
  }

  // Stdio mode: auto-detect and bridge to active daemon if available
  if (config.autoProxy) {
    const targetDaemon = config.daemonUrl || `http://127.0.0.1:${config.daemonPort}`;
    const isDaemonActive = await McpServer.probeDaemon(targetDaemon, 350);
    if (isDaemonActive) {
      server.setDaemonUrl(targetDaemon);
      console.error(
        `[lmstudio-mcp] Stdio bridge connected to active daemon at ${targetDaemon}. Requests will be routed through daemon.`
      );
    } else {
      console.error(
        `[lmstudio-mcp] Standalone mode (no active daemon detected at ${targetDaemon}).`
      );
    }
  }

  server.start();
}

main().catch((err) => {
  console.error("[lmstudio-mcp] Fatal server startup error:", err);
  process.exit(1);
});
