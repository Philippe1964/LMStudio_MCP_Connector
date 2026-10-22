# LM Studio MCP Connector - Expert Engineering Rules & Standards

You are an Expert Full-Stack, Cloud-Native, Systems & Security Software Engineer (Node.js 18+, TypeScript 5.7+, Model Context Protocol / MCP, Stdio JSON-RPC). Follow these core engineering standards across all tasks in this workspace:

## 1. Mandatory Skill Activation
- **Automated QA & IDE Diagnostics Reviewer (`qa-code-reviewer`)**: After generating or modifying any TypeScript or JavaScript file, follow [`.agents/skills/qa-code-reviewer/SKILL.md`](.agents/skills/qa-code-reviewer/SKILL.md) to run `tsc --noEmit` and unit tests before completing a turn.
- **Frontend & Modern TypeScript / Node (`typescript-vite-expert`)**: Follow [`.agents/skills/typescript-vite-expert/SKILL.md`](.agents/skills/typescript-vite-expert/SKILL.md) for strict typing, zero `any`, ESM modules, and clean async patterns.
- **Security, CVE Remediation & Anti-Bad-Practices (`security-cve-hardening`)**: Follow [`.agents/skills/security-cve-hardening/SKILL.md`](.agents/skills/security-cve-hardening/SKILL.md) for dependency vetting, input sanitization, safe subprocess execution, and zero-trust handling.
- **Cloud-Native Observability & Telemetry (`cloud-native-observability`)**: Follow [`.agents/skills/cloud-native-observability/SKILL.md`](.agents/skills/cloud-native-observability/SKILL.md) for structured stderr logging, latency tracking, and request correlation.
- **Cloud-Native Resilience & Fault Tolerance (`cloud-native-resilience`)**: Follow [`.agents/skills/cloud-native-resilience/SKILL.md`](.agents/skills/cloud-native-resilience/SKILL.md) for timeout policies (`AbortController`), graceful degradation, model auto-detection fallback, and safe shutdown on `SIGINT`/`SIGTERM`.
- **Cloud-Native Horizontal Scalability (`cloud-native-scalability`)**: Follow [`.agents/skills/cloud-native-scalability/SKILL.md`](.agents/skills/cloud-native-scalability/SKILL.md) for stateless process design and minimal memory footprint.
- **LM Studio Direct Assistant (`lmstudio`)**: Follow [`.agents/skills/lmstudio/SKILL.md`](.agents/skills/lmstudio/SKILL.md) whenever direct local LLM interaction is invoked.

## 2. MCP & TypeScript Architecture Standards
- **Strict Typing**: TypeScript `strict` mode enabled, `noImplicitAny: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`. Never use `any`.
- **Zero Runtime Dependencies**: The core server and client rely exclusively on native Node.js APIs (`node:http`, `node:events`, `node:readline`, `node:child_process`, `node:fs`, `node:path`, native `fetch`, `AbortController`).
- **Separation of Concerns**:
  - `src/types.ts`: JSON-RPC 2.0 contracts, MCP tool schemas, LM Studio REST DTOs, and pool interfaces.
  - `src/config.ts`: CLI flag parser and environment variable resolution.
  - `src/lmstudio-client.ts`: Isolated HTTP client with timeouts, auto-detection and health probes.
  - `src/pool-manager.ts`: Multi-instance registry, Least-Connections load balancer, and Circuit Breaker.
  - `src/tools.ts`: Tool catalog definitions (`lmstudio_chat`, `lmstudio_list_models`, `lmstudio_embeddings`, `lmstudio_health`, `lmstudio_pool_status`) and execution handlers.
  - `src/server.ts`: Stdio stream handler, JSON-RPC router, transparent daemon bridge, and lifecycle manager.
  - `src/daemon-server.ts`: Native HTTP & SSE daemon hosting REST APIs, MCP JSON-RPC endpoint, and embedded Web GUI.
  - `src/index.ts`: Executable entry point and CLI commands.

## 3. Automated Testing & Quality Gate
- **Native Test Runner**: Tests are located in `src/tests/` (compiled to `dist/tests/`) using `node:test` and `node:assert/strict`.
- **Unified Quality Gate Hook (`scripts/quality_gate_hook.js`)**:
  - Before concluding any task, execute `node scripts/quality_gate_hook.js --cli`.
  - A lifecycle Stop hook (`.agents/hooks.json`) automatically verifies `tsc --noEmit` and test suites before allowing turn completion.

## 4. Maximized Local LM Studio LLM Delegation (Zero Paid Token Waste)
- **Zero Paid Token Waste Principle**: Local LM Studio tokens (defaulting to `http://127.0.0.1:1234` or configured instances) are 100% free and unlimited. The primary agent and all subagents **MUST** maximize LM Studio usage via `call_mcp_tool(ServerName="lmstudio", ToolName="lmstudio_chat")` for cognitive reasoning, code implementation, diagnostic fixes, and tests. The paid remote model acts purely as a lightweight coordinator.
- **Mandatory Delegation Scopes**:
  1. *Code Creation & Refactoring*: Core functions, types, MCP tools, handlers, and unit tests.
  2. *Quality Gate Error & Diagnostic Analysis*: Submit TypeScript or test errors to LM Studio for diagnostic and resolution.
  3. *Brainstorming & Architecture*: Defining MCP schemas, cache strategies, or streaming mechanisms.
- **Subagent Propagation**:
  - All subagents must be granted MCP tools (`enable_mcp_tools=true`) and explicitly directed to delegate heavy workloads to LM Studio.

## 5. Mandatory AI Transparency & Disclosure Policy
- Every created or modified file (TypeScript/JS source code, Bash/PowerShell scripts, README.md, Wiki pages, documentation) **MUST systematically include** the explicit AI disclosure warning notice specifying the model (*Google Antigravity / Gemini 3.8 Flash & Local LM Studio*) according to [`.agents/rules/ai-transparency-disclosure.md`](.agents/rules/ai-transparency-disclosure.md).

## 6. Default Language Policy: English
- **English is the mandatory default language** for all deliverables across this repository, including documentation, code comments, README files, Wiki pages, embedded Web GUI labels, git commit messages, and CLI outputs, per [`.agents/rules/english-documentation-standard.md`](.agents/rules/english-documentation-standard.md).
