// Browser-only SQLite engine for SQL Detective. sql.js (SQLite compiled to
// WASM) builds each case's database in memory from its dbSetupSQL seed script.
// No server, no .db files — the WASM binary is served from /sql-wasm.wasm
// (copied into public/ by scripts/copy-sqljs-wasm.js). Never import this from a
// server component: it relies on fetch + the browser WASM runtime.

import type { Database, SqlJsStatic } from 'sql.js'
import type { CaseSchema, QueryOutcome } from './types'

let SQL: SqlJsStatic | null = null

/** Initialize sql.js once. Loads the WASM from /sql-wasm.wasm (public dir). */
export async function initSql(): Promise<SqlJsStatic> {
  if (SQL) return SQL
  const initSqlJs = (await import('sql.js')).default
  SQL = await initSqlJs({
    locateFile: () => '/sql-wasm.wasm',
  })
  return SQL
}

/** Create and seed a case database from setup SQL. */
export async function createCaseDb(dbSetupSQL: string): Promise<Database> {
  const SqlEngine = await initSql()
  const db = new SqlEngine.Database()
  db.run(dbSetupSQL)
  return db
}

// ─────────────────────────────────────────────
// Statement gating (read-only terminal)
// ─────────────────────────────────────────────

/** Drop leading whitespace and -- / block comments until real SQL starts. */
function skipLeadingTrivia(sql: string): string {
  let s = sql
  let prev: string
  do {
    prev = s
    s = s.replace(/^\s+/, '').replace(/^--[^\n]*(\n|$)/, '')
    if (s.startsWith('/*')) {
      const end = s.indexOf('*/')
      s = end === -1 ? '' : s.slice(end + 2)
    }
  } while (s !== prev)
  return s
}

function firstKeyword(sql: string): string {
  const m = skipLeadingTrivia(sql).match(/^[A-Za-z]+/)
  return m ? m[0].toUpperCase() : ''
}

// Every SQLite statement that can change the database (or its handle) starts
// with one of these. Anything else either reads (SELECT/WITH/EXPLAIN/VALUES)
// or is invalid SQL that the engine will reject on execution — so blocking by
// first keyword is sufficient to keep the evidence DB immutable while still
// letting typo'd keywords (SELCT, ELECT…) reach friendlyError's heuristics.
const WRITE_KEYWORDS = new Set([
  'INSERT', 'UPDATE', 'DELETE', 'REPLACE', 'DROP', 'CREATE', 'ALTER',
  'TRUNCATE', 'ATTACH', 'DETACH', 'PRAGMA', 'VACUUM', 'REINDEX', 'ANALYZE',
  'BEGIN', 'COMMIT', 'END', 'ROLLBACK', 'SAVEPOINT', 'RELEASE',
])

const READ_ONLY_MESSAGE =
  "This terminal is read-only — evidence databases can't be modified. Detectives investigate; they don't tamper."

const MULTI_STATEMENT_MESSAGE =
  'Run one query at a time. Split your queries and run them separately.'

/** True if a semicolon outside string literals/comments is followed by more SQL. */
function hasMultipleStatements(sql: string): boolean {
  let inString = false
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]
    if (inString) {
      if (ch === "'") inString = false // '' escape re-enters on the next quote
      continue
    }
    if (ch === "'") {
      inString = true
      continue
    }
    if (ch === '-' && sql[i + 1] === '-') {
      const nl = sql.indexOf('\n', i)
      if (nl === -1) return false
      i = nl
      continue
    }
    if (ch === '/' && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2)
      if (end === -1) return false
      i = end + 1
      continue
    }
    if (ch === ';' && skipLeadingTrivia(sql.slice(i + 1)) !== '') return true
  }
  return false
}

// ─────────────────────────────────────────────
// Error translation
// ─────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[a.length][b.length]
}

function closestMatch(input: string, options: string[]): string | null {
  if (!options.length) return null
  const scored = options.map((o) => ({
    o,
    d: levenshtein(input.toLowerCase(), o.toLowerCase()),
  }))
  const best = scored.sort((a, b) => a.d - b.d)[0]
  return best.d <= 3 ? best.o : null
}

function getAllColumns(schema: CaseSchema): string[] {
  return Object.values(schema.tables).flatMap((t) =>
    t.columns.map((c) => c.split(' ')[0]) // "name TEXT" → "name"
  )
}

function getTableNames(schema: CaseSchema): string[] {
  return Object.keys(schema.tables)
}

/** Blank out '…' literals (handling '' escapes) so typo heuristics never match
 *  words the player wrote inside a string. */
function stripStringLiterals(sql: string): string {
  return sql.replace(/'(?:[^']|'')*'/g, "''")
}

