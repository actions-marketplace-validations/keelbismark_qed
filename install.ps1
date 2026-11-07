# Q.E.D. Installer for Windows (PowerShell)
param (
    [string]$Target = "local", # "local" for current repo, "global" for ~/.gemini / agent home
    [string]$Agent = "all"     # "antigravity", "cursor", "claude", "windsurf", "all"
)

Write-Host "Installing Q.E.D. High-Assurance Engineering Standard..." -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if ($Target -eq "global") {
    $GeminiHome = Join-Path $HOME ".gemini"
    if (!(Test-Path $GeminiHome)) { New-Item -ItemType Directory -Path $GeminiHome -Force | Out-Null }
    Copy-Item (Join-Path $ScriptDir "core\CONSTITUTION.md") (Join-Path $GeminiHome "GEMINI.md") -Force
    Write-Host "Installed Q.E.D. globally to $GeminiHome\GEMINI.md" -ForegroundColor Green
} else {
    # Local project installation
    if ($Agent -eq "all" -or $Agent -eq "antigravity") {
        Copy-Item (Join-Path $ScriptDir "adapters\antigravity\GEMINI.md") ".\GEMINI.md" -Force
        Write-Host "Installed Antigravity rules to .\GEMINI.md" -ForegroundColor Green
    }
    if ($Agent -eq "all" -or $Agent -eq "cursor") {
        Copy-Item (Join-Path $ScriptDir "adapters\cursor\.cursorrules") ".\.cursorrules" -Force
        Write-Host "Installed Cursor rules to .\.cursorrules" -ForegroundColor Green
    }
    if ($Agent -eq "all" -or $Agent -eq "claude") {
        Copy-Item (Join-Path $ScriptDir "adapters\claude-code\CLAUDE.md") ".\CLAUDE.md" -Force
        Write-Host "Installed Claude Code rules to .\CLAUDE.md" -ForegroundColor Green
    }
    if ($Agent -eq "all" -or $Agent -eq "windsurf") {
        Copy-Item (Join-Path $ScriptDir "adapters\windsurf\.windsurfrules") ".\.windsurfrules" -Force
        Write-Host "Installed Windsurf rules to .\.windsurfrules" -ForegroundColor Green
    }
    if ($Agent -eq "all" -or $Agent -eq "copilot") {
        if (!(Test-Path ".github")) { New-Item -ItemType Directory -Path ".github" -Force | Out-Null }
        Copy-Item (Join-Path $ScriptDir "adapters\copilot\copilot-instructions.md") ".\.github\copilot-instructions.md" -Force
        Write-Host "Installed Copilot rules to .\.github\copilot-instructions.md" -ForegroundColor Green
    }
}

Write-Host "Q.E.D. installation complete! Evidence Before Assertions." -ForegroundColor Cyan
