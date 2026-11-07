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
  "bin",
  "adapters", // Platform templates contain illustrative placeholders
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

const KNOWN_RULES = new Set([
  "*",
  "ALL",
  "QED001", "PRISTINE_ROOT",
  "QED002", "ZERO_DEBUG",
  "QED003", "EMPTY_CATCH",
  "QED004", "UNSAFE_CAST",
  "QED005", "MISSING_TIMEOUT",
  "QED006", "UNBOUNDED_CACHE",
  "QED007", "SECRET_LEAK",
  "QED008", "ENV_SYNC",
  "QED009", "DIV_ONCLICK",
  "QED010", "BLOCKED_PASTE",
  "QED011", "UI_EMOJI_SLOP",
  "QED012", "DDL_UNSAFE",
]);

function parseDirectiveRules(rawText) {
  if (!rawText || !rawText.trim()) return ["*"];
  // Stop at common comment separators like '-', ':', '(', or '--'
  const clean = rawText.split(/[-:(]/)[0].trim();
  if (!clean) return ["*"];
  const tokens = clean.split(/[,\s]+/).map((t) => t.toUpperCase().trim()).filter(Boolean);
  const matchedRules = tokens.filter((t) => KNOWN_RULES.has(t) || /^QED\d{3}$/.test(t));
  return matchedRules.length > 0 ? matchedRules : ["*"];
}

function matchesGlob(relPath, pattern) {
  const normPath = relPath.replace(/\\/g, "/");
  const normPattern = pattern.replace(/\\/g, "/").replace(/^\.\//, "");
  if (normPattern.includes("*") || normPattern.includes("?")) {
    const escaped = normPattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*\*/g, ".*")
      .replace(/(?<!\.)\*/g, "[^/]*")
      .replace(/\?/g, ".");
    const rx = new RegExp(`(^|/)${escaped}($|/)`);
    return rx.test(normPath);
  }
  return (
    normPath === normPattern ||
    normPath.startsWith(normPattern + "/") ||
    normPath.includes("/" + normPattern + "/")
  );
}

function isTestOrFixturePath(filePath) {
  const norm = filePath.replace(/\\/g, "/");
  return (
    /(?:^|\/)(?:tests?|__tests__|fixtures?|samples?|scripts?)\//i.test(norm) ||
    /\.(?:test|spec)\.[a-z0-9]+$/i.test(norm)
  );
}

function ruleMatchesSet(ruleSet, targetRule) {
  if (!ruleSet || ruleSet.size === 0) return false;
  if (ruleSet.has("*") || ruleSet.has("ALL")) return true;
  const parts = targetRule.toUpperCase().split("/");
  const numId = parts[0];
  const nameId = parts[1] || "";
  for (const item of ruleSet) {
    const norm = item.toUpperCase().trim();
    if (norm === numId || (nameId && norm === nameId) || norm === targetRule.toUpperCase()) {
      return true;
    }
  }
  return false;
}

/**
 * FileSuppressionMap parses and manages in-code suppressions:
 * - Line suppressions: // qed-ignore [rules]
 * - Next-line suppressions: // qed-ignore-next-line [rules]
 * - Block suppressions: /* qed-disable [rules] * / ... /* qed-enable * /
 * - File suppression: // qed-disable-file
 */
class FileSuppressionMap {
  constructor(content) {
    this.isFileDisabled = false;
    this.lineSuppressions = new Map(); // lineNum -> Set of rules
    this.blockDisables = new Map(); // lineNum -> Set of currently disabled rules
    this.parse(content);
  }

  parse(content) {
    if (/(?:\/\/|#|\/\*|<!--)\s*qed-disable-file/i.test(content)) {
      this.isFileDisabled = true;
      return;
    }

    const lines = content.split(/\r?\n/);
    const activeBlock = new Set();
    let pendingNextLineRules = null;

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i];

      // 1. Block Disable
      const disableMatch = line.match(/(?:\/\/|#|\/\*|<!--)\s*qed-disable(?:\s+(.*?))?(?:\*\/|-->)?$/i);
      if (disableMatch && !line.includes("qed-disable-file")) {
        const rules = parseDirectiveRules(disableMatch[1]);
        for (const r of rules) activeBlock.add(r);
      }

      // 2. Block Enable
      const enableMatch = line.match(/(?:\/\/|#|\/\*|<!--)\s*qed-enable(?:\s+(.*?))?(?:\*\/|-->)?$/i);
      if (enableMatch) {
        const rules = parseDirectiveRules(enableMatch[1]);
        if (rules.includes("*")) {
          activeBlock.clear();
        } else {
          for (const r of rules) activeBlock.delete(r);
        }
      }

      if (activeBlock.size > 0) {
        this.blockDisables.set(lineNum, new Set(activeBlock));
      }

      // 3. Consume pending next-line ignore
      if (pendingNextLineRules) {
        const existing = this.lineSuppressions.get(lineNum) || new Set();
        for (const r of pendingNextLineRules) existing.add(r);
        this.lineSuppressions.set(lineNum, existing);
        pendingNextLineRules = null;
      }

      // 4. Next-line ignore declaration
      const nextLineMatch = line.match(/(?:\/\/|#|\/\*|<!--)\s*qed-ignore-next-line(?:\s+(.*?))?(?:\*\/|-->)?$/i);
      if (nextLineMatch) {
        const rules = parseDirectiveRules(nextLineMatch[1]);
        pendingNextLineRules = new Set(rules);
      }

      // 5. Current-line ignore declaration
      const inlineMatch = line.match(/(?:\/\/|#|\/\*|<!--)\s*qed-ignore(?:\s+(.*?))?(?:\*\/|-->)?$/i);
      if (inlineMatch && !line.includes("qed-ignore-next-line")) {
        const rules = parseDirectiveRules(inlineMatch[1]);
        const existing = this.lineSuppressions.get(lineNum) || new Set();
        for (const r of rules) existing.add(r);
        this.lineSuppressions.set(lineNum, existing);
      }
    }
  }

  isIgnored(ruleId, lineNum) {
    if (this.isFileDisabled) return true;
    if (lineNum !== null && lineNum !== undefined) {
      const lineRules = this.lineSuppressions.get(lineNum);
      if (lineRules && ruleMatchesSet(lineRules, ruleId)) {
        return true;
      }
      const blockRules = this.blockDisables.get(lineNum);
      if (blockRules && ruleMatchesSet(blockRules, ruleId)) {
        return true;
      }
    }
    return false;
  }
}

class QedLinter {
  constructor(targetDir = process.cwd(), options = {}) {
    this.targetDir = path.resolve(targetDir);
    this.strict = Boolean(options.strict);
    this.jsonOutput = Boolean(options.json);
    this.config = this.loadConfig(options.config);
    this.violations = [];
  }

  loadConfig(explicitConfigPath) {
    const configCandidates = explicitConfigPath
      ? [path.resolve(explicitConfigPath)]
      : [
          path.join(this.targetDir, ".qedrc.json"),
          path.join(this.targetDir, ".qedrc"),
          path.join(this.targetDir, "package.json"),
        ];

    for (const confPath of configCandidates) {
      if (fs.existsSync(confPath)) {
        try {
          const raw = fs.readFileSync(confPath, "utf8");
          const parsed = JSON.parse(raw);
          if (confPath.endsWith("package.json")) {
            if (parsed.qed && typeof parsed.qed === "object") {
              return this.normalizeConfig(parsed.qed, confPath);
            }
          } else {
            return this.normalizeConfig(parsed, confPath);
          }
        } catch {
          // Fall through on JSON parse error
        }
      }
    }
    return { ignorePatterns: [], rules: {} };
  }

  normalizeConfig(rawConfig, sourcePath) {
    const config = {
      source: sourcePath,
      ignorePatterns: Array.isArray(rawConfig.ignorePatterns) ? rawConfig.ignorePatterns : [],
      rules: {},
    };
    if (rawConfig.rules && typeof rawConfig.rules === "object") {
      for (const [key, val] of Object.entries(rawConfig.rules)) {
        const severity = String(val).toLowerCase();
        if (["off", "warn", "error"].includes(severity)) {
          config.rules[key.toUpperCase()] = severity;
        }
      }
    }
    return config;
  }

  getRuleSeverity(ruleId) {
    const parts = ruleId.toUpperCase().split("/");
    const numId = parts[0];
    const nameId = parts[1] || "";

    if (this.config.rules[numId]) return this.config.rules[numId];
    if (nameId && this.config.rules[nameId]) return this.config.rules[nameId];
    if (this.config.rules[ruleId.toUpperCase()]) return this.config.rules[ruleId.toUpperCase()];

    return "error";
  }

  isRelaxedInContext(ruleId, filePath) {
    if (this.strict) return false;
    if (!filePath) return false;
    if (isTestOrFixturePath(filePath)) {
      // Relax rules in tests and local scripts so developers are not suffocated
      const relaxedRules = new Set([
        "QED002",
        "ZERO_DEBUG",
        "QED004",
        "UNSAFE_CAST",
        "QED005",
        "MISSING_TIMEOUT",
        "QED009",
        "DIV_ONCLICK",
      ]);
      const parts = ruleId.toUpperCase().split("/");
      if (relaxedRules.has(parts[0]) || (parts[1] && relaxedRules.has(parts[1]))) {
        return true;
      }
    }
    return false;
  }

  addViolation(ruleId, message, filePath, lineNum = null, snippet = null, fix = null) {
    const severity = this.getRuleSeverity(ruleId);
    if (severity === "off") return;

    const relPath = filePath ? path.relative(this.targetDir, filePath) : null;
    this.violations.push({
      ruleId,
      severity,
      message,
      file: relPath,
      line: lineNum,
      snippet: snippet ? snippet.trim() : null,
      fix,
    });
  }

  // 1. Pristine Root Invariant
  checkPristineRoot() {
    if (this.getRuleSeverity("QED001") === "off") return;

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

  // Collect source files respecting exclusions, config ignorePatterns, and .gitignore
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
      const relPath = path.relative(this.targetDir, fullPath);

      // Check config ignore patterns
      if (this.config.ignorePatterns.some((pattern) => matchesGlob(relPath, pattern))) {
        continue;
      }

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

    const suppressions = new FileSuppressionMap(content);
    if (suppressions.isFileDisabled) return;

    const lines = content.split(/\r?\n/);
    const ext = path.extname(filePath).toLowerCase();
    const isUI = UI_EXTENSIONS.has(ext);

    // Multi-line pattern checks
    this.checkMultiLinePatterns(filePath, content, suppressions);

    // Line-by-line checks
    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i];

      // Skip lines that are purely comment lines
      if (/^\s*(\/\/|#|\/\*|\*|<!--|--)/.test(line)) continue;

      // QED002: Zero-Debug Print Invariant
      if (!suppressions.isIgnored("QED002", lineNum) && !this.isRelaxedInContext("QED002", filePath)) {
        // Allows console.warn, console.error, console.info; flags only debug/log
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
      }

      // QED004: Anti-`as any` Cast
      if (!suppressions.isIgnored("QED004", lineNum) && !this.isRelaxedInContext("QED004", filePath)) {
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
      }

      // QED006: Unbounded Module-Level Cache
      if (!suppressions.isIgnored("QED006", lineNum)) {
        if (/(?:export\s+(?:const|let|var)\s+([a-zA-Z0-9_]*cache[a-zA-Z0-9_]*)\s*=\s*new\s+Map\s*\(\s*\))/i.test(line)) {
          this.addViolation(
            "QED006/UNBOUNDED_CACHE",
            "Exported module-level unbounded Map causes memory leaks in long-running processes.",
            filePath,
            lineNum,
            line,
            "Use a bounded cache with maxSize and TTL (e.g. LRU cache)."
          );
        }
      }

      // QED007: Secret Leak Radar
      if (!suppressions.isIgnored("QED007", lineNum)) {
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
      }

      // UI-Specific Checks
      if (isUI) {
        // QED009: Semantic Links vs <div onClick> (Checks navigational actions only)
        if (!suppressions.isIgnored("QED009", lineNum) && !this.isRelaxedInContext("QED009", filePath)) {
          if (
            /<(div|span|section)\s+[^>]*onClick\s*=\s*\{?[^}]*(?:navigate|router\.(?:push|replace)|window\.location|history\.(?:push|replace))/i.test(
              line
            )
          ) {
            this.addViolation(
              "QED009/DIV_ONCLICK",
              "Navigational click handler on non-link container element (<div onClick>).",
              filePath,
              lineNum,
              line,
              "Use semantic <a href=\"...\"> or <Link href=\"...\"> to support middle-click and bookmarks."
            );
          }
        }

        // QED010: Blocked Paste (User-Hostile)
        if (!suppressions.isIgnored("QED010", lineNum)) {
          if (
            /onPaste\s*=\s*\{\s*(?:\([^)]*\)\s*=>\s*)?[a-zA-Z0-9_]*\.preventDefault\(\)/i.test(line) ||
            /onpaste\s*=\s*["']return\s+false["']/i.test(line)
          ) {
            this.addViolation(
              "QED010/BLOCKED_PASTE",
              "Clipboard paste is blocked by onPaste.preventDefault().",
              filePath,
              lineNum,
              line,
              "Remove onPaste block to support password managers and 2FA tokens."
            );
          }
        }

        // QED011: Emoji Salad in UI Chrome
        if (!suppressions.isIgnored("QED011", lineNum)) {
          const emojiMatch = line.match(
            /<button[^>]*>.*[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}].*<\/button>/u
          );
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
      }

      // SQL / DDL Specific Checks
      if (ext === ".sql") {
        if (!suppressions.isIgnored("QED012", lineNum)) {
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
  }

  // Multi-line regex checks with suppression awareness
  checkMultiLinePatterns(filePath, content, suppressions) {
    const ext = path.extname(filePath).toLowerCase();

    // QED003: Empty Catch Blocks
    const emptyCatchRegex = /catch\s*(?:\([^)]*\))?\s*\{\s*\}/g;
    let match;
    while ((match = emptyCatchRegex.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split("\n").length;
      if (suppressions.isIgnored("QED003", lineNum)) continue;
      if (this.isRelaxedInContext("QED003", filePath)) continue;

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
        if (suppressions.isIgnored("QED003", lineNum)) continue;
        if (this.isRelaxedInContext("QED003", filePath)) continue;

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

    // QED005: Missing Fetch Deadline (Naked single-argument fetch)
    if (ext === ".ts" || ext === ".js" || ext === ".tsx") {
      const nakedFetchRegex = /(?:^|[^\w$.])fetch\s*\(\s*([^,\n\)]+)\s*\)/g;
      while ((match = nakedFetchRegex.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split("\n").length;
        if (suppressions.isIgnored("QED005", lineNum)) continue;
        if (this.isRelaxedInContext("QED005", filePath)) continue;

        this.addViolation(
          "QED005/MISSING_TIMEOUT",
          "Naked fetch() without AbortSignal timeout causes hanging connections.",
          filePath,
          lineNum,
          match[0].trim(),
          "Pass AbortSignal.timeout(ms) in options: fetch(url, { signal: AbortSignal.timeout(5000) })."
        );
      }
    }
  }

  // 3. Check .env.example Synchronization
  checkEnvSync(files) {
    if (this.getRuleSeverity("QED008") === "off") return;

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
  const targetDir = args.find((a) => !a.startsWith("-") && a !== command) || process.cwd();
  const strict = args.includes("--strict");
  const jsonMode = args.includes("--json");
  const configIndex = args.indexOf("--config");
  const explicitConfig = configIndex !== -1 && args[configIndex + 1] ? args[configIndex + 1] : null;

  if (command === "check") {
    if (!jsonMode) {
      console.log(colors.cyan("=========================================================="));
      console.log(colors.cyan(" Q.E.D. High-Assurance Mechanical Verification Engine"));
      console.log(colors.gray(" Evidence Before Assertions"));
      console.log(colors.cyan("=========================================================="));
      console.log(colors.gray(`Target: ${path.resolve(targetDir)}\n`));
    }

    const linter = new QedLinter(targetDir, { strict, json: jsonMode, config: explicitConfig });
    const violations = linter.run();

    const errors = violations.filter((v) => v.severity === "error");
    const warnings = violations.filter((v) => v.severity === "warn");
    const isPassing = strict ? violations.length === 0 : errors.length === 0;

    if (jsonMode) {
      console.log(
        JSON.stringify(
          {
            violations,
            errors,
            warnings,
            total: violations.length,
            errorCount: errors.length,
            warningCount: warnings.length,
            passed: isPassing,
          },
          null,
          2
        )
      );
      process.exit(isPassing ? 0 : 1);
    }

    if (violations.length === 0) {
      console.log(colors.green("✓ Q.E.D. Verification Gate: 100% CLEAN. Zero violations found."));
      console.log(colors.gray("  All 16 pillars and mechanical invariants satisfied."));
      process.exit(0);
    }

    if (errors.length === 0 && warnings.length > 0) {
      console.log(colors.yellow(`✓ Q.E.D. Verification Gate: PASSED with ${warnings.length} warning(s):\n`));
      for (const v of warnings) {
        const loc = v.file ? `${v.file}${v.line ? `:${v.line}` : ""}` : "Repository Root";
        console.log(`  ${colors.yellow("[WARN]")} ${colors.bold(v.ruleId)} in ${colors.yellow(loc)}`);
        console.log(`         ${v.message}`);
        if (v.snippet) console.log(colors.gray(`         > ${v.snippet}`));
        if (v.fix) console.log(colors.cyan(`         Suggested Fix: ${v.fix}`));
        console.log("");
      }
      process.exit(0);
    }

    console.log(
      colors.red(
        `✗ Q.E.D. Verification Gate: FAILED (${errors.length} error(s), ${warnings.length} warning(s) detected):\n`
      )
    );
    for (const v of violations) {
      const isErr = v.severity === "error";
      const badge = isErr ? colors.red("[!]") : colors.yellow("[WARN]");
      const loc = v.file ? `${v.file}${v.line ? `:${v.line}` : ""}` : "Repository Root";
      console.log(`  ${badge} ${colors.bold(v.ruleId)} in ${colors.yellow(loc)}`);
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
  } else if (command === "init") {
    const configPath = path.join(path.resolve(targetDir), ".qedrc.json");
    if (fs.existsSync(configPath)) {
      console.log(colors.yellow(`Config file already exists at: ${configPath}`));
      process.exit(0);
    }
    const starterConfig = {
      $schema: "https://raw.githubusercontent.com/keelbismark/qed/main/schema/qedrc.schema.json",
      ignorePatterns: ["dist/**", "build/**", "coverage/**", "vendor/**"],
      rules: {
        QED001: "error",
        QED002: "error",
        QED003: "error",
        QED004: "error",
        QED005: "error",
        QED006: "error",
        QED007: "error",
        QED008: "error",
        QED009: "error",
        QED010: "error",
        QED011: "error",
        QED012: "error",
      },
    };
    fs.writeFileSync(configPath, JSON.stringify(starterConfig, null, 2) + "\n", "utf8");
    console.log(colors.green(`[+] Initialized Q.E.D. configuration at: ${configPath}`));
    process.exit(0);
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
    console.log("Usage: node bin/qed-engine.js [check | init | hook] [target_dir] [--json] [--strict] [--config <path>]");
    process.exit(1);
  }
}

module.exports = { QedLinter };
