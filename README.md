# LM Studio MCP Connector

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![MCP Specification](https://img.shields.io/badge/MCP-2024--11--05-orange.svg)](https://modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Un serveur **Model Context Protocol (MCP)** autonome, moderne et ultra-performant écrit en **TypeScript** pour connecter n'importe quel client IA (Antigravity, Gemini, Claude Desktop, Cursor, VS Code) à une instance locale ou distante de **LM Studio** via le protocole Stdio JSON-RPC.

---

## 🌟 Points Forts

- ⚡ **Zéro dépendance d'exécution (`zero-runtime dependencies`)** : S'appuie exclusivement sur les API natives de Node.js (`fetch`, `readline`, `AbortController`). Démarrage instantané, empreinte mémoire minimale, zéro vulnérabilité CVE.
- 🛡️ **Typage Strict TypeScript** : Architecture modulaire, séparation stricte des responsabilités (`types`, `config`, `client`, `tools`, `server`, `cli`).
- 🤖 **Support Multi-Modèles & Détection Dynamique** : Détection automatique en temps réel des modèles chat et embedding chargés dans LM Studio (Llama, Qwen, Gemma, Mistral, DeepSeek, etc.), avec modèle de repli paramétrable.
- 🌐 **Totalement Générique & Portable** : Fonctionne aussi bien en local (`http://127.0.0.1:1234`) qu'à travers un réseau local LAN ou un serveur distant via variable d'environnement ou options CLI.
- 🧪 **Suite de Tests Intégrée** : Tests unitaires et d'intégration via le test runner natif de Node (`node:test`, `node:assert/strict`).
- 🔌 **Compatibilité Universelle** : Conçu pour Antigravity / Gemini CLI, Claude Desktop, Cursor, VS Code Roo Code / Cline, et tout client conforme à la spécification MCP.
- 🩺 **Outils CLI Intégrés** : Diagnostic de santé en direct (`--check-health`), flags courts et longs pour l'URL et les modèles.

---

## 🛠️ Outils MCP Exposés

Le connecteur expose 4 outils standardisés :

| Outil | Description | Paramètres principaux |
| :--- | :--- | :--- |
| `lmstudio_chat` | Envoie un prompt ou une instruction au modèle local LM Studio et retourne la complétion générée. | `prompt` (requis), `system_prompt`, `model`, `temperature`, `max_tokens` |
| `lmstudio_list_models` | Liste tous les modèles IA actuellement chargés et prêts dans LM Studio. | *Aucun* |
| `lmstudio_embeddings` | Calcule les vecteurs d'embeddings pour un texte donné avec le modèle d'embedding local. | `input` (requis), `model` |
| `lmstudio_health` | Vérifie la disponibilité, la latence et les modèles actifs de l'instance LM Studio. | *Aucun* |

---

## 📋 Prérequis

1. **Node.js** >= 18.0.0 (testé et validé sur Node 18, 20, 22 et 24).
2. **LM Studio** lancé avec le serveur local démarré (par défaut sur `http://127.0.0.1:1234` ou sur une adresse IP de votre réseau).
3. Au moins un modèle chargé dans LM Studio pour le chat, et optionnellement un modèle pour l'embedding (ex. `nomic-embed-text`).

---

## 🚀 Installation & Compilation

```bash
# Cloner ou se placer dans le répertoire du connecteur
cd LMStudio_MCP_Connector

# Installer les dépendances de développement (TypeScript, types)
npm install

# Compiler le projet TypeScript vers dist/
npm run build

# Exécuter la suite de tests unitaires
npm test
```

---

## 💻 Utilisation CLI

### Test rapide de connectivité (Health Check)
```bash
# Test avec l'adresse par défaut (http://127.0.0.1:1234) :
node dist/index.js --check-health

# Test avec une URL personnalisée (IP LAN ou serveur distant) :
node dist/index.js --url http://192.168.1.50:1234 --check-health
```

### Options de la ligne de commande
```text
Options:
  --url, -u <url>                URL de base de l'API LM Studio (défaut: http://127.0.0.1:1234 ou $LMSTUDIO_API_URL)
  --model, -m <name>             Modèle chat par défaut ou repli (défaut: auto-détecté ou $LMSTUDIO_CHAT_MODEL)
  --fallback-chat-model <name>   Alias pour --model
  --fallback-embed-model <name>  Modèle embedding par défaut (défaut: text-embedding-nomic-embed-text-v1.5)
  --timeout, -t <ms>             Délai d'expiration HTTP en ms (défaut: 60000 ou $LMSTUDIO_TIMEOUT_MS)
  --check-health                 Effectue un test de santé et quitte
  --version, -v                  Affiche le numéro de version
  --help, -h                     Affiche l'aide
```

### Variables d'Environnement
Toutes les options sont configurables sans modifier la ligne de commande via un fichier `.env` ou votre environnement :
- `LMSTUDIO_API_URL` : URL du serveur LM Studio (défaut: `http://127.0.0.1:1234`).
- `LMSTUDIO_CHAT_MODEL` ou `LMSTUDIO_FALLBACK_CHAT_MODEL` : Modèle de chat spécifique si vous souhaitez forcer un modèle précis ou en cas d'absence de détection automatique.
- `LMSTUDIO_FALLBACK_EMBED_MODEL` : Modèle d'embedding de repli.
- `LMSTUDIO_TIMEOUT_MS` : Timeout des requêtes HTTP en millisecondes (défaut: `60000`).

---

## ⚙️ Configuration des Clients MCP

Remplacez `<CHEMIN_VERS_PROJET>` par le chemin absolu du dossier `LMStudio_MCP_Connector` sur votre machine.

### 1. Antigravity / Gemini CLI (`mcp_config.json`)
Dans le fichier de configuration de vos serveurs MCP (`~/.gemini/config/mcp_config.json` ou au sein de votre projet) :
```json
{
  "mcpServers": {
    "lmstudio": {
      "command": "node",
      "args": [
        "<CHEMIN_VERS_PROJET>/dist/index.js"
      ],
      "env": {
        "LMSTUDIO_API_URL": "http://127.0.0.1:1234"
      },
      "disabled": false
    }
  }
}
```

### 2. Claude Desktop (`claude_desktop_config.json`)
Emplacement :
- **Windows** : `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS** : `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux** : `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "lmstudio": {
      "command": "node",
      "args": [
        "<CHEMIN_VERS_PROJET>/dist/index.js",
        "--url",
        "http://127.0.0.1:1234"
      ]
    }
  }
}
```

### 3. Cursor (`mcp.json`)
Dans le panneau des paramètres MCP de Cursor :
```json
{
  "mcpServers": {
    "lmstudio": {
      "command": "node",
      "args": [
        "<CHEMIN_VERS_PROJET>/dist/index.js"
      ],
      "env": {
        "LMSTUDIO_API_URL": "http://127.0.0.1:1234"
      }
    }
  }
}
```

---

## 📁 Architecture du Projet

```text
LMStudio_MCP_Connector/
├── src/
│   ├── types.ts              # Interfaces JSON-RPC, schémas MCP & API LM Studio
│   ├── config.ts             # Résolution des arguments CLI et variables d'environnement
│   ├── lmstudio-client.ts    # Client HTTP natif (fetch, timeout, détection auto dynamique)
│   ├── tools.ts              # Définitions des 4 outils MCP et handlers d'exécution
│   ├── server.ts             # Serveur MCP Stdio JSON-RPC (initialize, ping, tools/list, tools/call)
│   ├── index.ts              # Point d'entrée exécutable (CLI, flags, lancement)
│   └── tests/
│       ├── config.test.ts    # Tests unitaires du parsing de configuration et des variables d'environnement
│       ├── tools.test.ts     # Tests d'exécution des outils et validation des schémas
│       └── server.test.ts    # Tests du flux JSON-RPC Stdio
├── config/                   # Modèles de configuration prêts à l'emploi
│   ├── gemini_mcp_config.example.json
│   ├── claude_desktop_config.example.json
│   └── cursor_mcp_config.example.json
├── plugin/                   # Bundle pour intégration comme plugin Antigravity
│   ├── plugin.json
│   ├── mcp_config.json
│   ├── rules/AGENTS.md
│   └── skills/lmstudio/SKILL.md
├── dist/                     # Code JavaScript compilé
├── package.json
├── tsconfig.json
├── .gitignore
├── .env.example
├── LICENSE
└── README.md
```

---

## 📜 Licence

Distribué sous licence **MIT**. Voir [LICENSE](LICENSE) pour plus de détails.
