#!/usr/bin/env node

/**
 * Q.E.D. Empirical Evaluation & LLM Slop Eradication Benchmark
 * Evaluates code generation outputs (Vanilla vs Q.E.D. Standard) against
 * the mechanical verification engine to quantify defect reduction.
 */

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { QedLinter } = require("../bin/qed-engine");

const scenariosPath = path.join(__dirname, "scenarios.json");
if (!fs.existsSync(scenariosPath)) {
  console.error("Error: scenarios.json not found.");
  process.exit(1);
}

const scenarios = JSON.parse(fs.readFileSync(scenariosPath, "utf8"));
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "qed-evals-"));

console.log("==========================================================");
console.log(" Q.E.D. Empirical LLM Code Quality Evaluation Benchmark");
console.log(" Evidence Before Assertions - Scientific Proof Matrix");
console.log("==========================================================\n");

const results = [];
let totalVanillaDefects = 0;
let totalQedDefects = 0;
let vanillaPasses = 0;
let qedPasses = 0;

try {
  for (const scn of scenarios) {
    const scnDir = path.join(tempDir, scn.id);
    const vanillaDir = path.join(scnDir, "vanilla");
    const qedDir = path.join(scnDir, "qed");
    fs.mkdirSync(vanillaDir, { recursive: true });
    fs.mkdirSync(qedDir, { recursive: true });

    const ext = scn.domain.startsWith("database") ? ".sql" : ".tsx";
    const vanillaFile = path.join(vanillaDir, `service${ext}`);
    const qedFile = path.join(qedDir, `service${ext}`);

    fs.writeFileSync(vanillaFile, scn.vanillaSample, "utf8");
    fs.writeFileSync(qedFile, scn.qedSample, "utf8");

    // Lint Vanilla
    const vanillaLinter = new QedLinter(vanillaDir);
    const vanillaViolations = vanillaLinter.run();
    const vanillaErrors = vanillaViolations.filter((v) => v.severity === "error");

    // Lint QED
    const qedLinter = new QedLinter(qedDir);
    const qedViolations = qedLinter.run();
    const qedErrors = qedViolations.filter((v) => v.severity === "error");

    totalVanillaDefects += vanillaErrors.length;
    totalQedDefects += qedErrors.length;
    if (vanillaErrors.length === 0) vanillaPasses++;
    if (qedErrors.length === 0) qedPasses++;

    results.push({
      id: scn.id,
      name: scn.name,
      domain: scn.domain,
      vanillaErrors: vanillaErrors.length,
      vanillaViolations: vanillaViolations.map((v) => v.ruleId),
      qedErrors: qedErrors.length,
      qedViolations: qedViolations.map((v) => v.ruleId),
      status: qedErrors.length === 0 ? "PASSED" : "FAILED",
    });
  }
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

// Render Results Table
console.log("Scenario Evaluation Results:");
console.log("---------------------------------------------------------------------------------------");
console.log(
  `| ${"Scenario ID".padEnd(16)} | ${"Domain".padEnd(25)} | ${"Vanilla Slop".padEnd(14)} | ${"Q.E.D. Result".padEnd(14)} | Status   |`
);
console.log("---------------------------------------------------------------------------------------");

for (const r of results) {
  const vCol = `${r.vanillaErrors} defect(s)`.padEnd(14);
  const qCol = `${r.qedErrors} defect(s)`.padEnd(14);
  console.log(
    `| ${r.id.padEnd(16)} | ${r.domain.padEnd(25)} | ${vCol} | ${qCol} | ${r.status.padEnd(8)} |`
  );
}
console.log("---------------------------------------------------------------------------------------\n");

const eliminationRate = totalVanillaDefects > 0 
  ? (((totalVanillaDefects - totalQedDefects) / totalVanillaDefects) * 100).toFixed(1)
  : "100.0";

const vanillaPassRate = ((vanillaPasses / scenarios.length) * 100).toFixed(1);
const qedPassRate = ((qedPasses / scenarios.length) * 100).toFixed(1);

console.log("Statistical Summary & Quality Delta:");
console.log(`  - Total Scenarios Evaluated:       ${scenarios.length}`);
console.log(`  - Vanilla Total Defects Detected:  ${totalVanillaDefects}`);
console.log(`  - Q.E.D. Total Defects Detected:   ${totalQedDefects}`);
console.log(`  - Slop Eradication Rate:           ${eliminationRate}% (Defects Eliminated)`);
console.log(`  - Vanilla Gate Pass Rate:          ${vanillaPassRate}%`);
console.log(`  - Q.E.D. Gate Pass Rate:           ${qedPassRate}% (High-Assurance Complete)`);

// Export JSON artifact
const summary = {
  timestamp: new Date().toISOString(),
  scenariosCount: scenarios.length,
  totalVanillaDefects,
  totalQedDefects,
  eradicationRatePercent: parseFloat(eliminationRate),
  vanillaPassRatePercent: parseFloat(vanillaPassRate),
  qedPassRatePercent: parseFloat(qedPassRate),
  results,
};

const outPath = path.join(__dirname, "benchmark-results.json");
fs.writeFileSync(outPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
console.log(`\n[+] Exported empirical benchmark data to: ${outPath}\n`);

if (totalQedDefects > 0) {
  process.exit(1);
}
process.exit(0);
