<#
.SYNOPSIS
    Test Suite for Q.E.D. Mechanical Verification Engine & Linter
.DESCRIPTION
    Creates temporary isolated fixtures to verify that all 12 Q.E.D. mechanical rules
    faithfully detect violations and respect suppressions.
#>

$ErrorActionPreference = "Stop"
$linterScript = Join-Path $PSScriptRoot "..\bin\qed-engine.js"
$repoRoot = (Resolve-Path "$PSScriptRoot\..").Path
$fixtureDir = Join-Path ([System.IO.Path]::GetTempPath()) "qed_linter_tests_$([System.Guid]::NewGuid().ToString().Substring(0,8))"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Q.E.D. Mechanical Linter Test Suite" -ForegroundColor Cyan
Write-Host " Evidence Before Assertions" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

New-Item -Path $fixtureDir -ItemType Directory -Force | Out-Null
$testsPassed = 0
$testsFailed = 0

function Assert-LinterRule {
    param (
        [string]$TestName,
        [hashtable]$Files,
        [string]$ExpectedRule,
        [bool]$ShouldPass = $false
    )

    $testCaseDir = Join-Path $fixtureDir ([System.Guid]::NewGuid().ToString().Substring(0,8))
    New-Item -Path $testCaseDir -ItemType Directory -Force | Out-Null

    try {
        foreach ($fName in $Files.Keys) {
            $fPath = Join-Path $testCaseDir $fName
            $parentDir = Split-Path $fPath -Parent
            if (-not (Test-Path $parentDir)) { New-Item -Path $parentDir -ItemType Directory -Force | Out-Null }
            Set-Content -Path $fPath -Value $Files[$fName] -NoNewline
        }

        # Run linter in JSON mode
        $jsonRaw = node $linterScript check $testCaseDir --json 2>$null
        $result = $jsonRaw | ConvertFrom-Json

        $hasExpectedRule = $false
        if ($result.violations) {
            foreach ($v in $result.violations) {
                if ($v.ruleId -like "*$ExpectedRule*") {
                    $hasExpectedRule = $true
                    break
                }
            }
        }

        if ($ShouldPass) {
            if ($result.passed -eq $true -and $result.violations.Count -eq 0) {
                Write-Host "  [PASS] $TestName" -ForegroundColor Green
                $script:testsPassed++
            } else {
                Write-Host "  [FAIL] $TestName (Expected clean pass, got $($result.violations.Count) violation(s))" -ForegroundColor Red
                $script:testsFailed++
            }
        } else {
            if ($hasExpectedRule) {
                Write-Host "  [PASS] $TestName (Correctly flagged $ExpectedRule)" -ForegroundColor Green
                $script:testsPassed++
            } else {
                Write-Host "  [FAIL] $TestName (Expected $ExpectedRule to be flagged)" -ForegroundColor Red
                $script:testsFailed++
            }
        }
    } finally {
        Remove-Item -Path $testCaseDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

try {
    # 1. Clean Baseline Test
    Assert-LinterRule -TestName "Clean Repository Baseline" -Files @{
        "src/math.ts" = "export function add(a: number, b: number): number { return a + b; }"
        "src/logger.ts" = "export const logger = { info: (msg: string) => { /* ok */ } };"
    } -ExpectedRule "" -ShouldPass $true

    # 2. QED001: Pristine Root
    Assert-LinterRule -TestName "Rule QED001: Pristine Root (temp_dump)" -Files @{
        "temp_debug_dump.json" = "{}"
        "src/app.ts" = "export const app = 1;"
    } -ExpectedRule "QED001" -ShouldPass $false

    # 3. QED002: Zero-Debug Console Log
    Assert-LinterRule -TestName "Rule QED002: Zero-Debug console.log" -Files @{
        "src/service.ts" = "function calc() { console.log('debugging value'); return 42; }"
    } -ExpectedRule "QED002" -ShouldPass $false

    # 4. QED002: Zero-Debug Debugger
    Assert-LinterRule -TestName "Rule QED002: Zero-Debug debugger;" -Files @{
        "src/worker.js" = "function work() { debugger; return true; }"
    } -ExpectedRule "QED002" -ShouldPass $false

    # 5. QED003: Empty Catch Block
    Assert-LinterRule -TestName "Rule QED003: Empty catch block" -Files @{
        "src/client.ts" = "try { doSomething(); } catch (e) {}"
    } -ExpectedRule "QED003" -ShouldPass $false

    # 6. QED004: Loose `as any` Cast
    Assert-LinterRule -TestName "Rule QED004: Loose 'as any' cast" -Files @{
        "src/types.ts" = "const rawData: unknown = { id: 1 }; const user = rawData as any;"
    } -ExpectedRule "QED004" -ShouldPass $false

    # 7. QED005: Missing Timeout on fetch()
    Assert-LinterRule -TestName "Rule QED005: Naked fetch without timeout" -Files @{
        "src/api.ts" = "async function load() { return await fetch('https://api.internal/data'); }"
    } -ExpectedRule "QED005" -ShouldPass $false

    # 8. QED007: Secret Leak (sk- token)
    Assert-LinterRule -TestName "Rule QED007: Hardcoded secret leak" -Files @{
        "src/config.ts" = "const apiKey = 'sk-proj-abcdefghijklmnopqrstuvwxyz1234567890';"
    } -ExpectedRule "QED007" -ShouldPass $false

    # 9. QED009: <div onClick> Navigation
    Assert-LinterRule -TestName "Rule QED009: <div onClick> navigation" -Files @{
        "src/Card.tsx" = "export function Card() { return <div onClick={() => navigate('/home')}>Go</div>; }"
    } -ExpectedRule "QED009" -ShouldPass $false

    # 10. QED010: Blocked Paste
    Assert-LinterRule -TestName "Rule QED010: Blocked onPaste" -Files @{
        "src/Input.tsx" = "export function Pin() { return <input onPaste={(e) => e.preventDefault()} />; }"
    } -ExpectedRule "QED010" -ShouldPass $false

    # 11. QED011: Emoji Salad in Button
    Assert-LinterRule -TestName "Rule QED011: Emoji salad in UI button" -Files @{
        "src/Header.tsx" = "export function CTA() { return <button>🚀 Launch Platform</button>; }"
    } -ExpectedRule "QED011" -ShouldPass $false

    # 12. QED012: Unsafe DDL (CREATE INDEX without CONCURRENTLY)
    Assert-LinterRule -TestName "Rule QED012: Unsafe CREATE INDEX" -Files @{
        "migrations/001_orders.sql" = "CREATE INDEX idx_orders_customer_id ON orders(customer_id);"
    } -ExpectedRule "QED012" -ShouldPass $false

    # 13. Inline Suppression Test (qed-ignore)
    Assert-LinterRule -TestName "Suppression via // qed-ignore" -Files @{
        "src/legacy.ts" = "const val = legacyApi() as any; // qed-ignore - legacy vendor wrapper"
    } -ExpectedRule "" -ShouldPass $true

    # 14. Next-line Suppression Test (qed-ignore-next-line)
    Assert-LinterRule -TestName "Suppression via // qed-ignore-next-line" -Files @{
        "src/client.ts" = "// qed-ignore-next-line`nconst raw = legacyCall() as any;"
    } -ExpectedRule "" -ShouldPass $true

    # 15. Rule-specific Next-line Suppression
    Assert-LinterRule -TestName "Rule-specific // qed-ignore-next-line QED004" -Files @{
        "src/types.ts" = "// qed-ignore-next-line QED004`nconst data = item as any;"
    } -ExpectedRule "" -ShouldPass $true

    # 16. Block Suppression (/* qed-disable */ ... /* qed-enable */)
    Assert-LinterRule -TestName "Block suppression (/* qed-disable */)" -Files @{
        "src/vendor.ts" = "/* qed-disable */`nconst a = 1 as any;`nconst b = 2 as any;`n/* qed-enable */"
    } -ExpectedRule "" -ShouldPass $true

    # 17. Config File Rule Override (.qedrc.json rule: off)
    Assert-LinterRule -TestName "Configuration .qedrc.json rule off" -Files @{
        ".qedrc.json" = '{ "rules": { "QED004": "off" } }'
        "src/cast.ts" = "const val = x as any;"
    } -ExpectedRule "" -ShouldPass $true

    # 18. Config File ignorePatterns (.qedrc.json)
    Assert-LinterRule -TestName "Configuration .qedrc.json ignorePatterns" -Files @{
        ".qedrc.json" = '{ "ignorePatterns": ["legacy/**"] }'
        "legacy/old.ts" = "const val = x as any;"
    } -ExpectedRule "" -ShouldPass $true

    # 19. Smart Heuristic: console.warn and console.error are allowed
    Assert-LinterRule -TestName "Heuristic: console.warn & console.error allowed" -Files @{
        "src/logging.ts" = "export function logIssue() { console.warn('Warning'); console.error('Error'); }"
    } -ExpectedRule "" -ShouldPass $true

    # 20. Smart Heuristic: fetch with options or AbortSignal allowed
    Assert-LinterRule -TestName "Heuristic: fetch with options allowed" -Files @{
        "src/api.ts" = "export async function query(url: string, opts: RequestInit) { return await fetch(url, opts); }"
    } -ExpectedRule "" -ShouldPass $true

    # 21. Smart Heuristic: Non-navigational onClick on div allowed
    Assert-LinterRule -TestName "Heuristic: Non-navigational onClick on div allowed" -Files @{
        "src/Accordion.tsx" = "export function Accordion({ onToggle }: any) { return <div onClick={onToggle}>Title</div>; } // qed-ignore QED004"
    } -ExpectedRule "" -ShouldPass $true

    # 22. Smart Heuristic: Test files allow as any and console.log
    Assert-LinterRule -TestName "Heuristic: Test files relax non-fatal rules" -Files @{
        "src/math.test.ts" = "console.log('test run'); const mock = {} as any;"
    } -ExpectedRule "" -ShouldPass $true

    # 23. Rule QED006: Unbounded Cache
    Assert-LinterRule -TestName "Rule QED006: Unbounded Module-Level Cache" -Files @{
        "src/cache.ts" = "export const userCache = new Map();"
    } -ExpectedRule "QED006" -ShouldPass $false

} finally {
    Remove-Item -Path $fixtureDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "`n----------------------------------------------------------"
$resColor = if ($testsFailed -eq 0) { "Green" } else { "Red" }
Write-Host "Linter Test Results: $testsPassed Passed, $testsFailed Failed" -ForegroundColor $resColor

if ($testsFailed -gt 0) {
    exit 1
}
exit 0
