#!/usr/bin/env bash
# Q.E.D. Installer for Linux / macOS
# Usage:
#   ./install.sh local cursor
#   ./install.sh --harness claude
#   ./install.sh -Harness all -Target local
#   ./install.sh global antigravity

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
        antigravity|gemini|cursor|claude|claude-code|cline|roo|roo-code|windsurf|aider|copilot|opencode|all)
            HARNESS="$1"
            shift
            ;;
        *)
            echo "Unknown argument: $1"
            exit 1
            ;;
    esac
done

TARGET="$(echo "$TARGET" | tr '[:upper:]' '[:lower:]')"
HARNESS="$(echo "$HARNESS" | tr '[:upper:]' '[:lower:]')"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================================="
echo " Q.E.D. (Quod Erat Demonstrandum) Installer"
echo " Evidence Before Assertions"
echo "=========================================================="
echo "Target mode: $TARGET"
echo "Selected harness: $HARNESS"
echo ""

copy_safe() {
    local src="$1"
    local dest="$2"
    if [ -e "$src" ]; then
        local dest_dir
        dest_dir="$(dirname "$dest")"
        mkdir -p "$dest_dir"
        cp -R "$src" "$dest"
        echo "  [+] Installed $dest"
    else
        echo "  [!] Warning: Source not found: $src" >&2
    fi
}

if [ "$TARGET" = "global" ]; then
    echo "Installing Q.E.D. globally to user home..."
    
    if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "antigravity" ] || [ "$HARNESS" = "gemini" ]; then
        mkdir -p "$HOME/.gemini"
        copy_safe "$SCRIPT_DIR/core/CONSTITUTION.md" "$HOME/.gemini/GEMINI.md"
    fi
    if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "cursor" ]; then
        copy_safe "$SCRIPT_DIR/adapters/cursor/.cursorrules" "$HOME/.cursorrules"
    fi
    if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "claude" ] || [ "$HARNESS" = "claude-code" ]; then
        mkdir -p "$HOME/.claude"
        copy_safe "$SCRIPT_DIR/adapters/claude-code/CLAUDE.md" "$HOME/.claude/CLAUDE.md"
        copy_safe "$SCRIPT_DIR/adapters/claude-code/.claude/skills" "$HOME/.claude/skills"
    fi
    if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "cline" ]; then
        copy_safe "$SCRIPT_DIR/adapters/cline/.clinerules" "$HOME/.clinerules"
    fi
    if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "roo" ] || [ "$HARNESS" = "roo-code" ]; then
        copy_safe "$SCRIPT_DIR/adapters/roo-code/.clinerules" "$HOME/.clinerules"
        copy_safe "$SCRIPT_DIR/adapters/roo-code/.roomodes" "$HOME/.roomodes"
    fi
    if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "windsurf" ]; then
        copy_safe "$SCRIPT_DIR/adapters/windsurf/.windsurfrules" "$HOME/.windsurfrules"
    fi
    if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "aider" ]; then
        copy_safe "$SCRIPT_DIR/adapters/aider/.aider.conf.yml" "$HOME/.aider.conf.yml"
        copy_safe "$SCRIPT_DIR/adapters/aider/.aider.conventions.md" "$HOME/.aider.conventions.md"
    fi
    if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "opencode" ]; then
        copy_safe "$SCRIPT_DIR/adapters/opencode/.opencoderules" "$HOME/.opencoderules"
    fi
else
    echo "Installing Q.E.D. locally to current project directory..."

    # 1. Antigravity
    if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "antigravity" ] || [ "$HARNESS" = "gemini" ]; then
        echo -e "\nConfiguring Google Antigravity..."
        copy_safe "$SCRIPT_DIR/adapters/antigravity/GEMINI.md" "./GEMINI.md"
    fi

    # 2. Cursor
    if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "cursor" ]; then
        echo -e "\nConfiguring Cursor (Legacy & Modern MDC Rules)..."
        copy_safe "$SCRIPT_DIR/adapters/cursor/.cursorrules" "./.cursorrules"
        mkdir -p "./.cursor/rules"
        cp -R "$SCRIPT_DIR/adapters/cursor/.cursor/rules/"* "./.cursor/rules/"
        echo "  [+] Installed ./.cursor/rules/*"
    fi

    # 3. Claude Code
    if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "claude" ] || [ "$HARNESS" = "claude-code" ]; then
        echo -e "\nConfiguring Claude Code (CLAUDE.md & Custom Skills)..."
        copy_safe "$SCRIPT_DIR/adapters/claude-code/CLAUDE.md" "./CLAUDE.md"
        mkdir -p "./.claude/skills"
        cp -R "$SCRIPT_DIR/adapters/claude-code/.claude/skills/"* "./.claude/skills/"
        echo "  [+] Installed ./.claude/skills/*"
    fi

    # 4. Cline
    if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "cline" ]; then
        echo -e "\nConfiguring Cline..."
        copy_safe "$SCRIPT_DIR/adapters/cline/.clinerules" "./.clinerules"
    fi

    # 5. Roo Code
    if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "roo" ] || [ "$HARNESS" = "roo-code" ]; then
        echo -e "\nConfiguring Roo Code (Architect, TDD Engineer & Reviewer modes)..."
        copy_safe "$SCRIPT_DIR/adapters/roo-code/.clinerules" "./.clinerules"
        copy_safe "$SCRIPT_DIR/adapters/roo-code/.roomodes" "./.roomodes"
    fi

    # 6. Windsurf
    if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "windsurf" ]; then
        echo -e "\nConfiguring Windsurf Cascade (Rules & Workflows)..."
        copy_safe "$SCRIPT_DIR/adapters/windsurf/.windsurfrules" "./.windsurfrules"
        mkdir -p "./.windsurf/workflows"
        cp -R "$SCRIPT_DIR/adapters/windsurf/.windsurf/workflows/"* "./.windsurf/workflows/"
        echo "  [+] Installed ./.windsurf/workflows/*"
    fi

    # 7. Aider
    if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "aider" ]; then
        echo -e "\nConfiguring Aider..."
        copy_safe "$SCRIPT_DIR/adapters/aider/.aider.conf.yml" "./.aider.conf.yml"
        copy_safe "$SCRIPT_DIR/adapters/aider/.aider.conventions.md" "./.aider.conventions.md"
    fi

    # 8. GitHub Copilot
    if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "copilot" ] || [ "$HARNESS" = "github-copilot" ]; then
        echo -e "\nConfiguring GitHub Copilot (Instructions & Prompt Files)..."
        copy_safe "$SCRIPT_DIR/adapters/copilot/.github/copilot-instructions.md" "./.github/copilot-instructions.md"
        mkdir -p "./.github/prompts"
        cp -R "$SCRIPT_DIR/adapters/copilot/.github/prompts/"* "./.github/prompts/"
        echo "  [+] Installed ./.github/prompts/*"
    fi

    # 9. OpenCode
    if [ "$HARNESS" = "all" ] || [ "$HARNESS" = "opencode" ]; then
        echo -e "\nConfiguring OpenCode..."
        copy_safe "$SCRIPT_DIR/adapters/opencode/opencode.json" "./opencode.json"
        copy_safe "$SCRIPT_DIR/adapters/opencode/.opencoderules" "./.opencoderules"
        copy_safe "$SCRIPT_DIR/adapters/opencode/OPENCODE.md" "./OPENCODE.md"
    fi
fi

echo ""
echo "=========================================================="
echo " Q.E.D. installation complete! Evidence Before Assertions."
echo "=========================================================="
