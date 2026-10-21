#!/usr/bin/env bash
# ==============================================================================
# LM Studio MCP Connector - macOS Dedicated Installer & Configurator
# Compatible with macOS Ventura, Sonoma, Sequoia (Intel x86_64 & Apple Silicon ARM64)
# ==============================================================================

set -euo pipefail

# ANSI color codes
BOLD="\033[1m"
GREEN="\033[32m"
YELLOW="\033[33m"
CYAN="\033[36m"
RED="\033[31m"
RESET="\033[0m"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${REPO_ROOT}"

echo -e "${CYAN}${BOLD}=== LM Studio MCP Connector: macOS Setup ===${RESET}"
echo -e "Operating System: ${BOLD}macOS ($(uname -m))${RESET}"
echo -e "Target Directory: ${REPO_ROOT}\n"

# 1. Verify Node.js presence
if ! command -v node >/dev/null 2>&1; then
  echo -e "${RED}Error: Node.js is not installed.${RESET}"
  echo "Please install Node.js (version 18 or higher) using Homebrew or nvm:"
  echo "  - Using Homebrew: brew install node"
  echo "  - Using NVM:      nvm install 20 && nvm use 20"
  exit 1
fi

# 2. Verify Node.js version >= 18
NODE_VERSION=$(node -v)
NODE_MAJOR=$(echo "${NODE_VERSION}" | cut -d'.' -f1 | tr -d 'v')
if [ "${NODE_MAJOR}" -lt 18 ]; then
  echo -e "${RED}Error: Node.js version 18+ is required.${RESET}"
  echo -e "Detected version: ${YELLOW}${NODE_VERSION}${RESET}. Please update Node.js (e.g. brew upgrade node)."
  exit 1
fi
echo -e "${GREEN}✔${RESET} Node.js detected: ${BOLD}${NODE_VERSION}${RESET}"

# 3. Verify npm
if ! command -v npm >/dev/null 2>&1; then
  echo -e "${RED}Error: npm is not installed.${RESET}"
  exit 1
fi
echo -e "${GREEN}✔${RESET} npm detected: ${BOLD}$(npm -v)${RESET}"

# 4. Install dependencies
echo -e "\n${BOLD}[1/3] Installing dependencies...${RESET}"
npm install

# 5. Build TypeScript
echo -e "\n${BOLD}[2/3] Compiling TypeScript project...${RESET}"
npm run build

# 6. Ensure executable permissions
chmod +x "${REPO_ROOT}/dist/index.js" 2>/dev/null || true
chmod +x "${REPO_ROOT}/scripts/setup.js" 2>/dev/null || true

# 7. Execute setup & client configuration
echo -e "\n${BOLD}[3/3] Running configuration assistant...${RESET}"
node scripts/setup.js "$@"

