# Règle Obligatoire : Délégation Maximale au LLM Local Gratuit LM Studio (Économie de Tokens)

Cette règle s'applique à l'agent principal ainsi qu'à **tous les sous-agents** intervenant dans ce workspace pour réduire au strict minimum la consommation de tokens distants payants.

## 1. Principe Zéro Token Payant Inutile
Le modèle local hébergé sur LM Studio (`google/gemma-4-e4b` sur `http://192.168.0.108:1234`) offre des inférences **gratuites, illimitées et locales**.
Le modèle cloud payant ne doit servir que de chef d'orchestre léger et de validateur final.

## 2. Cas d'Usage Obligatoires de Délégation via `lmstudio_chat`
L'outil MCP `call_mcp_tool(ServerName="lmstudio", ToolName="lmstudio_chat")` doit être appelé avant toute étape lourde :

1. **Création & Refactoring de Code** :
   - Écriture de fonctions, classes, routes FastAPI, composants React 19, requêtes SQL, modèles Pydantic et entités DDD.
   - Soumettre le prompt de spécification à LM Studio et exploiter son retour pour l'implémentation.
2. **Résolution de Diagnostics & Erreurs de Test** :
   - En cas d'erreur `ruff`, `mypy`, `basedpyright`, `tsc` ou `pytest`, transmettre le diagnostic et le code à LM Studio pour obtenir la correction optimale.
3. **Réflexion Mathématique & Algorithmique** :
   - Conception des méthodes de calcul de prédiction, statistiques, formules de tirage et probabilités.
4. **Rédaction de Tests et Scénarios** :
   - Génération de cas de tests unitaires et d'intégration.

## 3. Propagation Systématique aux Sous-Agents
- **MCP Activé** : Tout sous-agent invoqué ou défini doit posséder les outils MCP (`enable_mcp_tools=true`).
- **Consigne Injectée** : Dans le prompt de chaque sous-agent, la règle de sollicitation prioritaire de `lmstudio_chat` doit être explicitement inscrite.
- **Agents Dédiés Disponibles** :
  - `lmstudio-code-expert` : Pour déléguer la production de code.
  - `lmstudio-qa-reviewer` : Pour auditer et corriger les erreurs de compilation/linter.
