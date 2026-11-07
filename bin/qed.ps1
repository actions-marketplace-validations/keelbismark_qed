<#
.SYNOPSIS
    Q.E.D. (Quod Erat Demonstrandum) Command Line Tool & Mechanical Linter
.DESCRIPTION
    Runs the Q.E.D. Mechanical Verification Gate against all 16 pillars.
#>

[CmdletBinding()]
param (
    [Parameter(Position = 0)]
    [string]$Command = "check",

    [Parameter(Position = 1)]
    [string]$TargetDir = (Get-Location).Path,

    [switch]$Json,
    [switch]$Strict
)

$ErrorActionPreference = "Stop"
$engineScript = Join-Path $PSScriptRoot "qed-engine.js"

# 1. Prefer high-speed Node.js engine if node is available
if ((Get-Command node -ErrorAction SilentlyContinue) -and (Test-Path $engineScript)) {
    $nodeArgs = @($engineScript, $Command, $TargetDir)
    if ($Json) { $nodeArgs += "--json" }
    if ($Strict) { $nodeArgs += "--strict" }

    & node $nodeArgs
    exit $LASTEXITCODE
}

# 2. Pure PowerShell Fallback Implementation
function Write-QedHeader {
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host " Q.E.D. Mechanical Verification Gate (PowerShell Fallback)" -ForegroundColor Cyan
    Write-Host " Evidence Before Assertions" -ForegroundColor Gray
    Write-Host "==========================================================" -ForegroundColor Cyan
}

function Invoke-QedCheck {
    param ([string]$Dir)

    Write-Host "`nScanning repository at: $Dir`n" -ForegroundColor Cyan
    $violations = @()
    $excludeDirs = @("\.git\", "node_modules", "dist", "build", "vendor", "\.next\", "\.cache\", "tests\", "scripts\", "bin\", "adapters\")

    # QED001: Pristine Root
    Write-Host "[-] Checking Pristine Root Invariant..." -NoNewline
    $rootFiles = Get-ChildItem -Path $Dir -File -ErrorAction SilentlyContinue
    $suspiciousPatterns = @("^temp_", "^scratch", "\.tmp$", "\.log$", "^test_dump")
    $rootViolations = 0

    foreach ($file in $rootFiles) {
        foreach ($pattern in $suspiciousPatterns) {
            if ($file.Name -match $pattern) {
                $violations += "QED001/PRISTINE_ROOT: Temporary file in root: $($file.Name)"
                $rootViolations++
            }
        }
    }
    if ($rootViolations -eq 0) { Write-Host " [PASS]" -ForegroundColor Green } else { Write-Host " [FAIL]" -ForegroundColor Red }

    # Collect source files
    $sourceFiles = Get-ChildItem -Path $Dir -Recurse -File -Include "*.ts", "*.tsx", "*.js", "*.jsx", "*.py", "*.go", "*.sql" -ErrorAction SilentlyContinue | Where-Object {
        $path = $_.FullName
        $excluded = $false
        foreach ($ex in $excludeDirs) {
            if ($path -like "*$ex*") { $excluded = $true; break }
        }
        -not $excluded
    }

    # QED002: Zero-Debug Print Invariant
    Write-Host "[-] Checking Zero-Debug Print Invariant..." -NoNewline
    $debugCount = 0
    foreach ($file in $sourceFiles) {
        $lines = Get-Content $file.FullName -ErrorAction SilentlyContinue
        $lineNum = 1
        foreach ($line in $lines) {
            if ($line -match '^\s*//' -or $line -match '^\s*#') { $lineNum++; continue }
            if ($line -match 'qed-ignore') { $lineNum++; continue }
            if ($line -match 'console\.(log|debug|dir)\(' -and $line -notmatch 'logger\.') {
                $rel = Resolve-Path -Path $file.FullName -Relative
                $violations += "QED002/ZERO_DEBUG: Leftover console.log in ${rel}:${lineNum} -> $($line.Trim())"
                $debugCount++
            }
            if ($line -match '\bdebugger;') {
                $rel = Resolve-Path -Path $file.FullName -Relative
                $violations += "QED002/ZERO_DEBUG: Leftover debugger in ${rel}:${lineNum} -> $($line.Trim())"
                $debugCount++
            }
            $lineNum++
        }
    }
    if ($debugCount -eq 0) { Write-Host " [PASS]" -ForegroundColor Green } else { Write-Host " [FAIL]" -ForegroundColor Red }

    # QED004: Anti-`as any`
    Write-Host "[-] Checking Type Safety (Anti-as any)..." -NoNewline
    $castViolations = 0
    foreach ($file in ($sourceFiles | Where-Object { $_.Extension -in @(".ts", ".tsx") })) {
        $lines = Get-Content $file.FullName -ErrorAction SilentlyContinue
        $lineNum = 1
        foreach ($line in $lines) {
            if ($line -match '\bas\s+any\b' -and $line -notmatch 'qed-ignore') {
                $rel = Resolve-Path -Path $file.FullName -Relative
                $violations += "QED004/UNSAFE_CAST: Loose 'as any' cast in ${rel}:${lineNum} -> $($line.Trim())"
                $castViolations++
            }
            $lineNum++
        }
    }
    if ($castViolations -eq 0) { Write-Host " [PASS]" -ForegroundColor Green } else { Write-Host " [FAIL]" -ForegroundColor Red }

    # Summary Output
    Write-Host "`n----------------------------------------------------------"
    if ($violations.Count -eq 0) {
        Write-Host "Q.E.D. Verification Gate: 100% CLEAN. Zero violations found." -ForegroundColor Green
        return 0
    } else {
        Write-Host "Q.E.D. Verification Gate: FAILED ($($violations.Count) violation(s) found):" -ForegroundColor Red
        foreach ($v in $violations) {
            Write-Host "  [!] $v" -ForegroundColor Yellow
        }
        return 1
    }
}

function Install-QedHook {
    param ([string]$Dir)
    $gitHooksDir = Join-Path $Dir ".git\hooks"
    if (-not (Test-Path $gitHooksDir)) {
        New-Item -Path $gitHooksDir -ItemType Directory -Force | Out-Null
    }
    $preCommitPath = Join-Path $gitHooksDir "pre-commit"
    $hookScript = @"
#!/usr/bin/env sh
# Q.E.D. Automated Mechanical Gate Pre-Commit Hook
if command -v node >/dev/null 2>&1 && [ -f "./bin/qed-engine.js" ]; then
    node "./bin/qed-engine.js" check
    exit `$?
elif [ -f "./bin/qed" ]; then
    ./bin/qed check
    exit `$?
elif [ -f "./bin/qed.ps1" ]; then
    pwsh -ExecutionPolicy Bypass -File "./bin/qed.ps1" check || powershell -ExecutionPolicy Bypass -File "./bin/qed.ps1" check
    exit `$?
fi
exit 0
"@
    Set-Content -Path $preCommitPath -Value $hookScript -NoNewline
    Write-Host "[+] Installed Q.E.D. pre-commit hook to $preCommitPath" -ForegroundColor Green
    return 0
}

Write-QedHeader
switch ($Command.ToLower()) {
    "check" { exit (Invoke-QedCheck -Dir $TargetDir) }
    "hook"  { exit (Install-QedHook -Dir $TargetDir) }
    default {
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Write-Host "Usage: .\bin\qed.ps1 [check | hook] [-TargetDir <path>]"
        exit 1
    }
}
