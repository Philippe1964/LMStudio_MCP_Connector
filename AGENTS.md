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
- **Strict Typing**: TypeScript `strict` mode enabled, `noImplicitAny: true`, `noUncheckedIndexedAccess: true`. Never use `any`.
- **Zero Runtime Dependencies**: The core server and client rely exclusively on native Node.js APIs (`node:readline`, `node:child_process`, `node:fs`, `node:path`, native `fetch`, `AbortController`).
- **Separation of Concerns**:
  - `src/types.ts`: JSON-RPC 2.0 contracts, MCP tool schemas, LM Studio REST DTOs.
  - `src/config.ts`: CLI flag parser and environment variable resolution.
  - `src/lmstudio-client.ts`: Isolated HTTP client with timeouts, auto-detection and health probes.
  - `src/tools.ts`: Tool catalog definitions (`lmstudio_chat`, `lmstudio_list_models`, `lmstudio_embeddings`, `lmstudio_health`) and dispatch logic.
  - `src/server.ts`: Stdio stream handler, JSON-RPC router and lifecycle manager.
  - `src/index.ts`: Executable entry point and CLI commands.

## 3. Automated Testing & Quality Gate
- **Native Test Runner**: Tests are located in `src/tests/` (compiled to `dist/tests/`) using `node:test` and `node:assert/strict`.
- **Unified Quality Gate Hook (`scripts/quality_gate_hook.js`)**:
  - Before concluding any task, execute `node scripts/quality_gate_hook.js --cli`.
  - A lifecycle Stop hook (`.agents/hooks.json`) automatically verifies `tsc --noEmit` and test suites before allowing turn completion.

## 4. Délégation Maximale au Connecteur MCP LM Studio (Zéro Gaspillage de Tokens Payants)
- **Principe d'Économie Maximale** : Les tokens LM Studio local (par défaut sur `http://127.0.0.1:1234` ou l'URL configurée) sont 100% gratuits. L'agent principal et tous les sous-agents **DOIVENT** maximiser l'usage de LM Studio via `call_mcp_tool(ServerName="lmstudio", ToolName="lmstudio_chat")` pour toute réflexion, conception, rédaction de code, diagnostic d'erreur et test. Le modèle distant opère uniquement comme un coordinateur léger.
- **Périmètres d'Application Obligatoires** :
  1. *Création et Refactoring de Code* : Fonctions métier, types, outils MCP, handlers, tests unitaires.
  2. *Analyse d'Erreurs & Diagnostics Quality Gate* : Soumettre les erreurs TypeScript ou de tests à LM Studio pour diagnostic et résolution.
  3. *Brainstorming & Nouveaux Outils* : Définition des schémas d'outils MCP, stratégies de cache ou de streaming.
- **Délégation aux Sous-Agents** :
  - Tout sous-agent invoqué ou défini doit posséder les outils MCP (`enable_mcp_tools=true`) et recevoir pour consigne expresse de sous-traiter ses calculs et générations à LM Studio.

## 5. Règle Systématique de Transparence IA (AI Disclosure)
- Tout fichier créé ou modifié (code source TypeScript/JS, scripts Bash/PowerShell, README.md, pages Wiki, documentation) **DOIT obligatoirement et systématiquement** comporter la mention d'avertissement de génération par IA spécifiant le modèle (Google Antigravity / Gemini 3.8 Flash & LM Studio local) conformément à [`.agents/rules/ai-transparency-disclosure.md`](.agents/rules/ai-transparency-disclosure.md).


