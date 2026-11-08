# Q.E.D. Adapter & Installer Verification Test Suite
# Tests install.ps1 across each harness in local, global, and positional modes

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir

Write-Host "Running Q.E.D. Comprehensive Verification Suite (PowerShell)..." -ForegroundColor Cyan

$testRunDir = Join-Path ([System.IO.Path]::GetTempPath()) ("qed-test-" + [System.Guid]::NewGuid().ToString().Substring(0, 8))
New-Item -ItemType Directory -Path $testRunDir -Force | Out-Null

$results = @()

function Run-Harness-Test([string]$testName, [string]$targetMode, [string]$harness, [string[]]$expectedFiles, [string[]]$unexpectedFiles = @(), [switch]$Positional, [switch]$Lite) {
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
            if ($Lite) {
                & "$RepoRoot\install.ps1" $harness -Lite | Out-Null
            } else {
                & "$RepoRoot\install.ps1" $harness | Out-Null
            }
        } else {
            if ($Lite) {
                & "$RepoRoot\install.ps1" -Harness $harness -Target $targetMode -Lite | Out-Null
            } else {
                & "$RepoRoot\install.ps1" -Harness $harness -Target $targetMode | Out-Null
            }
        }
        
        $missing = @()
        $unexpected = @()
        $checkBase = if ($targetMode -eq "global") { $fakeHome } else { $targetDir }
        foreach ($file in $expectedFiles) {
            $fullPath = Join-Path $checkBase $file
            if (!(Test-Path $fullPath)) {
                $missing += $file
            }
        }
        foreach ($file in $unexpectedFiles) {
            $fullPath = Join-Path $checkBase $file
            if (Test-Path $fullPath) {
                $unexpected += $file
            }
        }
        
        if ($missing.Count -eq 0 -and $unexpected.Count -eq 0) {
            Write-Host "  [PASS] $testName ($($expectedFiles.Count) files verified)" -ForegroundColor Green
            return [PSCustomObject]@{ Test = $testName; Status = "PASS"; Missing = ""; Unexpected = "" }
        } else {
            $errs = @()
            if ($missing.Count -gt 0) { $errs += "Missing: $($missing -join ', ')" }
            if ($unexpected.Count -gt 0) { $errs += "Unexpected: $($unexpected -join ', ')" }
            Write-Host "  [FAIL] $testName ($($errs -join '; '))" -ForegroundColor Red
            return [PSCustomObject]@{ Test = $testName; Status = "FAIL"; Missing = ($missing -join ', '); Unexpected = ($unexpected -join ', ') }
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
) -unexpectedFiles @(
    "GEMINI.lite.md",
    "QED.lite.md"
)

$results += Run-Harness-Test "local-gemini" "local" "gemini" @(
    "GEMINI.md",
    "gemini-extension.json"
) -unexpectedFiles @(
    "GEMINI.lite.md",
    "QED.lite.md"
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
) -unexpectedFiles @(
    ".cursorrules.lite",
    "QED.lite.md"
)

$results += Run-Harness-Test "local-claude" "local" "claude" @(
    "CLAUDE.md",
    ".claude-plugin\plugin.json",
    ".claude-plugin\marketplace.json",
    ".claude\skills\qed-verify\SKILL.md",
    ".claude\skills\qed-review\SKILL.md",
    ".claude\skills\qed-blast-radius\SKILL.md",
    ".claude\skills\qed-boost\SKILL.md",
    "skills\qed-verify\SKILL.md",
    "skills\qed-review\SKILL.md",
    "skills\qed-blast-radius\SKILL.md",
    "skills\qed-boost\SKILL.md",
    ".claude\commands\qed-verify.md",
    ".claude\commands\qed-review.md",
    ".claude\commands\qed-blast-radius.md",
    ".claude\commands\qed-boost.md",
    ".claude\commands\boost.md"
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
    ".windsurf\workflows\qed-verification-gate.md",
    ".windsurf\workflows\qed-boost.md"
)

$results += Run-Harness-Test "local-aider" "local" "aider" @(
    ".aider.conf.yml",
    ".aider.conventions.md"
)

$results += Run-Harness-Test "local-copilot" "local" "copilot" @(
    ".github\copilot-instructions.md",
    ".github\prompts\qed-spec.prompt.md",
    ".github\prompts\qed-verify.prompt.md",
    ".github\prompts\qed-tdd.prompt.md",
    ".github\prompts\qed-boost.prompt.md"
)

$results += Run-Harness-Test "local-opencode" "local" "opencode" @(
    "opencode.json",
    ".opencoderules",
    "OPENCODE.md",
    ".opencode\plugins\qed.js",
    "index.js"
)

