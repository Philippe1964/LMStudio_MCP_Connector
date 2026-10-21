---
name: qa-code-reviewer
description: >-
  Automated Quality Gate, IDE Diagnostics (Pylance/BasedPyright, Mypy, Ruff, TypeScript tsc),
  and Multi-Agent Code Review workflow. Activate this skill after generating or modifying any
  Python or TypeScript file to catch and fix all IDE errors automatically before finishing a turn.
---

# Automated QA & IDE Diagnostics Reviewer (`qa-code-reviewer`)

## 1. Purpose: Zero User-Reported IDE Errors
Why do IDE errors sometimes slip past standard `mypy` or `ruff` checks?
- **VS Code / Antigravity IDE uses Pylance (Pyright engine)** in `strict` mode (`"python.analysis.typeCheckingMode": "strict"`), which enforces rules that `mypy` does not check:
  - `reportDeprecated` (e.g., `@asynccontextmanager` returning `AsyncIterator` instead of `AsyncGenerator`)
  - `reportUnnecessaryIsInstance` & `reportUnnecessaryComparison` (redundant `isinstance()` or `is not None` checks when types do not overlap)
  - `reportUnknownVariableType` & `reportUnknownMemberType` (e.g., un-narrowed `dict` from `json.loads`)
  - `reportAttributeAccessIssue` (missing or unexported symbols in `src/` layout)
- **Frontend IDE uses `tsc`** (`frontend/tsconfig.json` in `strict` mode with `noUnusedLocals` and `noUnusedParameters`).

To guarantee the user **never** has to report an IDE error manually, this project enforces a **3-Layer Automated Quality Gate**:

---

## 2. The 3-Layer Automated Quality Gate

### Layer 1: Unified IDE & Static Analysis Runner (`scripts/quality_gate_hook.py`)
Run the exact same engines as the IDE from a single command:
```powershell
uv run python scripts/quality_gate_hook.py --cli
```
This executes sequentially:
1. **Ruff Linter** (`ruff check src tests scripts`)
2. **Mypy Strict** (`mypy src tests scripts`)
3. **Pylance / BasedPyright Strict** (`basedpyright src tests scripts` with `reportDeprecated`, `reportUnnecessaryIsInstance`, `reportUnnecessaryComparison`, `reportUnknownVariableType` set to `"error"` in `pyproject.toml`)
4. **TypeScript / React 19 Compiler** (`tsc -p frontend/tsconfig.json --noEmit` executed via `nodejs_wheel` or system `node`)
5. **Pytest Suite** (`pytest -q`)

### Layer 2: Dedicated `qa-reviewer` Subagent
After any multi-file generation or refactoring, invoke the `qa-reviewer` subagent via `invoke_subagent`:
- If `qa-reviewer` is not yet registered in the current conversation session, define it first via `define_subagent(name="qa-reviewer", ...)` or invoke `self` with the `qa-code-reviewer` role.
- The `qa-reviewer` subagent audits all modified files in an independent context, runs `uv run python scripts/quality_gate_hook.py --cli`, fixes or reports any Pylance/Mypy/Ruff/TSC/Pytest issues, and verifies compliance with all architectural skills.

### Layer 3: Automatic Antigravity `Stop` Lifecycle Hook (`.agents/hooks.json`)
Configured in [`.agents/hooks.json`](../../hooks.json):
- Whenever the agent attempts to finish its turn (`terminationReason == "NO_TOOL_CALL"`), Antigravity automatically invokes `scripts/quality_gate_hook.py`.
- If **any** Pylance (`basedpyright`), `mypy`, `ruff`, or TypeScript (`tsc`) error exists in the workspace, the hook returns `{"decision": "continue", "reason": "..."}`.
- This **blocks the agent from stopping** and automatically injects the exact IDE error diagnostics back into the agent's loop so it fixes them before the user ever sees the response.

