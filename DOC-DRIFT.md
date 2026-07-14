# SQL Detective — Planning-Doc Drift

Audit date: 2026-06-11 (branch `sqlgame`). Compiled per audit prompt v2, Phase 5.

**Status of the planning docs themselves:** `PROJECT-BRIEF.md`, `ARCHITECTURE.md`, `CLAUDE-CODE-PROMPT.md`, and `ERROR-CATALOG.md` are **not present in this repository** (searched repo + home directory). They appear to live outside the repo (prompt-library side). Every "known drift" claim from the audit prompt is verified against the code below so the external docs can be corrected line-by-line; the only doc *in* the repo that references the old plan is `ROADMAP.md`, noted at the end.

## Verified drift items

| # | Doc claim (per audit prompt) | Reality in code | Proposed one-line correction |
|---|---|---|---|
| 1 | Built as a **daedalOS fork** | Custom Next.js 14 webOS shell; daedalOS appears only as "Reference Inspiration" (`ROADMAP.md:95`) | "The shell is a custom Next.js 14 + zustand window manager; daedalOS was inspiration only, no forked code." |
| 2 | A **CaseReport app** collects the player's findings | No such app exists; the accusation is free-text typed into the SQL Terminal's accusation bar (`SqlTerminal.tsx`, `accusing` state) | "Accusations are typed directly in the SQL Terminal; there is no separate CaseReport app." |
| 3 | Solutions validated by **result-set comparison** (player's rows vs expected rows) | Validation is name matching: `checkAnswer()` in `src/lib/sqldetective/answer.ts` (normalize + canonical/last-name/alias compare); a successful query merely unlocks the SUBMIT ANSWER button (`hasRunSuccess`) | "Winning = naming the suspect via checkAnswer(); query results gate the accusation but are never diffed against an expected result set." |
| 4 | Game state in **`lib/gameState.ts` + raw localStorage** | `src/store/useCaseStore.ts`, zustand `persist` middleware (storage key `sql-detective-game-state`); no `gameState.ts` exists. (Only DetectiveNotes uses raw localStorage, keyed `detective-notes-<caseId>`.) | "Progression state lives in a zustand persist store (`useCaseStore.ts`); raw localStorage is used only for the notepad text." |
| 5 | **CrimeOS green-CRT/phosphor dark theme** | Win95 light theme throughout: gray chrome tokens in `globals.css`, terminal is white-editor Win95 light (`win95Theme.ts`, commit `ac1123a`). Phosphor remnants survive only as off-theme constants inside `Inbox.tsx`/`CaseFile.tsx` (AUDIT-REPORT F-10/F-11) | "The visual theme is Windows 95 light (navy #000080 accents on #c0c0c0 gray), not green-on-black CRT." |
| 6 | **node-sql-parser pre-execution validation layer** | Never imported; removed from package.json this pass (AUDIT-REPORT F-05). Validation strategy: gate by first keyword + statement split, then let SQLite error and translate post-hoc (`friendlyError`) | "Pre-execution parsing was dropped — SQLite is the single source of truth for validity; errors are translated after execution (see DECISIONS.md 2026-06-11)." |

## ERROR-CATALOG coverage table (entries implemented vs not)

ERROR-CATALOG.md is not in the repo, so this maps the *implemented* player-facing messages in `queryEngine.ts` for reconciliation against the external catalog. The one catalog string quoted in the audit prompt ("Run one query at a time…") is implemented verbatim.

| Player mistake | Implemented message (paraphrase) | Status |
|---|---|---|
| Write/DDL statement (INSERT/UPDATE/DELETE/DROP/CREATE/ALTER/PRAGMA/ATTACH/transactions…) | "This terminal is read-only — evidence databases can't be modified. Detectives investigate; they don't tamper." | NEW this pass (Fix 1) |
| Multiple statements | "Run one query at a time. Split your queries and run them separately." | NEW this pass (Fix 2), matches catalog verbatim |
| Empty input | "Nothing to run. Type a SQL query first." | implemented |
| Unknown table | "There's no table called 'X'… Did you mean 'Y'? Open the Schema tab…" (Levenshtein ≤ 3) | implemented |
| Unknown column | "No column named 'X'. Did you mean 'Y'? Check the Schema tab…" | implemented |
| Known column but no FROM | missing-FROM message (rerouted from raw no-such-column — Fix 3 refinement) | NEW this pass |
| Ambiguous column | "'X' exists in more than one table. Specify which table: tablename.X" | implemented |
| Datatype mismatch | "Type mismatch… wrap the value in quotes: WHERE column = 'value'" | implemented |
| FORM / SELCT / SLECT / WHRE / WERE typos | "Did you mean FROM / SELECT / WHERE?" (now literal-safe, fallback-ordered) | implemented (hardened by Fix 3) |
| Doesn't start with SELECT (unrecognized keyword) | "SQL queries start with SELECT…" | implemented |
| Unclosed quote / unclosed parenthesis | dedicated messages | implemented |
| Anything else | "Query error: <raw SQLite message>" | implemented (fallback) |
| Not implemented (if the catalog lists them): JOIN-condition mistakes, GROUP BY/aggregate misuse, LIMIT misuse, subquery errors | fall through to the raw-error fallback | NOT implemented — candidates for future catalog entries |

## In-repo doc drift

- `ROADMAP.md` — pre-dates the game and the Win95 reskin entirely (macOS Sequoia design references, menubar/Mission Control roadmap items, daedalOS/macOS "Reference Inspiration"). Proposed correction: add a "superseded by the Win95/SQL Detective direction (see DECISIONS.md)" banner or rewrite the Phase list.
- `README.md` / `PROGRESS.md` / `STYLE_GUIDE.md` — describe the generic webOS (pre-game); no SQL Detective or Win95 sections. Proposed correction: one paragraph each pointing at the sqlgame branch state.
