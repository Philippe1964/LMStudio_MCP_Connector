# Configuration & Déploiement Multi-OS

Ce guide détaille l'ensemble des options de configuration, variables d'environnement et procédures de déploiement pour Linux, macOS et Windows.

---

## 🛠️ Options de la Ligne de Commande

```text
Options:
  --daemon, -d                   Lance en mode Daemon HTTP & SSE avec Dashboard Web intégré
  --port, --daemon-port, -p <n>  Port du Daemon HTTP & Web GUI (défaut: 9123 ou $LMSTUDIO_DAEMON_PORT)
  --daemon-url <url>             URL explicite du daemon pour le mode Stdio (défaut: auto-détection 9123)
  --no-proxy, --standalone       Désactive la passerelle vers le daemon et force l'exécution locale
  --instances <urls/json>        Liste des instances LM Studio (séparées par virgule ou tableau JSON)
  --url, -u <url>                URL de l'instance primaire (défaut: http://127.0.0.1:1234)
  --model, -m <name>             Modèle chat par défaut ou repli (défaut: auto-détecté)
  --fallback-chat-model <name>   Alias pour --model
  --fallback-embed-model <name>  Modèle embedding par défaut (défaut: text-embedding-nomic-embed-text-v1.5)
  --timeout, -t <ms>             Délai d'expiration HTTP en ms (défaut: 60000)
  --check-health                 Effectue un test de santé sur toutes les instances et quitte
  --version, -v                  Affiche le numéro de version (v2.0.0)
  --help, -h                     Affiche l'aide
```

---

## 🌍 Variables d'Environnement

Toutes les options sont paramétrables via l'environnement ou un fichier `.env` à la racine :

| Variable | Défaut | Description |
| :--- | :--- | :--- |
| `LMSTUDIO_API_URL` | `http://127.0.0.1:1234` | URL de l'instance LM Studio principale. |
| `LMSTUDIO_INSTANCES` | *Aucun* | Liste ou tableau JSON de toutes les instances du cluster. |
| `LMSTUDIO_DAEMON` | `false` | Active le mode daemon au démarrage (`true` ou `1`). |
| `LMSTUDIO_DAEMON_PORT` | `9123` | Port d'écoute du serveur HTTP et de la Web GUI. |
| `LMSTUDIO_AUTO_PROXY` | `true` | Détecte et utilise automatiquement le daemon local s'il tourne. |
| `LMSTUDIO_TIMEOUT_MS` | `60000` | Timeout des requêtes HTTP en millisecondes. |
| `LMSTUDIO_HEALTH_INTERVAL_MS`| `15000` | Fréquence en ms du healthcheck périodique en tâche de fond. |

---

## 🔌 Intégration dans les Clients MCP

### Antigravity & Gemini CLI
Chemin de configuration : `~/.gemini/config/mcp_config.json` (ou `%USERPROFILE%\.gemini\config\mcp_config.json`) :

```json
{
  "mcpServers": {
    "lmstudio": {
      "command": "node",
      "args": [
        "E:\\SourceCode\\LMStudio_MCP_Connector\\dist\\index.js"
      ],
      "env": {
        "LMSTUDIO_API_URL": "http://127.0.0.1:1234"
      }
    }
  }
}
```
*Note : Grâce au pont transparent, le connecteur détecte automatiquement le daemon sur le port 9123. S'il est allumé, vos requêtes transitent par le pool et s'affichent sur le dashboard !*

### Claude Desktop
Chemin : `%APPDATA%\Claude\claude_desktop_config.json` (Windows) ou `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) :

```json
{
  "mcpServers": {
    "lmstudio": {
      "command": "node",
      "args": [
        "/absolu/vers/LMStudio_MCP_Connector/dist/index.js"
      ]
    }
  }
}
```

### Cursor IDE
Chemin : `~/.cursor/mcp.json` :

```json
{
  "mcpServers": {
    "lmstudio": {
      "command": "node",
      "args": [
        "/absolu/vers/LMStudio_MCP_Connector/dist/index.js"
      ]
    }
  }
}
```

