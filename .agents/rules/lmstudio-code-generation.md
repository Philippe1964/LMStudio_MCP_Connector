# Mandatory Rule: Maximized Delegation to Free Local LM Studio LLM (Token Optimization)

This rule applies to the primary agent and **all subagents** operating within this workspace to minimize paid remote token consumption.

## 1. Zero Paid Token Waste Principle
The local model hosted on LM Studio (accessible at `http://127.0.0.1:1234` or the configured address) provides **100% free, unlimited, and confidential** inferences.
The paid cloud model must act solely as a lightweight orchestrator and final validator.

## 2. Mandatory Delegation Use Cases via `lmstudio_chat`
The MCP tool `call_mcp_tool(ServerName="lmstudio", ToolName="lmstudio_chat")` must be queried before executing any heavy cognitive task:

1. **Code Creation & Refactoring**:
   - Writing business logic, classes, types, handlers, and unit tests.
   - Send the specification prompt to LM Studio and adapt its implementation to project standards.
2. **Diagnostics Resolution & Test Failures**:
   - When encountering compiler or linter errors (`tsc`, `eslint`, `pytest`), submit the diagnostic and snippet to LM Studio for the optimal fix.
3. **Algorithmic & Mathematical Reasoning**:
   - Mathematical modeling, state machine design, edge case scenarios.
4. **Test Scenarios & Quality Reviews**:
   - Generating exhaustive test cases and test suites.

## 3. Systematic Subagent Propagation
- **MCP Enabled**: Any subagent invoked or defined must have `enable_mcp_tools=true`.
- **Injected Directive**: Every subagent prompt must explicitly instruct querying `lmstudio_chat` for cognitive and code generation work.
- **Dedicated Subagents**:
  - `lmstudio-code-expert`: Delegated algorithmic and heavy code generation.
  - `lmstudio-qa-reviewer`: IDE diagnostic auditing and automated fixes.
