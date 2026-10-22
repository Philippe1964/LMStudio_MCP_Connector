# LM Studio MCP Connector & Daemon

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![MCP Specification](https://img.shields.io/badge/MCP-2024--11--05-orange.svg)](https://modelcontextprotocol.io/)
[![Platform](https://img.shields.io/badge/Platform-Linux%20%7C%20macOS%20%7C%20Windows-blue.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-purple.svg)](package.json)
[![AI Generated](https://img.shields.io/badge/AI%20Assisted-Gemini%203.8%20Flash%20%7C%20LM%20Studio-blueviolet.svg)](.agents/rules/ai-transparency-disclosure.md)

> 🤖 **AI Transparency & Disclosure**: This project, its source code, multi-OS installation scripts, and technical documentation were designed and authored with Artificial Intelligence assistance (**Google Antigravity** — Models: *Gemini 3.8 Flash* for orchestration and local *LM Studio* models for cognitive reasoning). All code is systematically tested and validated by a strict Quality Gate.

A standalone, modern, ultra-resilient **Model Context Protocol (MCP)** server and daemon written in **TypeScript** to connect any agentic AI platform (Antigravity, Gemini, Claude Desktop, Cursor, VS Code) to one or multiple **LM Studio** instances via Stdio JSON-RPC or HTTP.

---

## 🌟 What's New in Version 2.0.0

- 🔀 **Multi-Instance Architecture & Load Balancing**: Configure multiple LM Studio machines (local, LAN, dedicated GPU servers). Requests are automatically routed using the **Least-Connections** algorithm.
- 🛡️ **Automatic Failover & Circuit Breaker**: If an instance times out, experiences connection errors, or shuts down, the connector seamlessly fails over to the next eligible instance.
- ⚡ **Antigravity Remote Fallback Directive**: If **all** local instances become unavailable, the connector returns a structured diagnostic (`REMOTE FALLBACK REQUIRED`) instructing the calling agent to complete the task using its native remote LLMs without failing the execution.
- 🖥️ **HTTP Daemon & Embedded Real-Time Web GUI**: Run with `--daemon` to host a web dashboard (`http://127.0.0.1:9123/`) for live monitoring (latency, in-flight requests, loaded models) and hot-reloading instance configurations without restarting.
- 🌉 **Transparent Stdio Bridge**: Standard Stdio clients automatically detect if the daemon is running and transparently forward requests to it, surfacing live metrics in the Web GUI without changing client configs.
- 🏷️ **Role-Based Routing**: Assign specialized roles (`chat`, `embeddings`, `all`) to instances (e.g. reserve fast embeddings to a specific machine without stalling heavy code completions).
- ⚡ **Zero Runtime Dependencies**: Built 100% on native Node.js APIs (`fetch`, `readline`, `node:http`, `node:events`, `AbortController`).

---

## 🛠️ Exposed MCP Tools

The connector exposes 5 standardized tools:

| Tool | Description | Main Arguments |
| :--- | :--- | :--- |
| `lmstudio_chat` | Send a prompt/instruction to the local LM Studio model with auto-detection, load balancing, and remote fallback on complete outage. | `prompt` (required), `system_prompt`, `model`, `temperature`, `max_tokens` |
| `lmstudio_list_models` | List all AI models available across active instances in the pool. | *None* |
| `lmstudio_embeddings` | Compute vector embeddings for text using the configured local embedding model. | `input` (required), `model` |
| `lmstudio_health` | Probe latency, status, and active models across all configured instances. | *None* |
| `lmstudio_pool_status` | Retrieve a detailed JSON report of pool metrics, in-flight connections, and failover stats. | *None* |

---

## 🚀 Usage Modes

### 1. Standard Stdio Mode (Direct for Antigravity / Claude / Cursor)
In your MCP client configuration file (`mcp_config.json`, `claude_desktop_config.json`, etc.):
```json
{
  "mcpServers": {
    "lmstudio": {
      "command": "node",
      "args": [
        "E:/SourceCode/LMStudio_MCP_Connector/dist/index.js",
        "--instances",
        "http://127.0.0.1:1234,http://192.168.1.50:1234"
      ]
    }
  }
}
```

### 2. Persistent HTTP Daemon & Web Dashboard
Run the connector as a background daemon:
```bash
node dist/index.js --daemon --port 9123 --instances "http://127.0.0.1:1234,http://192.168.1.50:1234"
```
- **Web Dashboard**: Open `http://127.0.0.1:9123/` in your browser.
- **MCP HTTP / RPC Endpoint**: `POST http://127.0.0.1:9123/mcp`
- **Real-Time SSE Stream**: `GET http://127.0.0.1:9123/api/events`

---

## 💻 CLI Options

```text
Options:
  --daemon, -d                   Run as persistent HTTP & SSE Daemon with embedded Web GUI
  --port, --daemon-port, -p <n>  Port for HTTP Daemon & Web GUI (default: 9123 or $LMSTUDIO_DAEMON_PORT)
  --daemon-url <url>             Explicit daemon URL for Stdio proxy (default: auto-detected 9123)
  --no-proxy, --standalone       Disable daemon proxy bridge and force local standalone execution
  --instances <urls/json>        Multi-instance list (comma-separated URLs or JSON array)
  --url, -u <url>                Primary LM Studio API URL (default: http://127.0.0.1:1234)
  --model, -m <name>             Model to use or fallback chat model (default: auto-detected)
  --fallback-chat-model <name>   Alias for --model
  --fallback-embed-model <name>  Fallback embedding model (default: text-embedding-nomic-embed-text-v1.5)
  --timeout, -t <ms>             HTTP Request timeout in ms (default: 60000)
  --check-health                 Perform a health check across all instances and exit
  --version, -v                  Display version number (v2.0.0)
  --help, -h                     Show help message
```

### Advanced JSON Configuration for `--instances` or `LMSTUDIO_INSTANCES`
```json
[
  { "id": "local-gpu", "name": "Desktop RTX 4090", "url": "http://127.0.0.1:1234", "roles": ["chat"], "priority": 2 },
  { "id": "lan-embed", "name": "Embedding Server", "url": "http://192.168.1.50:1234", "roles": ["embeddings"], "priority": 1 },
  { "id": "backup-cpu", "name": "Backup Node", "url": "http://192.168.1.60:1234", "roles": ["all"], "priority": 1 }
]
```

---

## 🛡️ Resilience & Antigravity Remote Fallback

When all local LM Studio instances are offline or unreachable:
1. The connector does not hang or crash.
2. The MCP tool returns `isError: true` with an explicit directive:
   ```text
   ⚠️ [LM STUDIO OFFLINE - REMOTE FALLBACK REQUIRED]
   No local LM Studio instances are currently reachable.
   Antigravity is instructed to immediately fulfill this user request using its native remote LLM capabilities without failing the turn.
   ```
3. The calling agent instantly recognizes the condition and fulfills the user request with its native cloud LLM (Gemini, Claude, GPT), ensuring zero workflow interruption.
4. Once LM Studio is restarted, the background health probe automatically restores `ONLINE` status in real time.

---

## 🧪 Testing & Automated Quality Gate

The project is governed by an automated Quality Gate enforcing strict TypeScript typing and native tests:
```bash
# Run TypeScript strict checks and all 29 unit & integration tests:
node scripts/quality_gate_hook.js --cli
```

---

## 📜 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.
