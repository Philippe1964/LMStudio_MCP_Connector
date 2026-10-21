---
name: cloud-native-resilience
description: >-
  Cloud-Native resilience, fault tolerance, and managed database failover handling for the
  Presentation (React 19/Nginx) and Business (Python 3.14/FastAPI) tiers. Activate this skill
  when implementing database transactions, external HTTP adapters, Nginx upstream routing, or
  React error handling.
---

# Cloud-Native Resilience & Fault Tolerance Skill

Use this skill to make the Presentation and Business tiers resilient to network hiccups, transient cloud failures, replica restarts, and managed database Multi-AZ failovers.

## 1. Managed Database Resilience (Business ➔ Data Tier)

While the cloud provider manages database high availability, storage replication, and backups, the **Business tier** must smoothly survive transient connection drops during a managed DB failover or maintenance window:

1. **Pre-Ping & Connection Recycling (`SQLAlchemy AsyncEngine`)**:
   - Always set `pool_pre_ping=True` and `pool_recycle=1800` on `create_async_engine`. When the cloud provider switches the primary DB instance, `pool_pre_ping` automatically detects dead sockets, invalidates the stale connection pool, and establishes fresh connections transparently.
2. **Transient Error Retry with Exponential Backoff & Jitter**:
   - For idempotent read operations or connection acquisition failures (`DBAPIError` with `connection_invalidated`), use bounded retries (e.g., max 3 attempts, base delay `100ms` with exponential backoff and random jitter) to absorb brief DNS/VIP switchovers without surfacing `500` errors to the user.

---

## 2. Outbound HTTP & External Service Resilience

1. **Mandatory Explicit Timeouts**:
   - **Never** perform an outbound network call without an explicit timeout.
   - Always configure `httpx.AsyncClient(timeout=httpx.Timeout(connect=2.0, read=5.0, write=5.0, pool=2.0))`.
2. **Graceful Degradation & Fallback**:
   - When a non-critical dependency or telemetry probe fails or times out, return a structured degraded status rather than crashing the entire request pipeline.
3. **Idempotency of Write Operations**:
   - Design Application layer write use cases (`POST`, `PUT`, `PATCH`) to be idempotent whenever possible (via natural business keys or `Idempotency-Key` headers) so client or gateway retries never duplicate business records.

---

## 3. Presentation Tier Resilience (Nginx & React 19)

1. **Nginx Upstream Failover (`docker/presentation/nginx.conf`)**:
   - Configure `proxy_next_upstream error timeout http_502 http_503 http_504;` and `keepalive` on the `business_backend` upstream so Nginx automatically retries idempotent requests against another healthy Business replica if one replica is restarting.
2. **React 19 UI Fault Isolation (`ErrorBoundary`)**:
   - Wrap top-level routes in a React `ErrorBoundary` component so an unexpected rendering error displays a recoverable fallback UI with a "Réessayer" action instead of a blank screen.
   - Propagate and display clear status banners when backend API calls experience transient network issues.

