# LM Studio MCP Connector

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![MCP Specification](https://img.shields.io/badge/MCP-2024--11--05-orange.svg)](https://modelcontextprotocol.io/)
[![Platform](https://img.shields.io/badge/Platform-Linux%20%7C%20macOS%20%7C%20Windows-blue.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Un serveur **Model Context Protocol (MCP)** autonome, moderne et ultra-performant écrit en **TypeScript** pour connecter n'importe quel client IA (Antigravity, Gemini, Claude Desktop, Cursor, VS Code) à une instance locale ou distante de **LM Studio** via le protocole Stdio JSON-RPC.

Compatible nativement avec **Linux**, **macOS** (Intel & Apple Silicon) et **Windows**, avec des scripts d'installation et de configuration automatisés dédiés à chaque environnement.

---

## 🌟 Points Forts

- ⚡ **Zéro dépendance d'exécution (`zero-runtime dependencies`)** : S'appuie exclusivement sur les API natives de Node.js (`fetch`, `readline`, `AbortController`). Démarrage instantané, empreinte mémoire minimale, zéro vulnérabilité CVE.
- 🐧 🍏 🪟 **Support Multi-Plateforme Natif** : Scripts d'installation et de configuration dédiés et interactifs pour **Linux**, **macOS** et **Windows**.
- 🛠️ **Configuration Automatisée des Clients MCP** : Détection et mise à jour sécurisée des fichiers de configuration pour **Claude Desktop**, **Cursor IDE** et **Antigravity / Gemini CLI** sans écraser vos serveurs existants.
- 🤖 **Support Multi-Modèles & Détection Dynamique** : Détection automatique en temps réel des modèles chat et embedding chargés dans LM Studio (Llama, Qwen, Gemma, Mistral, DeepSeek, etc.), avec modèle de repli paramétrable.
- 🌐 **Totalement Générique & Portable** : Fonctionne aussi bien en local (`http://127.0.0.1:1234`) qu'à travers un réseau local LAN ou un serveur distant via variable d'environnement ou options CLI.
- 🧪 **Suite de Tests Intégrée** : Tests unitaires et d'intégration via le test runner natif de Node (`node:test`, `node:assert/strict`).
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

## ⚡ Installation Rapide par Environnement

Des scripts dédiés vérifient les prérequis Node.js, installent les dépendances, compilent le projet TypeScript, configurent vos clients MCP (Claude Desktop, Cursor, Gemini) et testent la connexion avec LM Studio.

### 🐧 Sur Linux (Ubuntu, Debian, Fedora, Arch, openSUSE...)
```bash
# Rendre le script exécutable et le lancer :
chmod +x scripts/install-linux.sh
./scripts/install-linux.sh

# Ou via npm si les dépendances sont déjà présentes :
npm run install:linux
```

### 🍏 Sur macOS (Apple Silicon M1/M2/M3/M4 & Intel)
```bash
# Rendre le script exécutable et le lancer :
chmod +x scripts/install-macos.sh
./scripts/install-macos.sh

# Ou via npm :
npm run install:macos
```

*(Note : Sur macOS et Linux, vous pouvez également utiliser le lanceur universel POSIX `./scripts/install.sh`)*.

### 🪟 Sur Windows (PowerShell 5.1 ou 7+)
```powershell
# Exécuter le script PowerShell dédié :
powershell -ExecutionPolicy Bypass -File scripts\install-windows.ps1

# Ou via npm :
npm run install:windows
```

---

## 🎛️ Assistant de Configuration Universel (`npm run setup`)

Le projet inclut un moteur de configuration multi-plateforme autonome (`scripts/setup.js`) écrit en pur JavaScript ESM Node.js.

### Mode Interactif
```bash
npm run setup
```
L'assistant vous guide pas à pas :
1. Détecte votre système d'exploitation et l'emplacement de vos dossiers de configuration.
2. Demande l'adresse de votre serveur LM Studio (par défaut `http://127.0.0.1:1234`).
3. Vous propose de configurer automatiquement un ou l'ensemble des clients MCP installés :
   - **Claude Desktop**
   - **Cursor IDE**
   - **Antigravity / Gemini CLI**
4. Teste immédiatement la connectivité avec LM Studio.

### Mode Automatisé / Non-Interactif (CI / Déploiement silencieux)
```bash
# Configuration silencieuse avec les valeurs par défaut pour tous les clients :
node scripts/setup.js --yes

# Configuration avec une adresse LM Studio sur le réseau local :
node scripts/setup.js --yes --url http://192.168.1.50:1234 --model qwen2.5-coder-7b

# Configuration d'un seul client spécifique (ex. Claude Desktop) :
node scripts/setup.js --yes --client claude
```

---

## 💻 Utilisation CLI

### Test de connectivité (Health Check)
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

## ⚙️ Emplacement des Fichiers de Configuration par OS

Si vous préférez configurer vos clients manuellement plutôt que d'utiliser `npm run setup`, voici les chemins standards :

| Client | Linux | macOS | Windows |
| :--- | :--- | :--- | :--- |
| **Claude Desktop** | `~/.config/Claude/claude_desktop_config.json` | `~/Library/Application Support/Claude/claude_desktop_config.json` | `%APPDATA%\Claude\claude_desktop_config.json` |
| **Cursor IDE** | `~/.cursor/mcp.json` | `~/.cursor/mcp.json` | `%USERPROFILE%\.cursor\mcp.json` |
| **Antigravity / Gemini** | `~/.gemini/config/mcp_config.json` | `~/.gemini/config/mcp_config.json` | `%USERPROFILE%\.gemini\config\mcp_config.json` |

### Exemple de configuration type
Remplacez `<CHEMIN_VERS_PROJET>` par le chemin absolu du dossier `LMStudio_MCP_Connector` sur votre machine.

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
│       ├── config.test.ts    # Tests unitaires du parsing de configuration
│       ├── setup.test.ts     # Tests multi-OS des chemins et de la fusion de configurations
│       ├── tools.test.ts     # Tests d'exécution des outils et validation des schémas
│       └── server.test.ts    # Tests du flux JSON-RPC Stdio
├── scripts/
│   ├── setup.js              # Moteur de configuration cross-plateforme (Linux/macOS/Windows)
│   ├── install.sh            # Lanceur universel POSIX (Linux/macOS)
│   ├── install-linux.sh      # Script d'installation dédié Linux
│   ├── install-macos.sh      # Script d'installation dédié macOS
│   ├── install-windows.ps1   # Script d'installation dédié Windows (PowerShell)
│   └── quality_gate_hook.js  # Quality gate automatique (tsc + tests)
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
