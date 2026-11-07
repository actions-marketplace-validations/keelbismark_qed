#!/usr/bin/env bash
# Q.E.D. Installer for Linux / macOS
# Usage:
#   ./install.sh cursor
#   ./install.sh local cursor
#   ./install.sh --harness claude
#   ./install.sh -Harness all -Target local
#   ./install.sh global antigravity
#   curl -fsSL https://raw.githubusercontent.com/keelbismark/qed/main/install.sh | bash -s -- --harness cursor

set -euo pipefail

TARGET="local"
HARNESS="all"

# Argument parsing supporting positional and flag arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        -Target|--target|-t)
            TARGET="$2"
            shift 2
            ;;
        -Harness|--harness|-h|-Agent|--agent)
            HARNESS="$2"
            shift 2
            ;;
        local|global)
            TARGET="$1"
            shift
            ;;
        antigravity|gemini|gemini-cli|cursor|claude|claude-code|cline|roo|roo-code|windsurf|aider|copilot|github-copilot|opencode|deepseek|dsh|deepseek-harness|codex|codex-cli|codex-app|kimi|kimi-code|pi|hermes|hermes-agent|muse|devin|devin-cli|droid|factory-droid|grok|grok-build|qwen|qwen-code|all)
            HARNESS="$1"
            shift
            ;;
        *)
            echo "Unknown argument: $1" >&2
            exit 1
            ;;
    esac
done

TARGET="$(echo "$TARGET" | tr '[:upper:]' '[:lower:]')"
HARNESS="$(echo "$HARNESS" | tr '[:upper:]' '[:lower:]')"

RAW_BASE_URL="${QED_RAW_BASE_URL:-https://raw.githubusercontent.com/keelbismark/qed/main}"

# Safe SCRIPT_DIR detection even when piped into bash
SCRIPT_DIR=""
if [ -n "${BASH_SOURCE[0]:-}" ] && [ -f "${BASH_SOURCE[0]}" ]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi

IS_LOCAL=0
if [ -n "$SCRIPT_DIR" ] && [ -d "$SCRIPT_DIR/adapters" ]; then
    IS_LOCAL=1
fi

echo "=========================================================="
echo " Q.E.D. (Quod Erat Demonstrandum) Installer"
echo " Evidence Before Assertions"
echo "=========================================================="
echo "Target mode: $TARGET"
echo "Selected harness: $HARNESS"
echo "Source: $([ "$IS_LOCAL" -eq 1 ] && echo "Local repository ($SCRIPT_DIR)" || echo "Remote GitHub ($RAW_BASE_URL)")"
echo ""

INSTALLED_COUNT=0
FAILED_COUNT=0

install_file() {
    local rel_src="$1"
    local dest="$2"
    local dest_dir
    dest_dir="$(dirname "$dest")"
    mkdir -p "$dest_dir"

    if [ "$IS_LOCAL" -eq 1 ]; then
        local local_src="$SCRIPT_DIR/$rel_src"
        if [ -f "$local_src" ]; then
            cp -f "$local_src" "$dest"
            echo "  [+] Installed $dest"
            INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
        else
            echo "  [!] Error: Local source not found: $local_src" >&2
            FAILED_COUNT=$((FAILED_COUNT + 1))
        fi
    else
        local url="$RAW_BASE_URL/$rel_src"
        if command -v curl >/dev/null 2>&1; then
            if curl -fsSL "$url" -o "$dest"; then
                echo "  [+] Downloaded $dest"
                INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
            else
                echo "  [!] Error: Failed to fetch $url via curl" >&2
                FAILED_COUNT=$((FAILED_COUNT + 1))
            fi
        elif command -v wget >/dev/null 2>&1; then
            if wget -q -O "$dest" "$url"; then
                echo "  [+] Downloaded $dest"
                INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
            else
                echo "  [!] Error: Failed to fetch $url via wget" >&2
                FAILED_COUNT=$((FAILED_COUNT + 1))
            fi
        else
            echo "  [!] Error: Neither curl nor wget is available for remote installation" >&2
            FAILED_COUNT=$((FAILED_COUNT + 1))
        fi
    fi
}

BASE_DIR="."
if [ "$TARGET" = "global" ]; then
    BASE_DIR="$HOME"
    echo "Installing Q.E.D. globally to user profile ($BASE_DIR)..."
else
    echo "Installing Q.E.D. locally to current project directory..."
fi

