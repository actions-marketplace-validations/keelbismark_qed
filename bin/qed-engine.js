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

function getInstalledAdapters(targetDir) {
  const adapters = [];
  const checks = [
    { name: "GEMINI.md", relPath: "GEMINI.md", src: "adapters/antigravity/GEMINI.md", liteSrc: "adapters/antigravity/GEMINI.lite.md" },
    { name: ".cursorrules", relPath: ".cursorrules", src: "adapters/cursor/.cursorrules", liteSrc: "adapters/cursor/.cursorrules.lite" },
    { name: "CLAUDE.md", relPath: "CLAUDE.md", src: "adapters/claude-code/CLAUDE.md", liteSrc: "adapters/claude-code/CLAUDE.lite.md" },
    { name: ".clinerules", relPath: ".clinerules", src: "adapters/cline/.clinerules", liteSrc: "adapters/cline/.clinerules.lite" },
    { name: ".windsurfrules", relPath: ".windsurfrules", src: "adapters/windsurf/.windsurfrules", liteSrc: "adapters/windsurf/.windsurfrules.lite" },
    { name: ".aider.conventions.md", relPath: ".aider.conventions.md", src: "adapters/aider/.aider.conventions.md", liteSrc: "adapters/aider/.aider.conventions.lite.md" },
    { name: "copilot-instructions.md", relPath: ".github/copilot-instructions.md", src: "adapters/copilot/.github/copilot-instructions.md", liteSrc: "adapters/copilot/.github/copilot-instructions.lite.md" },
    { name: "AGENTS.md", relPath: "AGENTS.md", src: "adapters/codex/AGENTS.md", liteSrc: "adapters/codex/AGENTS.lite.md" },
    { name: "CODEX.md", relPath: "CODEX.md", src: "adapters/codex/CODEX.md", liteSrc: "adapters/codex/CODEX.lite.md" },
  ];

  for (const c of checks) {
    const fullTarget = path.join(targetDir, c.relPath);
    if (fs.existsSync(fullTarget)) {
      adapters.push({ ...c, fullTarget });
    }
  }
  return adapters;
}

function installGitHooks(hooksDir) {
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
}

function isNewerVersion(remote, current) {
  const rParts = remote.split(".").map((n) => parseInt(n, 10) || 0);
  const cParts = current.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((rParts[i] || 0) > (cParts[i] || 0)) return true;
    if ((rParts[i] || 0) < (cParts[i] || 0)) return false;
  }
  return false;
}

function checkNpmUpdate(currentVer) {
  const { spawnSync } = require("node:child_process");
  try {
    const res = spawnSync("npm", ["view", "qed-standard", "version"], {
      shell: true,
      encoding: "utf8",
      timeout: 2500,
    });
    if (res.status === 0 && res.stdout) {
      const latestVer = res.stdout.trim();
      if (latestVer && !latestVer.includes("\n") && !latestVer.includes(" ") && isNewerVersion(latestVer, currentVer)) {
        console.log(colors.cyan(`\nℹ Newer package available on npm: v${latestVer} (installed: v${currentVer})`));
        console.log(colors.gray(`  Run 'npm install -g qed-standard' to update your global CLI.`));
      }
    }
  } catch {}
}