$results += Run-Harness-Test "local-deepseek" "local" "deepseek" @(
    "DEEPSEEK.md",
    ".deepseekrules",
    ".dsh\config.json",
    ".continue\config.json",
    ".continue\prompts\qed-spec.prompt",
    ".continue\prompts\qed-verify.prompt",
    ".continue\prompts\qed-boost.prompt"
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
    ".claude\skills\qed-boost\SKILL.md",
    ".claude\commands\boost.md",
    ".clinerules",
    ".roomodes",
    ".windsurfrules",
    ".windsurf\workflows\qed-boost.md",
    ".aider.conf.yml",
    ".github\copilot-instructions.md",
    ".github\prompts\qed-boost.prompt.md",
    "opencode.json",
    ".opencode\plugins\qed.js",
    "index.js",
    "DEEPSEEK.md",
    ".continue\prompts\qed-boost.prompt",
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
    ".claude\skills\qed-boost\SKILL.md",
    ".claude\commands\boost.md",
    ".clinerules",
    ".roomodes",
    ".windsurfrules",
    ".windsurf\workflows\qed-tdd-cycle.md",
    ".windsurf\workflows\qed-boost.md",
    ".aider.conf.yml",
    ".github\copilot-instructions.md",
    ".github\prompts\qed-boost.prompt.md",
    ".opencoderules",
    ".opencode\opencode.json",
    ".opencode\plugins\qed.js",
    ".deepseek\DEEPSEEK.md",
    ".deepseekrules",
    ".continue\prompts\qed-boost.prompt",
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
# --- SECTION 4: Lite Mode Installation Tests ---
Write-Host "`n--- Section 4: Lite Mode Installation Tests ---" -ForegroundColor Yellow

$results += Run-Harness-Test "lite-antigravity" "local" "antigravity" @(
    "GEMINI.md",
    "GEMINI.lite.md",
    "QED.lite.md",
    ".antigravity-plugin\plugin.json"
) -Lite

$results += Run-Harness-Test "lite-gemini" "local" "gemini" @(
    "GEMINI.md",
    "GEMINI.lite.md",
    "QED.lite.md",
    "gemini-extension.json"
) -Lite

$results += Run-Harness-Test "lite-cursor" "local" "cursor" @(
    ".cursorrules",
    ".cursorrules.lite",
    ".cursor\rules\00-constitution.mdc",
    "QED.lite.md",
    ".cursor-plugin\plugin.json"
) -unexpectedFiles @(
    ".cursor\rules\01-blast-radius.mdc",
    ".cursor\rules\02-anti-duplication.mdc",
    ".cursor\rules\03-tdd-discipline.mdc",
    ".cursor\rules\04-three-am-readability.mdc",
    ".cursor\rules\05-verification-gate.mdc"
) -Lite

$results += Run-Harness-Test "lite-claude" "local" "claude" @(
    "CLAUDE.md",
    "CLAUDE.lite.md",
    "QED.lite.md",
    ".claude-plugin\plugin.json"
) -unexpectedFiles @(
    ".claude\skills\qed-verify\SKILL.md",
    "skills\qed-verify\SKILL.md",
    ".claude\commands\boost.md"
) -Lite

$results += Run-Harness-Test "lite-windsurf" "local" "windsurf" @(
    ".windsurfrules",
    ".windsurfrules.lite",
    "QED.lite.md"
) -unexpectedFiles @(
    ".windsurf\workflows\qed-tdd-cycle.md",
    ".windsurf\workflows\qed-boost.md"
) -Lite

$results += Run-Harness-Test "lite-copilot" "local" "copilot" @(
    ".github\copilot-instructions.md",
    ".github\copilot-instructions.lite.md",
    "QED.lite.md"
) -unexpectedFiles @(
    ".github\prompts\qed-spec.prompt.md",
    ".github\prompts\qed-boost.prompt.md"
) -Lite

$results += Run-Harness-Test "lite-cline" "local" "cline" @(
    ".clinerules",
    ".clinerules.lite",
    "QED.lite.md"
) -Lite

$results += Run-Harness-Test "lite-roo" "local" "roo" @(
    ".clinerules",
    ".clinerules.lite",
    ".roomodes",
    ".roomodes.lite",
    "QED.lite.md"
) -Lite

$results += Run-Harness-Test "lite-deepseek" "local" "deepseek" @(
    "DEEPSEEK.md",
    "DEEPSEEK.lite.md",
    ".deepseekrules",
    ".deepseekrules.lite",
    "QED.lite.md"
) -Lite

$results += Run-Harness-Test "lite-positional-cursor" "local" "cursor" @(
    ".cursorrules",
    ".cursorrules.lite",
    ".cursor\rules\00-constitution.mdc",
    "QED.lite.md"
) -Positional -Lite

$results += Run-Harness-Test "lite-all" "local" "all" @(
    "GEMINI.md",
    "GEMINI.lite.md",
    "CLAUDE.md",
    "CLAUDE.lite.md",
    ".cursorrules",
    ".cursorrules.lite",
    ".clinerules",
    ".clinerules.lite",
    "DEEPSEEK.md",
    "DEEPSEEK.lite.md",
    "CODEX.md",
    "CODEX.lite.md",
    "QED.lite.md"
) -Lite

# --- SECTION 5: qed update & Synchronization Tests ---
Write-Host "`n--- Section 5: qed update & Synchronization Tests ---" -ForegroundColor Yellow
$updateTestDir = Join-Path $testRunDir "update-test"
New-Item -ItemType Directory -Path $updateTestDir -Force | Out-Null
Set-Content -Path (Join-Path $updateTestDir "GEMINI.md") -Value "# Old Adapter without invariants"
$enginePath = Join-Path $repoRoot "bin\qed-engine.js"

& node $enginePath update $updateTestDir | Out-Null
$updatedContent = Get-Content -Path (Join-Path $updateTestDir "GEMINI.md") -Raw
if ($updatedContent -match "Leash Invariant") {
    Write-Host "  [PASS] qed-update-synchronization (GEMINI.md refreshed with latest invariants)" -ForegroundColor Green
    $results += [PSCustomObject]@{ Test = "qed-update"; Status = "PASS" }
} else {
    Write-Host "  [FAIL] qed-update-synchronization (GEMINI.md did not receive latest invariants)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "qed-update"; Status = "FAIL" }
}

# Cleanup
Remove-Item -Path $testRunDir -Recurse -Force -ErrorAction SilentlyContinue

$failed = $results | Where-Object { $_.Status -eq "FAIL" }
if ($failed.Count -gt 0) {
    Write-Error "Verification failed: $($failed.Count) tests failed."
    exit 1
} else {
    Write-Host "`nAll $($results.Count) verification tests PASSED successfully!" -ForegroundColor Green
}
