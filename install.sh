#!/usr/bin/env bash
# Q.E.D. Installer for Linux / macOS
# Usage:
#   ./install.sh cursor
#   ./install.sh local cursor
#   ./install.sh --harness claude
#   ./install.sh --lite                      # Install token-optimized Lite version (<500 tokens)
#   ./install.sh --lite cursor
#   ./install.sh -Harness all -Target local
#   ./install.sh global antigravity
#   curl -fsSL https://raw.githubusercontent.com/keelbismark/qed/main/install.sh | bash -s -- --harness cursor

set -euo pipefail

TARGET="local"
HARNESS="all"
LITE=0

if [ "${QED_LITE:-0}" = "1" ] || [ "${QED_LITE:-0}" = "true" ]; then
    LITE=1
fi

# Argument parsing supporting positional and flag arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        -Target|--target|-t)
            TARGET="$2"
            shift 2
            ;;
        -Harness|--harness|-h|-Agent|--agent)
            if [ "$2" = "lite" ]; then
                LITE=1
                HARNESS="all"
            else
                HARNESS="$2"
            fi
            shift 2
            ;;
        -Lite|--lite|-l|lite)
            LITE=1
            shift
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
if [ "$HARNESS" = "lite" ]; then
    LITE=1
    HARNESS="all"
fi

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
if [ "$LITE" -eq 1 ]; then
    echo "Edition: Lite (Token-Optimized, <500 tokens)"
else
    echo "Edition: Standard (Full Specification)"
fi
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

# Always install root QED.lite.md when Lite mode is selected
if [ "$LITE" -eq 1 ]; then
    install_file "QED.lite.md" "$BASE_DIR/QED.lite.md"
fi

# 1. Antigravity
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "antigravity" ]; then
    echo -e "\nConfiguring Google Antigravity..."
    src="adapters/antigravity/GEMINI.md"
    if [ "$LITE" -eq 1 ]; then src="adapters/antigravity/GEMINI.lite.md"; fi
    if [ "$TARGET" = "global" ]; then
        install_file "$src" "$HOME/.gemini/GEMINI.md"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/antigravity/GEMINI.lite.md" "$HOME/.gemini/GEMINI.lite.md"
        fi
        install_file "adapters/antigravity/.antigravity-plugin/plugin.json" "$BASE_DIR/.antigravity-plugin/plugin.json"
    else
        install_file "$src" "./GEMINI.md"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/antigravity/GEMINI.lite.md" "./GEMINI.lite.md"
        fi
        install_file "adapters/antigravity/.antigravity-plugin/plugin.json" "./.antigravity-plugin/plugin.json"
    fi
fi

# 2. Gemini CLI
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "gemini" ] || [ "$HARNESS" = "gemini-cli" ]; then
    echo -e "\nConfiguring Gemini CLI..."
    src="adapters/gemini/GEMINI.md"
    if [ "$LITE" -eq 1 ]; then src="adapters/gemini/GEMINI.lite.md"; fi
    if [ "$TARGET" = "global" ]; then
        install_file "$src" "$HOME/.gemini/GEMINI.md"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/gemini/GEMINI.lite.md" "$HOME/.gemini/GEMINI.lite.md"
        fi
        install_file "adapters/gemini/gemini-extension.json" "$HOME/.gemini/gemini-extension.json"
    else
        install_file "$src" "./GEMINI.md"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/gemini/GEMINI.lite.md" "./GEMINI.lite.md"
        fi
        install_file "adapters/gemini/gemini-extension.json" "./gemini-extension.json"
    fi
fi