function runUpdate(targetDir, options = {}) {
  const os = require("node:os");
  const isGlobal = options.global === true;
  const qedRoot = path.resolve(__dirname, "..");
  const adaptersDir = path.join(qedRoot, "adapters");
  const pkgJsonPath = path.join(qedRoot, "package.json");
  let currentVer = "1.0.4";
  try {
    currentVer = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8")).version || currentVer;
  } catch {}

  console.log(colors.cyan("=========================================================="));
  console.log(colors.cyan(" Q.E.D. Adapter & Rule Synchronizer"));
  console.log(colors.gray(" Evidence Before Assertions"));
  console.log(colors.cyan("=========================================================="));

  if (isGlobal) {
    const homeDir = os.homedir();
    console.log(colors.gray(`Target: Global User Environments (${homeDir})\n`));

    const globalTargets = [
      {
        name: "Google Antigravity",
        dest: path.join(homeDir, ".gemini", "GEMINI.md"),
        src: path.join(adaptersDir, "antigravity", "GEMINI.md"),
        ensureDir: path.join(homeDir, ".gemini"),
      },
      {
        name: "Claude Code",
        dest: path.join(homeDir, ".claude", "CLAUDE.md"),
        src: path.join(adaptersDir, "claude-code", "CLAUDE.md"),
        ensureDir: path.join(homeDir, ".claude"),
      },
      {
        name: "Cursor",
        dest: path.join(homeDir, ".cursorrules"),
        src: path.join(adaptersDir, "cursor", ".cursorrules"),
      },
    ];

    let updatedCount = 0;
    for (const gt of globalTargets) {
      if (gt.ensureDir && !fs.existsSync(gt.ensureDir)) {
        try {
          fs.mkdirSync(gt.ensureDir, { recursive: true });
        } catch {}
      }
      if (fs.existsSync(gt.src)) {
        try {
          fs.copyFileSync(gt.src, gt.dest);
          console.log(`  ${colors.green("[+]")} Synchronized ${colors.bold(gt.name)}: ${colors.gray(gt.dest)}`);
          updatedCount++;
        } catch (err) {
          console.log(`  ${colors.yellow("!")} Failed to update ${gt.name}: ${err.message}`);
        }
      }
    }

    console.log(colors.green(`\n✓ Global synchronization complete: ${updatedCount} environment(s) updated to v${currentVer}.`));
    checkNpmUpdate(currentVer);
    return;
  }

  const resolvedTarget = path.resolve(targetDir);
  console.log(colors.gray(`Target: ${resolvedTarget}\n`));

  const installed = getInstalledAdapters(resolvedTarget);
  if (installed.length === 0) {
    console.log(colors.yellow("! No existing Q.E.D. adapters detected in this directory."));
    console.log(colors.gray("  To initialize Q.E.D. in this project, run 'qed init' or the installation script."));
    console.log(colors.gray("  To update global user configurations, run 'qed update --global'."));
    return;
  }

  let updatedCount = 0;
  for (const item of installed) {
    let sourceRel = item.src;
    try {
      const existingContent = fs.readFileSync(item.fullTarget, "utf8");
      if (existingContent.includes("Q.E.D. Lite") || existingContent.includes("Token-Optimized")) {
        sourceRel = item.liteSrc;
      }
    } catch {}

    const fullSrc = path.join(qedRoot, sourceRel);
    if (fs.existsSync(fullSrc)) {
      try {
        fs.copyFileSync(fullSrc, item.fullTarget);
        console.log(`  ${colors.green("[+]")} Synchronized ${colors.bold(item.name)}: ${colors.gray(item.relPath)}`);
        updatedCount++;
      } catch (err) {
        console.log(`  ${colors.red("✗")} Failed to copy ${item.name}: ${err.message}`);
      }
    }
  }

  // Refresh Cursor modern MDC rules if present
  const cursorRulesDir = path.join(resolvedTarget, ".cursor", "rules");
  const srcCursorRulesDir = path.join(adaptersDir, "cursor", ".cursor", "rules");
  if (fs.existsSync(cursorRulesDir) && fs.existsSync(srcCursorRulesDir)) {
    try {
      const mdcFiles = fs.readdirSync(srcCursorRulesDir).filter((f) => f.endsWith(".mdc"));
      for (const mdc of mdcFiles) {
        fs.copyFileSync(path.join(srcCursorRulesDir, mdc), path.join(cursorRulesDir, mdc));
      }
      console.log(`  ${colors.green("[+]")} Refreshed ${mdcFiles.length} Cursor MDC rule(s) in .cursor/rules/`);
    } catch {}
  }

  // Refresh Claude commands and skills if present
  const claudeCommandsDir = path.join(resolvedTarget, ".claude", "commands");
  const srcClaudeCommandsDir = path.join(adaptersDir, "claude-code", ".claude", "commands");
  if (fs.existsSync(claudeCommandsDir) && fs.existsSync(srcClaudeCommandsDir)) {
    try {
      const cmdFiles = fs.readdirSync(srcClaudeCommandsDir).filter((f) => f.endsWith(".md"));
      for (const cmd of cmdFiles) {
        fs.copyFileSync(path.join(srcClaudeCommandsDir, cmd), path.join(claudeCommandsDir, cmd));
      }
      console.log(`  ${colors.green("[+]")} Refreshed ${cmdFiles.length} Claude slash command(s) in .claude/commands/`);
    } catch {}
  }

  // Refresh mechanical git hooks if git is present
  const gitDir = path.join(resolvedTarget, ".git");
  if (fs.existsSync(gitDir)) {
    const hooksDir = path.join(gitDir, "hooks");
    installGitHooks(hooksDir);
    console.log(`  ${colors.green("[+]")} Refreshed mechanical git hooks (.git/hooks/pre-commit & pre-push)`);
  }

  console.log(colors.green(`\n✓ Synchronized ${updatedCount} adapter(s) to Q.E.D. v${currentVer}.`));
  checkNpmUpdate(currentVer);
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

  // 8. Reverse Engineering Engine (REA Invariant)
  const reaProbe = spawnSync("rea", ["--version"], { shell: true, encoding: "utf8" });
  if (reaProbe.status === 0 && reaProbe.stdout && reaProbe.stdout.trim()) {
    report("pass", "Reverse Engineering Engine (REA)", `Active (rea-agents v${reaProbe.stdout.trim()})`);
  } else {
    report("warn", "Reverse Engineering Engine (REA)", "rea CLI not found ('npm i -g rea-agents' for empirical contract extraction)");
  }

  // 9. Computer-Use & UI Grounding (CUA Invariant)
  const hasLocalPlaywright =
    fs.existsSync(path.join(targetDir, "node_modules", "@playwright", "test")) ||
    fs.existsSync(path.join(targetDir, "node_modules", "playwright")) ||
    fs.existsSync(path.join(targetDir, "node_modules", "puppeteer"));

  if (hasLocalPlaywright) {
    report("pass", "Computer-Use & Visual Gate (CUA)", "Browser automation test engine detected in project dependencies");
  } else {
    const chromePaths = [
      process.env.CHROME_PATH,
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium",
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    ].filter(Boolean);
    const hasChrome = chromePaths.some((p) => fs.existsSync(p));
    if (hasChrome) {
      report("pass", "Computer-Use & Visual Gate (CUA)", "Chromium browser engine available for headless UI verification");
    } else {
      report("warn", "Computer-Use & Visual Gate (CUA)", "No browser engine detected; UI tasks require Playwright/Puppeteer/Chrome for visual verification");
    }
  }

  // 10. Q.E.D. Adapters Drift Check
  const adaptersDir = path.resolve(__dirname, "..", "adapters");
  if (fs.existsSync(adaptersDir)) {
    const pkgJsonPath = path.resolve(__dirname, "..", "package.json");
    let currentVer = "1.0.4";
    try {
      currentVer = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8")).version || currentVer;
    } catch {}

    const installed = getInstalledAdapters(targetDir);
    if (installed.length === 0) {
      const isQedRepo = fs.existsSync(path.join(targetDir, "core", "CONSTITUTION.md"));
      if (!isQedRepo) {
        report("warn", "Q.E.D. Adapters Status", "No AI agent adapters installed in target repo (run 'qed update' or installer)");
      }
    } else {
      const drifted = [];
      for (const item of installed) {
        let targetContent = "";
        try {
          targetContent = fs.readFileSync(item.fullTarget, "utf8");
        } catch {}

        const fullSrc = path.join(path.resolve(__dirname, ".."), item.src);
        const fullLiteSrc = path.join(path.resolve(__dirname, ".."), item.liteSrc);
        let srcContent = "";
        let liteSrcContent = "";
        try { srcContent = fs.readFileSync(fullSrc, "utf8"); } catch {}
        try { liteSrcContent = fs.readFileSync(fullLiteSrc, "utf8"); } catch {}

        const isExactMatch =
          (srcContent && targetContent.trim() === srcContent.trim()) ||
          (liteSrcContent && targetContent.trim() === liteSrcContent.trim());

        const lowerContent = targetContent.toLowerCase();
        const hasCoreInvariants =
          lowerContent.includes("leash invariant") ||
          lowerContent.includes("cognitive priming") ||
          (lowerContent.includes("evidence before assertions") && lowerContent.includes("mutation check"));

        if (!isExactMatch && !hasCoreInvariants) {
          drifted.push(item.relPath);
        }
      }

      if (drifted.length === 0) {
        report("pass", "Q.E.D. Adapters Integrity", `All ${installed.length} installed adapter(s) synchronized with v${currentVer}`);
      } else {
        report("warn", "Q.E.D. Adapters Drift", `${drifted.length} adapter file(s) are outdated (${drifted.join(", ")}). Run 'qed update'`);
      }
    }
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

// -------------------------------------------------------------
// Q.E.D. Project Authorization, Profiler & Onboarding Engine
// -------------------------------------------------------------

const ADAPTER_CATALOG = {
  antigravity: {
    name: "Google Antigravity",
    files: [
      { src: "adapters/antigravity/GEMINI.md", liteSrc: "adapters/antigravity/GEMINI.lite.md", dest: "GEMINI.md" },
      { src: "adapters/antigravity/.antigravity-plugin/plugin.json", dest: ".antigravity-plugin/plugin.json" },
      { src: "plugins/qed/skills/using-qed/SKILL.md", dest: ".gemini/skills/using-qed/SKILL.md" },
      { src: "plugins/qed/skills/qed-debug/SKILL.md", dest: ".gemini/skills/qed-debug/SKILL.md" },
      { src: "plugins/qed/skills/systematic-debugging/SKILL.md", dest: ".gemini/skills/systematic-debugging/SKILL.md" },
      { src: "plugins/qed/skills/qed-reconnaissance/SKILL.md", dest: ".gemini/skills/qed-reconnaissance/SKILL.md" },
      { src: "plugins/qed/skills/qed-blast-radius/SKILL.md", dest: ".gemini/skills/qed-blast-radius/SKILL.md" },
      { src: "plugins/qed/skills/qed-verify/SKILL.md", dest: ".gemini/skills/qed-verify/SKILL.md" },
      { src: "plugins/qed/skills/qed-boost/SKILL.md", dest: ".gemini/skills/qed-boost/SKILL.md" },
      { src: "plugins/qed/skills/qed-review/SKILL.md", dest: ".gemini/skills/qed-review/SKILL.md" }
    ]
  },
  cursor: {
    name: "Cursor IDE",
    files: [
      { src: "adapters/cursor/.cursorrules", liteSrc: "adapters/cursor/.cursorrules.lite", dest: ".cursorrules" },
      { src: "adapters/cursor/.cursor-plugin/plugin.json", dest: ".cursor-plugin/plugin.json" },
      { src: "adapters/cursor/.cursor/rules/00-constitution.mdc", liteSrc: "adapters/cursor/.cursor/rules/00-constitution.lite.mdc", dest: ".cursor/rules/00-constitution.mdc" },
      { src: "adapters/cursor/.cursor/rules/01-blast-radius.mdc", dest: ".cursor/rules/01-blast-radius.mdc" },
      { src: "adapters/cursor/.cursor/rules/02-anti-duplication.mdc", dest: ".cursor/rules/02-anti-duplication.mdc" },
      { src: "adapters/cursor/.cursor/rules/03-tdd-discipline.mdc", dest: ".cursor/rules/03-tdd-discipline.mdc" },
      { src: "adapters/cursor/.cursor/rules/04-three-am-readability.mdc", dest: ".cursor/rules/04-three-am-readability.mdc" },
      { src: "adapters/cursor/.cursor/rules/05-verification-gate.mdc", dest: ".cursor/rules/05-verification-gate.mdc" },
      { src: "adapters/cursor/.cursor/rules/06-documentation-and-visuals.mdc", dest: ".cursor/rules/06-documentation-and-visuals.mdc" },
      { src: "adapters/cursor/.cursor/rules/07-context-economics.mdc", dest: ".cursor/rules/07-context-economics.mdc" }
    ]
  },
  claude: {
    name: "Claude Code",
    files: [
      { src: "adapters/claude-code/CLAUDE.md", liteSrc: "adapters/claude-code/CLAUDE.lite.md", dest: "CLAUDE.md" },
      { src: "adapters/claude-code/.claude-plugin/plugin.json", dest: ".claude-plugin/plugin.json" },
      { src: "adapters/claude-code/.claude-plugin/marketplace.json", dest: ".claude-plugin/marketplace.json" },
      { src: "plugins/qed/skills/using-qed/SKILL.md", dest: ".claude/skills/using-qed/SKILL.md" },
      { src: "plugins/qed/skills/qed-debug/SKILL.md", dest: ".claude/skills/qed-debug/SKILL.md" },
      { src: "plugins/qed/skills/systematic-debugging/SKILL.md", dest: ".claude/skills/systematic-debugging/SKILL.md" },
      { src: "plugins/qed/skills/qed-reconnaissance/SKILL.md", dest: ".claude/skills/qed-reconnaissance/SKILL.md" },
      { src: "adapters/claude-code/.claude/skills/qed-verify/SKILL.md", dest: ".claude/skills/qed-verify/SKILL.md" },
      { src: "adapters/claude-code/.claude/skills/qed-boost/SKILL.md", dest: ".claude/skills/qed-boost/SKILL.md" },
      { src: "adapters/claude-code/.claude/skills/qed-review/SKILL.md", dest: ".claude/skills/qed-review/SKILL.md" },
      { src: "adapters/claude-code/.claude/skills/qed-blast-radius/SKILL.md", dest: ".claude/skills/qed-blast-radius/SKILL.md" },
      { src: "adapters/claude-code/.claude/commands/boost.md", dest: ".claude/commands/boost.md" },
      { src: "adapters/claude-code/.claude/commands/qed-boost.md", dest: ".claude/commands/qed-boost.md" },
      { src: "adapters/claude-code/.claude/commands/qed-verify.md", dest: ".claude/commands/qed-verify.md" },
      { src: "adapters/claude-code/.claude/commands/qed-review.md", dest: ".claude/commands/qed-review.md" },
      { src: "adapters/claude-code/.claude/commands/qed-blast-radius.md", dest: ".claude/commands/qed-blast-radius.md" }
    ]
  },
  cline: {
    name: "Cline",
    files: [
      { src: "adapters/cline/.clinerules", liteSrc: "adapters/cline/.clinerules.lite", dest: ".clinerules" }
    ]
  },
  roo: {
    name: "Roo Code",
    files: [
      { src: "adapters/roo-code/.roomodes", liteSrc: "adapters/roo-code/.roomodes.lite", dest: ".roomodes" }
    ]
  },
  windsurf: {
    name: "Windsurf",
    files: [
      { src: "adapters/windsurf/.windsurfrules", liteSrc: "adapters/windsurf/.windsurfrules.lite", dest: ".windsurfrules" },
      { src: "adapters/windsurf/.windsurf/workflows/qed-boost.md", dest: ".windsurf/workflows/qed-boost.md" },
      { src: "adapters/windsurf/.windsurf/workflows/qed-verify.md", dest: ".windsurf/workflows/qed-verify.md" }
    ]
  },
  copilot: {
    name: "GitHub Copilot",
    files: [
      { src: "adapters/copilot/.github/copilot-instructions.md", liteSrc: "adapters/copilot/.github/copilot-instructions.lite.md", dest: ".github/copilot-instructions.md" },
      { src: "adapters/copilot/.github/prompts/qed-boost.prompt.md", dest: ".github/prompts/qed-boost.prompt.md" },
      { src: "adapters/copilot/.github/prompts/qed-verify.prompt.md", dest: ".github/prompts/qed-verify.prompt.md" },
      { src: "adapters/copilot/.github/prompts/qed-tdd.prompt.md", dest: ".github/prompts/qed-tdd.prompt.md" },
      { src: "adapters/copilot/.github/prompts/qed-spec.prompt.md", dest: ".github/prompts/qed-spec.prompt.md" }
    ]
  },
  codex: {
    name: "Codex & AGENTS.md",
    files: [
      { src: "adapters/codex/CODEX.md", liteSrc: "adapters/codex/CODEX.lite.md", dest: "CODEX.md" },
      { src: "adapters/codex/AGENTS.md", liteSrc: "adapters/codex/AGENTS.lite.md", dest: "AGENTS.md" },
      { src: "adapters/codex/.codex-plugin/plugin.json", dest: ".codex-plugin/plugin.json" }
    ]
  },
  deepseek: {
    name: "DeepSeek & Continue.dev",
    files: [
      { src: "adapters/deepseek/DEEPSEEK.md", liteSrc: "adapters/deepseek/DEEPSEEK.lite.md", dest: "DEEPSEEK.md" },
      { src: "adapters/deepseek/.deepseekrules", liteSrc: "adapters/deepseek/.deepseekrules.lite", dest: ".deepseekrules" }
    ]
  },
  opencode: {
    name: "OpenCode",
    files: [
      { src: "adapters/opencode/opencode.json", dest: "opencode.json" },
      { src: "adapters/opencode/.opencode/plugins/qed.js", dest: ".opencode/plugins/qed.js" }
    ]
  },
  aider: {
    name: "Aider",
    files: [
      { src: "adapters/aider/.aider.conf.yml", dest: ".aider.conf.yml" },
      { src: "adapters/aider/.aider.conventions.md", liteSrc: "adapters/aider/.aider.conventions.lite.md", dest: ".aider.conventions.md" }
    ]
  },
  kimi: {
    name: "Kimi",
    files: [
      { src: "adapters/kimi/KIMI.md", liteSrc: "adapters/kimi/KIMI.lite.md", dest: "KIMI.md" },
      { src: "adapters/kimi/.kimirules", liteSrc: "adapters/kimi/.kimirules.lite", dest: ".kimirules" },
      { src: "adapters/kimi/.kimi/config.json", dest: ".kimi/config.json" }
    ]
  },
  pi: {
    name: "Pi Agent",
    files: [
      { src: "adapters/pi/PI.md", liteSrc: "adapters/pi/PI.lite.md", dest: "PI.md" },
      { src: "adapters/pi/.pi/config.json", dest: ".pi/config.json" },
      { src: "adapters/pi/.pi/extensions/qed.ts", dest: ".pi/extensions/qed.ts" }
    ]
  },
  hermes: {
    name: "Hermes Agent",
    files: [
      { src: "adapters/hermes/HERMES.md", liteSrc: "adapters/hermes/HERMES.lite.md", dest: "HERMES.md" },
      { src: "adapters/hermes/.hermes-plugin/plugin.yaml", dest: ".hermes-plugin/plugin.yaml" },
      { src: "adapters/hermes/.hermes-plugin/__init__.py", dest: ".hermes-plugin/__init__.py" }
    ]
  },
  muse: {
    name: "Muse Agent",
    files: [
      { src: "adapters/muse/MUSE.md", liteSrc: "adapters/muse/MUSE.lite.md", dest: "MUSE.md" },
      { src: "adapters/muse/.muse-plugin/plugin.json", dest: ".muse-plugin/plugin.json" },
      { src: "adapters/muse/.muse-plugin/marketplace.json", dest: ".muse-plugin/marketplace.json" }
    ]
  },
  devin: {
    name: "Devin",
    files: [
      { src: "adapters/devin/DEVIN.md", liteSrc: "adapters/devin/DEVIN.lite.md", dest: "DEVIN.md" },
      { src: "adapters/devin/.devin-plugin/plugin.json", dest: ".devin-plugin/plugin.json" },
      { src: "adapters/devin/.devin/config.json", dest: ".devin/config.json" }
    ]
  },
  droid: {
    name: "Factory Droid",
    files: [
      { src: "adapters/droid/DROID.md", liteSrc: "adapters/droid/DROID.lite.md", dest: "DROID.md" },
      { src: "adapters/droid/.droid/config.json", dest: ".droid/config.json" },
      { src: "adapters/droid/.agents/plugins/marketplace.json", dest: ".agents/plugins/marketplace.json" }
    ]
  },
  grok: {
    name: "Grok",
    files: [
      { src: "adapters/grok/GROK.md", liteSrc: "adapters/grok/GROK.lite.md", dest: "GROK.md" },
      { src: "adapters/grok/.grok-plugin/plugin.json", dest: ".grok-plugin/plugin.json" },
      { src: "adapters/grok/.grok/config.json", dest: ".grok/config.json" }
    ]
  },
  qwen: {
    name: "Qwen",
    files: [
      { src: "adapters/qwen/QWEN.md", liteSrc: "adapters/qwen/QWEN.lite.md", dest: "QWEN.md" },
      { src: "adapters/qwen/.qwenrules", liteSrc: "adapters/qwen/.qwenrules.lite", dest: ".qwenrules" },
      { src: "adapters/qwen/.qwen/config.json", dest: ".qwen/config.json" }
    ]
  }
};

const HARNESS_ALIASES = {
  gemini: "antigravity",
  "gemini-cli": "antigravity",
  "claude-code": "claude",
  "roo-code": "roo",
  "github-copilot": "copilot",
  dsh: "deepseek",
  "deepseek-harness": "deepseek",
  "kimi-code": "kimi",
  "hermes-agent": "hermes",
  "devin-cli": "devin",
  "factory-droid": "droid",
  "grok-build": "grok",
  "qwen-code": "qwen"
};

function resolveHarnessName(name) {
  const n = (name || "").toLowerCase().trim();
  return HARNESS_ALIASES[n] || n;
}

function detectProjectStack(targetDir) {
  const stack = {
    languages: [],
    packageManager: null,
    frameworks: [],
    testRunners: [],
    entrypoints: [],
    ignorePatterns: ["dist/**", "build/**", "coverage/**", "vendor/**"]
  };

  const has = (f) => fs.existsSync(path.join(targetDir, f));

  // Node / TS / JS
  if (has("package.json")) {
    const hasTs = has("tsconfig.json") || has("tsconfig.base.json");
    stack.languages.push(hasTs ? "TypeScript" : "JavaScript");
    stack.ignorePatterns.push("node_modules/**", ".next/**", ".nuxt/**", ".turbo/**");

    if (has("pnpm-lock.yaml")) stack.packageManager = "pnpm";
    else if (has("yarn.lock")) stack.packageManager = "yarn";
    else if (has("bun.lock") || has("bun.lockb")) stack.packageManager = "bun";
    else if (has("package-lock.json")) stack.packageManager = "npm";

    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps["next"]) stack.frameworks.push("Next.js");
      if (deps["vite"]) stack.frameworks.push("Vite");
      if (deps["react"]) stack.frameworks.push("React");
      if (deps["vue"]) stack.frameworks.push("Vue");
      if (deps["svelte"]) stack.frameworks.push("Svelte");
      if (deps["@angular/core"]) stack.frameworks.push("Angular");
      if (deps["express"]) stack.frameworks.push("Express");
      if (deps["nestjs"] || deps["@nestjs/core"]) stack.frameworks.push("NestJS");
      if (deps["fastify"]) stack.frameworks.push("Fastify");
      if (deps["hono"]) stack.frameworks.push("Hono");

      if (deps["vitest"]) stack.testRunners.push("Vitest");
      if (deps["jest"]) stack.testRunners.push("Jest");
      if (deps["@playwright/test"]) stack.testRunners.push("Playwright");
      if (deps["cypress"]) stack.testRunners.push("Cypress");
      if (deps["mocha"]) stack.testRunners.push("Mocha");

      if (pkg.scripts && pkg.scripts.test) {
        const testScript = pkg.scripts.test;
        if (testScript.includes("node --test") && !stack.testRunners.includes("Node Test Runner")) {
          stack.testRunners.push("Node Test Runner");
        }
      }

      if (pkg.main) stack.entrypoints.push(pkg.main);
      if (pkg.bin) {
        if (typeof pkg.bin === "string") stack.entrypoints.push(pkg.bin);
        else Object.values(pkg.bin).forEach((b) => stack.entrypoints.push(b));
      }
    } catch {}
  }

  // Go
  if (has("go.mod")) {
    stack.languages.push("Go");
    stack.testRunners.push("go test");
    if (has("main.go")) stack.entrypoints.push("main.go");
  }

  // Rust
  if (has("Cargo.toml")) {
    stack.languages.push("Rust");
    stack.ignorePatterns.push("target/**");
    stack.testRunners.push("cargo test");
    if (has("src/main.rs")) stack.entrypoints.push("src/main.rs");
    if (has("src/lib.rs")) stack.entrypoints.push("src/lib.rs");
  }

  // Python
  if (has("pyproject.toml") || has("requirements.txt") || has("Pipfile") || has("setup.py")) {
    stack.languages.push("Python");
    stack.ignorePatterns.push(".venv/**", "venv/**", "__pycache__/**", "*.pyc", ".pytest_cache/**");
    if (has("poetry.lock")) stack.packageManager = "poetry";
    else if (has("Pipfile.lock")) stack.packageManager = "pipenv";
    else if (has("requirements.txt")) stack.packageManager = "pip";

    if (has("pytest.ini") || has(".pytest_cache") || has("tests")) stack.testRunners.push("pytest");
    if (has("main.py")) stack.entrypoints.push("main.py");
    if (has("app.py")) stack.entrypoints.push("app.py");
    if (has("app/main.py")) stack.entrypoints.push("app/main.py");
  }

  // Conventional entrypoints fallback
  if (stack.entrypoints.length === 0) {
    const candidates = [
      "src/index.ts", "src/index.js", "src/main.ts", "src/main.js", "src/App.tsx",
      "index.ts", "index.js", "main.py", "app.py", "main.go"
    ];
    for (const c of candidates) {
      if (has(c)) {
        stack.entrypoints.push(c);
        break;
      }
    }
  }

  return stack;
}

