# Q.E.D. Adapter & Installer Verification Test Suite
# Tests install.ps1 across each harness in local, global, and positional modes

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir

Write-Host "Running Q.E.D. Comprehensive Verification Suite (PowerShell)..." -ForegroundColor Cyan

$testRunDir = Join-Path ([System.IO.Path]::GetTempPath()) ("qed-test-" + [System.Guid]::NewGuid().ToString().Substring(0, 8))
New-Item -ItemType Directory -Path $testRunDir -Force | Out-Null

$results = @()

function Run-Harness-Test([string]$testName, [string]$targetMode, [string]$harness, [string[]]$expectedFiles, [switch]$Positional) {
    $targetDir = Join-Path $testRunDir $testName
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    
    $origHome = $env:USERPROFILE
    if ($targetMode -eq "global") {
        $fakeHome = Join-Path $testRunDir ("home-" + $testName)
        New-Item -ItemType Directory -Path $fakeHome -Force | Out-Null
        $env:USERPROFILE = $fakeHome
        $env:HOME = $fakeHome
    }

    Push-Location $targetDir
    try {
        if ($Positional) {
            # Test positional syntax: install.ps1 <harness>
            & "$RepoRoot\install.ps1" $harness | Out-Null
        } else {
            & "$RepoRoot\install.ps1" -Harness $harness -Target $targetMode | Out-Null
        }
        
        $missing = @()
        $checkBase = if ($targetMode -eq "global") { $fakeHome } else { $targetDir }
        foreach ($file in $expectedFiles) {
            $fullPath = Join-Path $checkBase $file
            if (!(Test-Path $fullPath)) {
                $missing += $file
            }
        }
        
        if ($missing.Count -eq 0) {
            Write-Host "  [PASS] $testName ($($expectedFiles.Count) files verified)" -ForegroundColor Green
            return [PSCustomObject]@{ Test = $testName; Status = "PASS"; Missing = "" }
        } else {
            Write-Host "  [FAIL] $testName (Missing: $($missing -join ', '))" -ForegroundColor Red
            return [PSCustomObject]@{ Test = $testName; Status = "FAIL"; Missing = ($missing -join ', ') }
        }
    } finally {
        Pop-Location
        if ($targetMode -eq "global") {
            $env:USERPROFILE = $origHome
            $env:HOME = $origHome
        }
    }
}

# --- SECTION 1: Local Installation ---
Write-Host "`n--- Section 1: Local Installation Tests ---" -ForegroundColor Yellow

$results += Run-Harness-Test "local-antigravity" "local" "antigravity" @(
    "GEMINI.md",
    ".antigravity-plugin\plugin.json"
)

$results += Run-Harness-Test "local-gemini" "local" "gemini" @(
    "GEMINI.md",
    "gemini-extension.json"
)

$results += Run-Harness-Test "local-cursor" "local" "cursor" @(
    ".cursorrules",
    ".cursor-plugin\plugin.json",
    ".cursor\rules\00-constitution.mdc",
    ".cursor\rules\01-blast-radius.mdc",
    ".cursor\rules\02-anti-duplication.mdc",
    ".cursor\rules\03-tdd-discipline.mdc",
    ".cursor\rules\04-three-am-readability.mdc",
    ".cursor\rules\05-verification-gate.mdc"
)

$results += Run-Harness-Test "local-claude" "local" "claude" @(
    "CLAUDE.md",
    ".claude-plugin\plugin.json",
    ".claude-plugin\marketplace.json",
    ".claude\skills\qed-verify\SKILL.md",
    ".claude\skills\qed-review\SKILL.md",
    ".claude\skills\qed-blast-radius\SKILL.md",
    ".claude\commands\qed-verify.md",
    ".claude\commands\qed-review.md",
    ".claude\commands\qed-blast-radius.md"
)

$results += Run-Harness-Test "local-cline" "local" "cline" @(".clinerules")

$results += Run-Harness-Test "local-roo" "local" "roo" @(
    ".clinerules",
    ".roomodes"
)

$results += Run-Harness-Test "local-windsurf" "local" "windsurf" @(
    ".windsurfrules",
    ".windsurf\workflows\qed-spec-and-blast-radius.md",
    ".windsurf\workflows\qed-tdd-cycle.md",
    ".windsurf\workflows\qed-verification-gate.md"
)

$results += Run-Harness-Test "local-aider" "local" "aider" @(
    ".aider.conf.yml",
    ".aider.conventions.md"
)

$results += Run-Harness-Test "local-copilot" "local" "copilot" @(
    ".github\copilot-instructions.md",
    ".github\prompts\qed-spec.prompt.md",
    ".github\prompts\qed-verify.prompt.md",
    ".github\prompts\qed-tdd.prompt.md"
)

$results += Run-Harness-Test "local-opencode" "local" "opencode" @(
    "opencode.json",
    ".opencoderules",
    "OPENCODE.md"
)

$results += Run-Harness-Test "local-deepseek" "local" "deepseek" @(
    "DEEPSEEK.md",
    ".deepseekrules",
    ".dsh\config.json",
    ".continue\config.json",
    ".continue\prompts\qed-spec.prompt",
    ".continue\prompts\qed-verify.prompt"
)

