# SQL Detective — Audit Report

Audit & hardening pass per prompt v2, on branch `sqlgame` (base `ac1123a`).
Date: 2026-06-11. Auditor: Claude Code.

## Executive summary

The game content is sound — all three cases build, their schemas are honest, the intended solution paths (including the Case 1/2 red herrings) return exactly the right suspects, and the accusation matcher rejects every non-suspect. The one P0 was the terminal itself: the evidence DB was writable (`DROP TABLE employees` destroyed a case mid-session — reproduced in the harness), now blocked by a read-only guard plus a REBUILD DB recovery button. Error translation had a heuristic-before-fact ordering bug and a `WERE`-in-string-literal false positive, both fixed; multi-statement input is now rejected with the catalog message; the dead `node-sql-parser` dependency is gone. DetectiveNotes shared one notepad across all cases (P1) — fixed with per-case keying. Remaining findings are P2 polish, listed below with a proposed order.

## Phase 0 — game surface inventory

| Area | Files | Role |
|---|---|---|
| Engine | `src/lib/sqldetective/queryEngine.ts` | sql.js init, DB build, query gating + execution, friendly error translation |
| Answers | `src/lib/sqldetective/answer.ts` | `normalize()` + `checkAnswer()` free-text accusation matching |
| Types | `src/lib/sqldetective/types.ts` | `GameCase`, `CaseSchema`, `QueryOutcome` contracts |
| Cases | `src/lib/sqldetective/cases/{case001,case002,case003,index}.ts` | 3 cases: briefing, schema, seed SQL, solution + 3 hints each |
| Desktop hook | `src/lib/sqldetective/desktopIcon.ts` | creates the per-case desktop folder (double-guarded against dupes) |
| Apps | `src/components/apps/sqldetective/{Inbox,CaseFile,SqlTerminal,DetectiveNotes}.tsx`, `data.ts`, `win95Theme.ts` | email client, briefing/schema viewer, the terminal (CodeMirror + Win95 light theme), per-case notepad |
| Store | `src/store/useCaseStore.ts` | zustand + persist: activeCaseId, completedCases, hintsUsed, xp, openedCases, desktopIconsCreated |
| Scripts | `scripts/verify-cases.js` (harness, see Phase 1), `scripts/copy-sqljs-wasm.js` (postinstall → `public/sql-wasm.wasm`) |
| Shell touchpoints | `desktop/Taskbar.tsx` + `desktop/StartMenu.tsx` (unread-case badges via `unreadCount()`), `desktop/TaskbarClock.tsx`, `window/Window.tsx` + `window/Win95TitleButtons.tsx` (chrome only — no game logic) |

## Findings

