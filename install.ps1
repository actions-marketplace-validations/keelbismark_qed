# Q.E.D. Installer for Windows (PowerShell)
# Usage:
#   .\install.ps1 -Harness cursor
#   .\install.ps1 -Harness all -Target local
#   .\install.ps1 -Target global -Harness antigravity

param (
    [string]$Target = "local",  # "local" for project directory, "global" for user profile home
    [string]$Harness = "all",   # "all", "antigravity", "cursor", "claude", "cline", "roo", "windsurf", "aider", "copilot", "opencode"
    [string]$Agent = ""         # Backwards-compatible alias for -Harness
)

if ($Agent -ne "" -and $Harness -eq "all") {
    $Harness = $Agent
}

$Harness = $Harness.ToLower().Trim()
$Target = $Target.ToLower().Trim()

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Q.E.D. (Quod Erat Demonstrandum) Installer" -ForegroundColor Cyan
Write-Host " Evidence Before Assertions" -ForegroundColor DarkGray
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Target mode: $Target" -ForegroundColor White
Write-Host "Selected harness: $Harness`n" -ForegroundColor White

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Ensure-Dir($path) {
    if (!(Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
    }
}

function Copy-Safe($src, $dest) {
    if (Test-Path $src) {
        $parent = Split-Path -Parent $dest
        if ($parent -and !(Test-Path $parent)) { Ensure-Dir $parent }
        Copy-Item -Path $src -Destination $dest -Recurse -Force
        Write-Host "  [+] Installed $dest" -ForegroundColor Green
    } else {
        Write-Warning "Source not found: $src"
    }
}

if ($Target -eq "global") {
    Write-Host "Installing Q.E.D. globally to user home..." -ForegroundColor Yellow
    
    if ($Harness -eq "all" -or $Harness -eq "antigravity" -or $Harness -eq "gemini") {
        $GeminiHome = Join-Path $HOME ".gemini"
        Ensure-Dir $GeminiHome
        Copy-Safe (Join-Path $ScriptDir "core\CONSTITUTION.md") (Join-Path $GeminiHome "GEMINI.md")
    }
    if ($Harness -eq "all" -or $Harness -eq "cursor") {
        Copy-Safe (Join-Path $ScriptDir "adapters\cursor\.cursorrules") (Join-Path $HOME ".cursorrules")
    }
    if ($Harness -eq "all" -or $Harness -eq "claude" -or $Harness -eq "claude-code") {
        $ClaudeHome = Join-Path $HOME ".claude"
        Ensure-Dir $ClaudeHome
        Copy-Safe (Join-Path $ScriptDir "adapters\claude-code\CLAUDE.md") (Join-Path $ClaudeHome "CLAUDE.md")
        Copy-Safe (Join-Path $ScriptDir "adapters\claude-code\.claude\skills") (Join-Path $ClaudeHome "skills")
    }
    if ($Harness -eq "all" -or $Harness -eq "cline") {
        Copy-Safe (Join-Path $ScriptDir "adapters\cline\.clinerules") (Join-Path $HOME ".clinerules")
    }
    if ($Harness -eq "all" -or $Harness -eq "roo" -or $Harness -eq "roo-code") {
        Copy-Safe (Join-Path $ScriptDir "adapters\roo-code\.clinerules") (Join-Path $HOME ".clinerules")
        Copy-Safe (Join-Path $ScriptDir "adapters\roo-code\.roomodes") (Join-Path $HOME ".roomodes")
    }
    if ($Harness -eq "all" -or $Harness -eq "windsurf") {
        Copy-Safe (Join-Path $ScriptDir "adapters\windsurf\.windsurfrules") (Join-Path $HOME ".windsurfrules")
    }
    if ($Harness -eq "all" -or $Harness -eq "aider") {
        Copy-Safe (Join-Path $ScriptDir "adapters\aider\.aider.conf.yml") (Join-Path $HOME ".aider.conf.yml")
        Copy-Safe (Join-Path $ScriptDir "adapters\aider\.aider.conventions.md") (Join-Path $HOME ".aider.conventions.md")
    }
    if ($Harness -eq "all" -or $Harness -eq "opencode") {
        Copy-Safe (Join-Path $ScriptDir "adapters\opencode\.opencoderules") (Join-Path $HOME ".opencoderules")
    }
} else {
    Write-Host "Installing Q.E.D. locally to current project directory..." -ForegroundColor Yellow
    
    # 1. Antigravity
    if ($Harness -eq "all" -or $Harness -eq "antigravity" -or $Harness -eq "gemini") {
        Write-Host "`nConfiguring Google Antigravity..." -ForegroundColor Cyan
        Copy-Safe (Join-Path $ScriptDir "adapters\antigravity\GEMINI.md") ".\GEMINI.md"
    }

    # 2. Cursor
    if ($Harness -eq "all" -or $Harness -eq "cursor") {
        Write-Host "`nConfiguring Cursor (Legacy & Modern MDC Rules)..." -ForegroundColor Cyan
        Copy-Safe (Join-Path $ScriptDir "adapters\cursor\.cursorrules") ".\.cursorrules"
        Ensure-Dir ".\.cursor\rules"
        Copy-Safe (Join-Path $ScriptDir "adapters\cursor\.cursor\rules\*") ".\.cursor\rules"
    }

    # 3. Claude Code
    if ($Harness -eq "all" -or $Harness -eq "claude" -or $Harness -eq "claude-code") {
        Write-Host "`nConfiguring Claude Code (CLAUDE.md & Custom Skills)..." -ForegroundColor Cyan
        Copy-Safe (Join-Path $ScriptDir "adapters\claude-code\CLAUDE.md") ".\CLAUDE.md"
        Ensure-Dir ".\.claude\skills"
        Copy-Safe (Join-Path $ScriptDir "adapters\claude-code\.claude\skills\*") ".\.claude\skills"
    }

    # 4. Cline
    if ($Harness -eq "all" -or $Harness -eq "cline") {
        Write-Host "`nConfiguring Cline..." -ForegroundColor Cyan
        Copy-Safe (Join-Path $ScriptDir "adapters\cline\.clinerules") ".\.clinerules"
    }

    # 5. Roo Code
    if ($Harness -eq "all" -or $Harness -eq "roo" -or $Harness -eq "roo-code") {
        Write-Host "`nConfiguring Roo Code (Architect, TDD Engineer & Reviewer modes)..." -ForegroundColor Cyan
        Copy-Safe (Join-Path $ScriptDir "adapters\roo-code\.clinerules") ".\.clinerules"
        Copy-Safe (Join-Path $ScriptDir "adapters\roo-code\.roomodes") ".\.roomodes"
    }

    # 6. Windsurf
    if ($Harness -eq "all" -or $Harness -eq "windsurf") {
        Write-Host "`nConfiguring Windsurf Cascade (Rules & Workflows)..." -ForegroundColor Cyan
        Copy-Safe (Join-Path $ScriptDir "adapters\windsurf\.windsurfrules") ".\.windsurfrules"
        Ensure-Dir ".\.windsurf\workflows"
        Copy-Safe (Join-Path $ScriptDir "adapters\windsurf\.windsurf\workflows\*") ".\.windsurf\workflows"
    }

    # 7. Aider
    if ($Harness -eq "all" -or $Harness -eq "aider") {
        Write-Host "`nConfiguring Aider..." -ForegroundColor Cyan
        Copy-Safe (Join-Path $ScriptDir "adapters\aider\.aider.conf.yml") ".\.aider.conf.yml"
        Copy-Safe (Join-Path $ScriptDir "adapters\aider\.aider.conventions.md") ".\.aider.conventions.md"
    }

    # 8. GitHub Copilot
    if ($Harness -eq "all" -or $Harness -eq "copilot" -or $Harness -eq "github-copilot") {
        Write-Host "`nConfiguring GitHub Copilot (Instructions & Prompt Files)..." -ForegroundColor Cyan
        Ensure-Dir ".\.github\prompts"
        Copy-Safe (Join-Path $ScriptDir "adapters\copilot\.github\copilot-instructions.md") ".\.github\copilot-instructions.md"
        Copy-Safe (Join-Path $ScriptDir "adapters\copilot\.github\prompts\*") ".\.github\prompts"
    }

    # 9. OpenCode
    if ($Harness -eq "all" -or $Harness -eq "opencode") {
        Write-Host "`nConfiguring OpenCode..." -ForegroundColor Cyan
        Copy-Safe (Join-Path $ScriptDir "adapters\opencode\opencode.json") ".\opencode.json"
        Copy-Safe (Join-Path $ScriptDir "adapters\opencode\.opencoderules") ".\.opencoderules"
        Copy-Safe (Join-Path $ScriptDir "adapters\opencode\OPENCODE.md") ".\OPENCODE.md"
    }
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host " Q.E.D. installation complete! Evidence Before Assertions." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
