#!/usr/bin/env bash
# Q.E.D. Mechanical Linter Test Suite (Bash / POSIX)

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LINTER_SCRIPT="$DIR/../bin/qed-engine.js"
TEMP_BASE="${TMPDIR:-/tmp}/qed_linter_tests_$$"
mkdir -p "$TEMP_BASE"

echo "=========================================================="
echo " Q.E.D. Mechanical Linter Test Suite (Bash)"
echo " Evidence Before Assertions"
echo "=========================================================="

PASSED=0
FAILED=0

cleanup() {
    rm -rf "$TEMP_BASE"
}
trap cleanup EXIT

assert_rule() {
    local test_name="$1"
    local file_rel="$2"
    local file_content="$3"
    local expected_rule="$4"
    local should_pass="$5"

    local case_dir="$TEMP_BASE/$RANDOM"
    mkdir -p "$case_dir/$(dirname "$file_rel")"
    printf "%s" "$file_content" > "$case_dir/$file_rel"

    local output
    output=$(node "$LINTER_SCRIPT" check "$case_dir" --json 2>/dev/null || true)

    if [ "$should_pass" = "true" ]; then
        if echo "$output" | grep -q '"passed": true'; then
            echo "  [PASS] $test_name"
            PASSED=$((PASSED + 1))
        else
            echo "  [FAIL] $test_name (Expected clean pass)"
            FAILED=$((FAILED + 1))
        fi
    else
        if echo "$output" | grep -q "$expected_rule"; then
            echo "  [PASS] $test_name (Correctly flagged $expected_rule)"
            PASSED=$((PASSED + 1))
        else
            echo "  [FAIL] $test_name (Expected $expected_rule to be flagged)"
            FAILED=$((FAILED + 1))
        fi
    fi
    rm -rf "$case_dir"
}

# 1. Clean Baseline
assert_rule "Clean Repository Baseline" "src/math.ts" "export function add(a: number, b: number): number { return a + b; }" "" "true"

# 2. QED001: Pristine Root
assert_rule "Rule QED001: Pristine Root" "temp_junk.txt" "{}" "QED001" "false"

# 3. QED002: Zero-Debug console.log
assert_rule "Rule QED002: Zero-Debug console.log" "src/app.ts" "console.log('debug');" "QED002" "false"

# 4. QED003: Empty Catch Block
assert_rule "Rule QED003: Empty catch block" "src/app.ts" "try { work(); } catch (e) {}" "QED003" "false"

# 5. QED004: Loose 'as any'
assert_rule "Rule QED004: Loose as any cast" "src/app.ts" "const x = y as any;" "QED004" "false"

# 6. QED005: Naked fetch without timeout
assert_rule "Rule QED005: Naked fetch without timeout" "src/app.ts" "fetch('https://api.com')" "QED005" "false"

# 7. QED007: Secret Leak
assert_rule "Rule QED007: Secret leak" "src/app.ts" "const k = 'sk-proj-abcdefghijklmnopqrstuvwxyz1234567890';" "QED007" "false"

# 8. QED009: <div onClick>
assert_rule "Rule QED009: <div onClick> navigation" "src/App.tsx" "export function A() { return <div onClick={() => navigate('/x')}>Go</div>; }" "QED009" "false"

# 9. QED010: Blocked Paste
assert_rule "Rule QED010: Blocked onPaste" "src/App.tsx" "export function B() { return <input onPaste={(e) => e.preventDefault()} />; }" "QED010" "false"

# 10. QED011: Emoji Salad
assert_rule "Rule QED011: Emoji in button" "src/App.tsx" "export function C() { return <button>🚀 Launch</button>; }" "QED011" "false"

# 11. QED012: Unsafe DDL
assert_rule "Rule QED012: Unsafe CREATE INDEX" "migrations/001.sql" "CREATE INDEX idx_a ON orders(a);" "QED012" "false"

# 12. Suppression
assert_rule "Suppression via // qed-ignore" "src/app.ts" "const x = y as any; // qed-ignore" "" "true"

# 13. Next-line Suppression
assert_rule "Suppression via // qed-ignore-next-line" "src/client.ts" $'// qed-ignore-next-line\nconst raw = legacyCall() as any;' "" "true"

# 14. Rule-specific Next-line Suppression
assert_rule "Rule-specific // qed-ignore-next-line QED004" "src/types.ts" $'// qed-ignore-next-line QED004\nconst data = item as any;' "" "true"

# 15. Block Suppression
assert_rule "Block suppression (/* qed-disable */)" "src/vendor.ts" $'/* qed-disable */\nconst a = 1 as any;\nconst b = 2 as any;\n/* qed-enable */' "" "true"

# 16. Config File Rule Override (.qedrc.json)
assert_rule "Configuration .qedrc.json rule off" ".qedrc.json" '{ "rules": { "QED004": "off" } }' "" "true"

# 17. Heuristic: console.warn & console.error allowed
assert_rule "Heuristic: console.warn & console.error allowed" "src/logging.ts" "export function logIssue() { console.warn('Warning'); console.error('Error'); }" "" "true"