| ID | Sev | Location | Description | Status |
|---|---|---|---|---|
| F-01 | P0 | `queryEngine.ts` (`executeQuery`) | Evidence DB was writable: `DROP TABLE employees` executed and returned "Query ran successfully", destroying the case until reopen (reproduced in harness baseline). | **FIXED** — write-keyword guard (`errorKind: 'semantic'`, themed message) + ⟲ REBUILD DB button in the terminal toolbar |
| F-02 | P1 | `queryEngine.ts` (`executeQuery`) | Multiple statements executed silently with only the first result shown (`SELECT 1; SELECT 2;` → "1"). | **FIXED** — quote/comment-aware splitter rejects with the catalog message |
| F-03 | P1 | `queryEngine.ts` (`friendlyError`) | Typo heuristics ran before raw SQLite patterns, so a typo'd table name plus the word "were" in a string literal produced "Did you mean WHERE?" instead of the no-such-table suggestion. | **FIXED** — raw patterns first; heuristics run on string-literal-stripped SQL as fallback |
| F-04 | P1 | `friendlyError` (new behavior) | After reordering, `SELECT name, floor WHERE floor = 4` would surface raw "no such column: name" even though the schema has that column — the real mistake is the missing FROM. | **FIXED** — no-such-column branch falls through to the missing-FROM message when the column exists in the schema and the query has no FROM |
| F-05 | P2 | `package.json` | `node-sql-parser@5.4.0` shipped in dependencies with zero imports anywhere in `src/`. | **FIXED** — removed; build clean |
| F-06 | P1 | `DetectiveNotes.tsx` | Notepad hardcoded to `detective-notes-case-001` (storage key, header, footer) — all cases shared one pad; case switches bled notes across investigations. | **FIXED** — keyed by `activeCaseId` (backward compatible: the old key string equals the new template for case-001), pending saves flush to the old case's key on switch |
| F-07 | P2 | `useCaseStore.ts:47` | `isLocked` returns `false` (unlocked) for unknown case ids (`findIndex` → −1 hits the `idx <= 0` early-return). Harmless today (only registry ids are ever queried) but a typo'd id would silently unlock. Suggest `if (idx === -1) return true`. | REPORTED |
| F-08 | P2 | `useCaseStore.ts:98-100` | persist config has no `version`/`migrate`. Shallow default merge handles *added* keys (verified live: an old shape missing `openedCases`/`desktopIconsCreated` rehydrates cleanly), but any future *renamed/reshaped* key will need a migration hook. | REPORTED |
| F-09 | P2 | `cases/case002.ts:8` | Concept ladder gap: solving requires `LIKE '%447'`, but `sqlConcepts` declares only `[SELECT, WHERE, INNER JOIN]`; hint 3 teaches LIKE explicitly. Case content frozen this pass — fix is adding `'LIKE'` to `sqlConcepts`. Harness emits a permanent WARN until then. | REPORTED |
| F-10 | P2 | `Inbox.tsx:148,156,161,191,216,273` | Dark/macOS-era styling in a Win95 app: `hover:bg-white/5` (invisible on light bg), phosphor-green avatar `#1d4a1d`/`#7fbf7f`, unread dot `#5fe070`, `✓ CLOSED` badge `#6bffb8` (light-on-light, near-illegible), amber classification chip `#3a2c0e`/`#e0b020`, rounded corners throughout. | REPORTED |
| F-11 | P2 | `CaseFile.tsx:11-12,44-62,130-165` | Phosphor constants (`#7fbf7f`/`#b8ff6a`) and a `glass` tab bar; SCHEMA tab renders green-on-gray with `rgba(0,0,0,0.2)` cards and `rounded-lg` — the one remaining dark-era interior in the game. (The `glass` class itself is aliased to a Win95 raised surface in globals.css, so it renders solid, but the green text on gray is off-theme.) | REPORTED |
| F-12 | P2 | `Inbox.tsx:49-50` | Stale comment: claims the reader "defaults to the active case so the panel isn't empty when the app is reopened" — `selectedId` actually initializes to `null` and shows the placeholder. Make the code match the comment (nicer UX) or fix the comment. | REPORTED |
| F-13 | P2 | shell-wide | `lucide-react` icons in 6 shell files where inline SVG is the Win95 standard: `Taskbar.tsx:3`, `Spotlight.tsx:5`, `ControlCenter.tsx:4`, `NotificationCenter.tsx:4`, `DesktopContextMenu.tsx:5`, `MobileOverlay.tsx:4`. | REPORTED |
| F-14 | P2 | `desktop/Clock.tsx` | Dead code: zero imports anywhere (`grep -rn "desktop/Clock\|from './Clock'"` → only `AppContent.tsx` importing `./ClockApp`, a different file). The macOS-era Dock/MenuBar/TrafficLights files do **not** exist on this branch (already removed in earlier reskins); Spotlight/ControlCenter/NotificationCenter/SleepScreen are all still imported by `SystemLayer.tsx` and are live. | REPORTED (no deletions this pass) |
| F-15 | P2 | n/a | AI-assistant code check: **no ARIA/Gemini/assistant code exists on this branch.** `grep -rin "gemini|'aria'|aria-assistant"` over `src/` matches only standard `aria-*` accessibility attributes. | REPORTED (nothing to do) |

