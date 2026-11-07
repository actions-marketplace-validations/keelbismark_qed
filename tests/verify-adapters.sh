#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Running Q.E.D. Bash Installer Verification Suite..."

TEST_DIR="$(mktemp -d /tmp/qed-bash-test.XXXXXX)"
trap 'rm -rf "$TEST_DIR"' EXIT

run_test() {
    local harness="$1"
    shift
    local expected=("$@")
    local target_dir="$TEST_DIR/$harness"
    mkdir -p "$target_dir"
    
    (
        cd "$target_dir"
        bash "$REPO_ROOT/install.sh" local "$harness" > /dev/null
        
        for file in "${expected[@]}"; do
            if [ ! -e "$file" ]; then
                echo "  [FAIL] Harness: $harness (Missing: $file)"
                exit 1
            fi
        done
        echo "  [PASS] Harness: $harness (${#expected[@]} files verified)"
    )
}

run_test "antigravity" "GEMINI.md"
run_test "cursor" ".cursorrules" ".cursor/rules/00-constitution.mdc" ".cursor/rules/05-verification-gate.mdc"
run_test "claude" "CLAUDE.md" ".claude/skills/qed-verify/SKILL.md"
run_test "cline" ".clinerules"
run_test "roo" ".clinerules" ".roomodes"
run_test "windsurf" ".windsurfrules" ".windsurf/workflows/qed-tdd-cycle.md"
run_test "aider" ".aider.conf.yml" ".aider.conventions.md"
run_test "copilot" ".github/copilot-instructions.md" ".github/prompts/qed-spec.prompt.md"
run_test "opencode" "opencode.json" ".opencoderules" "OPENCODE.md"
run_test "all" "GEMINI.md" ".cursorrules" "CLAUDE.md" ".clinerules" ".roomodes" ".windsurfrules" ".aider.conf.yml" ".github/copilot-instructions.md" "opencode.json"

echo "All Bash harness tests PASSED successfully!"