function detectProjectHarnesses(targetDir) {
  const os = require("node:os");
  const localHarnesses = [];
  const checks = [
    { harness: "antigravity", file: "GEMINI.md" },
    { harness: "cursor", file: ".cursorrules" },
    { harness: "claude", file: "CLAUDE.md" },
    { harness: "cline", file: ".clinerules" },
    { harness: "roo", file: ".roomodes" },
    { harness: "windsurf", file: ".windsurfrules" },
    { harness: "copilot", file: ".github/copilot-instructions.md" },
    { harness: "codex", file: "CODEX.md" },
    { harness: "codex", file: "AGENTS.md" },
    { harness: "deepseek", file: ".deepseekrules" },
    { harness: "opencode", file: "opencode.json" },
    { harness: "aider", file: ".aider.conf.yml" },
    { harness: "kimi", file: "KIMI.md" },
    { harness: "pi", file: "PI.md" },
    { harness: "hermes", file: "HERMES.md" },
    { harness: "muse", file: "MUSE.md" },
    { harness: "devin", file: "DEVIN.md" },
    { harness: "droid", file: "DROID.md" },
    { harness: "grok", file: "GROK.md" },
    { harness: "qwen", file: "QWEN.md" }
  ];

  for (const c of checks) {
    if (fs.existsSync(path.join(targetDir, c.file)) && !localHarnesses.includes(c.harness)) {
      localHarnesses.push(c.harness);
    }
  }

  const globalHarnesses = [];
  const home = os.homedir();
  if (fs.existsSync(path.join(home, ".gemini", "GEMINI.md"))) globalHarnesses.push("antigravity");
  if (fs.existsSync(path.join(home, ".cursorrules")) || fs.existsSync(path.join(home, ".cursor"))) globalHarnesses.push("cursor");
  if (fs.existsSync(path.join(home, ".claude", "CLAUDE.md")) || fs.existsSync(path.join(home, ".claude.json"))) globalHarnesses.push("claude");
  if (fs.existsSync(path.join(home, ".codex"))) globalHarnesses.push("codex");

  return { localHarnesses, globalHarnesses };
}