# 3. Cursor
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "cursor" ]; then
    echo -e "\nConfiguring Cursor (Legacy & Modern MDC Rules)..."
    rules_src="adapters/cursor/.cursorrules"
    if [ "$LITE" -eq 1 ]; then rules_src="adapters/cursor/.cursorrules.lite"; fi
    install_file "$rules_src" "$BASE_DIR/.cursorrules"
    if [ "$LITE" -eq 1 ]; then
        install_file "adapters/cursor/.cursorrules.lite" "$BASE_DIR/.cursorrules.lite"
        # Token-optimized Lite mode: install only the lightweight constitution rule
        install_file "adapters/cursor/.cursor/rules/00-constitution.lite.mdc" "$BASE_DIR/.cursor/rules/00-constitution.mdc"
    else
        for rule in 00-constitution.mdc 01-blast-radius.mdc 02-anti-duplication.mdc 03-tdd-discipline.mdc 04-three-am-readability.mdc 05-verification-gate.mdc 06-documentation-and-visuals.mdc; do
            install_file "adapters/cursor/.cursor/rules/$rule" "$BASE_DIR/.cursor/rules/$rule"
        done
    fi
    install_file "adapters/cursor/.cursor-plugin/plugin.json" "$BASE_DIR/.cursor-plugin/plugin.json"
fi

# 4. Claude Code
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "claude" ] || [ "$HARNESS" = "claude-code" ]; then
    echo -e "\nConfiguring Claude Code (CLAUDE.md, Skills & Slash Commands)..."
    claude_src="adapters/claude-code/CLAUDE.md"
    if [ "$LITE" -eq 1 ]; then claude_src="adapters/claude-code/CLAUDE.lite.md"; fi
    install_file "adapters/claude-code/.claude-plugin/plugin.json" "$BASE_DIR/.claude-plugin/plugin.json"
    if [ "$TARGET" = "global" ]; then
        CLAUDE_ROOT="$HOME/.claude"
        install_file "$claude_src" "$CLAUDE_ROOT/CLAUDE.md"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/claude-code/CLAUDE.lite.md" "$CLAUDE_ROOT/CLAUDE.lite.md"
        else
            install_file "adapters/claude-code/.claude-plugin/marketplace.json" "$BASE_DIR/.claude-plugin/marketplace.json"
            for skill in qed-verify qed-review qed-blast-radius qed-boost; do
                install_file "adapters/claude-code/.claude/skills/$skill/SKILL.md" "$CLAUDE_ROOT/skills/$skill/SKILL.md"
            done
            for cmd in qed-verify.md qed-review.md qed-blast-radius.md qed-boost.md boost.md; do
                install_file "adapters/claude-code/.claude/commands/$cmd" "$CLAUDE_ROOT/commands/$cmd"
            done
        fi
    else
        install_file "$claude_src" "./CLAUDE.md"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/claude-code/CLAUDE.lite.md" "./CLAUDE.lite.md"
        else
            install_file "adapters/claude-code/.claude-plugin/marketplace.json" "$BASE_DIR/.claude-plugin/marketplace.json"
            for skill in qed-verify qed-review qed-blast-radius qed-boost; do
                install_file "adapters/claude-code/.claude/skills/$skill/SKILL.md" "./.claude/skills/$skill/SKILL.md"
                install_file "adapters/claude-code/skills/$skill/SKILL.md" "./skills/$skill/SKILL.md"
            done
            for cmd in qed-verify.md qed-review.md qed-blast-radius.md qed-boost.md boost.md; do
                install_file "adapters/claude-code/.claude/commands/$cmd" "./.claude/commands/$cmd"
            done
        fi
    fi
fi

# 5. Cline
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "cline" ]; then
    echo -e "\nConfiguring Cline..."
    cline_src="adapters/cline/.clinerules"
    if [ "$LITE" -eq 1 ]; then cline_src="adapters/cline/.clinerules.lite"; fi
    install_file "$cline_src" "$BASE_DIR/.clinerules"
    if [ "$LITE" -eq 1 ]; then
        install_file "adapters/cline/.clinerules.lite" "$BASE_DIR/.clinerules.lite"
    fi
fi

# 6. Roo Code
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "roo" ] || [ "$HARNESS" = "roo-code" ]; then
    echo -e "\nConfiguring Roo Code (Architect, TDD Engineer & Reviewer modes)..."
    roo_rules="adapters/roo-code/.clinerules"
    roo_modes="adapters/roo-code/.roomodes"
    if [ "$LITE" -eq 1 ]; then
        roo_rules="adapters/roo-code/.clinerules.lite"
        roo_modes="adapters/roo-code/.roomodes.lite"
    fi
    install_file "$roo_rules" "$BASE_DIR/.clinerules"
    install_file "$roo_modes" "$BASE_DIR/.roomodes"
    if [ "$LITE" -eq 1 ]; then
        install_file "adapters/roo-code/.clinerules.lite" "$BASE_DIR/.clinerules.lite"
        install_file "adapters/roo-code/.roomodes.lite" "$BASE_DIR/.roomodes.lite"
    fi
