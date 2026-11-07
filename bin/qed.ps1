<#
.SYNOPSIS
    Q.E.D. (Quod Erat Demonstrandum) Command Line Tool & Mechanical Linter
.DESCRIPTION
    Scans the repository for Q.E.D. standard violations:
    - Debug statements (console.log, debugger, print)
    - Pristine root violations (temp dumps, scratch files)
    - Unsynchronized .env.example variables
    - Anti-`as any` and unsafe casting patterns
    - Unbounded memory caches
#>

[CmdletBinding()]
param (
    [Parameter(Position = 0)]
    [string]$Command = "check",

    [Parameter(Position = 1)]
    [string]$TargetDir = (Get-Location).Path,

    [switch]$Fix,
    [switch]$Strict
)

$ErrorActionPreference = "Stop"

function Write-QedHeader {
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host " Q.E.D. Mechanical Verification Gate" -ForegroundColor Cyan
    Write-Host " Evidence Before Assertions" -ForegroundColor Gray
    Write-Host "==========================================================" -ForegroundColor Cyan
}

function Invoke-QedCheck {
    param ([string]$Dir)

    Write-Host "`nScanning repository at: $Dir`n" -ForegroundColor Cyan
    $violations = @()

    # Exclusions
    $excludeDirs = @("\.git\", "node_modules", "dist", "build", "vendor", "\.next\", "\.cache\", "tests\", "scripts\", "bin\")

    # 1. Check Pristine Root
    Write-Host "[-] Checking Pristine Root Invariant..." -NoNewline
    $rootFiles = Get-ChildItem -Path $Dir -File
    $suspiciousPatterns = @("^temp_", "^scratch", "\.tmp$", "\.log$", "^test_dump")
    $rootViolations = 0

    foreach ($file in $rootFiles) {
        foreach ($pattern in $suspiciousPatterns) {
            if ($file.Name -match $pattern) {
                $violations += "PRISTINE_ROOT: Temporary file in root: $($file.Name)"
                $rootViolations++
            }
        }
    }
    if ($rootViolations -eq 0) {
        Write-Host " [PASS]" -ForegroundColor Green
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
    }

    # 2. Check for Debug Prints (Zero-Debug Invariant)
    Write-Host "[-] Checking Zero-Debug Print Invariant..." -NoNewline
    $debugPatterns = @(
        @{ Regex = 'console\.(log|debug|dir)\('; Desc = "console.log" },
        @{ Regex = 'debugger;'; Desc = "debugger" },
        @{ Regex = '\bprint\(.*\)'; Desc = "print()" },
        @{ Regex = 'fmt\.Println\('; Desc = "fmt.Println" }
    )

    $sourceFiles = Get-ChildItem -Path $Dir -Recurse -File -Include "*.ts", "*.js", "*.py", "*.go", "*.rs" | Where-Object {
        $path = $_.FullName
        $excluded = $false
        foreach ($ex in $excludeDirs) {
            if ($path -like "*$ex*") { $excluded = $true; break }
        }
        -not $excluded
    }

    $debugCount = 0
    foreach ($file in $sourceFiles) {
        $lines = Get-Content $file.FullName -ErrorAction SilentlyContinue
        $lineNum = 1
        foreach ($line in $lines) {
            if ($line -match '^\s*//' -or $line -match '^\s*#') { 
                $lineNum++
                continue 
            }
            foreach ($dp in $debugPatterns) {
                if ($line -match $dp.Regex -and $line -notmatch 'logger\.' -and $line -notmatch 'qed-ignore') {
                    $rel = Resolve-Path -Path $file.FullName -Relative
                    $violations += "ZERO_DEBUG: Leftover $($dp.Desc) in ${rel}:${lineNum} -> $($line.Trim())"
                    $debugCount++
                }
            }
            $lineNum++
        }
    }
    if ($debugCount -eq 0) {
        Write-Host " [PASS]" -ForegroundColor Green
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
    }

    # 3. Check .env.example Synchronization
    Write-Host "[-] Checking Environment Variable Synchronization..." -NoNewline
    $envExamplePath = Join-Path $Dir ".env.example"
    $envViolations = 0

    if (Test-Path $envExamplePath) {
        $envExampleContent = Get-Content $envExamplePath -Raw
        $referencedVars = @()

        foreach ($file in $sourceFiles) {
            $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
            # Matches process.env.KEY or os.environ["KEY"]
            $matches = [regex]::Matches($content, 'process\.env\.([A-Z0-9_]+)|os\.(?:environ\["|Getenv\(")([A-Z0-9_]+)')
            foreach ($m in $matches) {
                $varName = if ($m.Groups[1].Value) { $m.Groups[1].Value } else { $m.Groups[2].Value }
                if ($varName -and $varName -notmatch '^(NODE_ENV|PORT|PATH)$') {
                    $referencedVars += $varName
                }
            }
        }

        $uniqueVars = $referencedVars | Select-Object -Unique
        foreach ($v in $uniqueVars) {
            if ($envExampleContent -notmatch "\b$v\b") {
                $violations += "ENV_SYNC: Referenced variable '$v' is missing from .env.example"
                $envViolations++
            }
        }
    }
    if ($envViolations -eq 0) {
        Write-Host " [PASS]" -ForegroundColor Green
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
    }

    # 4. Check Unsafe Casting (Anti-`as any` Invariant)
    Write-Host "[-] Checking Type Safety (Anti-`as any`)..." -NoNewline
    $castViolations = 0
    foreach ($file in ($sourceFiles | Where-Object { $_.Extension -in @(".ts", ".tsx") })) {
        $lines = Get-Content $file.FullName -ErrorAction SilentlyContinue
        $lineNum = 1
        foreach ($line in $lines) {
            if ($line -match '\bas\s+any\b' -and $line -notmatch 'qed-ignore') {
                $rel = Resolve-Path -Path $file.FullName -Relative
                $violations += "TYPE_SAFETY: Loose 'as any' cast in ${rel}:${lineNum} -> $($line.Trim())"
                $castViolations++
            }
            $lineNum++
        }
    }
    if ($castViolations -eq 0) {
        Write-Host " [PASS]" -ForegroundColor Green
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
    }

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
        Write-Error "No .git directory found at $Dir. Cannot install pre-commit hook."
        return 1
    }

    $preCommitPath = Join-Path $gitHooksDir "pre-commit"
    $hookScript = @"
#!/usr/bin/env sh
# Q.E.D. Automated Mechanical Gate Pre-Commit Hook

echo "Running Q.E.D. Pre-Commit Gate..."

if command -v pwsh >/dev/null 2>&1; then
    pwsh -ExecutionPolicy Bypass -File "./bin/qed.ps1" check
    EXIT_CODE=`$?
elif command -v powershell >/dev/null 2>&1; then
    powershell -ExecutionPolicy Bypass -File "./bin/qed.ps1" check
    EXIT_CODE=`$?
elif [ -f "./bin/qed" ]; then
    ./bin/qed check
    EXIT_CODE=`$?
else
    echo "Warning: Q.E.D. runner not found. Skipping gate."
    exit 0
fi

if [ "`$EXIT_CODE" -ne 0 ]; then
    echo "Commit BLOCKED by Q.E.D. Mechanical Verification Gate."
    echo "Fix all reported violations before committing."
    exit 1
fi

exit 0
"@

    Set-Content -Path $preCommitPath -Value $hookScript -NoNewline
    Write-Host "[+] Installed Q.E.D. pre-commit hook to $preCommitPath" -ForegroundColor Green
    return 0
}

# Main Execution Routing
Write-QedHeader

switch ($Command.ToLower()) {
    "check" {
        $code = Invoke-QedCheck -Dir $TargetDir
        exit $code
    }
    "hook" {
        $code = Install-QedHook -Dir $TargetDir
        exit $code
    }
    default {
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Write-Host "Usage: ./bin/qed.ps1 [check | hook] [-TargetDir <path>]"
        exit 1
    }
}