$results += Run-Harness-Test "local-codex" "local" "codex" @(
    "CODEX.md",
    "AGENTS.md",
    ".codex-plugin\plugin.json"
)

$results += Run-Harness-Test "local-kimi" "local" "kimi" @(
    "KIMI.md",
    ".kimi-plugin\plugin.json"
)

$results += Run-Harness-Test "local-pi" "local" "pi" @(
    "PI.md",
    "package.json",
    ".pi\extensions\qed.ts"
)

$results += Run-Harness-Test "local-hermes" "local" "hermes" @(
    "HERMES.md",
    ".hermes-plugin\plugin.yaml",
    ".hermes-plugin\__init__.py"
)

$results += Run-Harness-Test "local-muse" "local" "muse" @(
    "MUSE.md",
    ".muse-plugin\plugin.json",
    ".muse-plugin\marketplace.json"
)

$results += Run-Harness-Test "local-devin" "local" "devin" @(
    "DEVIN.md",
    ".devin-plugin\plugin.json",
    ".devin\config.json"
)

$results += Run-Harness-Test "local-droid" "local" "droid" @(
    "DROID.md",
    ".agents\plugins\marketplace.json",
    ".droid\config.json"
)

$results += Run-Harness-Test "local-grok" "local" "grok" @(
    "GROK.md",
    ".grok-plugin\plugin.json",
    ".grok\config.json"
)

$results += Run-Harness-Test "local-qwen" "local" "qwen" @(
    "QWEN.md",
    ".qwenrules",
    ".qwen\config.json"
)

$results += Run-Harness-Test "local-all" "local" "all" @(
    "GEMINI.md",
    "gemini-extension.json",
    ".antigravity-plugin\plugin.json",
    ".cursorrules",
    ".cursor-plugin\plugin.json",
    ".cursor\rules\00-constitution.mdc",
    "CLAUDE.md",
    ".claude-plugin\plugin.json",
    ".claude\skills\qed-verify\SKILL.md",
    ".clinerules",
    ".roomodes",
    ".windsurfrules",
    ".aider.conf.yml",
    ".github\copilot-instructions.md",
    "opencode.json",
    "DEEPSEEK.md",
    "CODEX.md",
    "AGENTS.md",
    ".codex-plugin\plugin.json",
    "KIMI.md",
    ".kimi-plugin\plugin.json",
    "PI.md",
    "package.json",
    ".pi\extensions\qed.ts",
    "HERMES.md",
    ".hermes-plugin\plugin.yaml",
    "MUSE.md",
    ".muse-plugin\plugin.json",
    "DEVIN.md",
    ".devin-plugin\plugin.json",
    "DROID.md",
    ".agents\plugins\marketplace.json",
    "GROK.md",
    ".grok-plugin\plugin.json",
    "QWEN.md",
    ".qwenrules"
)

# --- SECTION 2: Positional Argument Handling ---
Write-Host "`n--- Section 2: Positional Argument Tests ---" -ForegroundColor Yellow

$results += Run-Harness-Test "positional-cursor" "local" "cursor" @(
    ".cursorrules",
    ".cursor\rules\00-constitution.mdc"
) -Positional

$results += Run-Harness-Test "positional-codex" "local" "codex" @(
    "CODEX.md",
    ".codex-plugin\plugin.json"
) -Positional

$results += Run-Harness-Test "positional-kimi" "local" "kimi" @(
    "KIMI.md",
    ".kimi-plugin\plugin.json"
) -Positional

# --- SECTION 3: Global Installation Tests ---
Write-Host "`n--- Section 3: Global Installation Tests ---" -ForegroundColor Yellow

$results += Run-Harness-Test "global-all" "global" "all" @(
    ".gemini\GEMINI.md",
    ".gemini\gemini-extension.json",
    ".cursorrules",
    ".cursor\rules\00-constitution.mdc",
    ".claude\CLAUDE.md",
    ".claude\skills\qed-verify\SKILL.md",
    ".clinerules",
    ".roomodes",
    ".windsurfrules",
    ".windsurf\workflows\qed-tdd-cycle.md",
    ".aider.conf.yml",
    ".github\copilot-instructions.md",
    ".opencoderules",
    ".opencode\opencode.json",
    ".deepseek\DEEPSEEK.md",
    ".deepseekrules",
    ".codex\CODEX.md",
    ".agents\AGENTS.md",
    ".kimi\KIMI.md",
    ".pi\PI.md",
    ".pi\package.json",
    ".hermes\HERMES.md",
    ".muse\MUSE.md",
    ".devin\DEVIN.md",
    ".droid\DROID.md",
    ".grok\GROK.md",
    ".qwen\QWEN.md",
    ".qwenrules"
)

# Cleanup
Remove-Item -Path $testRunDir -Recurse -Force -ErrorAction SilentlyContinue

$failed = $results | Where-Object { $_.Status -eq "FAIL" }
if ($failed.Count -gt 0) {
    Write-Error "Verification failed: $($failed.Count) tests failed."
    exit 1
} else {
    Write-Host "`nAll $($results.Count) verification tests PASSED successfully!" -ForegroundColor Green
}