Notes on terminal lifecycle (Phase 3 item 8, all verified healthy): close/reopen rebuilds the DB via the mount effect; rapid case switches are raced-guarded by the `cancelled` flag (stale builds are closed, not assigned); the REBUILD DB button reuses that same effect (nonce bump), so editor content survives a rebuild while outcome/hint/accusation state resets. One intentional behavior: rebuild also resets `hasRunSuccess`, so SUBMIT ANSWER re-disables until the player runs another successful query.

## Phase 1 — case playability harness

`npm run verify:cases` (added to package.json). Asserts per case: seed SQL builds; schema honesty both directions (tables via `sqlite_master`, columns via `PRAGMA table_info`, type suffixes stripped); intended solution paths with red herrings pinned; hint identifier truthfulness; accusation matcher accepts canonical/last-name/mixed-case/punctuation/whitespace and rejects every seed-data name + last name; plus the Fix 1–3 guard-rail batteries. Exits non-zero on any failure.

### Concept-ladder minimal solving sequences (Phase 1 item 6)

- **Case 1** (`SELECT`, `WHERE`): ① `SELECT * FROM break_room_log WHERE entry_time <= '09:20' AND exit_time >= '09:00'` → employee_ids {2, 3}; ② `SELECT * FROM employees WHERE floor = 4` → ids {2, 4, 6}; cross-reference by eye → id 2 = Dave Kowalski. (Asserted programmatically as an intersection; the JOIN single-query path is also asserted but is beyond the declared ladder.)
- **Case 2** (`SELECT`, `WHERE`, `INNER JOIN` — **plus undeclared `LIKE`**, see F-09): ① join `uniform_assignments` to `city_employees` with `uniform_id LIKE '%447'` → Craig Muller (Parks) + Yuki Tanaka (Sanitation); ② add `department = 'Parks'` (the complainant saw a Parks uniform) → Craig Muller.
- **Case 3** (`SELECT`, `GROUP BY`, `COUNT`, `ORDER BY`): `SELECT civilian_name, COUNT(*) FROM jaywalking_citations GROUP BY civilian_name ORDER BY COUNT(*) DESC` → Brenda Watts (6) on top. No LIMIT needed — the top row reads off.

### Full passing output

