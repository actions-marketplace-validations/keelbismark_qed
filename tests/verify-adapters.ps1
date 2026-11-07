# Q.E.D. Adapter & Installer Verification Test Suite
# Tests install.ps1 across each harness and validates created file structures

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir

Write-Host "Running Q.E.D. Verification Suite..." -ForegroundColor Cyan

$testRunDir = Join-Path ([System.IO.Path]::GetTempPath()) ("qed-test-" + [System.Guid]::NewGuid().ToString().Substring(0, 8))
New-Item -ItemType Directory -Path $testRunDir -Force | Out-Null

$results = @()

function Run-Harness-Test([string]$harness, [string[]]$expectedFiles) {
    $targetDir = Join-Path $testRunDir $harness
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    
    Push-Location $targetDir
    try {
        & "$RepoRoot\install.ps1" -Harness $harness -Target "local" | Out-Null
        
        $missing = @()
        foreach ($file in $expectedFiles) {
            if (!(Test-Path $file)) {
                $missing += $file
            }
        }
        
        if ($missing.Count -eq 0) {
            Write-Host "  [PASS] Harness: $harness ($($expectedFiles.Count) files verified)" -ForegroundColor Green
            return [PSCustomObject]@{ Harness = $harness; Status = "PASS"; Missing = "" }
        } else {
            Write-Host "  [FAIL] Harness: $harness (Missing: $($missing -join ', '))" -ForegroundColor Red
            return [PSCustomObject]@{ Harness = $harness; Status = "FAIL"; Missing = ($missing -join ', ') }
        }
    } finally {
        Pop-Location
    }
}

# 1. Antigravity
$results += Run-Harness-Test "antigravity" @("GEMINI.md")

# 2. Cursor
$results += Run-Harness-Test "cursor" @(
    ".cursorrules",
    ".cursor\rules\00-constitution.mdc",
    ".cursor\rules\01-blast-radius.mdc",
    ".cursor\rules\02-anti-duplication.mdc",
    ".cursor\rules\03-tdd-discipline.mdc",
    ".cursor\rules\04-three-am-readability.mdc",
    ".cursor\rules\05-verification-gate.mdc"
)

# 3. Claude Code
$results += Run-Harness-Test "claude" @(
    "CLAUDE.md",
    ".claude\skills\qed-verify\SKILL.md",
    ".claude\skills\qed-review\SKILL.md",
    ".claude\skills\qed-blast-radius\SKILL.md"
)

# 4. Cline
$results += Run-Harness-Test "cline" @(".clinerules")

# 5. Roo Code
$results += Run-Harness-Test "roo" @(
    ".clinerules",
    ".roomodes"
)

# 6. Windsurf
$results += Run-Harness-Test "windsurf" @(
    ".windsurfrules",
    ".windsurf\workflows\qed-spec-and-blast-radius.md",
    ".windsurf\workflows\qed-tdd-cycle.md",
    ".windsurf\workflows\qed-verification-gate.md"
)

# 7. Aider
$results += Run-Harness-Test "aider" @(
    ".aider.conf.yml",
    ".aider.conventions.md"
)

# 8. GitHub Copilot
$results += Run-Harness-Test "copilot" @(
    ".github\copilot-instructions.md",
    ".github\prompts\qed-spec.prompt.md",
    ".github\prompts\qed-verify.prompt.md",
    ".github\prompts\qed-tdd.prompt.md"
)

# 9. OpenCode
$results += Run-Harness-Test "opencode" @(
    "opencode.json",
    ".opencoderules",
    "OPENCODE.md"
)

# 10. All
$results += Run-Harness-Test "all" @(
    "GEMINI.md",
    ".cursorrules",
    ".cursor\rules\00-constitution.mdc",
    "CLAUDE.md",
    ".claude\skills\qed-verify\SKILL.md",
    ".clinerules",
    ".roomodes",
    ".windsurfrules",
    ".windsurf\workflows\qed-tdd-cycle.md",
    ".aider.conf.yml",
    ".aider.conventions.md",
    ".github\copilot-instructions.md",
    ".github\prompts\qed-spec.prompt.md",
    "opencode.json",
    ".opencoderules"
)

# Cleanup
Remove-Item -Path $testRunDir -Recurse -Force -ErrorAction SilentlyContinue

$failed = $results | Where-Object { $_.Status -eq "FAIL" }
if ($failed.Count -gt 0) {
    Write-Error "Verification failed: $($failed.Count) harness tests failed."
    exit 1
} else {
    Write-Host "`nAll $($results.Count) harness tests PASSED successfully!" -ForegroundColor Green
}