# 1. Antigravity
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "antigravity" ]; then
    echo -e "\nConfiguring Google Antigravity..."
    if [ "$TARGET" = "global" ]; then
        install_file "adapters/antigravity/GEMINI.md" "$HOME/.gemini/GEMINI.md"
        install_file "adapters/antigravity/.antigravity-plugin/plugin.json" "$BASE_DIR/.antigravity-plugin/plugin.json"
    else
        install_file "adapters/antigravity/GEMINI.md" "./GEMINI.md"
        install_file "adapters/antigravity/.antigravity-plugin/plugin.json" "./.antigravity-plugin/plugin.json"
    fi
fi

# 2. Gemini CLI
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "gemini" ] || [ "$HARNESS" = "gemini-cli" ]; then
    echo -e "\nConfiguring Gemini CLI..."
    if [ "$TARGET" = "global" ]; then
        install_file "adapters/gemini/GEMINI.md" "$HOME/.gemini/GEMINI.md"
        install_file "adapters/gemini/gemini-extension.json" "$HOME/.gemini/gemini-extension.json"
    else
        install_file "adapters/gemini/GEMINI.md" "./GEMINI.md"
        install_file "adapters/gemini/gemini-extension.json" "./gemini-extension.json"
    fi
fi

# 3. Cursor
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "cursor" ]; then
    echo -e "\nConfiguring Cursor (Legacy & Modern MDC Rules)..."
    install_file "adapters/cursor/.cursorrules" "$BASE_DIR/.cursorrules"
    install_file "adapters/cursor/.cursor-plugin/plugin.json" "$BASE_DIR/.cursor-plugin/plugin.json"
    for rule in 00-constitution.mdc 01-blast-radius.mdc 02-anti-duplication.mdc 03-tdd-discipline.mdc 04-three-am-readability.mdc 05-verification-gate.mdc; do
        install_file "adapters/cursor/.cursor/rules/$rule" "$BASE_DIR/.cursor/rules/$rule"
    done
fi

# 4. Claude Code
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "claude" ] || [ "$HARNESS" = "claude-code" ]; then
    echo -e "\nConfiguring Claude Code (CLAUDE.md, Skills & Slash Commands)..."
    install_file "adapters/claude-code/.claude-plugin/plugin.json" "$BASE_DIR/.claude-plugin/plugin.json"
    install_file "adapters/claude-code/.claude-plugin/marketplace.json" "$BASE_DIR/.claude-plugin/marketplace.json"
    if [ "$TARGET" = "global" ]; then
        CLAUDE_ROOT="$HOME/.claude"
        install_file "adapters/claude-code/CLAUDE.md" "$CLAUDE_ROOT/CLAUDE.md"
        for skill in qed-verify qed-review qed-blast-radius; do
            install_file "adapters/claude-code/.claude/skills/$skill/SKILL.md" "$CLAUDE_ROOT/skills/$skill/SKILL.md"
        done
        for cmd in qed-verify.md qed-review.md qed-blast-radius.md; do
            install_file "adapters/claude-code/.claude/commands/$cmd" "$CLAUDE_ROOT/commands/$cmd"
        done
    else
        install_file "adapters/claude-code/CLAUDE.md" "./CLAUDE.md"
        for skill in qed-verify qed-review qed-blast-radius; do
            install_file "adapters/claude-code/.claude/skills/$skill/SKILL.md" "./.claude/skills/$skill/SKILL.md"
        done
        for cmd in qed-verify.md qed-review.md qed-blast-radius.md; do
            install_file "adapters/claude-code/.claude/commands/$cmd" "./.claude/commands/$cmd"
        done
    fi
fi

# 5. Cline
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "cline" ]; then
    echo -e "\nConfiguring Cline..."
    install_file "adapters/cline/.clinerules" "$BASE_DIR/.clinerules"
fi

# 6. Roo Code
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "roo" ] || [ "$HARNESS" = "roo-code" ]; then
    echo -e "\nConfiguring Roo Code (Architect, TDD Engineer & Reviewer modes)..."
    install_file "adapters/roo-code/.clinerules" "$BASE_DIR/.clinerules"
    install_file "adapters/roo-code/.roomodes" "$BASE_DIR/.roomodes"
fi

# 7. Windsurf
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "windsurf" ]; then
    echo -e "\nConfiguring Windsurf Cascade (Rules & Workflows)..."
    install_file "adapters/windsurf/.windsurfrules" "$BASE_DIR/.windsurfrules"
    for wf in qed-spec-and-blast-radius.md qed-tdd-cycle.md qed-verification-gate.md; do
        install_file "adapters/windsurf/.windsurf/workflows/$wf" "$BASE_DIR/.windsurf/workflows/$wf"
    done
fi