```
case-001 — The Missing Muffin
  PASS  seed SQL executes
  PASS  schema lists exactly the real tables
  PASS  schema columns for employees match the real DB
  PASS  schema columns for break_room_log match the real DB
  PASS  schema columns for muffin_inventory match the real DB
  PASS  hint 1 only references real tables/columns
  PASS  hint 2 only references real tables/columns
  PASS  hint 3 only references real tables/columns
  PASS  accepts canonical answer
  PASS  accepts last name alone ('Kowalski')
  PASS  accepts mixed casing ('dAvE KoWaLsKi')
  PASS  accepts trailing punctuation
  PASS  accepts extra whitespace
  PASS  rejects empty input
  PASS  rejects non-suspect 'Alice Chen'
  PASS  rejects non-suspect last name 'Chen'
  PASS  rejects non-suspect 'Maria Santos'
  PASS  rejects non-suspect last name 'Santos'
  PASS  rejects non-suspect 'Tom Birch'
  PASS  rejects non-suspect last name 'Birch'
  PASS  rejects non-suspect 'Priya Nair'
  PASS  rejects non-suspect last name 'Nair'
  PASS  rejects non-suspect 'Jim Foster'
  PASS  rejects non-suspect last name 'Foster'
  PASS  rejects non-suspect 'Sandra Lee'
  PASS  rejects non-suspect last name 'Lee'
  PASS  time-window step surfaces Dave Kowalski AND the Maria Santos red herring
  PASS  cross-reference with floor = 4 isolates exactly Dave Kowalski
  PASS  single-query solution returns exactly Dave Kowalski

case-002 — The Unauthorized Nap
  PASS  seed SQL executes
  PASS  schema lists exactly the real tables
  PASS  schema columns for city_employees match the real DB
  PASS  schema columns for uniform_assignments match the real DB
  PASS  schema columns for work_schedules match the real DB
  PASS  hint 1 only references real tables/columns
  PASS  hint 2 only references real tables/columns
  PASS  hint 3 only references real tables/columns
  PASS  accepts canonical answer
  PASS  accepts last name alone ('Muller')
  PASS  accepts mixed casing ('cRaIg mUlLeR')
  PASS  accepts trailing punctuation
  PASS  accepts extra whitespace
  PASS  rejects empty input
  PASS  rejects non-suspect 'Ronaldo Perez'
  PASS  rejects non-suspect last name 'Perez'
  PASS  rejects non-suspect 'Yuki Tanaka'
  PASS  rejects non-suspect last name 'Tanaka'
  PASS  rejects non-suspect 'Beth Okafor'
  PASS  rejects non-suspect last name 'Okafor'
  PASS  rejects non-suspect 'Diane Frost'
  PASS  rejects non-suspect last name 'Frost'
  PASS  rejects non-suspect 'Henry Lam'
  PASS  rejects non-suspect last name 'Lam'
  PASS  uniform LIKE '%447' surfaces exactly Craig Muller (Parks) and Yuki Tanaka (Sanitation)
  PASS  adding the Parks filter isolates exactly Craig Muller
  WARN  concept ladder gap: solving needs LIKE '%447', but sqlConcepts only declares [SELECT, WHERE, INNER JOIN] — hint 3 teaches LIKE explicitly; see AUDIT-REPORT.md

case-003 — The Serial Jaywalker
  PASS  seed SQL executes
  PASS  schema lists exactly the real tables
  PASS  schema columns for jaywalking_citations match the real DB
  PASS  hint 1 only references real tables/columns
  PASS  hint 2 only references real tables/columns
  PASS  hint 3 only references real tables/columns
  PASS  accepts canonical answer
  PASS  accepts last name alone ('Watts')
  PASS  accepts mixed casing ('bReNdA WaTtS')
  PASS  accepts trailing punctuation
  PASS  accepts extra whitespace
  PASS  rejects empty input
  PASS  rejects non-suspect 'Terry Glass'
  PASS  rejects non-suspect last name 'Glass'
  PASS  rejects non-suspect 'Park Ave'
  PASS  rejects non-suspect last name 'Ave'
  PASS  rejects non-suspect 'Sam Obi'
  PASS  rejects non-suspect last name 'Obi'
  PASS  rejects non-suspect 'Nina Vasquez'
  PASS  rejects non-suspect last name 'Vasquez'
  PASS  citation counts are exactly Brenda 6, Terry 5, Sam 3, Nina 2
  PASS  ORDER BY count DESC puts Brenda Watts on top

query engine — read-only guard (Fix 1)
  PASS  blocks: DROP TABLE
  PASS  blocks: DELETE FROM
  PASS  blocks: UPDATE employees
  PASS  blocks: INSERT INTO
  PASS  blocks: CREATE TABLE
  PASS  blocks: ALTER TABLE
  PASS  DB unchanged after blocked statements
  PASS  trailing semicolon still runs
  PASS  leading comment + SELECT still runs
  PASS  comment-wrapped write is still blocked
  PASS  WITH (CTE) runs

query engine — multi-statement policy (Fix 2)
  PASS  rejects 'SELECT 1; SELECT 2;' with the catalog message
  PASS  'SELECT 1;' runs fine
  PASS  semicolon inside a string literal is not a statement break
  PASS  multi-statement with a write is rejected (and nothing executes)

query engine — friendly error translation (Fix 3)
  PASS  typo'd table + 'were' inside a string literal → no-such-table message with suggestion
  PASS  SELCT typo heuristic fires
  PASS  FORM typo heuristic fires
  PASS  WERE typo heuristic fires (outside string literals)
  PASS  unclosed quote heuristic fires
  PASS  unclosed parenthesis heuristic fires
  PASS  missing-FROM heuristic fires
  PASS  Levenshtein suggests break_room_log for break_rom_log
  PASS  no-such-column message fires with a suggestion
  PASS  Levenshtein suggests civilian_name for civillian_name

ALL CHECKS PASSED (1 warning)
```

