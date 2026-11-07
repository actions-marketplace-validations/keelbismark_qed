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

echo "----------------------------------------------------------"
echo "Linter Test Results: $PASSED Passed, $FAILED Failed"

if [ "$FAILED" -gt 0 ]; then
    exit 1
fi
exit 0
