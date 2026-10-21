# LM Studio MCP Connector & Daemon

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![MCP Specification](https://img.shields.io/badge/MCP-2024--11--05-orange.svg)](https://modelcontextprotocol.io/)
[![Platform](https://img.shields.io/badge/Platform-Linux%20%7C%20macOS%20%7C%20Windows-blue.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-purple.svg)](package.json)

Un serveur et daemon **Model Context Protocol (MCP)** autonome, moderne et ultra-résilient écrit en **TypeScript** pour connecter n'importe quelle plateforme agentique (Antigravity, Gemini, Claude Desktop, Cursor, VS Code) à une ou plusieurs instances de **LM Studio**.

---

## 🌟 Nouveautés de la Version 2.0.0

- 🔀 **Architecture Multi-Instances & Répartition de Charge (Load Balancing)** : Déclarez plusieurs machines ou instances LM Studio (local, réseau LAN, GPU dédié). Les requêtes sont réparties intelligemment selon la charge en cours (*Least-Connections*).
- 🛡️ **Failover Automatique & Circuit Breaker** : Si une instance sature, timeout ou tombe en panne, le connecteur bascule automatiquement et de manière transparente sur l'instance de secours éligible.
- ⚡ **Directive de Repli Automatique vers LLM Distant (Antigravity Fallback)** : Si **toutes** les instances locales sont indisponibles, le connecteur retourne un diagnostic explicite (`REMOTE FALLBACK REQUIRED`) ordonnant à l'agent Antigravity de réaliser la tâche via ses modèles distants natifs sans bloquer ni échouer l'exécution.
- 🖥️ **Mode Daemon HTTP & Dashboard Web Intégré** : Lancez le connecteur en tâche de fond avec `--daemon` pour exposer une interface Web moderne en temps réel (`http://127.0.0.1:9123/`) permettant de monitorer les latences, requêtes en vol, modèles chargés et d'ajouter/supprimer des instances dynamiquement sans redémarrage.
- 🏷️ **Routage Spécialisé par Rôles** : Attribuez des rôles (`chat`, `embeddings`, `all`) à chaque instance pour réserver par exemple les embeddings à un CPU/GPU rapide sans ralentir la génération de code du gros modèle LLM.
- ⚡ **Zéro dépendance d'exécution (`zero-runtime dependencies`)** : Toujours 100% natif Node.js (`fetch`, `readline`, `node:http`, `node:events`, `AbortController`).

---

## 🛠️ Outils MCP Exposés

Le connecteur expose 5 outils standardisés :

| Outil | Description | Paramètres principaux |
| :--- | :--- | :--- |
| `lmstudio_chat` | Envoie un prompt ou une instruction au modèle local LM Studio avec auto-détection, load balancing et repli distant si panne totale. | `prompt` (requis), `system_prompt`, `model`, `temperature`, `max_tokens` |
| `lmstudio_list_models` | Inventorie tous les modèles IA disponibles à travers les instances actives du pool. | *Aucun* |
| `lmstudio_embeddings` | Calcule les vecteurs d'embeddings pour un texte donné avec le modèle d'embedding configuré. | `input` (requis), `model` |
| `lmstudio_health` | Vérifie la disponibilité, la latence et les modèles actifs de chaque instance du pool. | *Aucun* |
| `lmstudio_pool_status` | Fournit un rapport JSON complet du pool : statut, latence, requêtes en vol et taux d'erreurs. | *Aucun* |

---

## 🚀 Modes d'Utilisation

### 1. Mode Stdio Standard (Direct pour Antigravity / Claude / Cursor)
Dans vos fichiers de configuration MCP (`mcp_config.json`, `claude_desktop_config.json`, etc.) :
```json
{
  "mcpServers": {
    "lmstudio": {
      "command": "node",
      "args": [
        "E:/SourceCode/LMStudio_MCP_Connector/dist/index.js",
        "--instances",
        "http://127.0.0.1:1234,http://192.168.1.50:1234"
      ]
    }
  }
}
```

### 2. Mode Daemon HTTP avec Dashboard Web
Lancez le connecteur en daemon autonome :
```bash
node dist/index.js --daemon --port 9123 --instances "http://127.0.0.1:1234,http://192.168.1.50:1234"
```
- **Dashboard Web interactif** : Ouvrez votre navigateur sur `http://127.0.0.1:9123/`
- **Endpoint MCP HTTP / RPC** : `POST http://127.0.0.1:9123/mcp`
- **Flux temps réel SSE** : `GET http://127.0.0.1:9123/api/events`

---

## 💻 Options de la Ligne de Commande

```text
Options:
  --daemon, -d                   Lance en mode Daemon HTTP & SSE avec Dashboard Web intégré
  --port, --daemon-port, -p <n>  Port du Daemon HTTP & Web GUI (défaut: 9123 ou $LMSTUDIO_DAEMON_PORT)
  --instances <urls/json>        Liste des instances LM Studio (séparées par virgule ou JSON)
  --url, -u <url>                URL de l'instance primaire (défaut: http://127.0.0.1:1234)
  --model, -m <name>             Modèle chat par défaut ou repli (défaut: auto-détecté)
  --fallback-chat-model <name>   Alias pour --model
  --fallback-embed-model <name>  Modèle embedding par défaut (défaut: text-embedding-nomic-embed-text-v1.5)
  --timeout, -t <ms>             Délai d'expiration HTTP en ms (défaut: 60000)
  --check-health                 Effectue un test de santé sur toutes les instances et quitte
  --version, -v                  Affiche le numéro de version (v2.0.0)
  --help, -h                     Affiche l'aide
```

### Format JSON Avancé pour `--instances` ou `LMSTUDIO_INSTANCES`
Vous pouvez définir des instances avec des rôles et des priorités :
```json
[
  { "id": "local-gpu", "name": "RTX 4090", "url": "http://127.0.0.1:1234", "roles": ["chat"], "priority": 2 },
  { "id": "lan-embed", "name": "Serveur Embeddings", "url": "http://192.168.1.50:1234", "roles": ["embeddings"], "priority": 1 },
  { "id": "backup-cpu", "name": "Secours", "url": "http://192.168.1.60:1234", "roles": ["all"], "priority": 1 }
]
```

---

## 🛡️ Résilience & Repli Automatique vers LLM Distant

Lorsque toutes les instances locales LM Studio sont arrêtées ou injoignables :
1. Le connecteur ne bloque pas la requête et ne plante pas le processus.
2. L'outil retourne un statut `isError: true` avec la directive explicite :
   ```
   ⚠️ [LM STUDIO OFFLINE - REMOTE FALLBACK REQUIRED]
   No local LM Studio instances are currently reachable.
   Antigravity is instructed to immediately fulfill this user request using its native remote LLM capabilities without failing the turn.
   ```
3. L'agent Antigravity comprend instantanément qu'il doit exécuter la tâche avec ses capacités natives distantes, assurant une continuité de service totale.
4. Dès qu'une instance LM Studio redémarre, le healthcheck automatique rétablit son statut `ONLINE` en temps réel.

---

## 🧪 Tests & Quality Gate

Le projet est rigoureusement validé par un Quality Gate automatisé :
```bash
# Lancer les vérifications strictes TypeScript et les 27 tests unitaires / intégration :
node scripts/quality_gate_hook.js --cli
```

---

## 📜 Licence

Distribué sous licence **MIT**. Voir [LICENSE](LICENSE) pour plus de détails.