# 18. Heuristic: fetch with options allowed
assert_rule "Heuristic: fetch with options allowed" "src/api.ts" "export async function query(url: string, opts: RequestInit) { return await fetch(url, opts); }" "" "true"

# 19. Heuristic: Non-navigational onClick on div allowed
assert_rule "Heuristic: Non-navigational onClick on div allowed" "src/Accordion.tsx" "export function Accordion({ onToggle }: any) { return <div onClick={onToggle}>Title</div>; } // qed-ignore QED004" "" "true"

# 20. Heuristic: Test files relax non-fatal rules
assert_rule "Heuristic: Test files relax non-fatal rules" "src/math.test.ts" "console.log('test run'); const mock = {} as any;" "" "true"

# 21. Rule QED006: Unbounded Cache
assert_rule "Rule QED006: Unbounded Module-Level Cache" "src/cache.ts" "export const userCache = new Map();" "QED006" "false"

# 22. Compact / AI Mode (--compact)
COMPACT_DIR="$TEMP_BASE/compact_test"
mkdir -p "$COMPACT_DIR/src"
echo "export const a = 1;" > "$COMPACT_DIR/src/main.ts"
COMPACT_OUT=$(node "$LINTER_SCRIPT" check "$COMPACT_DIR" --compact 2>/dev/null || true)
if echo "$COMPACT_OUT" | grep -q "OK (0 violations"; then
    echo "  [PASS] Token Economy: check --compact outputs dense OK"
    PASSED=$((PASSED + 1))
else
    echo "  [FAIL] Token Economy: check --compact failed: $COMPACT_OUT"
    FAILED=$((FAILED + 1))
fi

# 23. Token Footprint Auditor (tokens --json)
TOKENS_OUT=$(node "$LINTER_SCRIPT" tokens "$DIR/.." --json 2>/dev/null || true)
if echo "$TOKENS_OUT" | grep -q '"totalTokens"'; then
    echo "  [PASS] Token Economy: tokens audit computes token metrics"
    PASSED=$((PASSED + 1))
else
    echo "  [FAIL] Token Economy: tokens audit returned invalid metrics"
    FAILED=$((FAILED + 1))
fi

# 24. Log Pruning Exec Runner (exec)
EXEC_OUT=$(node "$LINTER_SCRIPT" exec "echo all tests passed" 2>/dev/null || true)
if echo "$EXEC_OUT" | grep -q "PASS"; then
    echo "  [PASS] Token Economy: exec prunes command output"
    PASSED=$((PASSED + 1))
else
    echo "  [FAIL] Token Economy: exec failed to prune: $EXEC_OUT"
    FAILED=$((FAILED + 1))
fi

# 25. Custom Config: excludeDirs overrides hardcoded directory exclusions
CUSTOM_EXCLUDE_DIR="$TEMP_BASE/custom_exclude"
mkdir -p "$CUSTOM_EXCLUDE_DIR/custom_third_party"
echo '{ "excludeDirs": ["custom_third_party"] }' > "$CUSTOM_EXCLUDE_DIR/.qedrc.json"
echo 'const val = x as any;' > "$CUSTOM_EXCLUDE_DIR/custom_third_party/legacy.ts"
EXCL_OUT=$(node "$LINTER_SCRIPT" check "$CUSTOM_EXCLUDE_DIR" --compact 2>/dev/null || true)
if echo "$EXCL_OUT" | grep -q "OK (0 violations"; then
    echo "  [PASS] Configuration custom excludeDirs"
    PASSED=$((PASSED + 1))
else
    echo "  [FAIL] Configuration custom excludeDirs: $EXCL_OUT"
    FAILED=$((FAILED + 1))
fi

# 26. Custom Config: scratchPatterns overrides hardcoded root bans
CUSTOM_SCRATCH_DIR="$TEMP_BASE/custom_scratch"
mkdir -p "$CUSTOM_SCRATCH_DIR"
echo '{ "scratchPatterns": ["^my_dump_.*\\.bak$"] }' > "$CUSTOM_SCRATCH_DIR/.qedrc.json"
echo 'temporary dump' > "$CUSTOM_SCRATCH_DIR/my_dump_1.bak"
SCRATCH_OUT=$(node "$LINTER_SCRIPT" check "$CUSTOM_SCRATCH_DIR" --compact 2>/dev/null || true)
if echo "$SCRATCH_OUT" | grep -q "QED001"; then
    echo "  [PASS] Configuration custom scratchPatterns"
    PASSED=$((PASSED + 1))
else
    echo "  [FAIL] Configuration custom scratchPatterns: $SCRATCH_OUT"
    FAILED=$((FAILED + 1))
fi

# 27. Lexical Masker: string & comment keyword immunity
assert_rule "Lexical Masker: string & comment keyword immunity" "src/docs.ts" "export const guide = 'Never use as any or console.log in production'; // Tip: avoid catch {}" "" "true"

echo "----------------------------------------------------------"
echo "Linter Test Results: $PASSED Passed, $FAILED Failed"

if [ "$FAILED" -gt 0 ]; then
    exit 1
fi
exit 0