# 8. Aider
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "aider" ]; then
    echo -e "\nConfiguring Aider..."
    install_file "adapters/aider/.aider.conf.yml" "$BASE_DIR/.aider.conf.yml"
    install_file "adapters/aider/.aider.conventions.md" "$BASE_DIR/.aider.conventions.md"
fi

# 9. GitHub Copilot
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "copilot" ] || [ "$HARNESS" = "github-copilot" ]; then
    echo -e "\nConfiguring GitHub Copilot (Instructions & Prompt Files)..."
    install_file "adapters/copilot/.github/copilot-instructions.md" "$BASE_DIR/.github/copilot-instructions.md"
    for pr in qed-spec.prompt.md qed-tdd.prompt.md qed-verify.prompt.md; do
        install_file "adapters/copilot/.github/prompts/$pr" "$BASE_DIR/.github/prompts/$pr"
    done
fi

# 10. OpenCode
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "opencode" ]; then
    echo -e "\nConfiguring OpenCode..."
    if [ "$TARGET" = "global" ]; then
        install_file "adapters/opencode/.opencoderules" "$HOME/.opencoderules"
        install_file "adapters/opencode/opencode.json" "$HOME/.opencode/opencode.json"
        install_file "adapters/opencode/OPENCODE.md" "$HOME/.opencode/OPENCODE.md"
    else
        install_file "adapters/opencode/opencode.json" "./opencode.json"
        install_file "adapters/opencode/.opencoderules" "./.opencoderules"
        install_file "adapters/opencode/OPENCODE.md" "./OPENCODE.md"
    fi
fi

# 11. DeepSeek Harness (dsh) & Continue.dev
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "deepseek" ] || [ "$HARNESS" = "dsh" ] || [ "$HARNESS" = "deepseek-harness" ]; then
    echo -e "\nConfiguring DeepSeek Harness (dsh) & Continue.dev..."
    if [ "$TARGET" = "global" ]; then
        install_file "adapters/deepseek/DEEPSEEK.md" "$HOME/.deepseek/DEEPSEEK.md"
        install_file "adapters/deepseek/.deepseekrules" "$HOME/.deepseekrules"
        install_file "adapters/deepseek/.dsh/config.json" "$HOME/.dsh/config.json"
        install_file "adapters/deepseek/.continue/config.json" "$HOME/.continue/config.json"
    else
        install_file "adapters/deepseek/DEEPSEEK.md" "./DEEPSEEK.md"
        install_file "adapters/deepseek/.deepseekrules" "./.deepseekrules"
        install_file "adapters/deepseek/.dsh/config.json" "./.dsh/config.json"
        install_file "adapters/deepseek/.continue/config.json" "./.continue/config.json"
        install_file "adapters/deepseek/.continue/prompts/qed-spec.prompt" "./.continue/prompts/qed-spec.prompt"
        install_file "adapters/deepseek/.continue/prompts/qed-verify.prompt" "./.continue/prompts/qed-verify.prompt"
    fi
fi

# 12. OpenAI Codex (App & CLI)
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "codex" ] || [ "$HARNESS" = "codex-cli" ] || [ "$HARNESS" = "codex-app" ]; then
    echo -e "\nConfiguring OpenAI Codex (App & CLI)..."
    install_file "adapters/codex/.codex-plugin/plugin.json" "$BASE_DIR/.codex-plugin/plugin.json"
    if [ "$TARGET" = "global" ]; then
        install_file "adapters/codex/CODEX.md" "$HOME/.codex/CODEX.md"
        install_file "adapters/codex/AGENTS.md" "$HOME/.agents/AGENTS.md"
    else
        install_file "adapters/codex/CODEX.md" "./CODEX.md"
        install_file "adapters/codex/AGENTS.md" "./AGENTS.md"
    fi
fi

# 13. Kimi Code
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "kimi" ] || [ "$HARNESS" = "kimi-code" ]; then
    echo -e "\nConfiguring Kimi Code..."
    install_file "adapters/kimi/.kimi-plugin/plugin.json" "$BASE_DIR/.kimi-plugin/plugin.json"
    if [ "$TARGET" = "global" ]; then
        install_file "adapters/kimi/KIMI.md" "$HOME/.kimi/KIMI.md"
    else
        install_file "adapters/kimi/KIMI.md" "./KIMI.md"
    fi
fi

# 14. Pi Coding Agent
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "pi" ]; then
    echo -e "\nConfiguring Pi..."
    install_file "adapters/pi/.pi/extensions/qed.ts" "$BASE_DIR/.pi/extensions/qed.ts"
    if [ "$TARGET" = "global" ]; then
        install_file "adapters/pi/PI.md" "$HOME/.pi/PI.md"
        install_file "adapters/pi/package.json" "$HOME/.pi/package.json"
    else
        install_file "adapters/pi/PI.md" "./PI.md"
        install_file "adapters/pi/package.json" "./package.json"
    fi
