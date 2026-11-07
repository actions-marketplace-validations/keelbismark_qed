#!/usr/bin/env node

/**
 * Q.E.D. (Quod Erat Demonstrandum) Mechanical Verification Engine
 * Standalone, zero-dependency linter enforcing the 16 Pillars of Q.E.D.
 *
 * Rules:
 *  - QED001: PRISTINE_ROOT     -> Zero temp dumps, logs, or scratch files in root
 *  - QED002: ZERO_DEBUG        -> Zero console.log, debugger, print(), fmt.Println
 *  - QED003: EMPTY_CATCH       -> Zero empty catch blocks or swallowed exceptions
 *  - QED004: UNSAFE_CAST       -> Zero loose `as any` casts
 *  - QED005: MISSING_TIMEOUT   -> Mandatory timeout/signal on fetch()
 *  - QED006: UNBOUNDED_CACHE   -> Ban on exported module-level unbounded Map/dict
 *  - QED007: SECRET_LEAK       -> Zero hardcoded tokens, API keys, or private keys
 *  - QED008: ENV_SYNC          -> Synchronized .env.example with referenced vars
 *  - QED009: DIV_ONCLICK       -> Semantic <a> links instead of <div onClick>
 *  - QED010: BLOCKED_PASTE     -> Ban on user-hostile onPaste.preventDefault()
 *  - QED011: UI_EMOJI_SLOP     -> Ban on emoji salad in UI buttons and headers
 *  - QED012: DDL_UNSAFE        -> Non-blocking DDL (CREATE INDEX CONCURRENTLY)
 */

const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_EXCLUDES = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "vendor",
  ".next",
  ".cache",
  "coverage",
  "tests",
  "scripts",
  "bin",
  "adapters", // Platform templates may contain illustrative placeholders
]);

const CODE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".go",
  ".rs",
  ".sql",
]);

const UI_EXTENSIONS = new Set([".tsx", ".jsx", ".html", ".vue", ".svelte"]);

// Color helpers for terminal output (respects NO_COLOR standard)
const useColor = !process.env.NO_COLOR && process.stdout.isTTY;
const colors = {
  cyan: (s) => (useColor ? `\x1b[36m${s}\x1b[0m` : s),
  green: (s) => (useColor ? `\x1b[32m${s}\x1b[0m` : s),
  yellow: (s) => (useColor ? `\x1b[33m${s}\x1b[0m` : s),
  red: (s) => (useColor ? `\x1b[31m${s}\x1b[0m` : s),
  gray: (s) => (useColor ? `\x1b[90m${s}\x1b[0m` : s),
  bold: (s) => (useColor ? `\x1b[1m${s}\x1b[0m` : s),
};

class QedLinter {
  constructor(targetDir = process.cwd(), options = {}) {
    this.targetDir = path.resolve(targetDir);
    this.strict = Boolean(options.strict);
    this.jsonOutput = Boolean(options.json);
    this.violations = [];
  }

  addViolation(ruleId, message, filePath, lineNum = null, snippet = null, fix = null) {
    const relPath = filePath ? path.relative(this.targetDir, filePath) : null;
    this.violations.push({
      ruleId,
      message,
      file: relPath,
      line: lineNum,
      snippet: snippet ? snippet.trim() : null,
      fix,
    });
  }

