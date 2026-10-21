---
name: cloud-native-observability
description: >-
  Cloud-Native observability, distributed request correlation (X-Request-ID), and structured
  JSON logging standards across the Presentation (React/Nginx) and Business (Python 3.14/FastAPI)
  tiers. Activate this skill when configuring logging, HTTP middlewares, error handlers, or
  telemetry endpoints.
---

# Cloud-Native Observability & Correlation Skill

Use this skill to ensure every request across multiple Presentation and Business container replicas is traceable, structured, and observable in cloud log aggregators (Datadog, ELK, CloudWatch, GCP Cloud Logging, Azure Monitor).

## 1. End-to-End Request Correlation (`X-Request-ID`)

In a multi-replica Cloud-Native deployment, logs from many containers are interleaved. Every HTTP request must carry a correlation identifier from edge to database:
1. **Browser / Nginx Edge**:
   - If the client sends an `X-Request-ID` header, preserve it; otherwise, generate a unique request ID at the Nginx gateway (`$request_id`) or FastAPI middleware (`uuid.uuid4()`) and forward it via `X-Request-ID`.
2. **FastAPI Correlation Middleware & `contextvars`**:
   - Store the active `request_id` in a `contextvars.ContextVar[str]` for the duration of the async request lifecycle.
   - Always echo `X-Request-ID` in the HTTP response headers so clients and support teams can correlate browser errors with backend logs.

---

## 2. Structured JSON Logging to `stdout` (12-Factor Principle XI)

1. **Stream to `stdout` Only**:
   - Never write application log files inside containers. Emit all logs as single-line JSON objects to `stdout` so the container runtime and cloud log agents collect and index them automatically.
2. **Mandatory JSON Log Fields**:
   - Every log record must include:
     - `timestamp` (ISO-8601 UTC)
     - `level` (`INFO`, `WARNING`, `ERROR`)
     - `logger` (module name)
     - `message`
     - `request_id` (injected automatically from `ContextVar`)
     - `service` / `environment`
3. **Sensitive Data Redaction**:
   - Never log `Authorization` headers, passwords, JWT tokens, or personal identifiable information (PII) in plain text.

