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

# 28. Python AST: Rule QED002 Zero-Debug print()
assert_rule "Python AST: Rule QED002 print()" "src/calc.py" $'def compute(x):\n    print("debug", x)\n    return x * 2' "QED002" "false"

# 29. Python AST: Rule QED003 Empty except block
assert_rule "Python AST: Rule QED003 Empty except block" "src/fetch.py" $'def load():\n    try:\n        work()\n    except Exception:\n        pass' "QED003" "false"

# 30. Python AST: Rule QED003 Handled except passes
assert_rule "Python AST: Rule QED003 Handled except passes" "src/safe.py" $'def load():\n    try:\n        work()\n    except Exception as e:\n        logger.error("fail", e)\n        return None' "" "true"

# 31. Python AST: Rule QED004 Loose cast(Any)
assert_rule "Python AST: Rule QED004 cast(Any)" "src/types.py" $'from typing import cast, Any\nx = cast(Any, raw())' "QED004" "false"

# 32. Python AST: Rule QED004 Safe cast(int) passes
assert_rule "Python AST: Rule QED004 Safe cast(int) passes" "src/types.py" $'from typing import cast\nx = cast(int, raw())' "" "true"

# 33. Python AST: Rule QED005 Missing timeout on requests.get()
assert_rule "Python AST: Rule QED005 Missing timeout on requests.get()" "src/client.py" $'import requests\nresp = requests.get("https://api.internal/data")' "QED005" "false"

# 34. Python AST: Rule QED005 requests.get with timeout passes
assert_rule "Python AST: Rule QED005 requests.get with timeout passes" "src/client.py" $'import requests\nresp = requests.get("https://api.internal/data", timeout=5.0)' "" "true"

# 35. Python AST: Rule QED006 Unbounded @cache decorator
assert_rule "Python AST: Rule QED006 Unbounded @cache decorator" "src/memo.py" $'from functools import cache\n@cache\ndef fib(n): return n if n < 2 else fib(n-1) + fib(n-2)' "QED006" "false"

# 36. Python AST: Docstring immunity
assert_rule "Python AST: Docstring immunity" "src/docs.py" $'"""\nModule docs with print(123) example.\n"""\ndef worker(): pass' "" "true"

# 37. Go AST: Rule QED002 Zero-Debug fmt.Println()
assert_rule "Go AST: Rule QED002 fmt.Println()" "pkg/service.go" $'package pkg\nimport "fmt"\nfunc Run() { fmt.Println("debugging") }' "QED002" "false"

# 38. Go AST: Rule QED003 Empty if err != nil
assert_rule "Go AST: Rule QED003 Empty if err != nil" "pkg/client.go" $'package pkg\nfunc Query() {\n    if err != nil {\n    }\n}' "QED003" "false"

# 39. Go AST: Rule QED003 Handled error passes
assert_rule "Go AST: Rule QED003 Handled error passes" "pkg/client.go" $'package pkg\nfunc Query() error {\n    if err != nil {\n        return err\n    }\n    return nil\n}' "" "true"

# 40. Go AST: Rule QED004 unsafe.Pointer()
assert_rule "Go AST: Rule QED004 unsafe.Pointer()" "pkg/mem.go" $'package pkg\nimport "unsafe"\nfunc Cast(p *int) { ptr := unsafe.Pointer(p) }' "QED004" "false"

# 41. Go AST: Rule QED005 Naked http.Get()
assert_rule "Go AST: Rule QED005 Naked http.Get()" "pkg/api.go" $'package pkg\nimport "net/http"\nfunc Fetch() { resp, _ := http.Get("https://api.com") }' "QED005" "false"

# 42. Go AST: Rule QED006 Package-level unbounded cache map
assert_rule "Go AST: Rule QED006 Package-level unbounded cache map" "pkg/cache.go" $'package pkg\nvar userCache = make(map[string]any)' "QED006" "false"

# 43. Go AST: Relaxed rules in _test.go files
assert_rule "Go AST: Relaxed rules in _test.go files" "pkg/service_test.go" $'package pkg\nimport "fmt"\nfunc TestRun() { fmt.Println("test log") }' "" "true"

# 44. Rust AST: Rule QED002 Zero-Debug println!()
assert_rule "Rust AST: Rule QED002 println!()" "src/lib.rs" $'pub fn execute() { println!("debug msg"); }' "QED002" "false"

