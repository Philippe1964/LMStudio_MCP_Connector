---
name: cloud-native-scalability
description: >-
  Cloud-Native horizontal scalability and 12-Factor engineering standards for the Presentation
  (React/Nginx) and Business (Python 3.14/FastAPI) tiers. Activate this skill when designing
  use cases, configuring FastAPI lifespans, tuning SQLAlchemy connection pools for multi-replica
  deployments against managed databases, or configuring Liveness/Readiness probes.
---

# Cloud-Native Horizontal Scalability & 12-Factor Skill

Use this skill to ensure the Presentation and Business tiers can scale horizontally ($1 \to N$ container replicas) seamlessly behind a load balancer or orchestrator (Kubernetes, Cloud Run, AWS ECS, Azure Container Apps).

## 1. Strict Statelessness (12-Factor Principle VI)

1. **No In-Memory Session or Local State**:
   - Never store user sessions, authentication state, rate-limiting counters, or mutable caches in Python module globals or local process memory across requests. Any request must be serviceable by **any** replica of `<project>-business`.
   - Use stateless JWT/Bearer tokens validated at the Presentation layer, or externalize shared ephemeral state to a managed cache/database.
2. **No Local Ephemeral Filesystem Persistence**:
   - Never write business documents, exports, or user uploads to the container's local filesystem. Stream uploads directly to managed object storage (S3/Blob) or persist structured data in the managed Data tier.

---

## 2. Container Lifecycle & Graceful Shutdown (12-Factor Principle IX)

1. **FastAPI `lifespan` Context Manager**:
   - Always configure an `asynccontextmanager` `lifespan` on the FastAPI application so that when an orchestrator sends `SIGTERM` during a rolling update or scale-in:
     - In-flight HTTP requests complete cleanly.
     - Shared infrastructure resources (such as the SQLAlchemy `AsyncEngine` connection pool) are explicitly disposed (`await dispose_default_engine()`) before process exit.
2. **Fast Startup**:
   - Keep container startup under a few seconds. Never run heavy data migrations or blocking network calls synchronously at module import time.

---

## 3. Kubernetes / Cloud Orchestrator Probes (Liveness vs. Readiness)

Always expose distinct probe endpoints in the Presentation layer:
- **`GET /health/live` (Liveness Probe)**:
  - Verifies only that the Python/FastAPI event loop is alive and responsive.
  - **Must NOT** query the database or external services (a temporary database failover must never trigger a restart loop of all Business containers!).
- **`GET /health/ready` (Readiness Probe)**:
  - Verifies that the Business replica is ready to serve traffic and can reach its critical dependencies (e.g., `SELECT 1` on the managed database pool).
  - Returns HTTP `200 OK` when ready or `503 Service Unavailable` when the replica should be temporarily removed from load-balancer rotation.
- **`GET /api/health-check` (Full 3-Tier Diagnostic)**:
  - Deep hardware, software, and topology inspection across all tiers for human operators and supervision dashboards.

---

## 4. Database Connection Pool Sizing for Multi-Replica Scale-Out

When the Data tier is a managed cloud PostgreSQL service with a fixed connection ceiling (`max_connections`), each Business replica must bound its SQLAlchemy pool via externalized `AppSettings`:
- Formula: $\text{Max Replicas} \times (\text{db\_pool\_size} + \text{db\_max\_overflow}) < \text{Managed DB max\_connections}$.
- Always configure:
  - `pool_pre_ping=True` (validates connections before checkout).
  - `pool_size` (e.g., `5` per replica by default).
  - `max_overflow` (e.g., `10` per replica by default).
  - `pool_timeout` (e.g., `30.0` seconds).
  - `pool_recycle` (e.g., `1800` seconds to avoid stale cloud firewall/NAT TCP connections).