fi

# 7. Windsurf
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "windsurf" ]; then
    echo -e "\nConfiguring Windsurf Cascade (Rules & Workflows)..."
    wf_src="adapters/windsurf/.windsurfrules"
    if [ "$LITE" -eq 1 ]; then wf_src="adapters/windsurf/.windsurfrules.lite"; fi
    install_file "$wf_src" "$BASE_DIR/.windsurfrules"
    if [ "$LITE" -eq 1 ]; then
        install_file "adapters/windsurf/.windsurfrules.lite" "$BASE_DIR/.windsurfrules.lite"
    else
        for wf in qed-spec-and-blast-radius.md qed-tdd-cycle.md qed-verification-gate.md qed-boost.md; do
            install_file "adapters/windsurf/.windsurf/workflows/$wf" "$BASE_DIR/.windsurf/workflows/$wf"
        done
    fi
fi

# 8. Aider
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "aider" ]; then
    echo -e "\nConfiguring Aider..."
    aider_src="adapters/aider/.aider.conventions.md"
    if [ "$LITE" -eq 1 ]; then aider_src="adapters/aider/.aider.conventions.lite.md"; fi
    install_file "adapters/aider/.aider.conf.yml" "$BASE_DIR/.aider.conf.yml"
    install_file "$aider_src" "$BASE_DIR/.aider.conventions.md"
    if [ "$LITE" -eq 1 ]; then
        install_file "adapters/aider/.aider.conventions.lite.md" "$BASE_DIR/.aider.conventions.lite.md"
    fi
fi

# 9. GitHub Copilot
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "copilot" ] || [ "$HARNESS" = "github-copilot" ]; then
    echo -e "\nConfiguring GitHub Copilot (Instructions & Prompt Files)..."
    copilot_src="adapters/copilot/.github/copilot-instructions.md"
    if [ "$LITE" -eq 1 ]; then copilot_src="adapters/copilot/.github/copilot-instructions.lite.md"; fi
    install_file "$copilot_src" "$BASE_DIR/.github/copilot-instructions.md"
    if [ "$LITE" -eq 1 ]; then
        install_file "adapters/copilot/.github/copilot-instructions.lite.md" "$BASE_DIR/.github/copilot-instructions.lite.md"
    else
        for pr in qed-spec.prompt.md qed-tdd.prompt.md qed-verify.prompt.md qed-boost.prompt.md; do
            install_file "adapters/copilot/.github/prompts/$pr" "$BASE_DIR/.github/prompts/$pr"
        done
    fi
fi


# 10. OpenCode
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "opencode" ]; then
    echo -e "\nConfiguring OpenCode..."
    oc_rules="adapters/opencode/.opencoderules"
    oc_md="adapters/opencode/OPENCODE.md"
    if [ "$LITE" -eq 1 ]; then
        oc_rules="adapters/opencode/.opencoderules.lite"
        oc_md="adapters/opencode/OPENCODE.lite.md"
    fi
    if [ "$TARGET" = "global" ]; then
        install_file "$oc_rules" "$HOME/.opencoderules"
        install_file "adapters/opencode/opencode.json" "$HOME/.opencode/opencode.json"
        install_file "$oc_md" "$HOME/.opencode/OPENCODE.md"
        install_file "adapters/opencode/.opencode/plugins/qed.js" "$HOME/.opencode/plugins/qed.js"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/opencode/.opencoderules.lite" "$HOME/.opencoderules.lite"
            install_file "adapters/opencode/OPENCODE.lite.md" "$HOME/.opencode/OPENCODE.lite.md"
        fi
    else
        install_file "adapters/opencode/opencode.json" "./opencode.json"
        install_file "$oc_rules" "./.opencoderules"
        install_file "$oc_md" "./OPENCODE.md"
        install_file "adapters/opencode/.opencode/plugins/qed.js" "./.opencode/plugins/qed.js"
        install_file "adapters/opencode/index.js" "./index.js"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/opencode/.opencoderules.lite" "./.opencoderules.lite"
            install_file "adapters/opencode/OPENCODE.lite.md" "./OPENCODE.lite.md"
        fi
    fi