# 45. Rust AST: Rule QED003 Empty if let Err
assert_rule "Rust AST: Rule QED003 Empty if let Err" "src/lib.rs" $'pub fn work(res: Result<(), ()>) { if let Err(_) = res {} }' "QED003" "false"

# 46. Rust AST: Rule QED003 Handled Err passes
assert_rule "Rust AST: Rule QED003 Handled Err passes" "src/lib.rs" $'pub fn work(res: Result<(), ()>) -> Result<(), ()> { if let Err(e) = res { return Err(e); } Ok(()) }' "" "true"

# 47. Rust AST: Rule QED004 mem::transmute()
assert_rule "Rust AST: Rule QED004 mem::transmute()" "src/lib.rs" $'use std::mem; pub unsafe fn cast(x: u32) -> f32 { mem::transmute(x) }' "QED004" "false"

# 48. Rust AST: Rule QED005 Naked reqwest::get()
assert_rule "Rust AST: Rule QED005 Naked reqwest::get()" "src/lib.rs" $'pub async fn load() { let _ = reqwest::get("https://api.com").await; }' "QED005" "false"

# 49. Rust AST: Lifetime annotation immunity
assert_rule "Rust AST: Lifetime annotation immunity" "src/lib.rs" $'pub fn process<\'a, \'b>(x: &\'a str, y: &\'b str) -> &\'a str { x }' "" "true"

# 50. Python AST: Multiline cast(Any) is caught
assert_rule "Python AST: Multiline cast(Any) is caught" "src/types.py" $'from typing import cast, Any\nx = cast(\n    Any,\n    fetch_data()\n)' "QED004" "false"

# 51. Python AST: requests.get with timeout=None is caught
assert_rule "Python AST: requests.get with timeout=None is caught" "src/client.py" $'import requests\nresp = requests.get("https://api.com", timeout=None)' "QED005" "false"

# 52. Python AST: except* ValueError: pass is caught
assert_rule "Python AST: except* ValueError: pass is caught" "src/tasks.py" $'try:\n    run()\nexcept* ValueError:\n    pass' "QED003" "false"

# 53. Python AST: Handled except with col 0 comment passes
assert_rule "Python AST: Handled except with col 0 comment passes" "src/safe.py" $'try:\n    run()\nexcept Exception:\n# col 0 comment\n    logger.error("handled")\n    return None' "" "true"

# 54. Go AST: parseErr != nil empty block is caught
assert_rule "Go AST: parseErr != nil empty block is caught" "pkg/parser.go" $'package pkg\nfunc Parse() {\n    if parseErr != nil {\n    }\n}' "QED003" "false"

# 55. Go AST: Yoda nil != err empty block is caught
assert_rule "Go AST: Yoda nil != err empty block is caught" "pkg/client.go" $'package pkg\nfunc Query() {\n    if nil != err {\n    }\n}' "QED003" "false"

# 56. Go AST: var () block cache is caught
assert_rule "Go AST: var () block cache is caught" "pkg/cache.go" $'package pkg\nvar (\n    userCache = make(map[string]any)\n)' "QED006" "false"

# 57. Rust AST: Nested if let Err(Custom(_)) is caught
assert_rule "Rust AST: Nested if let Err(Custom(_)) is caught" "src/lib.rs" $'pub fn work(res: Result<(), ()>) { if let Err(Custom(_)) = res {} }' "QED003" "false"

# 58. Rust AST: Match arm Err(Custom(_)) => () is caught
assert_rule "Rust AST: Match arm Err(Custom(_)) => () is caught" "src/lib.rs" $'pub fn work(res: Result<(), ()>) { match res { Err(Custom(_)) => (), Ok(_) => () } }' "QED003" "false"

# 59. Rust AST: Multiline mem::transmute is caught
assert_rule "Rust AST: Multiline mem::transmute is caught" "src/lib.rs" $'use std::mem; pub unsafe fn cast(x: u32) -> f32 { mem::transmute::<\n    u32,\n    f32\n>(x) }' "QED004" "false"

echo "----------------------------------------------------------"
echo "Linter Test Results: $PASSED Passed, $FAILED Failed"

if [ "$FAILED" -gt 0 ]; then
    exit 1
fi
exit 0
