# Q.E.D. Installer for Windows (PowerShell)
# Usage:
#   .\install.ps1 -Harness cursor
#   .\install.ps1 cursor
#   .\install.ps1 -Harness all -Target local
#   .\install.ps1 -Target global -Harness antigravity
#   .\install.ps1 -Lite                      # Install token-optimized Lite version (<500 tokens)
#   .\install.ps1 cursor -Lite
#   irm https://raw.githubusercontent.com/keelbismark/qed/main/install.ps1 | iex

param (
    [string]$Target = "local",  # "local" for project directory, "global" for user profile home
    [string]$Harness = "all",   # "all" or specific harness
    [string]$Agent = "",        # Backwards-compatible alias for -Harness
    [switch]$Lite = $false      # Install token-optimized Lite version (<500 tokens)
)

# Handle backwards-compatible alias
if ($Agent -ne "" -and $Harness -eq "all") {
    $Harness = $Agent
}

# Handle environment variable override for Lite mode
if ($env:QED_LITE -eq "1" -or $env:QED_LITE -eq "true") {
    $Lite = $true
}

# Handle positional arguments when first param is harness or 'lite'
$knownHarnesses = @(
    "antigravity", "gemini", "gemini-cli", "cursor", "claude", "claude-code", 
    "cline", "roo", "roo-code", "windsurf", "aider", 
    "copilot", "github-copilot", "opencode", "deepseek", "dsh", "deepseek-harness",
    "codex", "codex-cli", "codex-app", "kimi", "kimi-code", "pi",
    "hermes", "hermes-agent", "muse", "devin", "devin-cli",
    "droid", "factory-droid", "grok", "grok-build", "qwen", "qwen-code", "all"
)

$targetNormalized = $Target.ToLower().Trim()

# Check if target was passed as 'lite'
if ($targetNormalized -eq "lite") {
    $Lite = $true
    $Target = "local"
}

# Check if target was passed as a harness name
if ($targetNormalized -ne "local" -and $targetNormalized -ne "global" -and ($knownHarnesses -contains $targetNormalized)) {
    if ($Harness -eq "all") {
        $Harness = $targetNormalized
        $Target = "local"
    }
}

# Inspect any extra unbound args
if ($args.Count -gt 0) {
    foreach ($a in $args) {
        $aNorm = ("" + $a).ToLower().Trim()
        if ($aNorm -eq "lite" -or $aNorm -eq "-lite" -or $aNorm -eq "--lite") {
            $Lite = $true
        } elseif ($knownHarnesses -contains $aNorm) {
            $Harness = $aNorm
        } elseif ($aNorm -eq "local" -or $aNorm -eq "global") {
            $Target = $aNorm
        }
    }
}

