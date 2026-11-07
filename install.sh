#!/usr/bin/env bash
# Q.E.D. Installer for Linux / macOS

set -euo pipefail

TARGET="${1:-local}"
AGENT="${2:-all}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Installing Q.E.D. High-Assurance Engineering Standard..."

if [ "$TARGET" = "global" ]; then
    mkdir -p "$HOME/.gemini"
    cp "$SCRIPT_DIR/core/CONSTITUTION.md" "$HOME/.gemini/GEMINI.md"
    echo "Installed Q.E.D. globally to $HOME/.gemini/GEMINI.md"
else
    if [ "$AGENT" = "all" ] || [ "$AGENT" = "antigravity" ]; then
        cp "$SCRIPT_DIR/adapters/antigravity/GEMINI.md" "./GEMINI.md"
        echo "Installed Antigravity rules to ./GEMINI.md"
    fi
    if [ "$AGENT" = "all" ] || [ "$AGENT" = "cursor" ]; then
        cp "$SCRIPT_DIR/adapters/cursor/.cursorrules" "./.cursorrules"
        echo "Installed Cursor rules to ./.cursorrules"
    fi
    if [ "$AGENT" = "all" ] || [ "$AGENT" = "claude" ]; then
        cp "$SCRIPT_DIR/adapters/claude-code/CLAUDE.md" "./CLAUDE.md"
        echo "Installed Claude Code rules to ./CLAUDE.md"
    fi
    if [ "$AGENT" = "all" ] || [ "$AGENT" = "windsurf" ]; then
        cp "$SCRIPT_DIR/adapters/windsurf/.windsurfrules" "./.windsurfrules"
        echo "Installed Windsurf rules to ./.windsurfrules"
    fi
    if [ "$AGENT" = "all" ] || [ "$AGENT" = "copilot" ]; then
        mkdir -p "./.github"
        cp "$SCRIPT_DIR/adapters/copilot/copilot-instructions.md" "./.github/copilot-instructions.md"
        echo "Installed Copilot rules to ./.github/copilot-instructions.md"
    fi
fi

echo "Q.E.D. installation complete! Evidence Before Assertions."
