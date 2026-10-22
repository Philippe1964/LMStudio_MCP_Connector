# Configuration & Multi-OS Deployment

This guide covers all command-line options, environment variables, and client setup procedures for Linux, macOS, and Windows.

---

## 🛠️ Command-Line Interface (CLI)

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

---

## 🌍 Environment Variables

All parameters can be configured via environment variables or a `.env` file located in the project root:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `LMSTUDIO_API_URL` | `http://127.0.0.1:1234` | Primary LM Studio instance URL. |
| `LMSTUDIO_INSTANCES` | *None* | Comma-separated list or JSON array of cluster instances. |
| `LMSTUDIO_DAEMON` | `false` | Enable daemon mode at launch (`true` or `1`). |
| `LMSTUDIO_DAEMON_PORT` | `9123` | Listening port for HTTP server and Web GUI. |
| `LMSTUDIO_AUTO_PROXY` | `true` | Automatically detect and proxy Stdio to active local daemon. |
| `LMSTUDIO_TIMEOUT_MS` | `60000` | HTTP request timeout in milliseconds. |
| `LMSTUDIO_HEALTH_INTERVAL_MS`| `15000` | Interval in ms for background health polling loop. |

---

## 🔌 MCP Client Configuration

### Antigravity & Gemini CLI
Configuration path: `~/.gemini/config/mcp_config.json` (or `%USERPROFILE%\.gemini\config\mcp_config.json` on Windows):

```json
{
  "mcpServers": {
    "lmstudio": {
      "command": "node",
      "args": [
        "E:\\SourceCode\\LMStudio_MCP_Connector\\dist\\index.js"
      ],
      "env": {
        "LMSTUDIO_API_URL": "http://127.0.0.1:1234"
      }
    }
  }
}
```
*Note: The transparent bridge automatically attaches to the daemon on port 9123 if running, routing requests across your multi-instance pool and updating your Web Dashboard live.*

### Claude Desktop
Path: `%APPDATA%\Claude\claude_desktop_config.json` (Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "lmstudio": {
      "command": "node",
      "args": [
        "/absolute/path/to/LMStudio_MCP_Connector/dist/index.js"
      ]
    }
  }
}
```

### Cursor IDE
Path: `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "lmstudio": {
      "command": "node",
      "args": [
        "/absolute/path/to/LMStudio_MCP_Connector/dist/index.js"
      ]
    }
  }
}
```