fi

# 15. Hermes Agent
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "hermes" ] || [ "$HARNESS" = "hermes-agent" ]; then
    echo -e "\nConfiguring Hermes Agent..."
    install_file "adapters/hermes/.hermes-plugin/plugin.yaml" "$BASE_DIR/.hermes-plugin/plugin.yaml"
    install_file "adapters/hermes/.hermes-plugin/__init__.py" "$BASE_DIR/.hermes-plugin/__init__.py"
    if [ "$TARGET" = "global" ]; then
        install_file "adapters/hermes/HERMES.md" "$HOME/.hermes/HERMES.md"
    else
        install_file "adapters/hermes/HERMES.md" "./HERMES.md"
    fi
fi

# 16. Muse
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "muse" ]; then
    echo -e "\nConfiguring Muse..."
    install_file "adapters/muse/.muse-plugin/plugin.json" "$BASE_DIR/.muse-plugin/plugin.json"
    install_file "adapters/muse/.muse-plugin/marketplace.json" "$BASE_DIR/.muse-plugin/marketplace.json"
    if [ "$TARGET" = "global" ]; then
        install_file "adapters/muse/MUSE.md" "$HOME/.muse/MUSE.md"
    else
        install_file "adapters/muse/MUSE.md" "./MUSE.md"
    fi
fi

# 17. Devin CLI
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "devin" ] || [ "$HARNESS" = "devin-cli" ]; then
    echo -e "\nConfiguring Devin CLI..."
    install_file "adapters/devin/.devin-plugin/plugin.json" "$BASE_DIR/.devin-plugin/plugin.json"
    install_file "adapters/devin/.devin/config.json" "$BASE_DIR/.devin/config.json"
    if [ "$TARGET" = "global" ]; then
        install_file "adapters/devin/DEVIN.md" "$HOME/.devin/DEVIN.md"
    else
        install_file "adapters/devin/DEVIN.md" "./DEVIN.md"
    fi
fi

# 18. Factory Droid
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "droid" ] || [ "$HARNESS" = "factory-droid" ]; then
    echo -e "\nConfiguring Factory Droid..."
    install_file "adapters/droid/.agents/plugins/marketplace.json" "$BASE_DIR/.agents/plugins/marketplace.json"
    install_file "adapters/droid/.droid/config.json" "$BASE_DIR/.droid/config.json"
    if [ "$TARGET" = "global" ]; then
        install_file "adapters/droid/DROID.md" "$HOME/.droid/DROID.md"
    else
        install_file "adapters/droid/DROID.md" "./DROID.md"
    fi
fi

# 19. Grok Build CLI
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "grok" ] || [ "$HARNESS" = "grok-build" ]; then
    echo -e "\nConfiguring Grok Build CLI..."
    install_file "adapters/grok/.grok-plugin/plugin.json" "$BASE_DIR/.grok-plugin/plugin.json"
    install_file "adapters/grok/.grok/config.json" "$BASE_DIR/.grok/config.json"
    if [ "$TARGET" = "global" ]; then
        install_file "adapters/grok/GROK.md" "$HOME/.grok/GROK.md"
    else
        install_file "adapters/grok/GROK.md" "./GROK.md"
    fi
fi

# 20. Qwen Code
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "qwen" ] || [ "$HARNESS" = "qwen-code" ]; then
    echo -e "\nConfiguring Qwen Code..."
    install_file "adapters/qwen/.qwenrules" "$BASE_DIR/.qwenrules"
    install_file "adapters/qwen/.qwen/config.json" "$BASE_DIR/.qwen/config.json"
    if [ "$TARGET" = "global" ]; then
        install_file "adapters/qwen/QWEN.md" "$HOME/.qwen/QWEN.md"
    else
        install_file "adapters/qwen/QWEN.md" "./QWEN.md"
    fi
fi

echo ""
echo "=========================================================="
if [ "$FAILED_COUNT" -eq 0 ] && [ "$INSTALLED_COUNT" -gt 0 ]; then
    echo " Q.E.D. installation complete! ($INSTALLED_COUNT files verified)"
    echo " Evidence Before Assertions."
    echo "=========================================================="
    exit 0
else
    echo " Q.E.D. installation completed with errors!"
    echo " Installed: $INSTALLED_COUNT, Failed: $FAILED_COUNT"
    echo "=========================================================="
    exit 1
fi