function discoverExistingHelpers(targetDir) {
  const HELPER_DIR_NAMES = new Set(["utils", "util", "helpers", "helper", "lib", "common", "shared", "pkg", "tools"]);
  const CODE_EXTS = new Set([".ts", ".js", ".tsx", ".jsx", ".go", ".py", ".rs"]);
  const helpers = [];

  function scan(currentDir, depth) {
    if (depth > 4 || helpers.length >= 25) return;
    let entries = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const ent of entries) {
      if (ent.isDirectory()) {
        const dName = ent.name.toLowerCase();
        if (dName.startsWith(".") || ["node_modules", "dist", "build", "target", "vendor", ".git", ".venv"].includes(dName)) continue;

        if (HELPER_DIR_NAMES.has(dName)) {
          collectHelperFiles(path.join(currentDir, ent.name));
        } else {
          scan(path.join(currentDir, ent.name), depth + 1);
        }
      }
    }
  }

  function collectHelperFiles(dir) {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const ent of entries) {
      if (helpers.length >= 25) break;
      if (ent.isFile()) {
        const ext = path.extname(ent.name);
        if (CODE_EXTS.has(ext) && !ent.name.includes(".test.") && !ent.name.includes(".spec.")) {
          const fullPath = path.join(dir, ent.name);
          const relPath = path.relative(targetDir, fullPath).replace(/\\/g, "/");
          const symbols = extractSymbols(fullPath, ext);
          if (symbols.length > 0) {
            helpers.push({ file: relPath, symbols });
          }
        }
      }
    }
  }

  function extractSymbols(filePath, ext) {
    const symbols = [];
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();
        if (ext === ".ts" || ext === ".js" || ext === ".tsx" || ext === ".jsx") {
          const fnMatch = trimmed.match(/^export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/);
          if (fnMatch) symbols.push(fnMatch[1]);
          const constMatch = trimmed.match(/^export\s+const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\(/);
          if (constMatch) symbols.push(constMatch[1]);
          const classMatch = trimmed.match(/^export\s+class\s+([A-Za-z0-9_]+)/);
          if (classMatch) symbols.push(classMatch[1]);
        } else if (ext === ".py") {
          const pyMatch = trimmed.match(/^def\s+([A-Za-z0-9_]+)\s*\(/);
          if (pyMatch && !pyMatch[1].startsWith("_")) symbols.push(pyMatch[1]);
        } else if (ext === ".go") {
          const goMatch = trimmed.match(/^func\s+([A-Z][A-Za-z0-9_]+)\s*\(/);
          if (goMatch) symbols.push(goMatch[1]);
        } else if (ext === ".rs") {
          const rsMatch = trimmed.match(/^pub\s+(?:async\s+)?fn\s+([A-Za-z0-9_]+)/);
          if (rsMatch) symbols.push(rsMatch[1]);
        }
        if (symbols.length >= 10) break;
      }
    } catch {}
    return symbols;
  }

  scan(targetDir, 0);
  return helpers;
}

