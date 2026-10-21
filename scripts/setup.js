#!/usr/bin/env node
/**
 * Cross-Platform Setup & Configuration Engine for LM Studio MCP Connector.
 * Supports Linux, macOS, and Windows.
 * Configures Claude Desktop, Cursor, and Antigravity / Gemini MCP clients.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const DIST_INDEX = path.join(REPO_ROOT, "dist", "index.js");

// Colors for terminal formatting
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  dim: "\x1b[2m",
};

function getPlatformInfo() {
  return {
    platform: process.platform,
    homeDir: os.homedir(),
  };
}

/**
 * Resolve standard MCP client configuration paths for current operating system
 */
export function getAvailableClients(platform = process.platform, homeDir = os.homedir()) {
  const clients = [];

  // 1. Claude Desktop
  let claudePath = "";
  if (platform === "darwin") {
    claudePath = path.join(homeDir, "Library", "Application Support", "Claude", "claude_desktop_config.json");
  } else if (platform === "win32") {
    const appData = process.env.APPDATA || path.join(homeDir, "AppData", "Roaming");
    claudePath = path.join(appData, "Claude", "claude_desktop_config.json");
  } else {
    // Linux and others
    const configHome = process.env.XDG_CONFIG_HOME || path.join(homeDir, ".config");
    claudePath = path.join(configHome, "Claude", "claude_desktop_config.json");
  }

  clients.push({
    id: "claude",
    name: "Claude Desktop",
    configPath: claudePath,
    format: "claude",
  });

  // 2. Cursor IDE
  const cursorPath = path.join(homeDir, ".cursor", "mcp.json");

  clients.push({
    id: "cursor",
    name: "Cursor IDE (~/.cursor/mcp.json)",
    configPath: cursorPath,
    format: "standard",
  });

  // 3. Antigravity / Gemini CLI
  const geminiPath = path.join(homeDir, ".gemini", "config", "mcp_config.json");
  clients.push({
    id: "gemini",
    name: "Antigravity / Gemini CLI (~/.gemini/config/mcp_config.json)",
    configPath: geminiPath,
    format: "standard",
  });

  return clients;
}

/**
 * Safely merge LM Studio MCP configuration into an existing or new config file
 */
