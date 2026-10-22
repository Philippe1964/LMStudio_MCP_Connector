#!/usr/bin/env node
/**
 * [AI-GENERATED FILE]
 * This script was generated with the assistance of AI
 * (Google Antigravity / Gemini 3.8 Flash & LM Studio local).
 *
 * Automated Quality Gate Hook & CLI Reviewer for Antigravity (TypeScript, TSC, Native Tests).
 * Follows the Antigravity Stop Hook JSON contract.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");

function runStep(label, command) {
  try {
    const stdout = execSync(command, {
      cwd: REPO_ROOT,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { passed: true, output: stdout.trim() };
  } catch (err) {
    const stdoutStr = (err.stdout || "").trim();
    const stderrStr = (err.stderr || "").trim();
    const combined = [stdoutStr, stderrStr].filter(Boolean).join("\n");
    return {
      passed: false,
      output: `[${label}] FAILED (exit ${err.status || 1}):\n${combined}`,
    };
  }
}

export function runAllChecks(includeTests = true) {
  const tscBin = path.join(REPO_ROOT, "node_modules", "typescript", "bin", "tsc");
  const nodeBin = process.execPath;

  const steps = [
    {
      label: "TypeScript Strict Check (tsc --noEmit)",
      command: `"${nodeBin}" "${tscBin}" --noEmit`,
    },
  ];

  if (includeTests) {
    steps.push({
      label: "Unit & Integration Tests (node --test)",
      command: `"${nodeBin}" --test dist/tests/**/*.test.js`,
    });
  }

  const failures = [];

  for (const step of steps) {
    const result = runStep(step.label, step.command);
    if (!result.passed) {
      failures.push(result.output);
    }
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}

function handleStopHook() {
  let rawStdin = "";
  try {
    rawStdin = fs.readFileSync(0, "utf-8").trim();
  } catch {
    // stdin empty
  }

  let terminationReason = "NO_TOOL_CALL";
  if (rawStdin) {
    try {
      const payload = JSON.parse(rawStdin);
      if (typeof payload.terminationReason === "string") {
        terminationReason = payload.terminationReason;
      }
    } catch {
      terminationReason = "NO_TOOL_CALL";
    }
  }

  if (terminationReason !== "NO_TOOL_CALL") {
    process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
    process.exit(0);
  }

  const { passed, failures } = runAllChecks(true);
  if (passed) {
    process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
    process.exit(0);
  }

  const reasonMsg =
    "Automatic Quality Gate detected TypeScript or Test failures. " +
    "You MUST fix all errors below before finishing your turn:\n\n" +
    failures.join("\n\n");

  process.stdout.write(
    JSON.stringify({
      decision: "continue",
      reason: reasonMsg,
    }) + "\n"
  );
  process.exit(0);
}

function main() {
  const args = process.argv.slice(2);
  const isCli = args.includes("--cli");

  if (!isCli) {
    handleStopHook();
    return;
  }

  const { passed, failures } = runAllChecks(true);
  if (passed) {
    process.stdout.write(
      "QUALITY GATE PASSED: TypeScript (tsc) and Test Suite all succeeded with 0 errors.\n"
    );
    process.exit(0);
  }

  process.stderr.write("QUALITY GATE FAILED:\n\n" + failures.join("\n\n") + "\n");
  process.exit(1);
}

main();

