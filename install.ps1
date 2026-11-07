# Q.E.D. Installer for Windows (PowerShell)
# Usage:
#   .\install.ps1 -Harness cursor
#   .\install.ps1 cursor
#   .\install.ps1 -Harness all -Target local
#   .\install.ps1 -Target global -Harness antigravity
#   irm https://raw.githubusercontent.com/keelbismark/qed/main/install.ps1 | iex

param (
    [string]$Target = "local",  # "local" for project directory, "global" for user profile home
    [string]$Harness = "all",   # "all", "antigravity", "cursor", "claude", "cline", "roo", "windsurf", "aider", "copilot", "opencode"
    [string]$Agent = ""         # Backwards-compatible alias for -Harness
)

# Handle backwards-compatible alias
if ($Agent -ne "" -and $Harness -eq "all") {
    $Harness = $Agent
}

# Handle positional arguments when first param is harness name (e.g. .\install.ps1 cursor)
$knownHarnesses = @(
    "antigravity", "gemini", "cursor", "claude", "claude-code", 
    "cline", "roo", "roo-code", "windsurf", "aider", 
    "copilot", "github-copilot", "opencode", "deepseek", "dsh", "deepseek-harness", "all"
)

$targetNormalized = $Target.ToLower().Trim()
if ($targetNormalized -ne "local" -and $targetNormalized -ne "global" -and ($knownHarnesses -contains $targetNormalized)) {
    if ($Harness -eq "all") {
        $Harness = $targetNormalized
        $Target = "local"
    }
}

$Harness = $Harness.ToLower().Trim()
$Target = $Target.ToLower().Trim()

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Q.E.D. (Quod Erat Demonstrandum) Installer" -ForegroundColor Cyan
Write-Host " Evidence Before Assertions" -ForegroundColor DarkGray
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Target mode: $Target" -ForegroundColor White
Write-Host "Selected harness: $Harness`n" -ForegroundColor White

$ScriptDir = ""
if ($MyInvocation.MyCommand -and $MyInvocation.MyCommand.Path) {
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}
$IsLocal = ($ScriptDir -ne "" -and (Test-Path (Join-Path $ScriptDir "adapters")))
$RawBaseUrl = "https://raw.githubusercontent.com/keelbismark/qed/main"

$script:installedCount = 0
$script:failedCount = 0