export function configureClient(client, apiUrl, model = "default") {
  try {
    const dir = path.dirname(client.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let configData = {};
    if (fs.existsSync(client.configPath)) {
      try {
        const raw = fs.readFileSync(client.configPath, "utf-8");
        configData = JSON.parse(raw);
      } catch (err) {
        // If file exists but is corrupted, back it up
        const backupPath = `${client.configPath}.bak.${Date.now()}`;
        fs.copyFileSync(client.configPath, backupPath);
        configData = {};
      }
    }

    if (!configData.mcpServers || typeof configData.mcpServers !== "object") {
      configData.mcpServers = {};
    }

    // Server definition
    if (client.format === "claude") {
      const args = [DIST_INDEX, "--url", apiUrl];
      if (model && model !== "default") {
        args.push("--model", model);
      }
      configData.mcpServers.lmstudio = {
        command: "node",
        args,
      };
    } else {
      const env = {
        LMSTUDIO_API_URL: apiUrl,
      };
      if (model && model !== "default") {
        env.LMSTUDIO_CHAT_MODEL = model;
      }
      configData.mcpServers.lmstudio = {
        command: "node",
        args: [DIST_INDEX],
        env,
      };
    }

    fs.writeFileSync(client.configPath, JSON.stringify(configData, null, 2) + "\n", "utf-8");
    return { success: true, path: client.configPath };
  } catch (err) {
    return { success: false, path: client.configPath, error: err.message };
  }
}

/**
 * Create or update local .env file in the repository root
 */
export function updateLocalEnv(apiUrl, model = "default") {
  const envPath = path.join(REPO_ROOT, ".env");
  const content = `# LM Studio MCP Connector Configuration
LMSTUDIO_API_URL=${apiUrl}
LMSTUDIO_CHAT_MODEL=${model}
LMSTUDIO_FALLBACK_CHAT_MODEL=${model}
LMSTUDIO_FALLBACK_EMBED_MODEL=text-embedding-nomic-embed-text-v1.5
LMSTUDIO_TIMEOUT_MS=60000
`;
  fs.writeFileSync(envPath, content, "utf-8");
}

function parseArgs(args) {
  const options = {
    url: "http://127.0.0.1:1234",
    model: "default",
    client: "all",
    yes: false,
    check: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--yes" || arg === "-y") options.yes = true;
    else if (arg === "--check") options.check = true;
    else if ((arg === "--url" || arg === "-u") && args[i + 1]) options.url = args[++i];
    else if (arg?.startsWith("--url=")) options.url = arg.split("=")[1];
    else if ((arg === "--model" || arg === "-m") && args[i + 1]) options.model = args[++i];
    else if (arg?.startsWith("--model=")) options.model = arg.split("=")[1];
    else if (arg === "--client" && args[i + 1]) options.client = args[++i];
    else if (arg?.startsWith("--client=")) options.client = arg.split("=")[1];
  }

  // Strip trailing slashes
  options.url = options.url.replace(/\/+$/, "");

  return options;
}

async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.help) {
    console.log(`
${colors.bold}LM Studio MCP Connector - Setup & Configuration Script${colors.reset}

Usage:
  node scripts/setup.js [options]
  npm run setup -- [options]

Options:
  --url, -u <url>      LM Studio API endpoint URL (default: http://127.0.0.1:1234)
  --model, -m <name>   Chat model name or fallback (default: default [auto-detected])
  --client <name>      Target client to configure: claude, cursor, gemini, all, none (default: all)
  --yes, -y            Non-interactive mode (use defaults or specified CLI options)
  --check              Check LM Studio connectivity after configuration
  --help, -h           Show this help message

Supported Operating Systems:
  - Linux (Ubuntu, Debian, Fedora, Arch, etc.)
  - macOS (Intel & Apple Silicon)
  - Windows (Windows 10/11, PowerShell, CMD)
`);
    process.exit(0);
  }

  console.log(`
${colors.cyan}${colors.bold}====================================================
  LM Studio MCP Connector - Installer & Configurator
====================================================${colors.reset}
`);

  const { platform, homeDir } = getPlatformInfo();
  const osLabel = platform === "darwin" ? "macOS" : platform === "win32" ? "Windows" : "Linux";
  console.log(`${colors.dim}Detected Platform:${colors.reset} ${colors.bold}${osLabel}${colors.reset} (${platform})`);
  console.log(`${colors.dim}Home Directory:${colors.reset}    ${homeDir}`);
  console.log(`${colors.dim}Connector Binary:${colors.reset}  ${DIST_INDEX}\n`);

  let targetUrl = options.url;
  let targetModel = options.model;
  let selectedClientOption = options.client;

  const isInteractive = Boolean(process.stdin.isTTY) && !options.yes;

  if (isInteractive) {
    const rl = readline.createInterface({ input, output });

    try {
      const askUrl = await rl.question(
        `${colors.bold}Enter LM Studio URL${colors.reset} [default: ${colors.green}${targetUrl}${colors.reset}]: `
      );
      if (askUrl.trim().length > 0) {
        targetUrl = askUrl.trim().replace(/\/+$/, "");
      }

      const askModel = await rl.question(
        `${colors.bold}Enter fallback chat model${colors.reset} [default: ${colors.green}auto-detected${colors.reset}]: `
      );
      if (askModel.trim().length > 0) {
        targetModel = askModel.trim();
      }

      console.log(`\n${colors.bold}Which AI clients would you like to configure?${colors.reset}`);
      console.log(`  1) All supported clients (${osLabel}) [Recommended]`);
      console.log(`  2) Claude Desktop only`);
      console.log(`  3) Cursor only`);
      console.log(`  4) Antigravity / Gemini CLI only`);
      console.log(`  5) Local .env file only (no client configs)`);

      const choice = await rl.question(`Select option [1-5, default: 1]: `);
      const trimmed = choice.trim();
      if (trimmed === "2") selectedClientOption = "claude";
      else if (trimmed === "3") selectedClientOption = "cursor";
      else if (trimmed === "4") selectedClientOption = "gemini";
      else if (trimmed === "5") selectedClientOption = "none";
      else selectedClientOption = "all";
    } finally {
      rl.close();
    }
  }

  console.log(`\n${colors.bold}Configuring environment...${colors.reset}`);

  // 1. Update local .env file
  updateLocalEnv(targetUrl, targetModel);
  console.log(`  ${colors.green}✔${colors.reset} Created/Updated project ${colors.bold}.env${colors.reset} file`);

  // 2. Configure target MCP clients
  const allClients = getAvailableClients(platform, homeDir);
  const clientsToConfigure =
    selectedClientOption === "all"
      ? allClients
      : selectedClientOption === "none"
      ? []
      : allClients.filter((c) => c.id === selectedClientOption);

  for (const client of clientsToConfigure) {
    const result = configureClient(client, targetUrl, targetModel);
    if (result.success) {
      console.log(`  ${colors.green}✔${colors.reset} Configured ${colors.bold}${client.name}${colors.reset}`);
      console.log(`    ${colors.dim}-> ${result.path}${colors.reset}`);
    } else {
      console.log(`  ${colors.red}✖${colors.reset} Failed to configure ${client.name}: ${result.error}`);
    }
  }

  // 3. Connectivity check if requested or in interactive mode
  console.log(`\n${colors.bold}Testing connectivity to LM Studio at ${colors.cyan}${targetUrl}${colors.reset}...`);
  try {
    const res = await fetch(`${targetUrl}/v1/models`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      const count = data.data?.length || 0;
      const models = (data.data || []).map((m) => m.id).join(", ");
      console.log(`  ${colors.green}✔ LM Studio is ONLINE!${colors.reset} (${count} active models: ${models || "None"})`);
    } else {
      console.log(`  ${colors.yellow}⚠ LM Studio responded with HTTP ${res.status} (${res.statusText})${colors.reset}`);
    }
  } catch (err) {
    console.log(`  ${colors.yellow}ℹ Note: LM Studio could not be reached right now (${err.message}).${colors.reset}`);
    console.log(`    ${colors.dim}Make sure LM Studio is open with the local server started on ${targetUrl}.${colors.reset}`);
  }

  console.log(`
${colors.green}${colors.bold}Installation and configuration complete!${colors.reset}
To start using LM Studio with your AI client:
  1. Restart your AI client (Claude Desktop, Cursor, or Antigravity/Gemini).
  2. The tool ${colors.cyan}lmstudio_chat${colors.reset} will be automatically available!
`);
}

const isDirectRun =
  Boolean(process.argv[1]) &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  main().catch((err) => {
    console.error(`${colors.red}Setup error:${colors.reset}`, err);
    process.exit(1);
  });
}
