#!/usr/bin/env bash
# [AI-GENERATED FILE] Generated with AI assistance (Google Antigravity / Gemini 3.8 Flash & LM Studio).
# ==============================================================================
# LM Studio MCP Connector - Universal POSIX Installer (Linux & macOS)
# Auto-detects operating system and launches dedicated installer
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OS="$(uname -s)"

case "${OS}" in
  Darwin*)
    exec bash "${SCRIPT_DIR}/install-macos.sh" "$@"
    ;;
  Linux*)
    exec bash "${SCRIPT_DIR}/install-linux.sh" "$@"
    ;;
  MINGW*|CYGWIN*|MSYS*)
    echo "Windows environment detected. Launching PowerShell installer..."
    powershell.exe -ExecutionPolicy Bypass -File "${SCRIPT_DIR}/install-windows.ps1" "$@"
    ;;
  *)
    echo "Unknown operating system: ${OS}. Defaulting to Linux installer..."
    exec bash "${SCRIPT_DIR}/install-linux.sh" "$@"
    ;;
esac

