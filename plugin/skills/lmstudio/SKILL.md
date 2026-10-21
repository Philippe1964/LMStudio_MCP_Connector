---
name: lmstudio
description: Direct access and query to the local LM Studio instance (google/gemma-4-e4b) via MCP. Triggered with /lmstudio.
---

# LM Studio Direct Assistant

Use this skill whenever the user invokes `/lmstudio` or requests a direct interaction with the local LM Studio model.

## Workflow
1. Call the MCP tool `call_mcp_tool` with `ServerName: "lmstudio"` and `ToolName: "lmstudio_chat"`.
2. Pass the user's query or prompt directly in the `prompt` argument.
3. Return the exact response from the local model clearly formatted in the chat, indicating the model used (e.g. `google/gemma-4-e4b`).

