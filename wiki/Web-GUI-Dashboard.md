# Web GUI Dashboard & Real-Time Monitoring

The Daemon mode in **LM Studio MCP Connector v2.0** embeds a native HTTP server and a responsive Single-Page Application (SPA) built exclusively with Node.js standard libraries (zero third-party dependencies).

---

## 🚀 Starting the Daemon & Web GUI

```bash
# Launch on default port (9123):
node dist/index.js --daemon

# Launch on custom port with multiple cluster nodes:
node dist/index.js --daemon --port 9123 --instances "http://127.0.0.1:1234,http://192.168.0.108:1234,http://192.168.0.43:1234"
```

Open the dashboard in your web browser:  
👉 **`http://127.0.0.1:9123/`**

---

## 🖥️ Dashboard Features

```text
┌────────────────────────────────────────────────────────────────────────┐
│  LM Studio MCP Connector [ ONLINE ]       [ ⚡ Quick Healthcheck ]     │
│  Multi-Instance Load Balancer, Circuit Breaker & Fallback Controller  │
├────────────────────────────────────────────────────────────────────────┤
│  [ 3 / 3 ]           [ 0 ]              [ 42 ]             [ 0 ]       │
│  Active Inst.     In-Flight Req.     Processed Req.     Failovers/Err. │
├────────────────────────────────────────────────────────────────────────┤
│  Configured LM Studio Instances                                        │
│  ┌───────────────────────┐ ┌───────────────────────┐                  │
│  │ instance-1 [ONLINE]   │ │ gpu-02 [ONLINE]       │                  │
│  │ http://127.0.0.1:1234 │ │ 192.168.0.108:1234    │                  │
│  │ Roles: all            │ │ Roles: all            │                  │
│  │ Latency: 3ms          │ │ Latency: 4ms          │                  │
│  │ Models: gemma-4-e4b   │ │ Models: gemma-4-e4b   │                  │
│  │ [Test]      [Delete]  │ │ [Test]      [Delete]  │                  │
│  └───────────────────────┘ └───────────────────────┘                  │
├────────────────────────────────────────────────────────────────────────┤
│  Add a New Instance                                                    │
│  [ ID: gpu-04 ] [ URL: http://192.168.0.50:1234 ] [ Role: chat ]       │
│  [ ＋ Add Instance to Pool ]                                          │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Real-Time Global Metrics**:
   - Total active instances over configured nodes.
   - Live in-flight requests currently being computed by GPUs.
   - Successful processed requests counter.
   - Error and automatic failover counters.
2. **Fallback Alert Banner**:
   - Displays a prominent red warning whenever **all** local nodes are offline, signaling active Antigravity remote model fallback.
3. **Detailed Instance Cards**:
   - Live status badges: 🟢 `ONLINE`, 🟡 `DEGRADED`, 🔴 `OFFLINE`.
   - Latency in milliseconds and active models loaded in VRAM/RAM for each node.
   - Individual test button to verify node health on demand.
4. **Hot Configuration Management**:
   - Form to add new instances dynamically with dedicated roles (`all`, `chat`, `embeddings`).
   - One-click instance removal without restarting the daemon or interrupting active MCP sessions.
5. **Server-Sent Events (SSE)**:
   - Dashboard automatically subscribes to `/api/events`, receiving state updates and metrics pushes without browser refresh.

---

## 📡 REST API Reference

The embedded HTTP server exposes the following endpoints:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Web GUI Dashboard HTML page. |
| `GET` | `/api/status` | Returns complete pool report, latencies, and metric counters (JSON). |
| `POST` | `/api/healthcheck` | Triggers an immediate health probe across all instances. |
| `POST` | `/api/instances/:id/check` | Triggers a health probe for a specific instance. |
| `POST` | `/api/instances` | Adds or updates an instance (`{ id, name, url, roles, priority }`). |
| `DELETE` | `/api/instances/:id` | Removes an instance from the pool. |
| `GET` | `/api/events` | Real-time Server-Sent Events (SSE) stream pushing state changes. |
| `POST` | `/mcp` or `/rpc` | HTTP endpoint executing MCP JSON-RPC 2.0 requests. |