fi

# 11. DeepSeek Harness (dsh) & Continue.dev
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "deepseek" ] || [ "$HARNESS" = "dsh" ] || [ "$HARNESS" = "deepseek-harness" ]; then
    echo -e "\nConfiguring DeepSeek Harness (dsh) & Continue.dev..."
    ds_md="adapters/deepseek/DEEPSEEK.md"
    ds_rules="adapters/deepseek/.deepseekrules"
    if [ "$LITE" -eq 1 ]; then
        ds_md="adapters/deepseek/DEEPSEEK.lite.md"
        ds_rules="adapters/deepseek/.deepseekrules.lite"
    fi
    if [ "$TARGET" = "global" ]; then
        install_file "$ds_md" "$HOME/.deepseek/DEEPSEEK.md"
        install_file "$ds_rules" "$HOME/.deepseekrules"
        install_file "adapters/deepseek/.dsh/config.json" "$HOME/.dsh/config.json"
        install_file "adapters/deepseek/.continue/config.json" "$HOME/.continue/config.json"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/deepseek/DEEPSEEK.lite.md" "$HOME/.deepseek/DEEPSEEK.lite.md"
            install_file "adapters/deepseek/.deepseekrules.lite" "$HOME/.deepseekrules.lite"
        else
            install_file "adapters/deepseek/.continue/prompts/qed-spec.prompt" "$HOME/.continue/prompts/qed-spec.prompt"
            install_file "adapters/deepseek/.continue/prompts/qed-verify.prompt" "$HOME/.continue/prompts/qed-verify.prompt"
            install_file "adapters/deepseek/.continue/prompts/qed-boost.prompt" "$HOME/.continue/prompts/qed-boost.prompt"
        fi
    else
        install_file "$ds_md" "./DEEPSEEK.md"
        install_file "$ds_rules" "./.deepseekrules"
        install_file "adapters/deepseek/.dsh/config.json" "./.dsh/config.json"
        install_file "adapters/deepseek/.continue/config.json" "./.continue/config.json"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/deepseek/DEEPSEEK.lite.md" "./DEEPSEEK.lite.md"
            install_file "adapters/deepseek/.deepseekrules.lite" "./.deepseekrules.lite"
        else
            install_file "adapters/deepseek/.continue/prompts/qed-spec.prompt" "./.continue/prompts/qed-spec.prompt"
            install_file "adapters/deepseek/.continue/prompts/qed-verify.prompt" "./.continue/prompts/qed-verify.prompt"
            install_file "adapters/deepseek/.continue/prompts/qed-boost.prompt" "./.continue/prompts/qed-boost.prompt"
        fi
    fi
fi

# 12. OpenAI Codex (App & CLI)
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "codex" ] || [ "$HARNESS" = "codex-cli" ] || [ "$HARNESS" = "codex-app" ]; then
    echo -e "\nConfiguring OpenAI Codex (App & CLI)..."
    codex_md="adapters/codex/CODEX.md"
    agents_md="adapters/codex/AGENTS.md"
    if [ "$LITE" -eq 1 ]; then
        codex_md="adapters/codex/CODEX.lite.md"
        agents_md="adapters/codex/AGENTS.lite.md"
    fi
    install_file "adapters/codex/.codex-plugin/plugin.json" "$BASE_DIR/.codex-plugin/plugin.json"
    if [ "$TARGET" = "global" ]; then
        install_file "$codex_md" "$HOME/.codex/CODEX.md"
        install_file "$agents_md" "$HOME/.agents/AGENTS.md"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/codex/CODEX.lite.md" "$HOME/.codex/CODEX.lite.md"
            install_file "adapters/codex/AGENTS.lite.md" "$HOME/.agents/AGENTS.lite.md"
        fi
    else
        install_file "$codex_md" "./CODEX.md"
        install_file "$agents_md" "./AGENTS.md"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/codex/CODEX.lite.md" "./CODEX.lite.md"
            install_file "adapters/codex/AGENTS.lite.md" "./AGENTS.lite.md"
        fi
    fi