function analyzeComplexityAndDebt(targetDir, stack) {
  const CODE_EXTS = new Set([".ts", ".js", ".tsx", ".jsx", ".go", ".py", ".rs", ".c", ".cpp", ".h", ".java"]);
  const IGNORE_DIRS = new Set([
    "node_modules", "dist", "build", "target", "vendor", ".git", ".venv", "venv", "__pycache__",
    "coverage", ".next", ".nuxt", ".turbo", ".cache"
  ]);

  let totalFiles = 0;
  let totalSloc = 0;
  let maxDepth = 0;
  let testFilesCount = 0;
  let largestFile = { relPath: "", lines: 0 };
  const enterpriseDirs = [];

  function scan(currentDir, currentDepth) {
    if (currentDepth > maxDepth) maxDepth = currentDepth;
    let entries = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const ent of entries) {
      if (ent.isDirectory()) {
        const dName = ent.name.toLowerCase();
        if (IGNORE_DIRS.has(dName) || dName.startsWith(".")) continue;

        if (["repositories", "usecases", "domain", "factories", "controllers", "entities"].includes(dName)) {
          enterpriseDirs.push(dName);
        }

        scan(path.join(currentDir, ent.name), currentDepth + 1);
      } else if (ent.isFile()) {
        const ext = path.extname(ent.name);
        const isTest = ent.name.includes(".test.") || ent.name.includes(".spec.") || ent.name.startsWith("test_");
        if (isTest) testFilesCount++;

        if (CODE_EXTS.has(ext)) {
          totalFiles++;
          const fullPath = path.join(currentDir, ent.name);
          try {
            const content = fs.readFileSync(fullPath, "utf8");
            const lines = content.split("\n").filter((l) => l.trim().length > 0).length;
            totalSloc += lines;
            if (lines > largestFile.lines) {
              largestFile = { relPath: path.relative(targetDir, fullPath).replace(/\\/g, "/"), lines };
            }
          } catch {}
        }
      }
    }
  }

  scan(targetDir, 0);

  let tier = "tier1-utility";
  let tierName = "Tier 1 (Utility / CLI / Script)";
  let tierMaxLines = 600;

  if (totalSloc > 20000) {
    tier = "tier3-platform";
    tierName = "Tier 3 (Core Platform / Multi-tenant)";
    tierMaxLines = 1500;
  } else if (totalSloc > 1500) {
    tier = "tier2-service";
    tierName = "Tier 2 (Service / Application / Modular Library)";
    tierMaxLines = 1000;
  }

  const findings = [];
  const avgSloc = totalFiles > 0 ? Math.round(totalSloc / totalFiles) : 0;

  if (tier === "tier1-utility" && (maxDepth >= 4 || enterpriseDirs.length > 0)) {
    findings.push({
      type: "bloat",
      severity: "warn",
      title: "Unearned Enterprise Bloat",
      detail: `Small codebase (${totalSloc} SLOC across ${totalFiles} files) contains premature layers (${enterpriseDirs.join(", ") || "depth " + maxDepth}). Violates Invariant 2 (Earned Complexity). Suggestion: flatten into simple functions before creating abstract hierarchies.`
    });
  }

  if (largestFile.lines > 1000) {
    findings.push({
      type: "god-file",
      severity: "warn",
      title: "Oversized Monolith Module",
      detail: `'${largestFile.relPath}' contains ${largestFile.lines} lines. Violates 3 AM test readability. Suggestion: decouple into focused leaf modules or subcomponents.`
    });
  } else if (largestFile.lines > 500 && totalSloc > 0 && (largestFile.lines / totalSloc) > 0.4) {
    findings.push({
      type: "god-file",
      severity: "warn",
      title: "God-File Concentration",
      detail: `'${largestFile.relPath}' holds ${Math.round((largestFile.lines / totalSloc) * 100)}% of the entire codebase logic (${largestFile.lines} lines). Decouple core logic from routes/wrappers.`
    });
  }

  if (totalSloc > 300 && testFilesCount === 0) {
    findings.push({
      type: "test-gap",
      severity: "warn",
      title: "Zero Test Verification Net",
      detail: `No automated test files detected for ${totalSloc} SLOC. Violates Invariant 5 (Verification Gate). Suggestion: add failing reproduction tests before editing business contracts.`
    });
  }

  return {
    tier,
    tierName,
    tierMaxLines,
    totalFiles,
    totalSloc,
    avgSloc,
    maxDepth,
    largestFile,
    testFilesCount,
    findings
  };
}

