/**
 * [AI-GENERATED FILE]
 * This file was generated and architected with the assistance of AI
 * (Google Antigravity / Gemini 3.8 Flash & LM Studio local).
 * Verified and validated by automated strict Quality Gate (TypeScript strict, test suites).
 *
 * LM Studio MCP Daemon & Embedded Web GUI Server
 * Zero external runtime dependencies - Built exclusively with node:http
 */

import http from "node:http";
import type { PoolManager } from "./pool-manager.js";
import type { McpServer } from "./server.js";
import type { InstanceConfig, JsonRpcRequest } from "./types.js";

export class DaemonServer {
  private readonly port: number;
  private readonly pool: PoolManager;
  private readonly mcpServer: McpServer;
  private server: http.Server | null = null;
  private sseClients = new Set<http.ServerResponse>();

  constructor(port: number, pool: PoolManager, mcpServer: McpServer) {
    this.port = port;
    this.pool = pool;
    this.mcpServer = mcpServer;

    // Listen to state changes to broadcast via SSE
    this.pool.on("stateChanged", (report) => {
      this.broadcastSse("poolState", report);
    });
  }

  public getPort(): number {
    return this.port;
  }

  private broadcastSse(event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of this.sseClients) {
      try {
        res.write(payload);
      } catch {
        this.sseClients.delete(res);
      }
    }
  }

  private parseBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk: Buffer) => {
        body += chunk.toString("utf-8");
        if (body.length > 5 * 1024 * 1024) {
          req.destroy(new Error("Request payload too large"));
        }
      });
      req.on("end", () => resolve(body));
      req.on("error", reject);
    });
  }

  private sendJson(res: http.ServerResponse, statusCode: number, data: unknown): void {
    const json = JSON.stringify(data);
    res.writeHead(statusCode, {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": Buffer.byteLength(json),
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end(json);
  }

  private getHtmlDashboard(): string {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LM Studio MCP Connector — Dashboard</title>
  <style>
    :root {
      --bg: #0d1117;
      --card-bg: #161b22;
      --border: #30363d;
      --text: #e6edf3;
      --text-muted: #8b949e;
      --primary: #58a6ff;
      --success: #3fb950;
      --warning: #d29922;
      --danger: #f85149;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 24px;
      line-height: 1.5;
    }
    .container { max-width: 1100px; margin: 0 auto; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }
    h1 { font-size: 1.6rem; font-weight: 600; display: flex; align-items: center; gap: 10px; }
    .badge {
      font-size: 0.75rem;
      padding: 4px 10px;
      border-radius: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-online { background: rgba(63, 185, 80, 0.15); color: var(--success); border: 1px solid var(--success); }
    .badge-offline { background: rgba(248, 81, 73, 0.15); color: var(--danger); border: 1px solid var(--danger); }
    .badge-degraded { background: rgba(210, 153, 34, 0.15); color: var(--warning); border: 1px solid var(--warning); }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .metric-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    .metric-value { font-size: 2rem; font-weight: 700; margin: 6px 0; color: var(--primary); }
    .metric-label { font-size: 0.85rem; color: var(--text-muted); }
    .banner {
      background: rgba(248, 81, 73, 0.12);
      border: 1px solid var(--danger);
      color: var(--danger);
      padding: 14px 18px;
      border-radius: 8px;
      margin-bottom: 24px;
      display: none;
      font-weight: 500;
    }
    .section-title {
      font-size: 1.2rem;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn {
      background: #238636;
      color: #fff;
      border: none;
      padding: 8px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      font-size: 0.9rem;
      transition: background 0.2s;
    }
    .btn:hover { background: #2ea043; }
    .btn-secondary { background: #21262d; border: 1px solid var(--border); color: var(--text); }
    .btn-secondary:hover { background: #30363d; }
    .btn-danger { background: #da3633; }
    .btn-danger:hover { background: #b62324; }
    .instances-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .instance-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .instance-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .instance-title { font-weight: 600; font-size: 1.1rem; }
    .instance-url { font-family: monospace; font-size: 0.85rem; color: var(--text-muted); word-break: break-all; }
    .instance-stats {
      font-size: 0.85rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      padding: 10px;
      background: rgba(0,0,0,0.25);
      border-radius: 6px;
    }
    .model-tag {
      background: #1f242c;
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 0.75rem;
      font-family: monospace;
      display: inline-block;
      margin: 2px;
    }
    .form-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 32px;
    }
    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 14px;
    }
    label { display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px; }
    input, select {
      width: 100%;
      padding: 8px 12px;
      background: #0d1117;
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
      font-size: 0.9rem;
    }
    input:focus, select:focus { outline: none; border-color: var(--primary); }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>LM Studio MCP Connector <span class="badge badge-online" id="globalStatus">ONLINE</span></h1>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">
          Multi-Instance Load Balancer, Circuit Breaker & Fallback Controller
        </p>
      </div>
      <div>
        <button class="btn btn-secondary" onclick="checkAll()">⚡ Quick Healthcheck</button>
      </div>
    </header>

    <div class="banner" id="fallbackBanner">
      ⚠️ <strong>REMOTE FALLBACK ACTIVE:</strong> All local LM Studio instances are offline.
      Antigravity is automatically routing requests to remote LLMs to maintain continuity.
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-value" id="activeCount">-</div>
        <div class="metric-label">Active Instances</div>
      </div>
      <div class="metric-card">
        <div class="metric-value" id="inFlightCount">0</div>
        <div class="metric-label">In-Flight Requests</div>
      </div>
      <div class="metric-card">
        <div class="metric-value" id="totalRequests">0</div>
        <div class="metric-label">Processed Requests (OK)</div>
      </div>
      <div class="metric-card">
        <div class="metric-value" id="failedRequests" style="color: var(--danger)">0</div>
        <div class="metric-label">Failovers / Errors</div>
      </div>
    </div>

    <div class="section-title">
      <span>Configured LM Studio Instances</span>
    </div>
    <div class="instances-grid" id="instancesGrid">
      <!-- Dynamically filled -->
    </div>

    <div class="section-title">
      <span>Add a New Instance</span>
    </div>
    <div class="form-card">
      <form id="addForm" onsubmit="addInstance(event)">
        <div class="form-row">
          <div>
            <label>Unique ID (e.g. gpu-01, lan-server)</label>
            <input type="text" id="instId" required placeholder="gpu-01">
          </div>
          <div>
            <label>Display Name (optional)</label>
            <input type="text" id="instName" placeholder="Desktop RTX 4090">
          </div>
          <div>
            <label>LM Studio Endpoint URL</label>
            <input type="url" id="instUrl" required placeholder="http://127.0.0.1:1234">
          </div>
          <div>
            <label>Dedicated Role</label>
            <select id="instRole">
              <option value="all">All Roles (Chat & Embeddings)</option>
              <option value="chat">Chat / Code Only</option>
              <option value="embeddings">Embeddings Only</option>
            </select>
          </div>
        </div>
        <button type="submit" class="btn">＋ Add Instance to Pool</button>
      </form>
    </div>
  </div>

  <script>
    async function fetchState() {
      try {
        const res = await fetch("/api/status");
        if (!res.ok) return;
        const report = await res.json();
        updateUI(report);
      } catch (err) {
        console.error("Fetch status failed:", err);
      }
    }

    function updateUI(report) {
      document.getElementById("activeCount").textContent = report.activeCount + " / " + report.totalCount;
      
      const banner = document.getElementById("fallbackBanner");
      const globalStatus = document.getElementById("globalStatus");

      if (report.allOffline) {
        banner.style.display = "block";
        globalStatus.className = "badge badge-offline";
        globalStatus.textContent = "OFFLINE (REMOTE FALLBACK)";
      } else {
        banner.style.display = "none";
        globalStatus.className = "badge badge-online";
        globalStatus.textContent = "ONLINE";
      }

      let inFlight = 0;
      let totalReq = 0;
      let failedReq = 0;

      const container = document.getElementById("instancesGrid");
      container.innerHTML = "";

      for (const inst of report.instances) {
        inFlight += inst.metrics.inFlightRequests || 0;
        totalReq += inst.metrics.totalRequests || 0;
        failedReq += inst.metrics.failedRequests || 0;

        let badgeClass = "badge-offline";
        if (inst.health === "ONLINE") badgeClass = "badge-online";
        else if (inst.health === "DEGRADED") badgeClass = "badge-degraded";

        const card = document.createElement("div");
        card.className = "instance-card";

        const models = inst.activeModelNames && inst.activeModelNames.length > 0
          ? inst.activeModelNames.map(m => '<span class="model-tag">' + m + '</span>').join("")
          : '<em style="color:var(--text-muted);font-size:0.8rem">No models detected</em>';

        card.innerHTML = \`
          <div class="instance-header">
            <span class="instance-title">\${inst.config.name || inst.config.id}</span>
            <span class="badge \${badgeClass}">\${inst.health}</span>
          </div>
          <div class="instance-url">\${inst.config.url}</div>
          <div style="font-size:0.8rem; color:var(--text-muted)">Roles: <strong>\${inst.config.roles.join(", ")}</strong></div>
          <div class="instance-stats">
            <div>Latency: <strong>\${inst.metrics.latencyMs || 0} ms</strong></div>
            <div>In-Flight: <strong>\${inst.metrics.inFlightRequests || 0}</strong></div>
            <div>Success: <strong>\${inst.metrics.totalRequests || 0}</strong></div>
            <div>Errors: <strong style="color:var(--danger)">\${inst.metrics.failedRequests || 0}</strong></div>
          </div>
          <div>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:4px;">Loaded Models:</div>
            \${models}
          </div>
          <div style="margin-top:auto; display:flex; gap:8px;">
            <button class="btn btn-secondary" style="font-size:0.8rem; padding:4px 8px;" onclick="checkInstance('\${inst.config.id}')">Test</button>
            <button class="btn btn-danger" style="font-size:0.8rem; padding:4px 8px; margin-left:auto;" onclick="removeInstance('\${inst.config.id}')">Delete</button>
          </div>
        \`;
        container.appendChild(card);
      }

      document.getElementById("inFlightCount").textContent = inFlight;
      document.getElementById("totalRequests").textContent = totalReq;
      document.getElementById("failedRequests").textContent = failedReq;
    }

    async function checkAll() {
      await fetch("/api/healthcheck", { method: "POST" });
      await fetchState();
    }

    async function checkInstance(id) {
      await fetch("/api/instances/" + encodeURIComponent(id) + "/check", { method: "POST" });
      await fetchState();
    }

    async function removeInstance(id) {
      if (!confirm("Remove instance " + id + " from the pool?")) return;
      await fetch("/api/instances/" + encodeURIComponent(id), { method: "DELETE" });
      await fetchState();
    }

    async function addInstance(event) {
      event.preventDefault();
      const id = document.getElementById("instId").value.trim();
      const name = document.getElementById("instName").value.trim();
      const url = document.getElementById("instUrl").value.trim();
      const role = document.getElementById("instRole").value;

      await fetch("/api/instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: name || undefined,
          url,
          roles: role === "all" ? ["all"] : [role],
          priority: 1
        })
      });

      document.getElementById("instId").value = "";
      document.getElementById("instName").value = "";
      document.getElementById("instUrl").value = "";
      await fetchState();
    }

    // Connect SSE for live updates
    const evtSource = new EventSource("/api/events");
    evtSource.addEventListener("poolState", (e) => {
      try {
        const report = JSON.parse(e.data);
        updateUI(report);
      } catch (err) {}
    });

    // Fallback polling
    fetchState();
    setInterval(fetchState, 5000);
  </script>
</body>
</html>`;
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
        const pathname = url.pathname;
        const method = req.method || "GET";

        // CORS preflight
        if (method === "OPTIONS") {
          res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          });
          res.end();
          return;
        }

        try {
          // 1. Dashboard Web UI
          if (method === "GET" && pathname === "/") {
            const html = this.getHtmlDashboard();
            res.writeHead(200, {
              "Content-Type": "text/html; charset=utf-8",
              "Content-Length": Buffer.byteLength(html),
            });
            res.end(html);
            return;
          }

          // 2. Status Report REST API
          if (method === "GET" && pathname === "/api/status") {
            const report = this.pool.getPoolReport();
            this.sendJson(res, 200, report);
            return;
          }

          // 3. Trigger Health Check All
          if (method === "POST" && pathname === "/api/healthcheck") {
            const report = await this.pool.forceCheckAll();
            this.sendJson(res, 200, report);
            return;
          }

          // 4. Trigger Health Check for single instance
          if (method === "POST" && pathname.startsWith("/api/instances/") && pathname.endsWith("/check")) {
            const match = pathname.match(/^\/api\/instances\/([^/]+)\/check$/);
            const id = match && match[1] ? decodeURIComponent(match[1]) : null;
            if (id) {
              await this.pool.checkInstanceHealth(id);
              this.sendJson(res, 200, { success: true, instanceId: id });
              return;
            }
          }

          // 5. Add or Update Instance
          if (method === "POST" && pathname === "/api/instances") {
            const body = await this.parseBody(req);
            const data = JSON.parse(body) as Partial<InstanceConfig>;
            if (!data.id || !data.url) {
              this.sendJson(res, 400, { error: "Missing required fields: id, url" });
              return;
            }

            const config: InstanceConfig = {
              id: data.id,
              name: data.name,
              url: data.url.replace(/\/+$/, ""),
              roles: Array.isArray(data.roles) && data.roles.length > 0 ? data.roles : ["all"],
              priority: typeof data.priority === "number" ? data.priority : 1,
            };

            this.pool.addOrUpdateInstance(config);
            await this.pool.checkInstanceHealth(config.id);
            this.sendJson(res, 201, { success: true, instance: config });
            return;
          }

          // 6. Delete Instance
          if (method === "DELETE" && pathname.startsWith("/api/instances/")) {
            const id = decodeURIComponent(pathname.replace("/api/instances/", ""));
            const removed = this.pool.removeInstance(id);
            this.sendJson(res, removed ? 200 : 404, { success: removed, id });
            return;
          }

          // 7. SSE Events Stream for real-time dashboard updates
          if (method === "GET" && pathname === "/api/events") {
            res.writeHead(200, {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
              "Access-Control-Allow-Origin": "*",
            });
            res.write(`event: poolState\ndata: ${JSON.stringify(this.pool.getPoolReport())}\n\n`);
            this.sseClients.add(res);

            req.on("close", () => {
              this.sseClients.delete(res);
            });
            return;
          }

          // 8. MCP JSON-RPC over HTTP POST /mcp
          if (method === "POST" && (pathname === "/mcp" || pathname === "/rpc")) {
            const body = await this.parseBody(req);
            const rpcReq = JSON.parse(body) as JsonRpcRequest;
            const rpcRes = await this.mcpServer.processRpcRequest(rpcReq);
            this.sendJson(res, 200, rpcRes);
            return;
          }

          // 404
          this.sendJson(res, 404, { error: "Not Found" });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          this.sendJson(res, 500, { error: msg });
        }
      });

      this.server.on("error", (err) => {
        reject(err);
      });

      this.server.listen(this.port, () => {
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    for (const client of this.sseClients) {
      try {
        client.end();
      } catch {}
    }
    this.sseClients.clear();

    if (this.server) {
      return new Promise((resolve) => {
        this.server?.close(() => resolve());
      });
    }
  }
}