function friendlyError(raw: string, sql: string, schema: CaseSchema): string {
  // Raw SQLite error patterns first — these are precise. The typo heuristics
  // below are guesses and only run as a fallback for generic syntax errors.

  // Table not found
  const tableMatch = raw.match(/no such table[:\s]+(\w+)/i)
  if (tableMatch) {
    const name = tableMatch[1]
    const suggestion = closestMatch(name, getTableNames(schema))
    return `There's no table called '${name}' in this case's database.${suggestion ? ` Did you mean '${suggestion}'?` : ''} Open the Schema tab to see available tables.`
  }

  // Column not found
  const colMatch = raw.match(/no such column[:\s]+(\w+)/i)
  if (colMatch) {
    const name = colMatch[1]
    const allColumns = getAllColumns(schema)
    // If the column exists in the schema but the query has no FROM, the real
    // mistake is the missing table — "no such column" would mislead here.
    const upperNoStrings = stripStringLiterals(sql).toUpperCase()
    if (
      allColumns.some((c) => c.toLowerCase() === name.toLowerCase()) &&
      upperNoStrings.trim().startsWith('SELECT') &&
      !/\bFROM\b/.test(upperNoStrings)
    ) {
      return "You listed columns to SELECT but didn't say which table. Add FROM tablename after your column list."
    }
    const suggestion = closestMatch(name, allColumns)
    return `No column named '${name}'.${suggestion ? ` Did you mean '${suggestion}'?` : ''} Check the Schema tab for column names.`
  }

  // Ambiguous column
  if (/ambiguous column name/i.test(raw)) {
    const name = raw.match(/ambiguous column name[:\s]+(\S+)/i)?.[1] ?? ''
    return `'${name}' exists in more than one table. Specify which table: tablename.${name}`
  }

  // Type mismatch
  if (/datatype mismatch/i.test(raw))
    return "Type mismatch: you're comparing incompatible types. If comparing to text, wrap the value in quotes: WHERE column = 'value'"

  // Fallback: common typos / missing keywords. Run against the query with
  // string literals blanked out, so e.g. WHERE note = 'we were here' can't
  // trip the WERE→WHERE guess.
  const stripped = stripStringLiterals(sql)
  const upper = stripped.toUpperCase().trim()

  if (/\bFORM\b/.test(upper) && !/\bFROM\b/.test(upper))
    return "Did you mean FROM? 'FORM' isn't a SQL keyword."
  if (/\bSELCT\b|\bSLECT\b/.test(upper))
    return "Did you mean SELECT? Check the spelling of your first keyword."
  if (/\bWHRE\b|\bWERE\b/.test(upper) && !/\bWHERE\b/.test(upper))
    return "Did you mean WHERE? That's the filtering keyword — check the spelling."
  if (!upper.includes('FROM') && upper.startsWith('SELECT') && upper.includes('WHERE'))
    return "You listed columns to SELECT but didn't say which table. Add FROM tablename after your column list."
  if (!upper.startsWith('SELECT') && !upper.startsWith('WITH'))
    return "SQL queries start with SELECT. Tell SQL what columns you want first."
  if ((sql.match(/'/g) || []).length % 2 !== 0)
    return "You have an unclosed quote — every opening ' needs a matching closing one."
  if ((stripped.match(/\(/g) || []).length !== (stripped.match(/\)/g) || []).length)
    return "You have an unclosed parenthesis. Count your ( and ) — they should match."

  // Generic fallback
  return `Query error: ${raw}`
}

// ─────────────────────────────────────────────
// Main execute function
// ─────────────────────────────────────────────

export function executeQuery(
  sql: string,
  db: Database,
  schema: CaseSchema
): QueryOutcome {
  const trimmed = sql.trim()

  if (!trimmed) {
    return {
      type: 'error',
      errorKind: 'syntax',
      message: 'Nothing to run. Type a SQL query first.',
    }
  }

  // A single trailing semicolon is fine; strip it before the statement checks.
  const single = trimmed.replace(/;\s*$/, '')

  if (hasMultipleStatements(single)) {
    return {
      type: 'error',
      errorKind: 'semantic',
      message: MULTI_STATEMENT_MESSAGE,
    }
  }

  if (WRITE_KEYWORDS.has(firstKeyword(single))) {
    return {
      type: 'error',
      errorKind: 'semantic',
      message: READ_ONLY_MESSAGE,
    }
  }

  try {
    const results = db.exec(single)

    if (!results.length || !results[0].values.length) {
      return {
        type: 'empty',
        message: 'Query ran successfully. No rows matched your filters.',
      }
    }

    const { columns, values } = results[0]
    const rows = values.map((row) =>
      Object.fromEntries(columns.map((col, i) => [col, row[i]]))
    )

    return {
      type: 'success',
      result: { columns, rows, rowCount: rows.length },
    }
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e)
    return {
      type: 'error',
      errorKind: 'runtime',
      message: friendlyError(raw, trimmed, schema),
      rawError: raw,
    }
  }
}
