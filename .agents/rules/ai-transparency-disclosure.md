# Règle Obligatoire : Avertissement de Génération par IA (AI Transparency & Disclosure)

Cette règle s'applique systématiquement à **l'ensemble des fichiers** de code source, scripts, documentations, wikis et README du projet `LMStudio_MCP_Connector`.

## 1. Principe Obligatoire
Toute création ou modification substantielle de fichier par une IA doit comporter un texte d'avertissement explicite indiquant qu'il a été généré / assisté par une Intelligence Artificielle, en précisant le modèle et sa configuration.

## 2. Formats Standardisés par Type de Fichier

### A. Fichiers Markdown (README.md, wiki/*.md, docs/*.md)
À placer en en-tête ou dans un bloc d'alerte bien visible :
```markdown
> 🤖 **Avertissement / AI Disclosure** : Ce contenu a été généré et structuré avec l'assistance d'une Intelligence Artificielle (Google Antigravity — Modèle : Gemini 3.8 Flash & LM Studio local). Validé par tests et Quality Gate automatisé.
```

### B. Code Source TypeScript & JavaScript (`src/**/*.ts`, `scripts/**/*.js`)
À placer dans le bloc de commentaire JSDoc en en-tête de chaque fichier :
```typescript
/**
 * [AI-GENERATED FILE]
 * Ce fichier a été généré et structuré avec l'assistance d'une Intelligence Artificielle
 * (Google Antigravity / Gemini 3.8 Flash & LM Studio Local LLM).
 * Vérifié et validé par le Quality Gate strict (TypeScript strict, suites de tests).
 */
```

### C. Scripts Shell & PowerShell (`scripts/*.sh`, `scripts/*.ps1`)
En commentaire d'en-tête :
```bash
# [AI-GENERATED FILE] Generated with AI assistance (Google Antigravity / Gemini 3.8 Flash & LM Studio).
```
```powershell
# [AI-GENERATED FILE] Generated with AI assistance (Google Antigravity / Gemini 3.8 Flash & LM Studio).
```