function generateProjectBrief(targetDir, stack, complexity, helpers, harnesses) {
  const briefLines = [];
  briefLines.push("# Project Reconnaissance Brief & Topology");
  briefLines.push(`> Generated by **Q.E.D. Onboarding Engine** on ${new Date().toISOString().split("T")[0]}`);
  briefLines.push(`> Target: \`${path.resolve(targetDir)}\``);
  briefLines.push("");

  briefLines.push("## 1. Project Identity & Stack Telemetry");
  briefLines.push(`- **Languages**: ${stack.languages.join(", ") || "Generic / Polyglot"}`);
  if (stack.packageManager) briefLines.push(`- **Package Manager**: \`${stack.packageManager}\``);
  if (stack.frameworks.length > 0) briefLines.push(`- **Frameworks**: ${stack.frameworks.join(", ")}`);
  if (stack.entrypoints.length > 0) {
    briefLines.push(`- **Discovered Entrypoints**: \`${stack.entrypoints.join("`, `")}\``);
  }
  briefLines.push(`- **Active AI Harnesses**: ${harnesses.map((h) => ADAPTER_CATALOG[h]?.name || h).join(", ")}`);
  briefLines.push("");

  briefLines.push("## 2. Earned Complexity Profile");
  briefLines.push(`- **Classified Tier**: **${complexity.tierName}**`);
  briefLines.push(`- **Total Code Volume (SLOC)**: ${complexity.totalSloc.toLocaleString()} lines across ${complexity.totalFiles} code files`);
  briefLines.push(`- **Code Density**: ~${complexity.avgSloc} lines/file (Max directory depth: ${complexity.maxDepth})`);
  briefLines.push(`- **Largest Source File**: \`${complexity.largestFile.relPath}\` (${complexity.largestFile.lines} lines)`);
  briefLines.push(`- **Recommended File Churn / Size Ceiling**: <= ${complexity.tierMaxLines} lines`);
  briefLines.push("");

  briefLines.push("## 3. Pre-Q.E.D. Debt & Architectural Findings");
  if (complexity.findings.length === 0) {
    briefLines.push("✓ **Clean Baseline**: No god-files, unearned enterprise layers, or severe structural debt detected.");
  } else {
    for (const f of complexity.findings) {
      briefLines.push(`- **[WARN] ${f.title}**: ${f.detail}`);
    }
  }
  briefLines.push("");

  briefLines.push("## 4. Anti-Duplication Atlas (Existing Helpers & Utilities)");
  briefLines.push("> [!IMPORTANT]");
  briefLines.push("> **SEARCH BEFORE YOU CREATE**: Check this inventory before creating any new helper, utility function, or wrapper. Never duplicate existing abstractions.");
  briefLines.push("");
  if (helpers.length === 0) {
    briefLines.push("*No centralized utility modules detected. Keep new helpers strictly flat and idiomatic.*");
  } else {
    for (const h of helpers) {
      briefLines.push(`### \`${h.file}\``);
      briefLines.push(`- Symbols: \`${h.symbols.join("`, `")}\``);
    }
  }
  briefLines.push("");

  briefLines.push("## 5. Verification Gate & Mechanical Enforcement");
  if (stack.testRunners.length > 0) {
    briefLines.push(`- **Detected Test Runner**: ${stack.testRunners.join(", ")} (${complexity.testFilesCount} test file(s))`);
  } else {
    briefLines.push(`- **Test Files**: ${complexity.testFilesCount} test file(s) found`);
  }
  briefLines.push("- **Mechanical Verification Gate**: `qed check` (or `node bin/qed-engine.js check`)");
  briefLines.push("- **Full Health Check**: `qed doctor`");
  briefLines.push("");

  briefLines.push("## 6. Mandatory Agent Flight Protocol (Mode A Invariant)");
  briefLines.push("1. **Turn-0 Ambient Priming**: Always ground yourself in this brief before writing code.");
  briefLines.push("2. **Zero Speculation**: Never assume contracts or APIs. Grep callers and trace runtime schemas.");
  briefLines.push("3. **Reproduction First (Red -> Green)**: Write a failing reproduction test before modifying contracts.");
  briefLines.push("4. **Root Cause Only**: No empty catch blocks, no arbitrary timeouts, no loose `any` casts.");
  briefLines.push("5. **Empirical Gate**: Run `qed check` in the terminal and provide real stdout before marking completion.");
  briefLines.push("");

  return briefLines.join("\n");
}