## Phase 3 — game flow & state audit results

1. **Progression** ✓ — case-002 locked until case-001 ∈ `completedCases`, case-003 until case-002; index 0 always unlocked. Unknown ids: see F-07.
2. **Hint flow** ✓ — one click = one `nextHint` peek + one `useHint` increment (clamped at 2); exhaustion shows "No more hints" without over-incrementing; `hintsUsed` persists (zustand persist).
3. **completeCase idempotency** ✓ — both the array append and the +100 XP share the same `includes` guard; re-solving cannot double-award.
4. **Persistence migration** ✓ (live test) — wrote `{activeCaseId, completedCases, hintsUsed, xp}` only (old shape) to localStorage; app rehydrated without crashing and re-persisted with `openedCases: []`, `desktopIconsCreated: []` defaulted in. See F-08 for the future-rename caveat.
5. **DetectiveNotes** — was P1-broken (one shared pad); FIXED, verified live: note typed under case-001, switch to case-002 → empty `#0002` pad, `detective-notes-case-001` key intact, zero bleed.
6. **Inbox unread/opened/completed** ✓ — `unreadCount` = unlocked ∧ unopened, consumed by Taskbar tray badge and StartMenu Inbox badge (both verified live, including re-badging the moment case-002 unlocked).
7. **Desktop icon dedupe** ✓ (live test) — with `desktopIconsCreated` wiped but the server-side FS folder still present, reopening case-001 created no duplicate (name-existence check) and re-marked the flag.
8. **Terminal lifecycle** ✓ — see notes under Findings.

## Phase 4 — quality gates

- `npx tsc --noEmit`: **0 errors**. `npm run build`: **✓ Compiled successfully**, no warnings captured beyond Next.js boilerplate output.
- Win95 consistency offenders: F-10, F-11, F-13 (file:line in the table). `Taskbar.tsx`/`StartMenu.tsx`/`TaskbarClock.tsx`/`DetectiveNotes.tsx` are otherwise clean (no `rounded`/`glass`/blur).
- Dead-code candidates: F-14 (only `desktop/Clock.tsx`).
- AI-assistant code: F-15 — none exists.

## Final gate

- `npm run verify:cases` → ALL CHECKS PASSED (exit 0; 1 intentional WARN = F-09)
- `npx tsc --noEmit` → clean; `npm run build` → clean
- **Manual smoke (performed in Chrome against the dev server, 2026-06-11):** logged in (PIN 0000) → Start ▸ Inbox showed unread badge "1" → opened Case #0001 email (badge cleared, no duplicate desktop folder) → Open Case File (briefing + CASE #0001 stamp) → Start ▸ SQL Terminal → `DROP TABLE employees` rejected with the read-only message → `SELECT 1; SELECT 2;` rejected with the one-query message → ran the JOIN time-window/floor-4 query → one row (Dave Kowalski, 09:03–09:18) → ⟲ REBUILD DB reset results to the Ready banner with editor content intact → re-ran, SUBMIT ANSWER → "Dave Kowalski" → **CASE CLOSED** dialog, +100 XP → OK → tray badge re-lit with "1": **Case #0002 unlocked**. Persisted state confirmed: `completedCases:["case-001"], xp:100`.

## Proposed order for remaining reported items

1. **F-09** — add `'LIKE'` to case-002 `sqlConcepts` (one-token case-content change; clears the harness WARN).
2. **F-10** — Inbox Win95 reskin (worst visible offender: invisible hover + light-on-light CLOSED badge).
3. **F-11** — CaseFile SCHEMA tab Win95 reskin.
4. **F-07 + F-08** — store hardening (unknown-id lock + persist `version: 1` with a pass-through migrate).
5. **F-12** — Inbox default-selection comment/code mismatch.
6. **F-13** — replace lucide-react icons with inline SVG shell-wide (then drop the dependency).
7. **F-14** — delete `desktop/Clock.tsx` (next cleanup pass that allows deletions).
