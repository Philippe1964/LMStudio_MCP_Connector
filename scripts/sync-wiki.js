#!/usr/bin/env node
/**
 * [AI-GENERATED FILE]
 * This script was generated with the assistance of AI
 * (Google Antigravity / Gemini 3.8 Flash & LM Studio local).
 *
 * Automated synchronization script from wiki/ directory to GitHub Wiki
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
  console.log("  📚 Synchronizing Local Wiki to GitHub Wiki");
  console.log(`  Source: ${WIKI_DIR}`);
  console.log(`  Target: ${WIKI_GIT_URL}`);
  console.log("=================================================\n");

  if (!fs.existsSync(WIKI_DIR)) {
    console.error("❌ Directory wiki/ not found in project root.");
    process.exit(1);
  }

  const tmpDir = path.join(os.tmpdir(), `lmstudio-wiki-sync-${Date.now()}`);

  try {
    console.log("1. Cloning remote GitHub Wiki repository...");
    try {
      run(`git clone "${WIKI_GIT_URL}" "${tmpDir}"`);
    } catch (cloneErr) {
      console.error("\n⚠️  Remote Wiki repository is not yet initialized on GitHub!");
      console.error("👉 Please open your browser at:");
      console.error("   https://github.com/Philippe1964/LMStudio_MCP_Connector/wiki");
      console.error("   and click 'Create the first page' to initialize the repository.");
      console.error("   Then rerun this synchronization script.\n");
      process.exit(1);
    }

    console.log("2. Copying markdown files from wiki/ directory...");
    const files = fs.readdirSync(WIKI_DIR);
    for (const file of files) {
      if (file.endsWith(".md")) {
        const src = path.join(WIKI_DIR, file);
        const dest = path.join(tmpDir, file);
        fs.copyFileSync(src, dest);
        console.log(`   • Copied: ${file}`);
      }
    }

    console.log("3. Creating Git commit...");
    run("git add .", tmpDir);
    const status = run("git status --porcelain", tmpDir);
    if (!status) {
      console.log("✨ Remote Wiki is already up to date, no changes needed.");
      return;
    }

    run('git commit -m "docs(wiki): sync English architecture and multi-instance documentation"', tmpDir);

    console.log("4. Pushing updates to GitHub Wiki...");
    run("git push origin HEAD", tmpDir);

    console.log("\n✅ Success! All GitHub Wiki pages have been updated in English:");
    console.log("   https://github.com/Philippe1964/LMStudio_MCP_Connector/wiki\n");
  } catch (err) {
    console.error("❌ Synchronization error:", err.message || err);
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