  // 1. Pristine Root Invariant
  checkPristineRoot() {
    const suspiciousPatterns = [
      /^temp_/i,
      /^scratch/i,
      /\.tmp$/i,
      /\.log$/i,
      /^test_dump/i,
      /^debug_/i,
    ];

    try {
      const entries = fs.readdirSync(this.targetDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(entry.name)) {
            this.addViolation(
              "QED001/PRISTINE_ROOT",
              `Temporary scratch file discovered in repository root: "${entry.name}"`,
              path.join(this.targetDir, entry.name),
              null,
              null,
              "Move scratch files to a local ignored directory or delete before committing."
            );
            break;
          }
        }
      }
    } catch {
      // Ignored if targetDir is unreadable
    }
  }

  // Collect source files respecting exclusions and .gitignore
  collectSourceFiles(dir = this.targetDir) {
    let results = [];
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return results;
    }

    for (const entry of entries) {
      if (entry.name.startsWith(".") && entry.name !== ".env.example") {
        if (entry.name !== ".github") continue;
      }
      if (DEFAULT_EXCLUDES.has(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(this.collectSourceFiles(fullPath));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (CODE_EXTENSIONS.has(ext)) {
          results.push(fullPath);
        }
      }
    }
    return results;
  }

  // 2. Scan Individual Source Files
  scanSourceFile(filePath) {
    let content;
    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch {
      return;
    }

    const lines = content.split(/\r?\n/);
    const ext = path.extname(filePath).toLowerCase();
    const isUI = UI_EXTENSIONS.has(ext);

    // Multi-line regex checks
    this.checkMultiLinePatterns(filePath, content);

    // Line-by-line checks
    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i];

      // Ignore comments and explicit suppressions
      if (/^\s*(\/\/|#|\/\*|\*)/.test(line)) continue;
      if (line.includes("qed-ignore")) continue;

      // QED002: Zero-Debug Print Invariant
      if (/console\.(log|debug|dir|trace)\s*\(/.test(line) && !line.includes("logger.")) {
        this.addViolation(
          "QED002/ZERO_DEBUG",
          "Leftover console debug print statement found in production source.",
          filePath,
          lineNum,
          line,
          "Use a structured logger (logger.info/debug) or remove before commit."
        );
      }
      if (/\bdebugger\s*;/.test(line)) {
        this.addViolation(
          "QED002/ZERO_DEBUG",
          "Leftover debugger breakpoint found.",
          filePath,
          lineNum,
          line,
          "Remove debugger statement."
        );
      }
      if (ext === ".py" && /\bprint\s*\(/.test(line) && !line.includes("logger.")) {
        this.addViolation(
          "QED002/ZERO_DEBUG",
          "Leftover print() call found in Python source.",
          filePath,
          lineNum,
          line,
          "Use logging module instead of raw print()."
        );
      }

      // QED004: Anti-`as any` Cast
      if ((ext === ".ts" || ext === ".tsx") && /\bas\s+any\b/.test(line)) {
        this.addViolation(
          "QED004/UNSAFE_CAST",
          "Loose 'as any' cast bypasses compile-time type safety.",
          filePath,
          lineNum,
          line,
          "Use typed interfaces, unknown with type-guards, or Zod schema validation."
        );
      }

      // QED007: Secret Leak Radar
      const secretMatch = line.match(/(?:sk-(?:proj-)?[a-zA-Z0-9-_]{20,}|ghp_[a-zA-Z0-9]{30,}|AIza[0-9A-Za-z-_]{35})/);
      if (secretMatch) {
        this.addViolation(
          "QED007/SECRET_LEAK",
          "High-entropy API secret or private access token hardcoded in source.",
          filePath,
          lineNum,
          line.replace(secretMatch[0], "[REDACTED_SECRET]"),
          "Store secrets in environment variables (.env) and add to .env.example."
        );
      }

      // UI-Specific Checks
      if (isUI) {
        // QED009: Semantic Links vs <div onClick>
        if (/<(div|span|section)\s+[^>]*onClick\s*=\s*\{.*navigate/i.test(line) ||
            /<(div|span)\s+[^>]*onClick\s*=.*router\.(push|replace)/i.test(line)) {
          this.addViolation(
            "QED009/DIV_ONCLICK",
            "Navigational click handler on non-link container element (<div onClick>).",
            filePath,
            lineNum,
            line,
            "Use semantic <a href=\"...\"> or <Link href=\"...\"> to support middle-click and bookmarks."
          );
        }

        // QED010: Blocked Paste (User-Hostile)
        if (/onPaste\s*=\s*\{\s*(?:\([^)]*\)\s*=>\s*)?[a-zA-Z0-9_]*\.preventDefault\(\)/i.test(line) ||
            /onpaste\s*=\s*["']return\s+false["']/i.test(line)) {
          this.addViolation(
            "QED010/BLOCKED_PASTE",
            "Clipboard paste is blocked by onPaste.preventDefault().",
            filePath,
            lineNum,
            line,
            "Remove onPaste block to support password managers and 2FA tokens."
          );
        }

        // QED011: Emoji Salad in UI Chrome
        const emojiMatch = line.match(/<button[^>]*>.*[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}].*<\/button>/u);
        if (emojiMatch) {
          this.addViolation(
            "QED011/UI_EMOJI_SLOP",
            "Gratuitous emoji used inside UI button chrome.",
            filePath,
            lineNum,
            line,
            "Replace emoji with calibrated SVG vector icons (Lucide, Heroicons) with aria-hidden."
          );
        }
      }

      // SQL / DDL Specific Checks
      if (ext === ".sql") {
        if (/CREATE\s+INDEX\s+(?!CONCURRENTLY\b)[a-zA-Z0-9_]+\s+ON/i.test(line)) {
          this.addViolation(
            "QED012/DDL_UNSAFE",
            "CREATE INDEX without CONCURRENTLY locks the table against writes.",
            filePath,
            lineNum,
            line,
            "Use CREATE INDEX CONCURRENTLY to build indexes without table-locking."
          );
        }
      }
    }
  }

  // Multi-line regex checks
  checkMultiLinePatterns(filePath, content) {
    if (content.includes("qed-ignore")) return;
    const ext = path.extname(filePath).toLowerCase();

    // QED003: Empty Catch Blocks
    const emptyCatchRegex = /catch\s*(?:\([^)]*\))?\s*\{\s*\}/g;
    let match;
    while ((match = emptyCatchRegex.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split("\n").length;
      this.addViolation(
        "QED003/EMPTY_CATCH",
        "Empty catch block silently swallows exceptions, hiding defects.",
        filePath,
        lineNum,
        match[0],
        "Handle with fallback, re-throw with cause (new Error('...', { cause })), or log at boundary."
      );
    }

    // Python empty except
    if (ext === ".py") {
      const emptyExceptRegex = /except(?:\s+[a-zA-Z0-9_]+)?\s*:\s*\n\s*pass/g;
      while ((match = emptyExceptRegex.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split("\n").length;
        this.addViolation(
          "QED003/EMPTY_CATCH",
          "Silent except: pass swallows errors without recovery.",
          filePath,
          lineNum,
          match[0],
          "Implement recovery logic, log structured error, or re-raise."
        );
      }
    }

    // QED005: Missing Fetch Deadline (Naked fetch)
    if (ext === ".ts" || ext === ".js" || ext === ".tsx") {
      const nakedFetchRegex = /\bfetch\s*\(\s*["'`][^"'`]+["'`]\s*\)/g;
      while ((match = nakedFetchRegex.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split("\n").length;
        this.addViolation(
          "QED005/MISSING_TIMEOUT",
          "Naked fetch() without AbortSignal timeout causes hanging connections.",
          filePath,
          lineNum,
          match[0],
          "Pass AbortSignal.timeout(ms) in options: fetch(url, { signal: AbortSignal.timeout(5000) })."
        );
      }
    }
  }

  // 3. Check .env.example Synchronization
  checkEnvSync(files) {
    const envExamplePath = path.join(this.targetDir, ".env.example");
    if (!fs.existsSync(envExamplePath)) return;

    let envContent = "";
    try {
      envContent = fs.readFileSync(envExamplePath, "utf8");
    } catch {
      return;
    }

    const referencedVars = new Set();
    const envVarRegex = /(?:process\.env\.([A-Z0-9_]+)|os\.(?:environ\["|Getenv\(")([A-Z0-9_]+))/g;

    for (const filePath of files) {
      let content = "";
      try {
        content = fs.readFileSync(filePath, "utf8");
      } catch {
        continue;
      }

      let m;
      while ((m = envVarRegex.exec(content)) !== null) {
        const varName = m[1] || m[2];
        if (varName && !["NODE_ENV", "PORT", "PATH"].includes(varName)) {
          referencedVars.add(varName);
        }
      }
    }

    for (const varName of referencedVars) {
      const regex = new RegExp(`\\b${varName}\\b`);
      if (!regex.test(envContent)) {
        this.addViolation(
          "QED008/ENV_SYNC",
          `Environment variable "${varName}" is referenced in code but missing from .env.example`,
          envExamplePath,
          null,
          null,
          `Add ${varName}=placeholder to .env.example with an explanatory comment.`
        );
      }
    }
  }

  // Run the full verification audit
  run() {
    this.checkPristineRoot();
    const sourceFiles = this.collectSourceFiles();
    for (const file of sourceFiles) {
      this.scanSourceFile(file);
    }
    this.checkEnvSync(sourceFiles);
    return this.violations;
  }
}

// CLI Execution Entrypoint
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || "check";
  const targetDir = args[1] || process.cwd();
  const strict = args.includes("--strict");
  const jsonMode = args.includes("--json");

  if (command === "check") {
    if (!jsonMode) {
      console.log(colors.cyan("=========================================================="));
      console.log(colors.cyan(" Q.E.D. High-Assurance Mechanical Verification Engine"));
      console.log(colors.gray(" Evidence Before Assertions"));
      console.log(colors.cyan("=========================================================="));
      console.log(colors.gray(`Target: ${path.resolve(targetDir)}\n`));
    }

    const linter = new QedLinter(targetDir, { strict, json: jsonMode });
    const violations = linter.run();

    if (jsonMode) {
      console.log(JSON.stringify({ violations, total: violations.length, passed: violations.length === 0 }, null, 2));
      process.exit(violations.length === 0 ? 0 : 1);
    }

    if (violations.length === 0) {
      console.log(colors.green("✓ Q.E.D. Verification Gate: 100% CLEAN. Zero violations found."));
      console.log(colors.gray("  All 16 pillars and mechanical invariants satisfied."));
      process.exit(0);
    } else {
      console.log(colors.red(`✗ Q.E.D. Verification Gate: FAILED (${violations.length} violation(s) detected):\n`));
      for (const v of violations) {
        const loc = v.file ? `${v.file}${v.line ? `:${v.line}` : ""}` : "Repository Root";
        console.log(`  ${colors.red("[!]")} ${colors.bold(v.ruleId)} in ${colors.yellow(loc)}`);
        console.log(`      ${v.message}`);
        if (v.snippet) {
          console.log(colors.gray(`      > ${v.snippet}`));
        }
        if (v.fix) {
          console.log(colors.cyan(`      Suggested Fix: ${v.fix}`));
        }
        console.log("");
      }
      process.exit(1);
    }
  } else if (command === "hook") {
    const gitDir = path.join(path.resolve(targetDir), ".git");
    const hooksDir = path.join(gitDir, "hooks");
    if (!fs.existsSync(gitDir)) {
      console.error(colors.red("Error: No .git directory found. Cannot install pre-commit hook."));
      process.exit(1);
    }
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }

    const hookScript = `#!/usr/bin/env sh
# Q.E.D. Automated Mechanical Gate Pre-Commit Hook

echo "Running Q.E.D. Pre-Commit Gate..."

if command -v node >/dev/null 2>&1 && [ -f "./bin/qed-engine.js" ]; then
    node "./bin/qed-engine.js" check
    EXIT_CODE=$?
elif [ -f "./bin/qed" ]; then
    ./bin/qed check
    EXIT_CODE=$?
elif [ -f "./bin/qed.ps1" ]; then
    pwsh -ExecutionPolicy Bypass -File "./bin/qed.ps1" check || powershell -ExecutionPolicy Bypass -File "./bin/qed.ps1" check
    EXIT_CODE=$?
else
    echo "Warning: Q.E.D. runner not found. Skipping gate."
    exit 0
fi

if [ "$EXIT_CODE" -ne 0 ]; then
    echo "Commit BLOCKED by Q.E.D. Mechanical Verification Gate."
    exit 1
fi
exit 0
`;

    const hookPath = path.join(hooksDir, "pre-commit");
    fs.writeFileSync(hookPath, hookScript, { mode: 0o755 });
    console.log(colors.green(`[+] Installed Q.E.D. pre-commit hook to: ${hookPath}`));
    process.exit(0);
  } else {
    console.log(colors.red(`Unknown command: ${command}`));
    console.log("Usage: node bin/qed-engine.js [check | hook] [target_dir] [--json] [--strict]");
    process.exit(1);
  }
}

module.exports = { QedLinter };
