#!/usr/bin/env node
/**
 * [AI-GENERATED FILE]
 * Ce script a été généré avec l'assistance d'une Intelligence Artificielle
 * (Google Antigravity / Gemini 3.8 Flash & LM Studio local).
 *
 * Script de synchronisation automatique du dossier wiki/ vers le Wiki GitHub
 * Usage: node scripts/sync-wiki.js
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const WIKI_DIR = path.join(REPO_ROOT, "wiki");
const WIKI_GIT_URL = "https://github.com/Philippe1964/LMStudio_MCP_Connector.wiki.git";

function run(cmd, cwd = REPO_ROOT) {
  return execSync(cmd, { cwd, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

async function main() {
  console.log("=================================================");
  console.log("  📚 Synchronisation du Wiki vers GitHub Wiki");
  console.log(`  Source : ${WIKI_DIR}`);
  console.log(`  Cible  : ${WIKI_GIT_URL}`);
  console.log("=================================================\n");

  if (!fs.existsSync(WIKI_DIR)) {
    console.error("❌ Dossier wiki/ introuvable à la racine.");
    process.exit(1);
  }

  const tmpDir = path.join(os.tmpdir(), `lmstudio-wiki-sync-${Date.now()}`);

  try {
    console.log("1. Clonage du dépôt Wiki GitHub...");
    try {
      run(`git clone "${WIKI_GIT_URL}" "${tmpDir}"`);
    } catch (cloneErr) {
      console.error("\n⚠️  Le dépôt Wiki distant n'est pas encore initialisé sur GitHub !");
      console.error("👉 Rendez-vous sur votre navigateur à l'adresse :");
      console.error("   https://github.com/Philippe1964/LMStudio_MCP_Connector/wiki");
      console.error("   et cliquez une première fois sur 'Create the first page' pour créer le dépôt.");
      console.error("   Relancez ensuite ce script.\n");
      process.exit(1);
    }

    console.log("2. Copie des fichiers markdown du dossier wiki/...");
    const files = fs.readdirSync(WIKI_DIR);
    for (const file of files) {
      if (file.endsWith(".md")) {
        const src = path.join(WIKI_DIR, file);
        const dest = path.join(tmpDir, file);
        fs.copyFileSync(src, dest);
        console.log(`   • Copié : ${file}`);
      }
    }

    console.log("3. Création du commit...");
    run("git add .", tmpDir);
    const status = run("git status --porcelain", tmpDir);
    if (!status) {
      console.log("✨ Le Wiki distant est déjà à jour, aucune modification nécessaire.");
      return;
    }

    run('git commit -m "docs(wiki): update v2 architecture and multi-instance documentation"', tmpDir);

    console.log("4. Publication (push) vers GitHub Wiki...");
    run("git push origin HEAD", tmpDir);

    console.log("\n✅ Succès ! Toutes les pages du Wiki GitHub ont été mises à jour :");
    console.log("   https://github.com/Philippe1964/LMStudio_MCP_Connector/wiki\n");
  } catch (err) {
    console.error("❌ Erreur lors de la synchronisation :", err.message || err);
    process.exit(1);
  } finally {
    if (fs.existsSync(tmpDir)) {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {}
    }
  }
}

main();