$Harness = $Harness.ToLower().Trim()
$Target = $Target.ToLower().Trim()
if ($Harness -eq "lite") {
    $Lite = $true
    $Harness = "all"
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Q.E.D. (Quod Erat Demonstrandum) Installer" -ForegroundColor Cyan
Write-Host " Evidence Before Assertions" -ForegroundColor DarkGray
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Target mode: $Target" -ForegroundColor White
Write-Host "Selected harness: $Harness" -ForegroundColor White
if ($Lite) {
    Write-Host "Edition: Lite (Token-Optimized, <500 tokens)`n" -ForegroundColor Magenta
} else {
    Write-Host "Edition: Standard (Full Specification)`n" -ForegroundColor Gray
}

$ScriptDir = ""
if ($MyInvocation.MyCommand -and $MyInvocation.MyCommand.Path) {
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}
$IsLocal = ($ScriptDir -ne "" -and (Test-Path (Join-Path $ScriptDir "adapters")))
$RawBaseUrl = if ($env:QED_RAW_BASE_URL) { $env:QED_RAW_BASE_URL } else { "https://raw.githubusercontent.com/keelbismark/qed/main" }

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

# Always install root QED.lite.md when Lite mode is selected
if ($Lite) {
    Install-File "QED.lite.md" (Join-Path $baseDir "QED.lite.md")
}

# 1. Antigravity
if ($Harness -eq "all" -or $Harness -eq "antigravity") {
    Write-Host "`nConfiguring Google Antigravity..." -ForegroundColor Cyan
    $dest = if ($Target -eq "global") { Join-Path $userHome ".gemini\GEMINI.md" } else { ".\GEMINI.md" }
    $src = if ($Lite) { "adapters\antigravity\GEMINI.lite.md" } else { "adapters\antigravity\GEMINI.md" }
    Install-File $src $dest
    if ($Lite) {
        $destLite = if ($Target -eq "global") { Join-Path $userHome ".gemini\GEMINI.lite.md" } else { ".\GEMINI.lite.md" }
        Install-File "adapters\antigravity\GEMINI.lite.md" $destLite
    }
    Install-File "adapters\antigravity\.antigravity-plugin\plugin.json" (Join-Path $baseDir ".antigravity-plugin\plugin.json")
}

# 2. Gemini CLI
if ($Harness -eq "all" -or $Harness -eq "gemini" -or $Harness -eq "gemini-cli") {
    Write-Host "`nConfiguring Gemini CLI..." -ForegroundColor Cyan
    $dest = if ($Target -eq "global") { Join-Path $userHome ".gemini\GEMINI.md" } else { ".\GEMINI.md" }
    $src = if ($Lite) { "adapters\gemini\GEMINI.lite.md" } else { "adapters\gemini\GEMINI.md" }
    Install-File $src $dest
    if ($Lite) {
        $destLite = if ($Target -eq "global") { Join-Path $userHome ".gemini\GEMINI.lite.md" } else { ".\GEMINI.lite.md" }
        Install-File "adapters\gemini\GEMINI.lite.md" $destLite
    }
    $extDest = if ($Target -eq "global") { Join-Path $userHome ".gemini\gemini-extension.json" } else { ".\gemini-extension.json" }
    Install-File "adapters\gemini\gemini-extension.json" $extDest
}

# 3. Cursor
if ($Harness -eq "all" -or $Harness -eq "cursor") {
    Write-Host "`nConfiguring Cursor (Legacy & Modern MDC Rules)..." -ForegroundColor Cyan
    $mainSrc = if ($Lite) { "adapters\cursor\.cursorrules.lite" } else { "adapters\cursor\.cursorrules" }
    Install-File $mainSrc (Join-Path $baseDir ".cursorrules")
    if ($Lite) {
        Install-File "adapters\cursor\.cursorrules.lite" (Join-Path $baseDir ".cursorrules.lite")
    }
    Install-File "adapters\cursor\.cursor-plugin\plugin.json" (Join-Path $baseDir ".cursor-plugin\plugin.json")
    
    if ($Lite) {
        # Token-optimized Lite mode: install only the lightweight constitution rule
        Install-File "adapters\cursor\.cursor\rules\00-constitution.lite.mdc" (Join-Path $baseDir ".cursor\rules\00-constitution.mdc")
    } else {
        $cursorRules = @(
            "00-constitution.mdc",
            "01-blast-radius.mdc",
            "02-anti-duplication.mdc",
            "03-tdd-discipline.mdc",
            "04-three-am-readability.mdc",
            "05-verification-gate.mdc",
            "06-documentation-and-visuals.mdc"
        )
        foreach ($rule in $cursorRules) {
            Install-File "adapters\cursor\.cursor\rules\$rule" (Join-Path $baseDir ".cursor\rules\$rule")
        }
    }
}

# 4. Claude Code
if ($Harness -eq "all" -or $Harness -eq "claude" -or $Harness -eq "claude-code") {
    Write-Host "`nConfiguring Claude Code (CLAUDE.md, Skills & Slash Commands)..." -ForegroundColor Cyan
    $claudeRoot = if ($Target -eq "global") { Join-Path $userHome ".claude" } else { "." }
    $claudeMdDest = if ($Target -eq "global") { Join-Path $claudeRoot "CLAUDE.md" } else { ".\CLAUDE.md" }
    $mainSrc = if ($Lite) { "adapters\claude-code\CLAUDE.lite.md" } else { "adapters\claude-code\CLAUDE.md" }
    Install-File $mainSrc $claudeMdDest
    if ($Lite) {
        $claudeMdLiteDest = if ($Target -eq "global") { Join-Path $claudeRoot "CLAUDE.lite.md" } else { ".\CLAUDE.lite.md" }
        Install-File "adapters\claude-code\CLAUDE.lite.md" $claudeMdLiteDest
    }
    Install-File "adapters\claude-code\.claude-plugin\plugin.json" (Join-Path $baseDir ".claude-plugin\plugin.json")
    if (!$Lite) {
        Install-File "adapters\claude-code\.claude-plugin\marketplace.json" (Join-Path $baseDir ".claude-plugin\marketplace.json")
        
        # Skills
        $claudeSkills = @("qed-verify", "qed-review", "qed-blast-radius", "qed-boost")
        foreach ($skill in $claudeSkills) {
            $destPath = if ($Target -eq "global") {
                Join-Path $claudeRoot "skills\$skill\SKILL.md"
            } else {
                ".\.claude\skills\$skill\SKILL.md"
            }
            Install-File "adapters\claude-code\.claude\skills\$skill\SKILL.md" $destPath
            if ($Target -ne "global") {
                Install-File "adapters\claude-code\skills\$skill\SKILL.md" ".\skills\$skill\SKILL.md"
            }
        }

        # Slash commands
        $claudeCommands = @("qed-verify.md", "qed-review.md", "qed-blast-radius.md", "qed-boost.md", "boost.md")
        foreach ($cmd in $claudeCommands) {
            $destPath = if ($Target -eq "global") {
                Join-Path $claudeRoot "commands\$cmd"
            } else {
                ".\.claude\commands\$cmd"
            }
            Install-File "adapters\claude-code\.claude\commands\$cmd" $destPath
        }
    }
}

# 5. Cline
if ($Harness -eq "all" -or $Harness -eq "cline") {
    Write-Host "`nConfiguring Cline..." -ForegroundColor Cyan
    $mainSrc = if ($Lite) { "adapters\cline\.clinerules.lite" } else { "adapters\cline\.clinerules" }
    Install-File $mainSrc (Join-Path $baseDir ".clinerules")
    if ($Lite) {
        Install-File "adapters\cline\.clinerules.lite" (Join-Path $baseDir ".clinerules.lite")
    }
}

# 6. Roo Code
if ($Harness -eq "all" -or $Harness -eq "roo" -or $Harness -eq "roo-code") {
    Write-Host "`nConfiguring Roo Code (Architect, TDD Engineer & Reviewer modes)..." -ForegroundColor Cyan
    $mainSrc = if ($Lite) { "adapters\roo-code\.clinerules.lite" } else { "adapters\roo-code\.clinerules" }
    $mainModes = if ($Lite) { "adapters\roo-code\.roomodes.lite" } else { "adapters\roo-code\.roomodes" }
    Install-File $mainSrc (Join-Path $baseDir ".clinerules")
    Install-File $mainModes (Join-Path $baseDir ".roomodes")
    if ($Lite) {
        Install-File "adapters\roo-code\.clinerules.lite" (Join-Path $baseDir ".clinerules.lite")
        Install-File "adapters\roo-code\.roomodes.lite" (Join-Path $baseDir ".roomodes.lite")
    }
}

# 7. Windsurf
if ($Harness -eq "all" -or $Harness -eq "windsurf") {
    Write-Host "`nConfiguring Windsurf Cascade (Rules & Workflows)..." -ForegroundColor Cyan
    $mainSrc = if ($Lite) { "adapters\windsurf\.windsurfrules.lite" } else { "adapters\windsurf\.windsurfrules" }
    Install-File $mainSrc (Join-Path $baseDir ".windsurfrules")
    if ($Lite) {
        Install-File "adapters\windsurf\.windsurfrules.lite" (Join-Path $baseDir ".windsurfrules.lite")
    } else {
        $windsurfWorkflows = @(
            "qed-spec-and-blast-radius.md",
            "qed-tdd-cycle.md",
            "qed-verification-gate.md",
            "qed-boost.md"
        )
        foreach ($wf in $windsurfWorkflows) {
            Install-File "adapters\windsurf\.windsurf\workflows\$wf" (Join-Path $baseDir ".windsurf\workflows\$wf")
        }
    }
}

# 8. Aider
if ($Harness -eq "all" -or $Harness -eq "aider") {
    Write-Host "`nConfiguring Aider..." -ForegroundColor Cyan
    Install-File "adapters\aider\.aider.conf.yml" (Join-Path $baseDir ".aider.conf.yml")
    $mainSrc = if ($Lite) { "adapters\aider\.aider.conventions.lite.md" } else { "adapters\aider\.aider.conventions.md" }
    Install-File $mainSrc (Join-Path $baseDir ".aider.conventions.md")
    if ($Lite) {
        Install-File "adapters\aider\.aider.conventions.lite.md" (Join-Path $baseDir ".aider.conventions.lite.md")
    }
}

# 9. GitHub Copilot
if ($Harness -eq "all" -or $Harness -eq "copilot" -or $Harness -eq "github-copilot") {
    Write-Host "`nConfiguring GitHub Copilot (Instructions & Prompt Files)..." -ForegroundColor Cyan
    $mainSrc = if ($Lite) { "adapters\copilot\.github\copilot-instructions.lite.md" } else { "adapters\copilot\.github\copilot-instructions.md" }
    Install-File $mainSrc (Join-Path $baseDir ".github\copilot-instructions.md")
    if ($Lite) {
        Install-File "adapters\copilot\.github\copilot-instructions.lite.md" (Join-Path $baseDir ".github\copilot-instructions.lite.md")
    } else {
        $copilotPrompts = @(
            "qed-spec.prompt.md",
            "qed-tdd.prompt.md",
            "qed-verify.prompt.md",
            "qed-boost.prompt.md"
        )
        foreach ($pr in $copilotPrompts) {
            Install-File "adapters\copilot\.github\prompts\$pr" (Join-Path $baseDir ".github\prompts\$pr")
        }
    }
}


# 10. OpenCode
if ($Harness -eq "all" -or $Harness -eq "opencode") {
    Write-Host "`nConfiguring OpenCode..." -ForegroundColor Cyan
    $rulesSrc = if ($Lite) { "adapters\opencode\.opencoderules.lite" } else { "adapters\opencode\.opencoderules" }
    $mdSrc = if ($Lite) { "adapters\opencode\OPENCODE.lite.md" } else { "adapters\opencode\OPENCODE.md" }
    if ($Target -eq "global") {
        Install-File $rulesSrc (Join-Path $userHome ".opencoderules")
        Install-File "adapters\opencode\opencode.json" (Join-Path $userHome ".opencode\opencode.json")
        Install-File $mdSrc (Join-Path $userHome ".opencode\OPENCODE.md")
        Install-File "adapters\opencode\.opencode\plugins\qed.js" (Join-Path $userHome ".opencode\plugins\qed.js")
        if ($Lite) {
            Install-File "adapters\opencode\.opencoderules.lite" (Join-Path $userHome ".opencoderules.lite")
            Install-File "adapters\opencode\OPENCODE.lite.md" (Join-Path $userHome ".opencode\OPENCODE.lite.md")
        }
    } else {
        Install-File "adapters\opencode\opencode.json" ".\opencode.json"
        Install-File $rulesSrc ".\.opencoderules"
        Install-File $mdSrc ".\OPENCODE.md"
        Install-File "adapters\opencode\.opencode\plugins\qed.js" ".\.opencode\plugins\qed.js"
        Install-File "adapters\opencode\index.js" ".\index.js"
        if ($Lite) {
            Install-File "adapters\opencode\.opencoderules.lite" ".\.opencoderules.lite"
            Install-File "adapters\opencode\OPENCODE.lite.md" ".\OPENCODE.lite.md"
        }
    }
}

# 11. DeepSeek Harness (dsh) & Continue.dev
if ($Harness -eq "all" -or $Harness -eq "deepseek" -or $Harness -eq "dsh" -or $Harness -eq "deepseek-harness") {
    Write-Host "`nConfiguring DeepSeek Harness (dsh) & Continue.dev..." -ForegroundColor Cyan
    $mdSrc = if ($Lite) { "adapters\deepseek\DEEPSEEK.lite.md" } else { "adapters\deepseek\DEEPSEEK.md" }
    $rulesSrc = if ($Lite) { "adapters\deepseek\.deepseekrules.lite" } else { "adapters\deepseek\.deepseekrules" }
    if ($Target -eq "global") {
        Install-File $mdSrc (Join-Path $userHome ".deepseek\DEEPSEEK.md")
        Install-File $rulesSrc (Join-Path $userHome ".deepseekrules")
        Install-File "adapters\deepseek\.dsh\config.json" (Join-Path $userHome ".dsh\config.json")
        Install-File "adapters\deepseek\.continue\config.json" (Join-Path $userHome ".continue\config.json")
        if ($Lite) {
            Install-File "adapters\deepseek\DEEPSEEK.lite.md" (Join-Path $userHome ".deepseek\DEEPSEEK.lite.md")
            Install-File "adapters\deepseek\.deepseekrules.lite" (Join-Path $userHome ".deepseekrules.lite")
        } else {
            Install-File "adapters\deepseek\.continue\prompts\qed-spec.prompt" (Join-Path $userHome ".continue\prompts\qed-spec.prompt")
            Install-File "adapters\deepseek\.continue\prompts\qed-verify.prompt" (Join-Path $userHome ".continue\prompts\qed-verify.prompt")
            Install-File "adapters\deepseek\.continue\prompts\qed-boost.prompt" (Join-Path $userHome ".continue\prompts\qed-boost.prompt")
        }
    } else {
        Install-File $mdSrc ".\DEEPSEEK.md"
        Install-File $rulesSrc ".\.deepseekrules"
        Install-File "adapters\deepseek\.dsh\config.json" ".\.dsh\config.json"
        Install-File "adapters\deepseek\.continue\config.json" ".\.continue\config.json"
        if ($Lite) {
            Install-File "adapters\deepseek\DEEPSEEK.lite.md" ".\DEEPSEEK.lite.md"
            Install-File "adapters\deepseek\.deepseekrules.lite" ".\.deepseekrules.lite"
        } else {
            Install-File "adapters\deepseek\.continue\prompts\qed-spec.prompt" ".\.continue\prompts\qed-spec.prompt"
            Install-File "adapters\deepseek\.continue\prompts\qed-verify.prompt" ".\.continue\prompts\qed-verify.prompt"
            Install-File "adapters\deepseek\.continue\prompts\qed-boost.prompt" ".\.continue\prompts\qed-boost.prompt"
        }
    }
}

# 12. OpenAI Codex (App & CLI)
if ($Harness -eq "all" -or $Harness -eq "codex" -or $Harness -eq "codex-cli" -or $Harness -eq "codex-app") {
    Write-Host "`nConfiguring OpenAI Codex (App & CLI)..." -ForegroundColor Cyan
    Install-File "adapters\codex\.codex-plugin\plugin.json" (Join-Path $baseDir ".codex-plugin\plugin.json")
    $mdSrc = if ($Lite) { "adapters\codex\CODEX.lite.md" } else { "adapters\codex\CODEX.md" }
    $agentsSrc = if ($Lite) { "adapters\codex\AGENTS.lite.md" } else { "adapters\codex\AGENTS.md" }
    if ($Target -eq "global") {
        Install-File $mdSrc (Join-Path $userHome ".codex\CODEX.md")
        Install-File $agentsSrc (Join-Path $userHome ".agents\AGENTS.md")
        if ($Lite) {
            Install-File "adapters\codex\CODEX.lite.md" (Join-Path $userHome ".codex\CODEX.lite.md")
            Install-File "adapters\codex\AGENTS.lite.md" (Join-Path $userHome ".agents\AGENTS.lite.md")
        }
    } else {
        Install-File $mdSrc ".\CODEX.md"
        Install-File $agentsSrc ".\AGENTS.md"
        if ($Lite) {
            Install-File "adapters\codex\CODEX.lite.md" ".\CODEX.lite.md"
            Install-File "adapters\codex\AGENTS.lite.md" ".\AGENTS.lite.md"
        }
    }
}

# 13. Kimi Code
if ($Harness -eq "all" -or $Harness -eq "kimi" -or $Harness -eq "kimi-code") {
    Write-Host "`nConfiguring Kimi Code..." -ForegroundColor Cyan
    Install-File "adapters\kimi\.kimi-plugin\plugin.json" (Join-Path $baseDir ".kimi-plugin\plugin.json")
    $mdSrc = if ($Lite) { "adapters\kimi\KIMI.lite.md" } else { "adapters\kimi\KIMI.md" }
    if ($Target -eq "global") {
        Install-File $mdSrc (Join-Path $userHome ".kimi\KIMI.md")
        if ($Lite) {
            Install-File "adapters\kimi\KIMI.lite.md" (Join-Path $userHome ".kimi\KIMI.lite.md")
        }
    } else {
        Install-File $mdSrc ".\KIMI.md"
        if ($Lite) {
            Install-File "adapters\kimi\KIMI.lite.md" ".\KIMI.lite.md"
        }
    }
}

# 14. Pi Coding Agent
if ($Harness -eq "all" -or $Harness -eq "pi") {
    Write-Host "`nConfiguring Pi..." -ForegroundColor Cyan
    Install-File "adapters\pi\.pi\extensions\qed.ts" (Join-Path $baseDir ".pi\extensions\qed.ts")
    $mdSrc = if ($Lite) { "adapters\pi\PI.lite.md" } else { "adapters\pi\PI.md" }
    if ($Target -eq "global") {
        Install-File $mdSrc (Join-Path $userHome ".pi\PI.md")
        Install-File "adapters\pi\package.json" (Join-Path $userHome ".pi\package.json")
        if ($Lite) {
            Install-File "adapters\pi\PI.lite.md" (Join-Path $userHome ".pi\PI.lite.md")
        }
    } else {
        Install-File $mdSrc ".\PI.md"
        Install-File "adapters\pi\package.json" ".\package.json"
        if ($Lite) {
            Install-File "adapters\pi\PI.lite.md" ".\PI.lite.md"
        }
    }
}

# 15. Hermes Agent
if ($Harness -eq "all" -or $Harness -eq "hermes" -or $Harness -eq "hermes-agent") {
    Write-Host "`nConfiguring Hermes Agent..." -ForegroundColor Cyan
    Install-File "adapters\hermes\.hermes-plugin\plugin.yaml" (Join-Path $baseDir ".hermes-plugin\plugin.yaml")
    Install-File "adapters\hermes\.hermes-plugin\__init__.py" (Join-Path $baseDir ".hermes-plugin\__init__.py")
    $mdSrc = if ($Lite) { "adapters\hermes\HERMES.lite.md" } else { "adapters\hermes\HERMES.md" }
    if ($Target -eq "global") {
        Install-File $mdSrc (Join-Path $userHome ".hermes\HERMES.md")
        if ($Lite) {
            Install-File "adapters\hermes\HERMES.lite.md" (Join-Path $userHome ".hermes\HERMES.lite.md")
        }
    } else {
        Install-File $mdSrc ".\HERMES.md"
        if ($Lite) {
            Install-File "adapters\hermes\HERMES.lite.md" ".\HERMES.lite.md"
        }
    }
}

# 16. Muse
if ($Harness -eq "all" -or $Harness -eq "muse") {
    Write-Host "`nConfiguring Muse..." -ForegroundColor Cyan
    Install-File "adapters\muse\.muse-plugin\plugin.json" (Join-Path $baseDir ".muse-plugin\plugin.json")
    Install-File "adapters\muse\.muse-plugin\marketplace.json" (Join-Path $baseDir ".muse-plugin\marketplace.json")
    $mdSrc = if ($Lite) { "adapters\muse\MUSE.lite.md" } else { "adapters\muse\MUSE.md" }
    if ($Target -eq "global") {
        Install-File $mdSrc (Join-Path $userHome ".muse\MUSE.md")
        if ($Lite) {
            Install-File "adapters\muse\MUSE.lite.md" (Join-Path $userHome ".muse\MUSE.lite.md")
        }
    } else {
        Install-File $mdSrc ".\MUSE.md"
        if ($Lite) {
            Install-File "adapters\muse\MUSE.lite.md" ".\MUSE.lite.md"
        }
    }
}

# 17. Devin CLI
if ($Harness -eq "all" -or $Harness -eq "devin" -or $Harness -eq "devin-cli") {
    Write-Host "`nConfiguring Devin CLI..." -ForegroundColor Cyan
    Install-File "adapters\devin\.devin-plugin\plugin.json" (Join-Path $baseDir ".devin-plugin\plugin.json")
    Install-File "adapters\devin\.devin\config.json" (Join-Path $baseDir ".devin\config.json")
    $mdSrc = if ($Lite) { "adapters\devin\DEVIN.lite.md" } else { "adapters\devin\DEVIN.md" }
    if ($Target -eq "global") {
        Install-File $mdSrc (Join-Path $userHome ".devin\DEVIN.md")
        if ($Lite) {
            Install-File "adapters\devin\DEVIN.lite.md" (Join-Path $userHome ".devin\DEVIN.lite.md")
        }
    } else {
        Install-File $mdSrc ".\DEVIN.md"
        if ($Lite) {
            Install-File "adapters\devin\DEVIN.lite.md" ".\DEVIN.lite.md"
        }
    }
}

# 18. Factory Droid
if ($Harness -eq "all" -or $Harness -eq "droid" -or $Harness -eq "factory-droid") {
    Write-Host "`nConfiguring Factory Droid..." -ForegroundColor Cyan
    Install-File "adapters\droid\.agents\plugins\marketplace.json" (Join-Path $baseDir ".agents\plugins\marketplace.json")
    Install-File "adapters\droid\.droid\config.json" (Join-Path $baseDir ".droid\config.json")
    $mdSrc = if ($Lite) { "adapters\droid\DROID.lite.md" } else { "adapters\droid\DROID.md" }
    if ($Target -eq "global") {
        Install-File $mdSrc (Join-Path $userHome ".droid\DROID.md")
        if ($Lite) {
            Install-File "adapters\droid\DROID.lite.md" (Join-Path $userHome ".droid\DROID.lite.md")
        }
    } else {
        Install-File $mdSrc ".\DROID.md"
        if ($Lite) {
            Install-File "adapters\droid\DROID.lite.md" ".\DROID.lite.md"
        }
    }
}

# 19. Grok Build CLI
if ($Harness -eq "all" -or $Harness -eq "grok" -or $Harness -eq "grok-build") {
    Write-Host "`nConfiguring Grok Build CLI..." -ForegroundColor Cyan
    Install-File "adapters\grok\.grok-plugin\plugin.json" (Join-Path $baseDir ".grok-plugin\plugin.json")
    Install-File "adapters\grok\.grok\config.json" (Join-Path $baseDir ".grok\config.json")
    $mdSrc = if ($Lite) { "adapters\grok\GROK.lite.md" } else { "adapters\grok\GROK.md" }
    if ($Target -eq "global") {
        Install-File $mdSrc (Join-Path $userHome ".grok\GROK.md")
        if ($Lite) {
            Install-File "adapters\grok\GROK.lite.md" (Join-Path $userHome ".grok\GROK.lite.md")
        }
    } else {
        Install-File $mdSrc ".\GROK.md"
        if ($Lite) {
            Install-File "adapters\grok\GROK.lite.md" ".\GROK.lite.md"
        }
    }
}

# 20. Qwen Code
if ($Harness -eq "all" -or $Harness -eq "qwen" -or $Harness -eq "qwen-code") {
    Write-Host "`nConfiguring Qwen Code..." -ForegroundColor Cyan
    $rulesSrc = if ($Lite) { "adapters\qwen\.qwenrules.lite" } else { "adapters\qwen\.qwenrules" }
    $mdSrc = if ($Lite) { "adapters\qwen\QWEN.lite.md" } else { "adapters\qwen\QWEN.md" }
    Install-File $rulesSrc (Join-Path $baseDir ".qwenrules")
    Install-File "adapters\qwen\.qwen\config.json" (Join-Path $baseDir ".qwen\config.json")
    if ($Lite) {
        Install-File "adapters\qwen\.qwenrules.lite" (Join-Path $baseDir ".qwenrules.lite")
    }
    if ($Target -eq "global") {
        Install-File $mdSrc (Join-Path $userHome ".qwen\QWEN.md")
        if ($Lite) {
            Install-File "adapters\qwen\QWEN.lite.md" (Join-Path $userHome ".qwen\QWEN.lite.md")
        }
    } else {
        Install-File $mdSrc ".\QWEN.md"
        if ($Lite) {
            Install-File "adapters\qwen\QWEN.lite.md" ".\QWEN.lite.md"
        }
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
