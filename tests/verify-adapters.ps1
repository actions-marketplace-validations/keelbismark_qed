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
            # Test positional syntax: install.ps1 cursor
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

$results += Run-Harness-Test "local-antigravity" "local" "antigravity" @("GEMINI.md")

$results += Run-Harness-Test "local-cursor" "local" "cursor" @(
    ".cursorrules",
    ".cursor\rules\00-constitution.mdc",
    ".cursor\rules\01-blast-radius.mdc",
    ".cursor\rules\02-anti-duplication.mdc",
    ".cursor\rules\03-tdd-discipline.mdc",
    ".cursor\rules\04-three-am-readability.mdc",
    ".cursor\rules\05-verification-gate.mdc"
)

$results += Run-Harness-Test "local-claude" "local" "claude" @(
    "CLAUDE.md",
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

$results += Run-Harness-Test "local-all" "local" "all" @(
    "GEMINI.md",
    ".cursorrules",
    ".cursor\rules\00-constitution.mdc",
    "CLAUDE.md",
    ".claude\skills\qed-verify\SKILL.md",
    ".claude\commands\qed-verify.md",
    ".clinerules",
    ".roomodes",
    ".windsurfrules",
    ".windsurf\workflows\qed-tdd-cycle.md",
    ".aider.conf.yml",
    ".aider.conventions.md",
    ".github\copilot-instructions.md",
    ".github\prompts\qed-spec.prompt.md",
    "opencode.json",
    ".opencoderules",
    "DEEPSEEK.md",
    ".deepseekrules",
    ".dsh\config.json",
    ".continue\config.json"
)

# --- SECTION 2: Positional Argument Handling ---
Write-Host "`n--- Section 2: Positional Argument Tests ---" -ForegroundColor Yellow

$results += Run-Harness-Test "positional-cursor" "local" "cursor" @(
    ".cursorrules",
    ".cursor\rules\00-constitution.mdc"
) -Positional

# --- SECTION 3: Global Installation Tests ---
Write-Host "`n--- Section 3: Global Installation Tests ---" -ForegroundColor Yellow

$results += Run-Harness-Test "global-all" "global" "all" @(
    ".gemini\GEMINI.md",
    ".cursorrules",
    ".cursor\rules\00-constitution.mdc",
    ".claude\CLAUDE.md",
    ".claude\skills\qed-verify\SKILL.md",
    ".claude\commands\qed-verify.md",
    ".clinerules",
    ".roomodes",
    ".windsurfrules",
    ".windsurf\workflows\qed-tdd-cycle.md",
    ".aider.conf.yml",
    ".aider.conventions.md",
    ".github\copilot-instructions.md",
    ".github\prompts\qed-spec.prompt.md",
    ".opencoderules",
    ".opencode\opencode.json",
    ".opencode\OPENCODE.md",
    ".deepseek\DEEPSEEK.md",
    ".deepseekrules",
    ".dsh\config.json",
    ".continue\config.json"
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
