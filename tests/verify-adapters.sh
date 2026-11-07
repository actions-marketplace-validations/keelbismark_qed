#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Running Q.E.D. Comprehensive Bash Verification Suite..."

TEST_DIR="$(mktemp -d /tmp/qed-bash-test.XXXXXX)"
trap 'rm -rf "$TEST_DIR"' EXIT

run_local_test() {
    local harness="$1"
    shift
    local expected=("$@")
    local target_dir="$TEST_DIR/local-$harness"
    mkdir -p "$target_dir"
    
    (
        cd "$target_dir"
        bash "$REPO_ROOT/install.sh" local "$harness" > /dev/null
        
        for file in "${expected[@]}"; do
            if [ ! -e "$file" ]; then
                echo "  [FAIL] local-$harness (Missing: $file)"
                exit 1
            fi
        done
        echo "  [PASS] local-$harness (${#expected[@]} files verified)"
    )
}

run_positional_test() {
    local harness="$1"
    shift
    local expected=("$@")
    local target_dir="$TEST_DIR/pos-$harness"
    mkdir -p "$target_dir"
    
    (
        cd "$target_dir"
        bash "$REPO_ROOT/install.sh" "$harness" > /dev/null
        
        for file in "${expected[@]}"; do
            if [ ! -e "$file" ]; then
                echo "  [FAIL] positional-$harness (Missing: $file)"
                exit 1
            fi
        done
        echo "  [PASS] positional-$harness (${#expected[@]} files verified)"
    )
}

run_global_test() {
    local fake_home="$TEST_DIR/fake-home"
    mkdir -p "$fake_home"
    
    (
        HOME="$fake_home"
        cd "$TEST_DIR"
        bash "$REPO_ROOT/install.sh" global all > /dev/null
        
        expected=(
            "$fake_home/.gemini/GEMINI.md"
            "$fake_home/.cursorrules"
            "$fake_home/.cursor/rules/00-constitution.mdc"
            "$fake_home/.claude/CLAUDE.md"
            "$fake_home/.claude/skills/qed-verify/SKILL.md"
            "$fake_home/.claude/commands/qed-verify.md"
            "$fake_home/.clinerules"
            "$fake_home/.roomodes"
            "$fake_home/.windsurfrules"
            "$fake_home/.windsurf/workflows/qed-tdd-cycle.md"
            "$fake_home/.aider.conf.yml"
            "$fake_home/.aider.conventions.md"
            "$fake_home/.github/copilot-instructions.md"
            "$fake_home/.github/prompts/qed-spec.prompt.md"
            "$fake_home/.opencoderules"
            "$fake_home/.opencode/opencode.json"
            "$fake_home/.opencode/OPENCODE.md"
        )
        
        for file in "${expected[@]}"; do
            if [ ! -e "$file" ]; then
                echo "  [FAIL] global-all (Missing: $file)"
                exit 1
            fi
        done
        echo "  [PASS] global-all (${#expected[@]} files verified)"
    )
}

run_piped_remote_test() {
    local target_dir="$TEST_DIR/piped-test"
    mkdir -p "$target_dir"
    
    (
        cd "$target_dir"
        # Simulate piped execution: cat install.sh | bash -s -- --harness cursor
        cat "$REPO_ROOT/install.sh" | bash -s -- --harness cursor > /dev/null
        
        expected=(
            ".cursorrules"
            ".cursor/rules/00-constitution.mdc"
            ".cursor/rules/05-verification-gate.mdc"
        )
        for file in "${expected[@]}"; do
            if [ ! -e "$file" ]; then
                echo "  [FAIL] piped-remote (Missing: $file)"
                exit 1
            fi
        done
        echo "  [PASS] piped-remote (${#expected[@]} files verified from GitHub)"
    )
}

echo "--- Section 1: Local Installation Tests ---"
run_local_test "antigravity" "GEMINI.md"
run_local_test "cursor" ".cursorrules" ".cursor/rules/00-constitution.mdc" ".cursor/rules/05-verification-gate.mdc"
run_local_test "claude" "CLAUDE.md" ".claude/skills/qed-verify/SKILL.md" ".claude/commands/qed-verify.md"
run_local_test "cline" ".clinerules"
run_local_test "roo" ".clinerules" ".roomodes"
run_local_test "windsurf" ".windsurfrules" ".windsurf/workflows/qed-tdd-cycle.md"
run_local_test "aider" ".aider.conf.yml" ".aider.conventions.md"
run_local_test "copilot" ".github/copilot-instructions.md" ".github/prompts/qed-spec.prompt.md"
run_local_test "opencode" "opencode.json" ".opencoderules" "OPENCODE.md"
run_local_test "all" "GEMINI.md" ".cursorrules" "CLAUDE.md" ".clinerules" ".roomodes" ".windsurfrules" ".aider.conf.yml" ".github/copilot-instructions.md" "opencode.json"

echo "--- Section 2: Positional Argument Tests ---"
run_positional_test "cursor" ".cursorrules" ".cursor/rules/00-constitution.mdc"

echo "--- Section 3: Global Installation Tests ---"
run_global_test

echo "--- Section 4: Piped Remote Execution Tests ---"
run_piped_remote_test

echo ""
echo "All Bash verification tests PASSED successfully!"