function printBriefForConsole(targetDir, stack, complexity, helpers, harnesses) {
  console.log("\n" + colors.cyan("=========================================================="));
  console.log(colors.cyan(" Q.E.D. Codebase Reconnaissance Brief & Topology"));
  console.log(colors.gray(` Target: ${path.resolve(targetDir)}`));
  console.log(colors.cyan("=========================================================="));

  // 1. Stack Telemetry
  console.log(`\n${colors.bold("1. Project Identity & Stack Telemetry")}`);
  console.log(`   Languages:             ${stack.languages.join(", ") || "Generic / Polyglot"}`);
  if (stack.packageManager) {
    console.log(`   Package Manager:       ${stack.packageManager}`);
  }
  if (stack.frameworks.length > 0) {
    console.log(`   Frameworks:            ${stack.frameworks.join(", ")}`);
  }
  if (stack.entrypoints.length > 0) {
    console.log(`   Discovered Entrypoint: ${stack.entrypoints.join(", ")}`);
  }
  const harnessNames = harnesses.map((h) => ADAPTER_CATALOG[h]?.name || h).join(", ");
  console.log(`   Active AI Harnesses:   ${harnessNames}`);

  // 2. Earned Complexity Profile
  console.log(`\n${colors.bold("2. Earned Complexity Profile")}`);
  console.log(`   Classified Tier:       ${colors.cyan(complexity.tierName)}`);
  console.log(`   Code Volume:           ${complexity.totalSloc.toLocaleString()} SLOC across ${complexity.totalFiles} code files`);
  console.log(`   Code Density:          ~${complexity.avgSloc} SLOC/file (Max nesting depth: ${complexity.maxDepth})`);
  console.log(`   Largest Source File:   ${complexity.largestFile.relPath} (${complexity.largestFile.lines} lines)`);
  console.log(`   Recommended Ceiling:   <= ${complexity.tierMaxLines} lines per module`);

  // 3. Pre-Q.E.D. Debt Findings
  console.log(`\n${colors.bold("3. Pre-Q.E.D. Architectural Findings")}`);
  if (complexity.findings.length === 0) {
    console.log(colors.green("   ✓ Clean Baseline: No god-files or premature layer bloat detected."));
  } else {
    for (const f of complexity.findings) {
      console.log(`   ${colors.yellow("[!WARN]")} ${colors.bold(f.title)}:`);
      console.log(`          ${f.detail}`);
    }
  }

  // 4. Anti-Duplication Atlas
  console.log(`\n${colors.bold("4. Anti-Duplication Atlas (Existing Helpers)")}`);
  if (helpers.length === 0) {
    console.log(colors.gray("   No centralized utility modules detected. Keep new helpers strictly flat and idiomatic."));
  } else {
    for (const h of helpers) {
      const symList = h.symbols.join(", ");
      console.log(`   - ${colors.cyan(h.file)}: ${symList}`);
    }
  }

  // 5. Verification Gate
  console.log(`\n${colors.bold("5. Verification Gate & Mechanical Enforcement")}`);
  if (stack.testRunners.length > 0) {
    console.log(`   Detected Test Runner:  ${stack.testRunners.join(", ")} (${complexity.testFilesCount} test file(s))`);
  } else {
    console.log(`   Test Files:            ${complexity.testFilesCount} test file(s) found`);
  }
  console.log(`   Mechanical Gate:       ${colors.cyan("qed check")} (or node bin/qed-engine.js check)`);
  console.log(`   Full Health Check:     ${colors.cyan("qed doctor")}`);

  // 6. Mandatory Flight Protocol
  console.log(`\n${colors.bold("6. Mandatory Agent Flight Protocol (Mode A Invariant)")}`);
  console.log(`   1. ${colors.bold("Turn-0 Ambient Priming")}: Always ground in .qed/BRIEF.md before writing code.`);
  console.log(`   2. ${colors.bold("Zero Speculation")}:       Never assume contracts or APIs. Grep callers & trace wire.`);
  console.log(`   3. ${colors.bold("Reproduction First")}:     Write a failing reproduction test before modifying contracts.`);
  console.log(`   4. ${colors.bold("Root Cause Only")}:        No empty catch blocks, no loose 'any' casts.`);
  console.log(`   5. ${colors.bold("Empirical Gate")}:         Run 'qed check' in terminal and show real stdout as proof.`);
  console.log(colors.cyan("==========================================================\n"));
}

function injectReadmeBadge(targetDir) {
  const readmePath = path.join(targetDir, "README.md");
  if (!fs.existsSync(readmePath)) return false;

  try {
    const content = fs.readFileSync(readmePath, "utf8");
    if (content.includes("keelbismark/qed")) return false;

    const badge = "[![Q.E.D. Standard](https://img.shields.io/badge/Q.E.D.-Quality%20%3E%20Speed-000000?style=flat&logo=target)](https://github.com/keelbismark/qed)";
    const lines = content.split("\n");
    let inserted = false;
    const newLines = [];

    for (let i = 0; i < lines.length; i++) {
      newLines.push(lines[i]);
      if (!inserted && lines[i].startsWith("# ")) {
        newLines.push("");
        newLines.push(badge);
        inserted = true;
      }
    }

    if (!inserted) {
      newLines.unshift(badge + "\n");
    }

    fs.writeFileSync(readmePath, newLines.join("\n"), "utf8");
    return true;
  } catch {
    return false;
  }
}

function writeQedrc(targetDir, stack, complexity, options = {}) {
  const configPath = path.join(targetDir, ".qedrc.json");
  if (fs.existsSync(configPath) && !options.force) {
    return { created: false, path: configPath };
  }

  const qedrc = {
    $schema: "https://raw.githubusercontent.com/keelbismark/qed/main/schema/qedrc.schema.json",
    tier: complexity.tier,
    stack: {
      languages: stack.languages,
      packageManager: stack.packageManager,
      frameworks: stack.frameworks
    },
    ignorePatterns: stack.ignorePatterns,
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
      QED012: "error"
    }
  };

  fs.writeFileSync(configPath, JSON.stringify(qedrc, null, 2) + "\n", "utf8");
  return { created: true, path: configPath };
}

function installMatchingAdapters(targetDir, harnesses, options = {}) {
  const qedRoot = path.resolve(__dirname, "..");
  const installedFiles = [];

  for (const h of harnesses) {
    const entry = ADAPTER_CATALOG[h];
    if (!entry) continue;

    for (const file of entry.files) {
      const srcRel = options.lite && file.liteSrc ? file.liteSrc : file.src;
      const fullSrc = path.join(qedRoot, srcRel);
      const fullDest = path.join(targetDir, file.dest);

      if (!fs.existsSync(fullSrc)) continue;

      fs.mkdirSync(path.dirname(fullDest), { recursive: true });
      fs.copyFileSync(fullSrc, fullDest);
      installedFiles.push(file.dest);
    }
  }

  return installedFiles;
}

