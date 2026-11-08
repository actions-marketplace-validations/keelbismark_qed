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

run_lite_test() {
    local harness="$1"
    shift
    local expected=("$@")
    local target_dir="$TEST_DIR/lite-$harness"
    mkdir -p "$target_dir"
    
    (
        cd "$target_dir"
        bash "$REPO_ROOT/install.sh" --lite "$harness" > /dev/null
        
        for file in "${expected[@]}"; do
            if [ ! -e "$file" ]; then
                echo "  [FAIL] lite-$harness (Missing: $file)"
                exit 1
            fi
        done
        echo "  [PASS] lite-$harness (${#expected[@]} files verified)"
    )
}

run_lite_positional_test() {
    local harness="$1"
    shift
    local expected=("$@")
    local target_dir="$TEST_DIR/pos-lite-$harness"
    mkdir -p "$target_dir"
    
    (
        cd "$target_dir"
        bash "$REPO_ROOT/install.sh" "$harness" --lite > /dev/null
        
        for file in "${expected[@]}"; do
            if [ ! -e "$file" ]; then
                echo "  [FAIL] pos-lite-$harness (Missing: $file)"
                exit 1
            fi
        done
        echo "  [PASS] pos-lite-$harness (${#expected[@]} files verified)"
    )
}

run_absence_test() {
    local test_name="$1"
    local cmd="$2"
    shift 2
    local unexpected=("$@")
    local target_dir="$TEST_DIR/absence-$test_name"
    mkdir -p "$target_dir"
    
    (
        cd "$target_dir"
        eval "$cmd" > /dev/null
        for file in "${unexpected[@]}"; do
            if [ -e "$file" ]; then
                echo "  [FAIL] $test_name (Unexpected file found: $file)"
                exit 1
            fi
        done
        echo "  [PASS] $test_name (Absence of ${#unexpected[@]} unneeded files verified)"
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
            "$fake_home/.gemini/gemini-extension.json"
            "$fake_home/.cursorrules"
            "$fake_home/.cursor/rules/00-constitution.mdc"
            "$fake_home/.claude/CLAUDE.md"
            "$fake_home/.claude/skills/qed-verify/SKILL.md"
            "$fake_home/.claude/skills/qed-boost/SKILL.md"
            "$fake_home/.claude/commands/boost.md"
            "$fake_home/.clinerules"
            "$fake_home/.roomodes"
            "$fake_home/.windsurfrules"
            "$fake_home/.windsurf/workflows/qed-tdd-cycle.md"
            "$fake_home/.windsurf/workflows/qed-boost.md"
            "$fake_home/.aider.conf.yml"
            "$fake_home/.github/copilot-instructions.md"
            "$fake_home/.github/prompts/qed-boost.prompt.md"
            "$fake_home/.opencoderules"
            "$fake_home/.opencode/opencode.json"
            "$fake_home/.opencode/plugins/qed.js"
            "$fake_home/.deepseek/DEEPSEEK.md"
            "$fake_home/.deepseekrules"
            "$fake_home/.continue/prompts/qed-boost.prompt"
            "$fake_home/.codex/CODEX.md"
            "$fake_home/.agents/AGENTS.md"
            "$fake_home/.kimi/KIMI.md"
            "$fake_home/.pi/PI.md"
            "$fake_home/.pi/package.json"
            "$fake_home/.hermes/HERMES.md"
            "$fake_home/.muse/MUSE.md"
            "$fake_home/.devin/DEVIN.md"
            "$fake_home/.droid/DROID.md"
            "$fake_home/.grok/GROK.md"
            "$fake_home/.qwen/QWEN.md"
            "$fake_home/.qwenrules"
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

find_free_port() {
    if command -v python3 >/dev/null 2>&1; then
        python3 -c 'import socket; s = socket.socket(); s.bind(("", 0)); print(s.getsockname()[1]); s.close()'
    elif command -v python >/dev/null 2>&1; then
        python -c 'import socket; s = socket.socket(); s.bind(("", 0)); print(s.getsockname()[1]); s.close()'
    elif command -v node >/dev/null 2>&1; then
        node -e 'const s = require("net").createServer(); s.listen(0, () => { console.log(s.address().port); s.close(); });'
    else
        echo $(( 20000 + RANDOM % 30000 ))
    fi
}

run_piped_remote_test() {
    local target_dir="$TEST_DIR/piped-test"
    mkdir -p "$target_dir"
    
    # Dynamically allocate ephemeral port to avoid hardcoded port collisions
    local port
    port=$(find_free_port)
    local server_pid
    if command -v python3 >/dev/null 2>&1; then
        (cd "$REPO_ROOT" && python3 -m http.server "$port" --bind 127.0.0.1 > /dev/null 2>&1) &
        server_pid=$!
    elif command -v python >/dev/null 2>&1; then
        (cd "$REPO_ROOT" && python -m http.server "$port" --bind 127.0.0.1 > /dev/null 2>&1) &
        server_pid=$!
    else
        node -e "const http=require('http'),fs=require('fs'),path=require('path');http.createServer((req,res)=>{const p=path.join('$REPO_ROOT',req.url.split('?')[0]);if(fs.existsSync(p)&&fs.statSync(p).isFile()){res.writeHead(200);fs.createReadStream(p).pipe(res);}else{res.writeHead(404);res.end();}}).listen($port);" > /dev/null 2>&1 &
        server_pid=$!
    fi

    # Deterministic polling: wait until server responds before proceeding (zero arbitrary sleep)
    local ready=0
    for _ in $(seq 1 40); do
        if curl -s -f -o /dev/null "http://127.0.0.1:$port/install.sh" 2>/dev/null; then
            ready=1
            break
        fi
        node -e 'const start = Date.now(); while (Date.now() - start < 50) {}' 2>/dev/null || true
    done

    if [ "$ready" -ne 1 ]; then
        echo "  [FAIL] piped-remote (Local HTTP test server failed to bind port $port)"
        kill "$server_pid" 2>/dev/null || true
        exit 1
    fi

    (
        cd "$target_dir"
        # Simulate piped execution: cat install.sh | bash -s -- --harness cursor
        cat "$REPO_ROOT/install.sh" | QED_RAW_BASE_URL="http://127.0.0.1:$port" bash -s -- --harness cursor > /dev/null
        
        expected=(
            ".cursorrules"
            ".cursor-plugin/plugin.json"
            ".cursor/rules/00-constitution.mdc"
            ".cursor/rules/05-verification-gate.mdc"
        )
        for file in "${expected[@]}"; do
            if [ ! -e "$file" ]; then
                echo "  [FAIL] piped-remote (Missing: $file)"
                kill "$server_pid" 2>/dev/null || true
                exit 1
            fi
        done
        echo "  [PASS] piped-remote (${#expected[@]} files verified via piped remote stream)"
    )
    kill "$server_pid" 2>/dev/null || true
}

echo "--- Section 1: Local Installation Tests ---"
run_local_test "antigravity" "GEMINI.md" ".antigravity-plugin/plugin.json"
run_local_test "gemini" "GEMINI.md" "gemini-extension.json"
run_local_test "cursor" ".cursorrules" ".cursor/rules/00-constitution.mdc" ".cursor-plugin/plugin.json"
run_local_test "claude" "CLAUDE.md" ".claude/skills/qed-verify/SKILL.md" ".claude/commands/boost.md" "skills/qed-verify/SKILL.md" ".claude-plugin/plugin.json"
run_local_test "cline" ".clinerules"
run_local_test "roo" ".clinerules" ".roomodes"
run_local_test "windsurf" ".windsurfrules" ".windsurf/workflows/qed-tdd-cycle.md" ".windsurf/workflows/qed-boost.md"
run_local_test "aider" ".aider.conf.yml" ".aider.conventions.md"
run_local_test "copilot" ".github/copilot-instructions.md" ".github/prompts/qed-spec.prompt.md" ".github/prompts/qed-boost.prompt.md"
run_local_test "opencode" "opencode.json" ".opencoderules" "OPENCODE.md" ".opencode/plugins/qed.js" "index.js"
run_local_test "deepseek" "DEEPSEEK.md" ".deepseekrules" ".dsh/config.json" ".continue/config.json" ".continue/prompts/qed-boost.prompt"
run_local_test "codex" "CODEX.md" "AGENTS.md" ".codex-plugin/plugin.json"
run_local_test "kimi" "KIMI.md" ".kimi-plugin/plugin.json"
run_local_test "pi" "PI.md" "package.json" ".pi/extensions/qed.ts"
run_local_test "hermes" "HERMES.md" ".hermes-plugin/plugin.yaml" ".hermes-plugin/__init__.py"
run_local_test "muse" "MUSE.md" ".muse-plugin/plugin.json" ".muse-plugin/marketplace.json"
run_local_test "devin" "DEVIN.md" ".devin-plugin/plugin.json" ".devin/config.json"
run_local_test "droid" "DROID.md" ".agents/plugins/marketplace.json" ".droid/config.json"
run_local_test "grok" "GROK.md" ".grok-plugin/plugin.json" ".grok/config.json"
run_local_test "qwen" "QWEN.md" ".qwenrules" ".qwen/config.json"

run_local_test "all" \
    "GEMINI.md" \
    "gemini-extension.json" \
    ".cursorrules" \
    "CLAUDE.md" \
    ".claude/commands/boost.md" \
    "skills/qed-verify/SKILL.md" \
    ".clinerules" \
    ".roomodes" \
    ".windsurfrules" \
    ".windsurf/workflows/qed-boost.md" \
    ".aider.conf.yml" \
    ".github/copilot-instructions.md" \
    ".github/prompts/qed-boost.prompt.md" \
    "opencode.json" \
    ".opencode/plugins/qed.js" \
    "index.js" \
    "DEEPSEEK.md" \
    ".continue/prompts/qed-boost.prompt" \
    "CODEX.md" \
    "AGENTS.md" \
    "KIMI.md" \
    "PI.md" \
    "HERMES.md" \
    "MUSE.md" \
    "DEVIN.md" \
    "DROID.md" \
    "GROK.md" \
    "QWEN.md"

echo "--- Section 2: Positional Argument Tests ---"
run_positional_test "cursor" ".cursorrules" ".cursor/rules/00-constitution.mdc"
run_positional_test "codex" "CODEX.md" ".codex-plugin/plugin.json"
run_positional_test "kimi" "KIMI.md" ".kimi-plugin/plugin.json"

echo "--- Section 3: Global Installation Tests ---"
run_global_test

echo "--- Section 4: Piped Remote Execution Tests ---"
run_piped_remote_test

echo "--- Section 5: Lite Mode Installation Tests ---"
run_lite_test "antigravity" "GEMINI.md" "GEMINI.lite.md" "QED.lite.md" ".antigravity-plugin/plugin.json"
run_lite_test "gemini" "GEMINI.md" "GEMINI.lite.md" "QED.lite.md" "gemini-extension.json"
run_lite_test "cursor" ".cursorrules" ".cursorrules.lite" ".cursor/rules/00-constitution.mdc" "QED.lite.md" ".cursor-plugin/plugin.json"
run_lite_test "claude" "CLAUDE.md" "CLAUDE.lite.md" "QED.lite.md" ".claude-plugin/plugin.json"
run_lite_test "cline" ".clinerules" ".clinerules.lite" "QED.lite.md"
run_lite_test "roo" ".clinerules" ".clinerules.lite" ".roomodes" ".roomodes.lite" "QED.lite.md"
run_lite_test "windsurf" ".windsurfrules" ".windsurfrules.lite" "QED.lite.md"
run_lite_test "copilot" ".github/copilot-instructions.md" ".github/copilot-instructions.lite.md" "QED.lite.md"
run_lite_test "deepseek" "DEEPSEEK.md" "DEEPSEEK.lite.md" ".deepseekrules" ".deepseekrules.lite" "QED.lite.md"
run_lite_positional_test "cursor" ".cursorrules" ".cursorrules.lite" ".cursor/rules/00-constitution.mdc" "QED.lite.md"
run_lite_test "all" "GEMINI.md" "GEMINI.lite.md" "CLAUDE.md" "CLAUDE.lite.md" ".cursorrules" ".cursorrules.lite" "QED.lite.md"

echo "--- Section 6: Cleanliness & Absence Tests ---"
run_absence_test "clean-std-antigravity" "bash \"$REPO_ROOT/install.sh\" local antigravity" "GEMINI.lite.md" "QED.lite.md"
run_absence_test "clean-std-cursor" "bash \"$REPO_ROOT/install.sh\" local cursor" ".cursorrules.lite" "QED.lite.md"
run_absence_test "clean-std-claude" "bash \"$REPO_ROOT/install.sh\" local claude" "CLAUDE.lite.md" "QED.lite.md"
run_absence_test "clean-lite-cursor" "bash \"$REPO_ROOT/install.sh\" --lite cursor" ".cursor/rules/01-blast-radius.mdc" ".cursor/rules/05-verification-gate.mdc"
run_absence_test "clean-lite-claude" "bash \"$REPO_ROOT/install.sh\" --lite claude" ".claude/skills/qed-verify/SKILL.md" ".claude/commands/boost.md"
run_absence_test "clean-lite-windsurf" "bash \"$REPO_ROOT/install.sh\" --lite windsurf" ".windsurf/workflows/qed-boost.md" ".windsurf/workflows/qed-tdd-cycle.md"
run_absence_test "clean-lite-copilot" "bash \"$REPO_ROOT/install.sh\" --lite copilot" ".github/prompts/qed-boost.prompt.md"
run_absence_test "clean-lite-deepseek" "bash \"$REPO_ROOT/install.sh\" --lite deepseek" ".continue/prompts/qed-boost.prompt"

echo "--- Section 7: qed update & Synchronization Tests ---"
UPDATE_TEST_DIR="$TEST_DIR/update-test"
mkdir -p "$UPDATE_TEST_DIR"

(
    cd "$UPDATE_TEST_DIR"
    echo "# Old Adapter without invariants" > "GEMINI.md"
    node "$REPO_ROOT/bin/qed-engine.js" update . >/dev/null 2>&1
    if grep -q "Leash Invariant" "GEMINI.md" && grep -q "TRIGGER DIRECTIVE" "GEMINI.md"; then
        echo -e "  \033[0;32m[PASS]\033[0m qed-update-synchronization (GEMINI.md refreshed with priming & trigger directives)"
    else
        echo -e "  \033[0;31m[FAIL]\033[0m qed-update-synchronization"
        exit 1
    fi
)

echo ""
echo "All Bash verification tests PASSED successfully!"
