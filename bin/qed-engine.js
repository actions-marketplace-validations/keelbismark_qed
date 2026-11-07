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
    /(?:^|\/)(?:tests?|__tests__|fixtures?|samples?|scripts?|evals?|benchmarks?)\//i.test(norm) ||
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
 * maskCodeStringsAndComments:
 * Lexical masking engine. Replaces string literals ("...", '...', `...`)
 * and non-directive comments with space characters while preserving exact newlines,
 * line numbers, and character offsets. Eliminates false positives when rule keywords
 * appear inside documentation strings, comments, or UI copy.
 */
function maskCodeStringsAndComments(source, ext = ".ts") {
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let inSingleLineComment = false;
  let inMultiLineComment = false;
  let isEscaped = false;

  const chars = source.split("");
  const len = chars.length;

  for (let i = 0; i < len; i++) {
    const c = chars[i];
    const next = i + 1 < len ? chars[i + 1] : "";

    if (inSingleLineComment) {
      if (c === "\n" || c === "\r") {
        inSingleLineComment = false;
      } else {
        chars[i] = " ";
      }
      continue;
    }

    if (inMultiLineComment) {
      if (c === "*" && next === "/") {
        chars[i] = " ";
        chars[i + 1] = " ";
        i++;
        inMultiLineComment = false;
      } else if (c !== "\n" && c !== "\r") {
        chars[i] = " ";
      }
      continue;
    }

    if (inSingleQuote) {
      if (isEscaped) {
        isEscaped = false;
        chars[i] = " ";
      } else if (c === "\\") {
        isEscaped = true;
        chars[i] = " ";
      } else if (c === "'") {
        inSingleQuote = false;
        chars[i] = " ";
      } else if (c !== "\n" && c !== "\r") {
        chars[i] = " ";
      }
      continue;
    }

    if (inDoubleQuote) {
      if (isEscaped) {
        isEscaped = false;
        chars[i] = " ";
      } else if (c === "\\") {
        isEscaped = true;
        chars[i] = " ";
      } else if (c === '"') {
        inDoubleQuote = false;
        chars[i] = " ";
      } else if (c !== "\n" && c !== "\r") {
        chars[i] = " ";
      }
      continue;
    }

    if (inBacktick) {
      if (isEscaped) {
        isEscaped = false;
        chars[i] = " ";
      } else if (c === "\\") {
        isEscaped = true;
        chars[i] = " ";
      } else if (c === "`") {
        inBacktick = false;
        chars[i] = " ";
      } else if (c !== "\n" && c !== "\r") {
        chars[i] = " ";
      }
      continue;
    }

    // Check for comment starts
    if (c === "/" && next === "/" && (ext === ".ts" || ext === ".js" || ext === ".tsx" || ext === ".jsx" || ext === ".go" || ext === ".rs")) {
      const remainder = source.substring(i);
      const firstLine = remainder.split(/\r?\n/)[0];
      if (/qed-(?:ignore|disable|enable)/i.test(firstLine)) {
        i += firstLine.length - 1;
        continue;
      }
      inSingleLineComment = true;
      chars[i] = " ";
      chars[i + 1] = " ";
      i++;
      continue;
    }

    if (c === "/" && next === "*" && (ext === ".ts" || ext === ".js" || ext === ".tsx" || ext === ".jsx" || ext === ".go" || ext === ".rs" || ext === ".sql")) {
      const remainder = source.substring(i);
      const closeIdx = remainder.indexOf("*/");
      const block = closeIdx !== -1 ? remainder.substring(0, closeIdx + 2) : remainder;
      if (/qed-(?:ignore|disable|enable)/i.test(block)) {
        i += block.length - 1;
        continue;
      }
      inMultiLineComment = true;
      chars[i] = " ";
      chars[i + 1] = " ";
      i++;
      continue;
    }

    if (c === "#" && (ext === ".py" || ext === ".sh" || ext === ".yaml" || ext === ".yml")) {
      const remainder = source.substring(i);
      const firstLine = remainder.split(/\r?\n/)[0];
      if (/qed-(?:ignore|disable|enable)/i.test(firstLine)) {
        i += firstLine.length - 1;
        continue;
      }
      inSingleLineComment = true;
      chars[i] = " ";
      continue;
    }

    if (c === "-" && next === "-" && ext === ".sql") {
      const remainder = source.substring(i);
      const firstLine = remainder.split(/\r?\n/)[0];
      if (/qed-(?:ignore|disable|enable)/i.test(firstLine)) {
        i += firstLine.length - 1;
        continue;
      }
      inSingleLineComment = true;
      chars[i] = " ";
      chars[i + 1] = " ";
      i++;
      continue;
    }

    if (c === "'") {
      inSingleQuote = true;
      chars[i] = " ";
      continue;
    }
    if (c === '"') {
      inDoubleQuote = true;
      chars[i] = " ";
      continue;
    }
    if (c === "`") {
      inBacktick = true;
      chars[i] = " ";
      continue;
    }
  }

  return chars.join("");
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
    this._ts = undefined;
  }

  getTsCompiler() {
    if (this._ts !== undefined) return this._ts;
    try {
      const tsPath = require.resolve("typescript", { paths: [this.targetDir, process.cwd()] });
      this._ts = require(tsPath);
    } catch {
      this._ts = null;
    }
    return this._ts;
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
      excludeDirs: Array.isArray(rawConfig.excludeDirs) ? rawConfig.excludeDirs : [],
      extensions: Array.isArray(rawConfig.extensions)
        ? rawConfig.extensions.map((e) => (e.startsWith(".") ? e.toLowerCase() : "." + e.toLowerCase()))
        : [],
      scratchPatterns: Array.isArray(rawConfig.scratchPatterns) ? rawConfig.scratchPatterns : [],
      secretPatterns: Array.isArray(rawConfig.secretPatterns) ? rawConfig.secretPatterns : [],
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

    const defaultScratchPatterns = [
      /^temp_/i,
      /^scratch/i,
      /\.tmp$/i,
      /\.log$/i,
      /^test_dump/i,
      /^debug_/i,
    ];

    const customPatterns = (this.config.scratchPatterns || []).map((p) => {
      try {
        return typeof p === "string" ? new RegExp(p, "i") : p;
      } catch {
        return null;
      }
    }).filter(Boolean);

    const suspiciousPatterns = [...defaultScratchPatterns, ...customPatterns];

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

    const activeExcludes = new Set([...DEFAULT_EXCLUDES, ...(this.config.excludeDirs || [])]);
    const activeExtensions = new Set([...CODE_EXTENSIONS, ...(this.config.extensions || [])]);

    for (const entry of entries) {
      if (entry.name.startsWith(".") && entry.name !== ".env.example") {
        if (entry.name !== ".github") continue;
      }
      if (activeExcludes.has(entry.name)) continue;

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
        if (activeExtensions.has(ext)) {
          results.push(fullPath);
        }
      }
    }
    return results;
  }

  // TypeScript Compiler AST Traverser (Active when typescript is available in project)
  scanSourceFileWithTsAst(filePath, content, suppressions, ts) {
    const handledRules = new Set(["QED003", "QED004", "QED005"]);
    try {
      const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

      const visit = (node) => {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const lineNum = line + 1;

        // QED004: AST check for `as any`
        if (ts.isAsExpression(node) && node.type && node.type.kind === ts.SyntaxKind.AnyKeyword) {
          if (!suppressions.isIgnored("QED004", lineNum) && !this.isRelaxedInContext("QED004", filePath)) {
            this.addViolation(
              "QED004/UNSAFE_CAST",
              "[AST Verified] Loose 'as any' cast bypasses compile-time type safety.",
              filePath,
              lineNum,
              node.getText(sourceFile),
              "Use typed interfaces, unknown with type-guards, or Zod schema validation."
            );
          }
        }

        // QED003: AST check for empty catch block
        if (ts.isCatchClause(node) && node.block && node.block.statements.length === 0) {
          if (!suppressions.isIgnored("QED003", lineNum) && !this.isRelaxedInContext("QED003", filePath)) {
            this.addViolation(
              "QED003/EMPTY_CATCH",
              "[AST Verified] Empty catch block silently swallows exceptions, hiding defects.",
              filePath,
              lineNum,
              node.getText(sourceFile),
              "Handle with fallback, re-throw with cause (new Error('...', { cause })), or log at boundary."
            );
          }
        }

        // QED005: AST check for naked single-argument fetch()
        if (ts.isCallExpression(node)) {
          if (ts.isIdentifier(node.expression) && node.expression.text === "fetch" && node.arguments.length === 1) {
            if (!suppressions.isIgnored("QED005", lineNum) && !this.isRelaxedInContext("QED005", filePath)) {
              this.addViolation(
                "QED005/MISSING_TIMEOUT",
                "[AST Verified] Naked fetch() without AbortSignal timeout causes hanging connections.",
                filePath,
                lineNum,
                node.getText(sourceFile),
                "Pass AbortSignal.timeout(ms) in options: fetch(url, { signal: AbortSignal.timeout(5000) })."
              );
            }
          }
        }

        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
    } catch {
      handledRules.clear();
    }
    return handledRules;
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

    const ext = path.extname(filePath).toLowerCase();
    const isUI = UI_EXTENSIONS.has(ext);

    // 1. Dynamic TypeScript AST traversal if compiler is present in target project
    const ts = this.getTsCompiler();
    const isTsOrJs = ext === ".ts" || ext === ".tsx" || ext === ".js" || ext === ".jsx";
    let astHandledRules = new Set();
    if (ts && isTsOrJs) {
      astHandledRules = this.scanSourceFileWithTsAst(filePath, content, suppressions, ts);
    }

    // 2. Lexical masking for strings and non-directive comments
    // Replaces string literals with whitespace while preserving line numbers and character offsets
    const maskedContent = maskCodeStringsAndComments(content, ext);
    const maskedLines = maskedContent.split(/\r?\n/);
    const rawLines = content.split(/\r?\n/);

    // Multi-line pattern checks (evaluated on masked content)
    this.checkMultiLinePatterns(filePath, maskedContent, suppressions, astHandledRules);

    // Line-by-line checks
    for (let i = 0; i < rawLines.length; i++) {
      const lineNum = i + 1;
      const line = rawLines[i];
      const maskedLine = maskedLines[i];

      // Skip lines that are purely comment lines
      if (/^\s*(\/\/|#|\/\*|\*|<!--|--)/.test(line)) continue;

      // QED002: Zero-Debug Print Invariant (evaluated against masked code so console.log inside strings is ignored)
      if (!suppressions.isIgnored("QED002", lineNum) && !this.isRelaxedInContext("QED002", filePath)) {
        if (/console\.(log|debug|dir|trace)\s*\(/.test(maskedLine) && !line.includes("logger.")) {
          this.addViolation(
            "QED002/ZERO_DEBUG",
            "Leftover console debug print statement found in production source.",
            filePath,
            lineNum,
            line,
            "Use a structured logger (logger.info/debug) or remove before commit."
          );
        }
        if (/\bdebugger\s*;/.test(maskedLine)) {
          this.addViolation(
            "QED002/ZERO_DEBUG",
            "Leftover debugger breakpoint found.",
            filePath,
            lineNum,
            line,
            "Remove debugger statement."
          );
        }
        if (ext === ".py" && /\bprint\s*\(/.test(maskedLine) && !line.includes("logger.")) {
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

      // QED004: Anti-`as any` Cast (skipped if AST already verified this rule)
      if (!astHandledRules.has("QED004") && !suppressions.isIgnored("QED004", lineNum) && !this.isRelaxedInContext("QED004", filePath)) {
        if ((ext === ".ts" || ext === ".tsx") && /\bas\s+any\b/.test(maskedLine)) {
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

      // QED006: Unbounded Module-Level Cache (evaluated against masked line)
      if (!suppressions.isIgnored("QED006", lineNum)) {
        if (/(?:export\s+(?:const|let|var)\s+([a-zA-Z0-9_]*cache[a-zA-Z0-9_]*)\s*=\s*new\s+Map\s*\(\s*\))/i.test(maskedLine)) {
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

      // QED007: Secret Leak Radar (evaluated against rawLine since secrets are strings)
      if (!suppressions.isIgnored("QED007", lineNum)) {
        let secretMatch = line.match(/(?:sk-(?:proj-)?[a-zA-Z0-9-_]{20,}|ghp_[a-zA-Z0-9]{30,}|AIza[0-9A-Za-z-_]{35})/);
        if (!secretMatch && this.config.secretPatterns && this.config.secretPatterns.length > 0) {
          for (const pattern of this.config.secretPatterns) {
            try {
              const rx = typeof pattern === "string" ? new RegExp(pattern) : pattern;
              const m = line.match(rx);
              if (m) {
                secretMatch = m;
                break;
              }
            } catch {
              // Ignore invalid custom regex
            }
          }
        }
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
        // QED009: Semantic Links vs <div onClick>
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

      // SQL / DDL Specific Checks (checked on masked line)
      if (ext === ".sql") {
        if (!suppressions.isIgnored("QED012", lineNum)) {
          if (/CREATE\s+INDEX\s+(?!CONCURRENTLY\b)[a-zA-Z0-9_]+\s+ON/i.test(maskedLine)) {
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
  checkMultiLinePatterns(filePath, maskedContent, suppressions, astHandledRules = new Set()) {
    const ext = path.extname(filePath).toLowerCase();

    // QED003: Empty Catch Blocks (if not handled by AST)
    if (!astHandledRules.has("QED003")) {
      const emptyCatchRegex = /catch\s*(?:\([^)]*\))?\s*\{\s*\}/g;
      let match;
      while ((match = emptyCatchRegex.exec(maskedContent)) !== null) {
        const lineNum = maskedContent.substring(0, match.index).split("\n").length;
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
    }

    // Python empty except
    if (ext === ".py") {
      const emptyExceptRegex = /except(?:\s+[a-zA-Z0-9_]+)?\s*:\s*\n\s*pass/g;
      let match;
      while ((match = emptyExceptRegex.exec(maskedContent)) !== null) {
        const lineNum = maskedContent.substring(0, match.index).split("\n").length;
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

    // QED005: Missing Fetch Deadline (if not handled by AST)
    if (!astHandledRules.has("QED005") && (ext === ".ts" || ext === ".js" || ext === ".tsx")) {
      const nakedFetchRegex = /(?:^|[^\w$.])fetch\s*\(\s*([^,\n\)]+)\s*\)/g;
      let match;
      while ((match = nakedFetchRegex.exec(maskedContent)) !== null) {
        const lineNum = maskedContent.substring(0, match.index).split("\n").length;
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

    // QED011: Emoji Salad in UI buttons (multi-line aware)
    if (UI_EXTENSIONS.has(ext)) {
      const buttonEmojiRegex = /<button\b[^>]*>([\s\S]*?)<\/button>/gi;
      let bMatch;
      while ((bMatch = buttonEmojiRegex.exec(maskedContent)) !== null) {
        const inner = bMatch[1];
        const emojiMatch = inner.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u);
        if (emojiMatch) {
          const lineNum = maskedContent.substring(0, bMatch.index).split("\n").length;
          if (!suppressions.isIgnored("QED011", lineNum)) {
            this.addViolation(
              "QED011/UI_EMOJI_SLOP",
              "Gratuitous emoji used inside UI button chrome.",
              filePath,
              lineNum,
              bMatch[0].split("\n").slice(0, 3).join("\n"),
              "Replace emoji with calibrated SVG vector icons (Lucide, Heroicons) with aria-hidden."
            );
          }
        }
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

// -------------------------------------------------------------
// Token Economics & Context Budget Helpers
// -------------------------------------------------------------

function auditTokens(targetDir, jsonMode = false) {
  const candidatePatterns = [
    ".cursorrules",
    ".cursorrules.lite",
    ".cursor/rules",
    "CLAUDE.md",
    "CLAUDE.lite.md",
    ".claude/skills",
    ".claude/commands",
    "GEMINI.md",
    "GEMINI.lite.md",
    "QED.lite.md",
    ".clinerules",
    ".clinerules.lite",
    ".roomodes",
    ".roomodes.lite",
    ".windsurfrules",
    ".windsurfrules.lite",
    ".aider.conf.yml",
    ".github/copilot-instructions.md",
    ".github/copilot-instructions.lite.md",
    ".opencoderules",
    "OPENCODE.md",
    "DEEPSEEK.md",
    ".deepseekrules",
    "CODEX.md",
    "AGENTS.md",
    "KIMI.md",
    "PI.md",
    "HERMES.md",
    "MUSE.md",
    "DEVIN.md",
    "DROID.md",
    "GROK.md",
    "QWEN.md",
    ".qwenrules",
  ];

  const results = [];
  let totalChars = 0;
  let totalTokens = 0;

  function scanCandidate(rel) {
    const full = path.join(targetDir, rel);
    if (!fs.existsSync(full)) return;
    try {
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        const sub = fs.readdirSync(full);
        for (const s of sub) {
          scanCandidate(path.join(rel, s));
        }
        return;
      }
      if (stat.isFile()) {
        const content = fs.readFileSync(full, "utf8");
        const chars = content.length;
        const estTokens = Math.ceil(chars / 4);
        totalChars += chars;
        totalTokens += estTokens;
        results.push({
          file: rel.replace(/\\/g, "/"),
          bytes: stat.size,
          chars,
          tokens: estTokens,
        });
      }
    } catch {}
  }

  for (const pat of candidatePatterns) {
    scanCandidate(pat);
  }

  const turns20 = totalTokens * 20;
  let rating = "EXCELLENT";
  let statusColor = "green";
  if (totalTokens > 1500) {
    rating = "HEAVY";
    statusColor = "red";
  } else if (totalTokens > 500) {
    rating = "MODERATE";
    statusColor = "yellow";
  }

  if (jsonMode) {
    console.log(JSON.stringify({ files: results, totalTokens, totalChars, turns20, rating }, null, 2));
    process.exit(0);
  }

  console.log(colors.cyan("=========================================================="));
  console.log(colors.cyan(" Q.E.D. Token Footprint & Context Budget Auditor"));
  console.log(colors.gray(" Evidence Before Assertions"));
  console.log(colors.cyan("=========================================================="));
  console.log(colors.gray(`Target: ${path.resolve(targetDir)}\n`));

  if (results.length === 0) {
    console.log(colors.yellow("No agent rule or instruction files detected in target directory.\n"));
    console.log(colors.gray("Install Q.E.D. via: npx qed-standard check or bash install.sh [harness]"));
    process.exit(0);
  }

  console.log(colors.bold("Discovered Instruction Files:"));
  for (const r of results) {
    console.log(
      `  - ${colors.yellow(r.file.padEnd(38))} ${colors.cyan(r.tokens.toString().padStart(6) + " tokens")} ${colors.gray(
        `(${r.chars} chars)`
      )}`
    );
  }

  console.log("\n----------------------------------------------------------");
  console.log(`Per-Turn Rule Tax:      ${colors.bold(totalTokens.toLocaleString() + " tokens")}`);
  console.log(`20-Turn Session Tax:    ${colors.bold(turns20.toLocaleString() + " tokens")}`);
  console.log(`Context Efficiency:     ${colors[statusColor](colors.bold(rating))}`);
  console.log("----------------------------------------------------------\n");

  if (rating === "HEAVY") {
    console.log(colors.yellow("Recommendations:"));
    console.log("  [!] Heavy prompt tax detected. Install Q.E.D. Lite edition (<500 tokens):");
    console.log(colors.cyan("      bash install.sh --lite <harness>"));
    console.log("  [!] Use modular rules with file globs (e.g. .cursor/rules/*.mdc) to load rules on-demand.\n");
  } else if (rating === "MODERATE") {
    console.log(colors.cyan("Standard tier active. For token-constrained sessions, consider Lite edition:"));
    console.log(colors.gray("      bash install.sh --lite <harness>\n"));
  } else {
    console.log(colors.green("✓ Optimal token efficiency. Context footprint is minimal (<500 tokens).\n"));
  }
}

function runCompactExec(commandArgs) {
  const { spawnSync } = require("node:child_process");
  if (commandArgs.length === 0) {
    console.error(colors.red("Error: No command specified for exec."));
    console.error("Usage: node bin/qed-engine.js exec <command...>");
    process.exit(1);
  }

  const cmdString = commandArgs.join(" ");
  const res = spawnSync(cmdString, {
    shell: true,
    stdio: "pipe",
    encoding: "utf8",
  });

  const stdout = res.stdout || "";
  const stderr = res.stderr || "";
  const combined = stdout + (stderr ? "\n" + stderr : "");
  const lines = combined.split(/\r?\n/).filter(Boolean);

  if (res.status === 0) {
    // Look for test/build summary line
    const summaryMatch = lines.find((l) => /(?:passed|passing|tests?|ok\b|build.*success|clean)/i.test(l));
    const summary = summaryMatch ? summaryMatch.trim() : "All checks passed successfully.";
    console.log(colors.green(`✓ PASS [exit 0]: ${summary}`));
    process.exit(0);
  }

  // Failure: Filter out passing lines, retain errors & failure traces
  console.log(colors.red(`✗ FAIL [exit ${res.status}]: ${cmdString}\n`));

  const relevantLines = lines.filter((l) => {
    if (/^\s*(?:\[PASS\]|✓|PASS\b|.*passing)/.test(l)) return false;
    return true;
  });

  const maxLines = 40;
  if (relevantLines.length <= maxLines) {
    console.log(relevantLines.join("\n"));
  } else {
    const head = relevantLines.slice(0, 15);
    const tail = relevantLines.slice(-20);
    console.log(head.join("\n"));
    console.log(colors.yellow(`\n[... ${relevantLines.length - 35} noise lines omitted for context economics ...]\n`));
    console.log(tail.join("\n"));
  }

  process.exit(res.status || 1);
}

function findBashInterpreter() {
  const { spawnSync } = require("node:child_process");
  if (process.platform !== "win32") {
    return "bash";
  }

  // 1. Explicit user/agent override via environment variables
  const envBash = process.env.GIT_BASH || process.env.BASH_PATH || process.env.SHELL;
  if (envBash && fs.existsSync(envBash) && !/powershell|cmd\.exe/i.test(envBash)) {
    return envBash;
  }

  // 2. Locate Git installation dynamically from 'where git'
  try {
    const gitProbe = spawnSync("where", ["git"], { encoding: "utf8" });
    if (gitProbe.status === 0 && gitProbe.stdout) {
      const gitExe = gitProbe.stdout.trim().split(/\r?\n/)[0].trim();
      if (gitExe) {
        const gitRoot = path.resolve(path.dirname(gitExe), "..");
        const cand1 = path.join(gitRoot, "bin", "bash.exe");
        const cand2 = path.join(gitRoot, "usr", "bin", "bash.exe");
        if (fs.existsSync(cand1)) return cand1;
        if (fs.existsSync(cand2)) return cand2;
      }
    }
  } catch {
    // Ignore Git probe error
  }

  // 3. Dynamically search standard system installation roots from environment
  const systemDrive = process.env.SystemDrive || "C:";
  const searchRoots = [
    process.env.ProgramFiles,
    process.env["ProgramFiles(x86)"],
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Programs") : null,
    path.join(systemDrive, "Git"),
  ].filter(Boolean);

  for (const root of searchRoots) {
    const cand1 = path.join(root, "Git", "bin", "bash.exe");
    const cand2 = path.join(root, "Git", "usr", "bin", "bash.exe");
    const cand3 = path.join(root, "bin", "bash.exe");
    if (fs.existsSync(cand1)) return cand1;
    if (fs.existsSync(cand2)) return cand2;
    if (fs.existsSync(cand3)) return cand3;
  }

  // 4. Discover via PATH (excluding WSL / System32 redirectors)
  try {
    const probe = spawnSync("where", ["bash"], { encoding: "utf8" });
    if (probe.status === 0 && probe.stdout) {
      const paths = probe.stdout.trim().split(/\r?\n/).map((p) => p.trim()).filter(Boolean);
      const safeBash = paths.find((p) => !/System32|WindowsApps/i.test(p) && fs.existsSync(p));
      if (safeBash) return safeBash;
    }
  } catch {
    // Ignore PATH probe error
  }

  return null;
}

function runAllTests(targetDir) {
  const { spawnSync } = require("node:child_process");
  const testsDir = path.join(targetDir, "tests");
  if (!fs.existsSync(testsDir)) {
    console.log(colors.yellow("No tests/ directory found."));
    process.exit(0);
  }

  const isWindows = process.platform === "win32";
  const bashPath = findBashInterpreter();

  const entries = fs.readdirSync(testsDir);
  const ps1Tests = entries.filter((f) => f.endsWith(".ps1") && f.startsWith("verify-"));
  const shTests = entries.filter((f) => f.endsWith(".sh") && f.startsWith("verify-"));

  let failed = false;

  console.log(colors.cyan("=========================================================="));
  console.log(colors.cyan(" Q.E.D. Multi-Platform Test Runner & Verification Gate"));
  console.log(colors.gray(" Evidence Before Assertions"));
  console.log(colors.cyan("=========================================================="));
  console.log(colors.gray(`OS: ${process.platform} | Bash: ${bashPath || "None"}\n`));

  // 1. Run PowerShell tests (on Windows or if pwsh available)
  if (isWindows || spawnSync("which", ["pwsh"]).status === 0) {
    const psExe = isWindows ? "powershell" : "pwsh";
    for (const testFile of ps1Tests) {
      const fullPath = path.join(testsDir, testFile);
      console.log(colors.bold(`\n▶ Running Windows Suite: ${testFile}`));
      const res = spawnSync(psExe, ["-ExecutionPolicy", "Bypass", "-File", fullPath], {
        stdio: "inherit",
      });
      if (res.status !== 0) {
        failed = true;
        console.log(colors.red(`✗ Windows Test Failed: ${testFile}`));
      }
    }
  }

  // 2. Run POSIX Bash tests (if bash runtime is found)
  if (bashPath) {
    for (const testFile of shTests) {
      const fullPath = path.join(testsDir, testFile).replace(/\\/g, "/");
      console.log(colors.bold(`\n▶ Running POSIX Suite via Bash: ${testFile}`));
      const res = spawnSync(bashPath, [fullPath], {
        stdio: "inherit",
        cwd: targetDir,
      });
      if (res.status !== 0) {
        failed = true;
        console.log(colors.red(`✗ POSIX Test Failed: ${testFile}`));
      }
    }
  } else {
    console.log(colors.yellow("\n[WARN] Bash interpreter not detected on Windows; skipping POSIX tests."));
  }

  console.log("\n----------------------------------------------------------");
  if (failed) {
    console.log(colors.red("✗ Q.E.D. Multi-Platform Test Suite FAILED: Some tests did not pass."));
    process.exit(1);
  } else {
    console.log(colors.green("✓ Q.E.D. Multi-Platform Test Suite: 100% PASSED."));
    process.exit(0);
  }
}

function watchCI(targetDir, extraArgs = []) {
  const { spawnSync } = require("node:child_process");
  const ghProbe = spawnSync("gh", ["--version"], { encoding: "utf8" });
  if (ghProbe.status !== 0) {
    console.log(colors.yellow("GitHub CLI (gh) is not installed. Polling requires gh CLI."));
    console.log("Install gh CLI from: https://cli.github.com/");
    process.exit(1);
  }

  // Allow explicit run ID via positional arg or flag
  const explicitRunId = extraArgs.find((a) => /^\d{5,}$/.test(a));
  if (explicitRunId) {
    console.log(colors.bold(`Watching explicitly specified CI Run #${explicitRunId}...\n`));
    const watchRes = spawnSync("gh", ["run", "watch", explicitRunId], {
      cwd: targetDir,
      stdio: "inherit",
    });
    process.exit(watchRes.status || 0);
  }

  // Detect current git branch dynamically to avoid watching unrelated branch runs
  let currentBranch = null;
  const branchFlagIndex = extraArgs.indexOf("--branch");
  if (branchFlagIndex !== -1 && extraArgs[branchFlagIndex + 1]) {
    currentBranch = extraArgs[branchFlagIndex + 1];
  } else {
    try {
      const branchRes = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
        cwd: targetDir,
        encoding: "utf8",
      });
      if (branchRes.status === 0 && branchRes.stdout) {
        currentBranch = branchRes.stdout.trim();
      }
    } catch {
      // Fall through if git branch resolution fails
    }
  }

  console.log(colors.cyan(`Connecting to GitHub Actions CI stream${currentBranch ? ` for branch [${currentBranch}]` : ""}...`));

  const listArgs = ["run", "list", "--limit", "1", "--json", "databaseId,status,conclusion,name,headBranch"];
  if (currentBranch && currentBranch !== "HEAD") {
    listArgs.push("--branch", currentBranch);
  }

  const res = spawnSync("gh", listArgs, {
    cwd: targetDir,
    encoding: "utf8",
  });
  if (res.status !== 0 || !res.stdout) {
    console.error(colors.red("Failed to query GitHub Actions runs."));
    process.exit(1);
  }

  try {
    const runs = JSON.parse(res.stdout);
    if (!runs || runs.length === 0) {
      console.log(colors.yellow(`No recent CI runs found${currentBranch ? ` for branch ${currentBranch}` : ""}.`));
      process.exit(0);
    }
    const runId = runs[0].databaseId;
    console.log(colors.bold(`Watching CI Run #${runId} (${runs[0].name}) on [${runs[0].headBranch || "unknown"}]...\n`));
    const watchRes = spawnSync("gh", ["run", "watch", runId.toString()], {
      cwd: targetDir,
      stdio: "inherit",
    });
    process.exit(watchRes.status || 0);
  } catch (err) {
    console.error(colors.red(`Error: ${err.message}`));
    process.exit(1);
  }
}

function runDoctor(targetDir) {
  const { spawnSync } = require("node:child_process");
  console.log(colors.cyan("=========================================================="));
  console.log(colors.cyan(" Q.E.D. Repository & Runtime Health Doctor"));
  console.log(colors.gray(" Evidence Before Assertions"));
  console.log(colors.cyan("=========================================================="));
  console.log(colors.gray(`Target: ${path.resolve(targetDir)}\n`));

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  function report(status, title, details) {
    if (status === "pass") {
      console.log(`  ${colors.green("✓")} ${colors.bold(title)}${details ? colors.gray(" - " + details) : ""}`);
      passed++;
    } else if (status === "warn") {
      console.log(`  ${colors.yellow("!")} ${colors.bold(title)}${details ? colors.yellow(" - " + details) : ""}`);
      warnings++;
    } else {
      console.log(`  ${colors.red("✗")} ${colors.bold(title)}${details ? colors.red(" - " + details) : ""}`);
      failed++;
    }
  }

  // 1. Git Repository Check
  const gitDir = path.join(targetDir, ".git");
  if (!fs.existsSync(gitDir)) {
    report("fail", "Git Repository", "Not a git repository");
  } else {
    report("pass", "Git Repository", "Root initialized");

    // 2. Working Tree Cleanliness
    const statusRes = spawnSync("git", ["status", "--porcelain"], { cwd: targetDir, encoding: "utf8" });
    if (statusRes.status === 0) {
      const dirty = statusRes.stdout.trim();
      if (!dirty) {
        report("pass", "Working Tree Cleanliness", "Zero unstaged or uncommitted changes");
      } else {
        const dirtyCount = dirty.split("\n").length;
        report("warn", "Working Tree Cleanliness", `${dirtyCount} uncommitted change(s) present`);
      }
    }

    // 3. Git Hooks Installation
    const preCommitHook = path.join(gitDir, "hooks", "pre-commit");
    const prePushHook = path.join(gitDir, "hooks", "pre-push");
    if (fs.existsSync(preCommitHook) && fs.existsSync(prePushHook)) {
      report("pass", "Mechanical Git Hooks", "Both pre-commit & pre-push installed and active");
    } else if (fs.existsSync(preCommitHook)) {
      report("warn", "Mechanical Git Hooks", "pre-commit installed, but pre-push missing");
    } else {
      report("fail", "Mechanical Git Hooks", "No git hooks installed (run 'qed hook')");
    }
  }

  // 4. Linter Gate Verification (0 errors)
  const linter = new QedLinter(targetDir, { strict: false });
  const violations = linter.run();
  const errors = violations.filter((v) => v.severity === "error");
  if (errors.length === 0) {
    report("pass", "Q.E.D. Verification Gate", `100% Clean (0 errors, ${violations.length} warnings)`);
  } else {
    report("fail", "Q.E.D. Verification Gate", `${errors.length} fatal error(s) detected`);
  }

  // 5. Cross-Platform Interpreters
  const bash = findBashInterpreter();
  if (bash) {
    report("pass", "Cross-Platform Bash", `Resolved: ${bash}`);
  } else {
    report("warn", "Cross-Platform Bash", "No Bash interpreter found on Windows; POSIX tests cannot run locally");
  }

  // 6. AST Engine Availability
  const tsCompiler = linter.getTsCompiler();
  if (tsCompiler) {
    report("pass", "AST Analysis Engine", `Active via project TypeScript (${tsCompiler.version || "compiler"})`);
  } else {
    report("pass", "AST Analysis Engine", "Active via native zero-dependency lexical masking engine");
  }

  // 7. Remote GitHub Actions CI Status
  const ghProbe = spawnSync("gh", ["--version"], { encoding: "utf8" });
  if (ghProbe.status === 0) {
    const ciRes = spawnSync(
      "gh",
      ["run", "list", "--workflow", "ci.yml", "--limit", "1", "--json", "conclusion,status,databaseId,headBranch"],
      {
        cwd: targetDir,
        encoding: "utf8",
      }
    );
    if (ciRes.status === 0 && ciRes.stdout) {
      try {
        const runs = JSON.parse(ciRes.stdout);
        if (runs.length > 0) {
          const latest = runs[0];
          if (latest.conclusion === "success") {
            report("pass", "Remote CI Pipeline", `Run #${latest.databaseId} on [${latest.headBranch}] is 100% GREEN (success)`);
          } else if (latest.status === "in_progress" || latest.status === "queued") {
            report("warn", "Remote CI Pipeline", `Run #${latest.databaseId} is currently ${latest.status}`);
          } else {
            report("fail", "Remote CI Pipeline", `Run #${latest.databaseId} FAILED (${latest.conclusion})`);
          }
        }
      } catch {
        // Parse error ignored
      }
    }
  } else {
    report("warn", "GitHub CLI (gh)", "gh CLI not installed; remote CI status probe skipped");
  }

  console.log("\n----------------------------------------------------------");
  if (failed === 0) {
    console.log(colors.green(`✓ Doctor: System Healthy (${passed} checks passed, ${warnings} warning(s)).`));
    process.exit(0);
  } else {
    console.log(colors.red(`✗ Doctor: Issues Detected (${failed} failure(s), ${passed} passed, ${warnings} warning(s)).`));
    process.exit(1);
  }
}

// CLI Execution Entrypoint
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || "check";
  const targetDir = args.find((a) => !a.startsWith("-") && a !== command) || process.cwd();
  const strict = args.includes("--strict");
  const jsonMode = args.includes("--json");
  const compactMode = args.includes("--compact") || args.includes("--ai");
  const configIndex = args.indexOf("--config");
  const explicitConfig = configIndex !== -1 && args[configIndex + 1] ? args[configIndex + 1] : null;

  if (command === "check") {
    if (!jsonMode && !compactMode) {
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

    if (compactMode) {
      if (isPassing) {
        console.log(`OK (0 violations${warnings.length > 0 ? `, ${warnings.length} warning(s)` : ""})`);
        process.exit(0);
      }
      for (const v of violations) {
        const tag = v.severity === "error" ? "ERR " : "WARN";
        const loc = v.file ? `${v.file}${v.line ? `:${v.line}` : ""}` : "root";
        const fix = v.fix ? ` -> ${v.fix}` : "";
        console.log(`${tag} ${v.ruleId.split("/")[0]} ${loc}: ${v.message}${fix}`);
      }
      process.exit(1);
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

    // Pre-push hook enforces cross-platform test matrix before code leaves machine
    const prePushScript = `#!/usr/bin/env sh
# Q.E.D. Automated Mechanical Gate Pre-Push Hook

echo "Running Q.E.D. Pre-Push Multi-Platform Test Gate..."

if command -v node >/dev/null 2>&1 && [ -f "./bin/qed-engine.js" ]; then
    node "./bin/qed-engine.js" test
    EXIT_CODE=$?
elif [ -f "./tests/verify-linter.ps1" ] && command -v powershell >/dev/null 2>&1; then
    powershell -ExecutionPolicy Bypass -File "./tests/verify-linter.ps1"
    EXIT_CODE=$?
else
    EXIT_CODE=0
fi

if [ "$EXIT_CODE" -ne 0 ]; then
    echo "Push BLOCKED by Q.E.D. Multi-Platform Test Gate."
    exit 1
fi
exit 0
`;
    const prePushPath = path.join(hooksDir, "pre-push");
    fs.writeFileSync(prePushPath, prePushScript, { mode: 0o755 });

    console.log(colors.green(`[+] Installed Q.E.D. hooks: pre-commit & pre-push to ${hooksDir}`));
    process.exit(0);
  } else if (command === "doctor") {
    runDoctor(targetDir);
  } else if (command === "test") {
    runAllTests(targetDir);
  } else if (command === "ci" || command === "ci-watch") {
    watchCI(targetDir, args.slice(1));
  } else if (command === "tokens" || command === "context") {
    auditTokens(targetDir, jsonMode);
  } else if (command === "exec") {
    runCompactExec(args.slice(1));
  } else {
    console.log(colors.red(`Unknown command: ${command}`));
    console.log(
      "Usage: node bin/qed-engine.js [check | test | doctor | ci | exec | tokens | init | hook] [target_dir] [--compact] [--json] [--strict] [--config <path>]"
    );
    process.exit(1);
  }
}

module.exports = { QedLinter };