function runInit(targetDir, options = {}) {
  const { performance } = require("node:perf_hooks");
  const t0 = performance.now();
  const absTarget = path.resolve(targetDir);

  console.log(colors.cyan("=========================================================="));
  console.log(colors.cyan(" Q.E.D. Project Authorization & Onboarding Engine"));
  console.log(colors.gray(" Quod Erat Demonstrandum: Evidence Before Assertions"));
  console.log(colors.cyan("=========================================================="));
  console.log(colors.gray(`Target: ${absTarget}\n`));

  // 1. Stack Telemetry
  const stack = detectProjectStack(absTarget);
  console.log(colors.bold("[1/6] Stack Telemetry"));
  console.log(`  Languages: ${stack.languages.join(", ") || "Generic / Polyglot"}`);
  if (stack.packageManager) console.log(`  Package Manager: ${stack.packageManager}`);
  if (stack.frameworks.length > 0) console.log(`  Frameworks: ${stack.frameworks.join(", ")}`);
  if (stack.entrypoints.length > 0) console.log(`  Discovered Entrypoint: ${stack.entrypoints.join(", ")}`);

  // 2. Earned Complexity Profile
  const complexity = analyzeComplexityAndDebt(absTarget, stack);
  console.log(`\n${colors.bold("[2/6] Earned Complexity Profile")}`);
  console.log(`  Classified Tier: ${colors.cyan(complexity.tierName)}`);
  console.log(`  Code Volume: ${complexity.totalSloc.toLocaleString()} SLOC across ${complexity.totalFiles} files`);
  console.log(`  Code Density: ~${complexity.avgSloc} SLOC/file (Max Nesting Depth: ${complexity.maxDepth})`);
  console.log(`  Recommended Churn Ceiling: <= ${complexity.tierMaxLines} lines`);

  // 3. Pre-Q.E.D. Debt Findings
  console.log(`\n${colors.bold("[3/6] Pre-Q.E.D. Architectural Findings")}`);
  if (complexity.findings.length === 0) {
    console.log(colors.green("  ✓ Clean Baseline: No god-files or premature layer bloat detected."));
  } else {
    for (const f of complexity.findings) {
      console.log(`  ${colors.yellow("[!WARN]")} ${colors.bold(f.title)}: ${f.detail}`);
    }
  }

  // 4. Anti-Duplication Atlas
  const helpers = discoverExistingHelpers(absTarget);
  console.log(`\n${colors.bold("[4/6] Anti-Duplication Atlas")}`);
  if (helpers.length === 0) {
    console.log(colors.gray("  No centralized utility modules detected. New helpers must be kept flat."));
  } else {
    console.log(`  Discovered ${helpers.length} utility module(s) with reusable helpers:`);
    for (const h of helpers.slice(0, 5)) {
      const symList = h.symbols.slice(0, 3).join(", ") + (h.symbols.length > 3 ? `... (+${h.symbols.length - 3})` : "");
      console.log(`    - ${colors.cyan(h.file)}: ${symList}`);
    }
  }

  // 5. Harness Discovery & Adapter Installation
  const harnessProbe = detectProjectHarnesses(absTarget);
  let selectedHarnesses = [];

  if (options.harness) {
    const resolved = resolveHarnessName(options.harness);
    if (resolved === "all") {
      selectedHarnesses = Object.keys(ADAPTER_CATALOG);
    } else if (ADAPTER_CATALOG[resolved]) {
      selectedHarnesses = [resolved];
    }
  }

  if (selectedHarnesses.length === 0) {
    if (harnessProbe.localHarnesses.length > 0) {
      selectedHarnesses = harnessProbe.localHarnesses;
    } else if (harnessProbe.globalHarnesses.length > 0) {
      selectedHarnesses = harnessProbe.globalHarnesses;
    } else {
      selectedHarnesses = ["antigravity", "cursor", "claude"];
    }
  }

  console.log(`\n${colors.bold("[5/6] Reconnaissance Brief & Configuration")}`);
  if (options.dryRun) {
    console.log(colors.yellow("  [DRY RUN] Skipping file writes."));
  } else {
    // Generate .qed/BRIEF.md
    const qedDir = path.join(absTarget, ".qed");
    fs.mkdirSync(qedDir, { recursive: true });
    const briefContent = generateProjectBrief(absTarget, stack, complexity, helpers, selectedHarnesses);
    fs.writeFileSync(path.join(qedDir, "BRIEF.md"), briefContent, "utf8");
    console.log(colors.green("  [+] Generated: .qed/BRIEF.md (Situational awareness armed for AI agents at Turn 0)"));

    // Generate .qedrc.json
    const qedrcRes = writeQedrc(absTarget, stack, complexity, options);
    if (qedrcRes.created) {
      console.log(colors.green(`  [+] Created: .qedrc.json (Configured for ${complexity.tier})`));
    } else {
      console.log(colors.yellow(`  [!] Preserved existing: .qedrc.json (use --force to overwrite)`));
    }

    // Install Adapters
    const installed = installMatchingAdapters(absTarget, selectedHarnesses, options);
    for (const h of selectedHarnesses) {
      const cat = ADAPTER_CATALOG[h];
      if (cat) console.log(colors.green(`  [+] Installed Adapter: ${cat.name}`));
    }

    // README Badge
    const badgeAdded = injectReadmeBadge(absTarget);
    if (badgeAdded) {
      console.log(colors.green("  [+] Updated: README.md with Q.E.D. Standard verification badge"));
    }
  }

  // 6. Git Verification Gate
  console.log(`\n${colors.bold("[6/6] Git Verification Gate")}`);
  const gitDir = path.join(absTarget, ".git");
  if (fs.existsSync(gitDir)) {
    if (!options.dryRun) {
      const hooksDir = path.join(gitDir, "hooks");
      installGitHooks(hooksDir);
      console.log(colors.green("  [+] Installed: .git/hooks/pre-commit (qed check)"));
      console.log(colors.green("  [+] Installed: .git/hooks/pre-push (qed test)"));
    } else {
      console.log(colors.yellow("  [DRY RUN] Git hooks installation skipped."));
    }
  } else {
    console.log(colors.gray("  Git repository not detected; git hooks skipped (run 'git init && qed hook' later)"));
  }

  const duration = (performance.now() - t0).toFixed(1);
  console.log("\n----------------------------------------------------------");
  console.log(colors.green(`✓ Q.E.D. Initialized successfully in ${duration}ms.`));
  console.log(colors.gray("  Run 'qed check' or 'qed doctor' to verify repository health."));

  if (options.explore) {
    printBriefForConsole(absTarget, stack, complexity, helpers, selectedHarnesses);
  }
}

// CLI Execution Entrypoint
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || "check";
  const flagsWithValue = new Set(["--config", "-c", "--harness", "--target", "-t"]);
  const skipIndices = new Set([0]);
  for (let i = 0; i < args.length; i++) {
    if (flagsWithValue.has(args[i]) && i + 1 < args.length) {
      skipIndices.add(i + 1);
    }
  }
  const positionalTarget = args.find((a, idx) => !skipIndices.has(idx) && !a.startsWith("-"));
  const targetDir = positionalTarget || process.cwd();
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
    const isLite = args.includes("--lite");
    const isYes = args.includes("-y") || args.includes("--yes");
    const isForce = args.includes("-f") || args.includes("--force");
    const isExplore = args.includes("--explore");
    const isDryRun = args.includes("--dry-run");
    const harnessIdx = args.indexOf("--harness");
    const explicitHarness = harnessIdx !== -1 && args[harnessIdx + 1] ? args[harnessIdx + 1] : null;

    runInit(targetDir, {
      lite: isLite,
      yes: isYes,
      force: isForce,
      explore: isExplore,
      dryRun: isDryRun,
      harness: explicitHarness,
    });
    process.exit(0);
  } else if (command === "hook") {
    const gitDir = path.join(path.resolve(targetDir), ".git");
    const hooksDir = path.join(gitDir, "hooks");
    if (!fs.existsSync(gitDir)) {
      console.error(colors.red("Error: No .git directory found. Cannot install pre-commit hook."));
      process.exit(1);
    }
    installGitHooks(hooksDir);
    console.log(colors.green(`[+] Installed Q.E.D. hooks: pre-commit & pre-push to ${hooksDir}`));
    process.exit(0);
  } else if (command === "update" || command === "upgrade" || command === "sync") {
    const isGlobal = args.includes("--global") || args.includes("-g");
    runUpdate(targetDir, { global: isGlobal });
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
      "Usage: node bin/qed-engine.js [check | test | doctor | update | ci | exec | tokens | init | hook] [target_dir] [--global] [--compact] [--json] [--strict] [--config <path>]"
    );
    process.exit(1);
  }
}

module.exports = { QedLinter };
