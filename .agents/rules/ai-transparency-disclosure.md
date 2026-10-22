# Engineering Standard: Mandatory AI Transparency & Disclosure

This standard applies systematically to **all files** across source code, scripts, documentation, wikis, and README files in the `LMStudio_MCP_Connector` repository.

## 1. Mandatory Principle
Any file created or substantially modified by an AI must include an explicit disclosure notice stating that it was generated/assisted by an Artificial Intelligence, specifying the model and its configuration.

## 2. Standardized Templates by File Type

### A. Markdown Files (`README.md`, `wiki/*.md`, `docs/*.md`)
Place at the top of the file or in a visible alert block:
```markdown
> 🤖 **AI Transparency & Disclosure**: This content was generated and architected with the assistance of Artificial Intelligence (Google Antigravity — Model: Gemini 3.8 Flash & LM Studio Local Models). Verified by strict Quality Gate.
```

### B. TypeScript & JavaScript Source Code (`src/**/*.ts`, `scripts/**/*.js`)
Include in the top JSDoc comment header of each file:
```typescript
/**
 * [AI-GENERATED FILE]
 * This file was generated and architected with the assistance of AI
 * (Google Antigravity / Gemini 3.8 Flash & LM Studio Local LLMs).
 * Verified and validated by automated strict Quality Gate (TypeScript strict, test suites).
 */
```

### C. Shell & PowerShell Scripts (`scripts/*.sh`, `scripts/*.ps1`)
Include in the top script comment header:
```bash
# [AI-GENERATED FILE] Generated with AI assistance (Google Antigravity / Gemini 3.8 Flash & LM Studio).
```
```powershell
# [AI-GENERATED FILE] Generated with AI assistance (Google Antigravity / Gemini 3.8 Flash & LM Studio).
```