fi

# 13. Kimi Code
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "kimi" ] || [ "$HARNESS" = "kimi-code" ]; then
    echo -e "\nConfiguring Kimi Code..."
    kimi_md="adapters/kimi/KIMI.md"
    if [ "$LITE" -eq 1 ]; then kimi_md="adapters/kimi/KIMI.lite.md"; fi
    install_file "adapters/kimi/.kimi-plugin/plugin.json" "$BASE_DIR/.kimi-plugin/plugin.json"
    if [ "$TARGET" = "global" ]; then
        install_file "$kimi_md" "$HOME/.kimi/KIMI.md"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/kimi/KIMI.lite.md" "$HOME/.kimi/KIMI.lite.md"
        fi
    else
        install_file "$kimi_md" "./KIMI.md"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/kimi/KIMI.lite.md" "./KIMI.lite.md"
        fi
    fi
fi

# 14. Pi Coding Agent
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "pi" ]; then
    echo -e "\nConfiguring Pi..."
    pi_md="adapters/pi/PI.md"
    if [ "$LITE" -eq 1 ]; then pi_md="adapters/pi/PI.lite.md"; fi
    install_file "adapters/pi/.pi/extensions/qed.ts" "$BASE_DIR/.pi/extensions/qed.ts"
    if [ "$TARGET" = "global" ]; then
        install_file "$pi_md" "$HOME/.pi/PI.md"
        install_file "adapters/pi/package.json" "$HOME/.pi/package.json"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/pi/PI.lite.md" "$HOME/.pi/PI.lite.md"
        fi
    else
        install_file "$pi_md" "./PI.md"
        install_file "adapters/pi/package.json" "./package.json"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/pi/PI.lite.md" "./PI.lite.md"
        fi
    fi
fi

# 15. Hermes Agent
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "hermes" ] || [ "$HARNESS" = "hermes-agent" ]; then
    echo -e "\nConfiguring Hermes Agent..."
    hermes_md="adapters/hermes/HERMES.md"
    if [ "$LITE" -eq 1 ]; then hermes_md="adapters/hermes/HERMES.lite.md"; fi
    install_file "adapters/hermes/.hermes-plugin/plugin.yaml" "$BASE_DIR/.hermes-plugin/plugin.yaml"
    install_file "adapters/hermes/.hermes-plugin/__init__.py" "$BASE_DIR/.hermes-plugin/__init__.py"
    if [ "$TARGET" = "global" ]; then
        install_file "$hermes_md" "$HOME/.hermes/HERMES.md"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/hermes/HERMES.lite.md" "$HOME/.hermes/HERMES.lite.md"
        fi
    else
        install_file "$hermes_md" "./HERMES.md"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/hermes/HERMES.lite.md" "./HERMES.lite.md"
        fi
    fi
fi

# 16. Muse
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "muse" ]; then
    echo -e "\nConfiguring Muse..."
    muse_md="adapters/muse/MUSE.md"
    if [ "$LITE" -eq 1 ]; then muse_md="adapters/muse/MUSE.lite.md"; fi
    install_file "adapters/muse/.muse-plugin/plugin.json" "$BASE_DIR/.muse-plugin/plugin.json"
    install_file "adapters/muse/.muse-plugin/marketplace.json" "$BASE_DIR/.muse-plugin/marketplace.json"
    if [ "$TARGET" = "global" ]; then
        install_file "$muse_md" "$HOME/.muse/MUSE.md"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/muse/MUSE.lite.md" "$HOME/.muse/MUSE.lite.md"
        fi
    else
        install_file "$muse_md" "./MUSE.md"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/muse/MUSE.lite.md" "./MUSE.lite.md"
        fi
    fi
