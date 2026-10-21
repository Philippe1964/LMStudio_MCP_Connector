# Global Engineering Standard: Maximized Free LM Studio LLM Delegation & Token Optimization

This rule applies globally across all existing and future projects on this machine to minimize paid token consumption by delegating all possible reasoning, coding, and analysis to the local LM Studio model (`google/gemma-4-e4b` on `http://192.168.0.108:1234`).

## 1. Principe Fondamental : Délégation Maximale au LLM Local Gratuit
Les tokens du modèle local LM Studio sont **100% gratuits et illimités**. À l'inverse, les tokens des modèles distants sont payants.
Par conséquent, l'agent principal et tous les sous-agents **DOIVENT systématiquement et prioritairement** sous-traiter toute tâche de calcul cognitif, de réflexion, de conception et de génération à LM Studio via l'outil MCP `call_mcp_tool(ServerName="lmstudio", ToolName="lmstudio_chat")`.

Le modèle distant payant agit comme un **orchestrateur léger**, tandis que LM Studio exécute le travail textuel, algorithmique et analytique lourd.

## 2. Périmètres d'Application Obligatoires

### A. Création et Modification de Code
Pour **toute écriture de code** (fonctions métier, classes, composants d'interface, scripts de migration, requêtes, tests unitaires, Dockerfiles, configurations) :
- Interroger préalablement `lmstudio_chat` en lui fournissant la spécification, les contraintes et le contexte.
- Récupérer l'implémentation proposée par LM Studio, l'adapter aux normes du projet (Architecture 4 Couches, typage strict) et l'appliquer.

### B. Analyse de Bugs, Diagnostics et Échecs de Tests
- Dès qu'une erreur de linter (`ruff`, `eslint`), de vérificateur de types (`mypy`, `pyright`, `tsc`) ou de test (`pytest`, `vitest`) survient :
  - Transmettre l'erreur et l'extrait de code fautif à LM Studio via `lmstudio_chat` pour diagnostic et formulation du correctif.
  - Appliquer la correction issue de LM Studio avant toute nouvelle tentative.

### C. Brainstorming, Conception Métier & Algorithmes
- Pour toute conception d'architecture, modélisation DDD (Aggregates, Value Objects, Domain Events), sélection de formules mathématiques, cas limites ou scénarios de test :
  - Consulter LM Studio pour dégager la logique et les étapes à suivre.

### D. Documentation, Commentaires & Réflecteurs
- La rédaction de documentation technique, commentaires détaillés, docstrings et résumés d'analyse doit être demandée à LM Studio.

## 3. Extension Obligatoire aux Sous-Agents (Multi-Agent System)
- **Outils MCP Requis** : Tout sous-agent défini (`define_subagent`) ou invoqué (`invoke_subagent`) **DOIT obligatoirement avoir `enable_mcp_tools=true`**.
- **Consignes Systèmes des Sous-Agents** : Le prompt ou rôle de tout sous-agent créé doit explicitement inclure la consigne de solliciter `lmstudio_chat` pour ses étapes d'analyse, d'écriture et de revue.
- **Sous-Agents Dédiés Préférés** :
  - `lmstudio-code-expert` : Pour la génération de code et l'implémentation algorithmique.
  - `lmstudio-qa-reviewer` : Pour la revue qualité, l'analyse d'erreurs IDE et l'application des correctifs.

## 4. Confidentialité et Sécurité Locale
- Le traitement local via LM Studio garantit que le code propriétaire, les algorithmes sensibles et les données métier ne quittent pas la machine de développement.