function Ensure-Dir($path) {
    if (!(Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
    }
}

function Install-File($relSrc, $dest) {
    try {
        $parent = Split-Path -Parent $dest
        if ($parent -and !(Test-Path $parent)) { Ensure-Dir $parent }

        if ($IsLocal) {
            $localSrc = Join-Path $ScriptDir $relSrc
            if (Test-Path $localSrc) {
                Copy-Item -Path $localSrc -Destination $dest -Force
                Write-Host "  [+] Installed $dest" -ForegroundColor Green
                $script:installedCount++
            } else {
                Write-Warning "Source file not found: $localSrc"
                $script:failedCount++
            }
        } else {
            # Remote download mode
            $url = "$RawBaseUrl/" + ($relSrc -replace '\\', '/')
            Invoke-RestMethod -Uri $url -OutFile $dest -TimeoutSec 15
            Write-Host "  [+] Downloaded $dest" -ForegroundColor Green
            $script:installedCount++
        }
    } catch {
        Write-Error "Failed to install $dest : $_"
        $script:failedCount++
    }
}

$userHome = if ($env:USERPROFILE) { $env:USERPROFILE } elseif ($env:HOME) { $env:HOME } else { $HOME }
$baseDir = if ($Target -eq "global") { $userHome } else { "." }

if ($Target -eq "global") {
    Write-Host "Installing Q.E.D. globally to user profile ($baseDir)..." -ForegroundColor Yellow
} else {
    Write-Host "Installing Q.E.D. locally to current project directory..." -ForegroundColor Yellow
}

# 1. Antigravity
if ($Harness -eq "all" -or $Harness -eq "antigravity" -or $Harness -eq "gemini") {
    Write-Host "`nConfiguring Google Antigravity..." -ForegroundColor Cyan
    $dest = if ($Target -eq "global") { Join-Path $userHome ".gemini\GEMINI.md" } else { ".\GEMINI.md" }
    Install-File "adapters\antigravity\GEMINI.md" $dest
}

# 2. Cursor
if ($Harness -eq "all" -or $Harness -eq "cursor") {
    Write-Host "`nConfiguring Cursor (Legacy & Modern MDC Rules)..." -ForegroundColor Cyan
    Install-File "adapters\cursor\.cursorrules" (Join-Path $baseDir ".cursorrules")
    
    $cursorRules = @(
        "00-constitution.mdc",
        "01-blast-radius.mdc",
        "02-anti-duplication.mdc",
        "03-tdd-discipline.mdc",
        "04-three-am-readability.mdc",
        "05-verification-gate.mdc"
    )
    foreach ($rule in $cursorRules) {
        Install-File "adapters\cursor\.cursor\rules\$rule" (Join-Path $baseDir ".cursor\rules\$rule")
    }
}

# 3. Claude Code
if ($Harness -eq "all" -or $Harness -eq "claude" -or $Harness -eq "claude-code") {
    Write-Host "`nConfiguring Claude Code (CLAUDE.md, Skills & Slash Commands)..." -ForegroundColor Cyan
    $claudeRoot = if ($Target -eq "global") { Join-Path $userHome ".claude" } else { "." }
    $claudeMdDest = if ($Target -eq "global") { Join-Path $claudeRoot "CLAUDE.md" } else { ".\CLAUDE.md" }
    Install-File "adapters\claude-code\CLAUDE.md" $claudeMdDest
    
    # Skills
    $claudeSkills = @("qed-verify", "qed-review", "qed-blast-radius")
    foreach ($skill in $claudeSkills) {
        $destPath = if ($Target -eq "global") {
            Join-Path $claudeRoot "skills\$skill\SKILL.md"
        } else {
            ".\.claude\skills\$skill\SKILL.md"
        }
        Install-File "adapters\claude-code\.claude\skills\$skill\SKILL.md" $destPath
    }

    # Slash commands
    $claudeCommands = @("qed-verify.md", "qed-review.md", "qed-blast-radius.md")
    foreach ($cmd in $claudeCommands) {
        $destPath = if ($Target -eq "global") {
            Join-Path $claudeRoot "commands\$cmd"
        } else {
            ".\.claude\commands\$cmd"
        }
        Install-File "adapters\claude-code\.claude\commands\$cmd" $destPath
    }
}

# 4. Cline
if ($Harness -eq "all" -or $Harness -eq "cline") {
    Write-Host "`nConfiguring Cline..." -ForegroundColor Cyan
    Install-File "adapters\cline\.clinerules" (Join-Path $baseDir ".clinerules")
}

# 5. Roo Code
if ($Harness -eq "all" -or $Harness -eq "roo" -or $Harness -eq "roo-code") {
    Write-Host "`nConfiguring Roo Code (Architect, TDD Engineer & Reviewer modes)..." -ForegroundColor Cyan
    Install-File "adapters\roo-code\.clinerules" (Join-Path $baseDir ".clinerules")
    Install-File "adapters\roo-code\.roomodes" (Join-Path $baseDir ".roomodes")
}

# 6. Windsurf
if ($Harness -eq "all" -or $Harness -eq "windsurf") {
    Write-Host "`nConfiguring Windsurf Cascade (Rules & Workflows)..." -ForegroundColor Cyan
    Install-File "adapters\windsurf\.windsurfrules" (Join-Path $baseDir ".windsurfrules")
    
    $windsurfWorkflows = @(
        "qed-spec-and-blast-radius.md",
        "qed-tdd-cycle.md",
        "qed-verification-gate.md"
    )
    foreach ($wf in $windsurfWorkflows) {
        Install-File "adapters\windsurf\.windsurf\workflows\$wf" (Join-Path $baseDir ".windsurf\workflows\$wf")
    }
}

# 7. Aider
if ($Harness -eq "all" -or $Harness -eq "aider") {
    Write-Host "`nConfiguring Aider..." -ForegroundColor Cyan
    Install-File "adapters\aider\.aider.conf.yml" (Join-Path $baseDir ".aider.conf.yml")
    Install-File "adapters\aider\.aider.conventions.md" (Join-Path $baseDir ".aider.conventions.md")
}

# 8. GitHub Copilot
if ($Harness -eq "all" -or $Harness -eq "copilot" -or $Harness -eq "github-copilot") {
    Write-Host "`nConfiguring GitHub Copilot (Instructions & Prompt Files)..." -ForegroundColor Cyan
    Install-File "adapters\copilot\.github\copilot-instructions.md" (Join-Path $baseDir ".github\copilot-instructions.md")
    
    $copilotPrompts = @(
        "qed-spec.prompt.md",
        "qed-tdd.prompt.md",
        "qed-verify.prompt.md"
    )
    foreach ($pr in $copilotPrompts) {
        Install-File "adapters\copilot\.github\prompts\$pr" (Join-Path $baseDir ".github\prompts\$pr")
    }
}

# 9. OpenCode
if ($Harness -eq "all" -or $Harness -eq "opencode") {
    Write-Host "`nConfiguring OpenCode..." -ForegroundColor Cyan
    if ($Target -eq "global") {
        Install-File "adapters\opencode\.opencoderules" (Join-Path $userHome ".opencoderules")
        Install-File "adapters\opencode\opencode.json" (Join-Path $userHome ".opencode\opencode.json")
        Install-File "adapters\opencode\OPENCODE.md" (Join-Path $userHome ".opencode\OPENCODE.md")
    } else {
        Install-File "adapters\opencode\opencode.json" ".\opencode.json"
        Install-File "adapters\opencode\.opencoderules" ".\.opencoderules"
        Install-File "adapters\opencode\OPENCODE.md" ".\OPENCODE.md"
    }
}

# 10. DeepSeek Harness (dsh) & Continue.dev
if ($Harness -eq "all" -or $Harness -eq "deepseek" -or $Harness -eq "dsh" -or $Harness -eq "deepseek-harness") {
    Write-Host "`nConfiguring DeepSeek Harness (dsh) & Continue.dev..." -ForegroundColor Cyan
    if ($Target -eq "global") {
        Install-File "adapters\deepseek\DEEPSEEK.md" (Join-Path $userHome ".deepseek\DEEPSEEK.md")
        Install-File "adapters\deepseek\.deepseekrules" (Join-Path $userHome ".deepseekrules")
        Install-File "adapters\deepseek\.dsh\config.json" (Join-Path $userHome ".dsh\config.json")
        Install-File "adapters\deepseek\.continue\config.json" (Join-Path $userHome ".continue\config.json")
    } else {
        Install-File "adapters\deepseek\DEEPSEEK.md" ".\DEEPSEEK.md"
        Install-File "adapters\deepseek\.deepseekrules" ".\.deepseekrules"
        Install-File "adapters\deepseek\.dsh\config.json" ".\.dsh\config.json"
        Install-File "adapters\deepseek\.continue\config.json" ".\.continue\config.json"
        Install-File "adapters\deepseek\.continue\prompts\qed-spec.prompt" ".\.continue\prompts\qed-spec.prompt"
        Install-File "adapters\deepseek\.continue\prompts\qed-verify.prompt" ".\.continue\prompts\qed-verify.prompt"
    }
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
if ($script:failedCount -eq 0 -and $script:installedCount -gt 0) {
    Write-Host " Q.E.D. installation complete! ($script:installedCount files verified)" -ForegroundColor Green
    Write-Host " Evidence Before Assertions." -ForegroundColor DarkGray
    Write-Host "==========================================================" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host " Q.E.D. installation completed with errors!" -ForegroundColor Red
    Write-Host " Installed: $script:installedCount, Failed: $script:failedCount" -ForegroundColor Red
    Write-Host "==========================================================" -ForegroundColor Cyan
    exit 1
}