fi

# 17. Devin CLI
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "devin" ] || [ "$HARNESS" = "devin-cli" ]; then
    echo -e "\nConfiguring Devin CLI..."
    devin_md="adapters/devin/DEVIN.md"
    if [ "$LITE" -eq 1 ]; then devin_md="adapters/devin/DEVIN.lite.md"; fi
    install_file "adapters/devin/.devin-plugin/plugin.json" "$BASE_DIR/.devin-plugin/plugin.json"
    install_file "adapters/devin/.devin/config.json" "$BASE_DIR/.devin/config.json"
    if [ "$TARGET" = "global" ]; then
        install_file "$devin_md" "$HOME/.devin/DEVIN.md"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/devin/DEVIN.lite.md" "$HOME/.devin/DEVIN.lite.md"
        fi
    else
        install_file "$devin_md" "./DEVIN.md"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/devin/DEVIN.lite.md" "./DEVIN.lite.md"
        fi
    fi
fi

# 18. Factory Droid
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "droid" ] || [ "$HARNESS" = "factory-droid" ]; then
    echo -e "\nConfiguring Factory Droid..."
    droid_md="adapters/droid/DROID.md"
    if [ "$LITE" -eq 1 ]; then droid_md="adapters/droid/DROID.lite.md"; fi
    install_file "adapters/droid/.agents/plugins/marketplace.json" "$BASE_DIR/.agents/plugins/marketplace.json"
    install_file "adapters/droid/.droid/config.json" "$BASE_DIR/.droid/config.json"
    if [ "$TARGET" = "global" ]; then
        install_file "$droid_md" "$HOME/.droid/DROID.md"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/droid/DROID.lite.md" "$HOME/.droid/DROID.lite.md"
        fi
    else
        install_file "$droid_md" "./DROID.md"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/droid/DROID.lite.md" "./DROID.lite.md"
        fi
    fi
fi

# 19. Grok Build CLI
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "grok" ] || [ "$HARNESS" = "grok-build" ]; then
    echo -e "\nConfiguring Grok Build CLI..."
    grok_md="adapters/grok/GROK.md"
    if [ "$LITE" -eq 1 ]; then grok_md="adapters/grok/GROK.lite.md"; fi
    install_file "adapters/grok/.grok-plugin/plugin.json" "$BASE_DIR/.grok-plugin/plugin.json"
    install_file "adapters/grok/.grok/config.json" "$BASE_DIR/.grok/config.json"
    if [ "$TARGET" = "global" ]; then
        install_file "$grok_md" "$HOME/.grok/GROK.md"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/grok/GROK.lite.md" "$HOME/.grok/GROK.lite.md"
        fi
    else
        install_file "$grok_md" "./GROK.md"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/grok/GROK.lite.md" "./GROK.lite.md"
        fi
    fi
fi

# 20. Qwen Code
if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "qwen" ] || [ "$HARNESS" = "qwen-code" ]; then
    echo -e "\nConfiguring Qwen Code..."
    qwen_rules="adapters/qwen/.qwenrules"
    qwen_md="adapters/qwen/QWEN.md"
    if [ "$LITE" -eq 1 ]; then
        qwen_rules="adapters/qwen/.qwenrules.lite"
        qwen_md="adapters/qwen/QWEN.lite.md"
    fi
    install_file "$qwen_rules" "$BASE_DIR/.qwenrules"
    install_file "adapters/qwen/.qwen/config.json" "$BASE_DIR/.qwen/config.json"
    if [ "$LITE" -eq 1 ]; then
        install_file "adapters/qwen/.qwenrules.lite" "$BASE_DIR/.qwenrules.lite"
    fi
    if [ "$TARGET" = "global" ]; then
        install_file "$qwen_md" "$HOME/.qwen/QWEN.md"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/qwen/QWEN.lite.md" "$HOME/.qwen/QWEN.lite.md"
        fi
    else
        install_file "$qwen_md" "./QWEN.md"
        if [ "$LITE" -eq 1 ]; then
            install_file "adapters/qwen/QWEN.lite.md" "./QWEN.lite.md"
        fi
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
