// SQL Detective — case playability harness. Headless regression suite for the
// game logic: builds every case's DB from dbSetupSQL and asserts, per case:
//   1. the seed SQL executes cleanly in sql.js
//   2. schema honesty — schema.tables matches the real DB exactly, both
//      directions (the Schema tab is the player's map; it must never lie)
//   3. the intended solution path returns the right suspect (red herrings
//      asserted intact)
//   4. hint truthfulness — every table/column identifier a hint mentions exists
//   5. the accusation matcher accepts the canonical answer in lenient formats
//      and rejects every other person named in the seed data
//   6. concept ladder — the case is solvable with only its declared sqlConcepts
//      (case 2 additionally needs LIKE; flagged as WARN, see AUDIT-REPORT.md)
// plus the query-engine guard rails (read-only guard, multi-statement policy,
// friendly error translation). Exits non-zero on any failure.
// Run: npm run verify:cases
const fs = require('fs')
const path = require('path')
const ts = require('typescript')
const initSqlJs = require('sql.js')

// Transpile a single TS module (strips `import type`, compiles to CJS).
function loadTs(file, deps = {}) {
  const src = fs.readFileSync(file, 'utf8')
  const js = ts.transpileModule(src, {
    compilerOptions: { module: 'commonjs', target: 'es2019' },
  }).outputText
  const module = { exports: {} }
  const require2 = (spec) => {
    if (deps[spec]) return deps[spec]
    throw new Error('unexpected require: ' + spec)
  }
  new Function('module', 'exports', 'require', js)(module, module.exports, require2)
  return module.exports
}

const base = path.join(__dirname, '..', 'src', 'lib', 'sqldetective')
const typesStub = {} // modules only `import type` from ./types — erased
const { checkAnswer } = loadTs(path.join(base, 'answer.ts'), { './types': typesStub })
const { executeQuery } = loadTs(path.join(base, 'queryEngine.ts'), {
  './types': typesStub,
  'sql.js': initSqlJs, // only reached via initSql(), which this harness never calls
})
const cases = ['case001', 'case002', 'case003'].map((f) => {
  const mod = loadTs(path.join(base, 'cases', f + '.ts'), { '../types': typesStub })
  return Object.values(mod)[0]
})

// ── tiny assertion collector ────────────────────────────────────────────────
let failures = 0
let warnings = 0
function check(label, ok, detail = '') {
  if (ok) {
    console.log(`  PASS  ${label}`)
  } else {
    failures++
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
  }
}
function warn(label, detail = '') {
  warnings++
  console.log(`  WARN  ${label}${detail ? ` — ${detail}` : ''}`)
}
function setEq(a, b) {
  const A = new Set(a)
  const B = new Set(b)
  return A.size === B.size && [...A].every((x) => B.has(x))
}

// ── helpers over a built DB ─────────────────────────────────────────────────
function realTables(db) {
  const res = db.exec(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  )
  return res[0] ? res[0].values.map((r) => r[0]) : []
}
function realColumns(db, table) {
  const res = db.exec(`PRAGMA table_info(${table})`)
  return res[0] ? res[0].values.map((r) => r[1]) : []
}
function declaredColumns(schema, table) {
  return schema.tables[table].columns.map((c) => c.split(' ')[0]) // "name TEXT" → "name"
}
function rows(db, sql) {
  const res = db.exec(sql)
  if (!res[0]) return []
  const { columns, values } = res[0]
  return values.map((v) => Object.fromEntries(columns.map((c, i) => [c, v[i]])))
}
function col(rowsArr, name) {
  return rowsArr.map((r) => r[name])
}
/** Identifiers a hint plausibly references: snake_case tokens + the word right
 *  before "table"/"tables". Under-extraction is safe (we only assert that what
 *  IS extracted exists); over-extraction would cause false failures. */
function hintIdentifiers(hint) {
  const ids = new Set()
  for (const m of hint.matchAll(/\b[a-z]+(?:_[a-z]+)+\b/g)) ids.add(m[0])
  for (const m of hint.matchAll(/\b([a-z_]+)\s+tables?\b/gi)) {
    const w = m[1].toLowerCase()
    if (w !== 'the' && w !== 'both' && w !== 'these' && w !== 'two') ids.add(w)
  }
  return [...ids]
}
/** Full names ('First Last') quoted anywhere in the seed SQL. */
function seedNames(dbSetupSQL) {
  const names = new Set()
  for (const m of dbSetupSQL.matchAll(/'([A-Z][a-z]+ [A-Z][a-z]+)'/g)) names.add(m[1])
  return [...names]
}
function mixCase(s) {
  return [...s].map((ch, i) => (i % 2 ? ch.toUpperCase() : ch.toLowerCase())).join('')
}

initSqlJs().then((SQL) => {
  // ──────────────────────────────────────────────────────────────────────────
  // Per-case assertions
  // ──────────────────────────────────────────────────────────────────────────
  for (const gc of cases) {
    console.log(`\n${gc.id} — ${gc.title}`)
    const sol = gc.solution

    // 1. Seed SQL builds cleanly.
    const db = new SQL.Database()
    let seedOk = true
    try {
      db.run(gc.dbSetupSQL)
    } catch (e) {
      seedOk = false
      check('seed SQL executes', false, String(e))
    }
    if (seedOk) check('seed SQL executes', true)

    // 2. Schema honesty — both directions, tables and columns.
    const tables = realTables(db)
    check(
      'schema lists exactly the real tables',
      setEq(tables, Object.keys(gc.schema.tables)),
      `real=[${tables}] declared=[${Object.keys(gc.schema.tables)}]`
    )
    for (const t of Object.keys(gc.schema.tables)) {
      if (!tables.includes(t)) continue // already failed above
      const real = realColumns(db, t)
      const declared = declaredColumns(gc.schema, t)
      check(
        `schema columns for ${t} match the real DB`,
        setEq(real, declared),
        `real=[${real}] declared=[${declared}]`
      )
    }

    // 4. Hint truthfulness.
    const known = new Set([
      ...Object.keys(gc.schema.tables),
      ...Object.keys(gc.schema.tables).flatMap((t) => declaredColumns(gc.schema, t)),
    ])
    sol.hints.forEach((hint, i) => {
      const mentioned = hintIdentifiers(hint)
      const bogus = mentioned.filter((id) => !known.has(id))
      check(
        `hint ${i + 1} only references real tables/columns`,
        bogus.length === 0,
        `unknown identifiers: [${bogus}] in "${hint.slice(0, 60)}…"`
      )
    })

    // 5. Accusation matcher — lenient accepts…
    const lastName = sol.answer.split(' ').pop()
    check('accepts canonical answer', checkAnswer(sol.answer, sol))
    check(`accepts last name alone ('${lastName}')`, checkAnswer(lastName, sol))
    check(
      `accepts mixed casing ('${mixCase(sol.answer)}')`,
      checkAnswer(mixCase(sol.answer), sol)
    )
    check('accepts trailing punctuation', checkAnswer(sol.answer + '.', sol))
    check(
      'accepts extra whitespace',
      checkAnswer('  ' + sol.answer.replace(' ', '   ') + '  ', sol)
    )
    check('rejects empty input', !checkAnswer('', sol))
    // …and rejects every other person named in the seed data.
    const accepted = new Set(
      [sol.answer, lastName, ...(sol.accept ?? [])].map((s) => s.toLowerCase())
    )
    for (const name of seedNames(gc.dbSetupSQL)) {
      if (accepted.has(name.toLowerCase())) continue
      check(`rejects non-suspect '${name}'`, !checkAnswer(name, sol))
      const ln = name.split(' ').pop()
      if (!accepted.has(ln.toLowerCase())) {
        check(`rejects non-suspect last name '${ln}'`, !checkAnswer(ln, sol))
      }
    }

    // 3 + 6. Intended solution path + concept ladder (per case).
    if (gc.id === 'case-001') {
      // Concept ladder (SELECT, WHERE only): two queries + human cross-reference.
      const window = rows(
        db,
        "SELECT * FROM break_room_log WHERE entry_time <= '09:20' AND exit_time >= '09:00'"
      )
      const windowNames = rows(
        db,
        `SELECT name FROM employees WHERE id IN (${col(window, 'employee_id').join(',')})`
      )
      check(
        'time-window step surfaces Dave Kowalski AND the Maria Santos red herring',
        setEq(col(windowNames, 'name'), ['Dave Kowalski', 'Maria Santos']),
        `got [${col(windowNames, 'name')}]`
      )
      const floor4 = rows(db, 'SELECT id, name FROM employees WHERE floor = 4')
      const intersection = floor4.filter((e) =>
        col(window, 'employee_id').includes(e.id)
      )
      check(
        'cross-reference with floor = 4 isolates exactly Dave Kowalski',
        intersection.length === 1 && intersection[0].name === 'Dave Kowalski',
        `got [${intersection.map((e) => e.name)}]`
      )
      // Full single-query path (JOIN — beyond the declared ladder, but the
      // canonical "intended" query) must also yield exactly the suspect.
      const joined = rows(
        db,
        "SELECT e.name FROM break_room_log b JOIN employees e ON e.id = b.employee_id WHERE b.entry_time <= '09:20' AND b.exit_time >= '09:00' AND e.floor = 4"
      )
      check(
        'single-query solution returns exactly Dave Kowalski',
        setEq(col(joined, 'name'), ['Dave Kowalski']),
        `got [${col(joined, 'name')}]`
      )
    }

    if (gc.id === 'case-002') {
      const both = rows(
        db,
        "SELECT ce.name, ce.department FROM uniform_assignments u JOIN city_employees ce ON ce.id = u.employee_id WHERE u.uniform_id LIKE '%447'"
      )
      check(
        "uniform LIKE '%447' surfaces exactly Craig Muller (Parks) and Yuki Tanaka (Sanitation)",
        setEq(col(both, 'name'), ['Craig Muller', 'Yuki Tanaka']) &&
          both.find((r) => r.name === 'Craig Muller')?.department === 'Parks' &&
          both.find((r) => r.name === 'Yuki Tanaka')?.department === 'Sanitation',
        `got ${JSON.stringify(both)}`
      )
      const parks = rows(
        db,
        "SELECT ce.name FROM uniform_assignments u JOIN city_employees ce ON ce.id = u.employee_id WHERE u.uniform_id LIKE '%447' AND u.department = 'Parks'"
      )
      check(
        'adding the Parks filter isolates exactly Craig Muller',
        setEq(col(parks, 'name'), ['Craig Muller']),
        `got [${col(parks, 'name')}]`
      )
      if (!gc.sqlConcepts.includes('LIKE')) {
        warn(
          "concept ladder gap: solving needs LIKE '%447' but sqlConcepts does not declare LIKE",
          'hint 3 teaches LIKE explicitly; see AUDIT-REPORT.md'
        )
      }
    }

    if (gc.id === 'case-003') {
      const counts = rows(
        db,
        'SELECT civilian_name, COUNT(*) AS n FROM jaywalking_citations GROUP BY civilian_name ORDER BY n DESC'
      )
      const expected = {
        'Brenda Watts': 6,
        'Terry Glass': 5,
        'Sam Obi': 3,
        'Nina Vasquez': 2,
      }
      check(
        'citation counts are exactly Brenda 6, Terry 5, Sam 3, Nina 2',
        counts.length === 4 && counts.every((r) => expected[r.civilian_name] === r.n),
        `got ${JSON.stringify(counts)}`
      )
      check(
        'ORDER BY count DESC puts Brenda Watts on top',
        counts[0] && counts[0].civilian_name === 'Brenda Watts'
      )
    }

    db.close()
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Query-engine guard rails (executeQuery) — run against the case-001 DB
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\nquery engine — read-only guard (Fix 1)')
  const gc1 = cases[0]
  const db = new SQL.Database()
  db.run(gc1.dbSetupSQL)
  const schema = gc1.schema
  const run = (sql) => executeQuery(sql, db, schema)
  const tableCount = (t) => rows(db, `SELECT COUNT(*) AS n FROM ${t}`)[0].n

  const beforeCounts = realTables(db).map((t) => [t, tableCount(t)])
  const READ_ONLY_MSG = 'read-only'
  for (const stmt of [
    'DROP TABLE employees',
    'DELETE FROM employees',
    "UPDATE employees SET name = 'X'",
    "INSERT INTO employees VALUES (99,'Mallory','IT',4,'red')",
    'CREATE TABLE evil (id INTEGER)',
    'ALTER TABLE employees ADD COLUMN hacked INTEGER',
  ]) {
    const out = run(stmt)
    check(
      `blocks: ${stmt.split(' ').slice(0, 2).join(' ')}`,
      out.type === 'error' &&
        out.errorKind === 'semantic' &&
        out.message.includes(READ_ONLY_MSG),
      `got ${JSON.stringify(out)}`
    )
  }
  check(
    'DB unchanged after blocked statements',
    setEq(
      realTables(db),
      beforeCounts.map(([t]) => t)
    ) && beforeCounts.every(([t, n]) => tableCount(t) === n)
  )
  check(
    'trailing semicolon still runs',
    run('SELECT * FROM employees;').type === 'success'
  )
  check(
    'leading comment + SELECT still runs',
    run('-- a note\nSELECT * FROM employees').type === 'success'
  )
  check(
    'comment-wrapped write is still blocked',
    run('/* sneaky */ DROP TABLE employees').type === 'error'
  )
  check('WITH (CTE) runs', run('WITH x AS (SELECT 1 AS n) SELECT * FROM x').type === 'success')

  console.log('\nquery engine — multi-statement policy (Fix 2)')
  const MULTI_MSG = 'Run one query at a time. Split your queries and run them separately.'
  const multi = run('SELECT 1; SELECT 2;')
  check(
    "rejects 'SELECT 1; SELECT 2;' with the catalog message",
    multi.type === 'error' && multi.message === MULTI_MSG,
    `got ${JSON.stringify(multi)}`
  )
  check("'SELECT 1;' runs fine", run('SELECT 1;').type === 'success')
  check(
    "semicolon inside a string literal is not a statement break",
    run("SELECT * FROM employees WHERE name = 'a;b'").type === 'empty'
  )
  const multiWrite = run('SELECT 1; DROP TABLE employees;')
  check(
    'multi-statement with a write is rejected (and nothing executes)',
    multiWrite.type === 'error' && realTables(db).includes('employees')
  )

  console.log('\nquery engine — friendly error translation (Fix 3)')
  const t1 = run("SELECT 'we were young', name FROM emloyees")
  check(
    "typo'd table + 'were' inside a string literal → no-such-table message with suggestion",
    t1.type === 'error' &&
      t1.message.includes("no table called 'emloyees'") &&
      t1.message.includes("Did you mean 'employees'?"),
    `got ${JSON.stringify(t1)}`
  )
  const t2 = run('SELCT * FROM employees')
  check(
    'SELCT typo heuristic fires',
    t2.type === 'error' && t2.message.includes('Did you mean SELECT?'),
    `got ${JSON.stringify(t2)}`
  )
  const t3 = run('SELECT * FORM employees')
  check(
    'FORM typo heuristic fires',
    t3.type === 'error' && t3.message.includes('Did you mean FROM?'),
    `got ${JSON.stringify(t3)}`
  )
  const t4 = run('SELECT name WERE floor = 4 FROM employees')
  check(
    'WERE typo heuristic fires (outside string literals)',
    t4.type === 'error' && t4.message.includes('Did you mean WHERE?'),
    `got ${JSON.stringify(t4)}`
  )
  const t5 = run("SELECT name FROM employees WHERE badge_color = 'blue")
  check(
    'unclosed quote heuristic fires',
    t5.type === 'error' && t5.message.includes('unclosed quote'),
    `got ${JSON.stringify(t5)}`
  )
  const t6 = run('SELECT name FROM employees WHERE (floor = 4')
  check(
    'unclosed parenthesis heuristic fires',
    t6.type === 'error' && t6.message.includes('unclosed parenthesis'),
    `got ${JSON.stringify(t6)}`
  )
  const t7 = run('SELECT name, floor WHERE floor = 4')
  check(
    'missing-FROM heuristic fires',
    t7.type === 'error' && t7.message.includes('Add FROM'),
    `got ${JSON.stringify(t7)}`
  )
  const t8 = run('SELECT * FROM break_rom_log')
  check(
    'Levenshtein suggests break_room_log for break_rom_log',
    t8.type === 'error' && t8.message.includes("Did you mean 'break_room_log'?"),
    `got ${JSON.stringify(t8)}`
  )
  const t9 = run('SELECT emloyees FROM employees')
  check(
    'no-such-column message fires with a suggestion',
    t9.type === 'error' && t9.message.includes('No column named'),
    `got ${JSON.stringify(t9)}`
  )
  // Levenshtein column suggestion on case-003's schema
  const db3 = new SQL.Database()
  db3.run(cases[2].dbSetupSQL)
  const t10 = executeQuery(
    'SELECT civillian_name FROM jaywalking_citations',
    db3,
    cases[2].schema
  )
  check(
    'Levenshtein suggests civilian_name for civillian_name',
    t10.type === 'error' && t10.message.includes("Did you mean 'civilian_name'?"),
    `got ${JSON.stringify(t10)}`
  )
  db3.close()
  db.close()

  // ──────────────────────────────────────────────────────────────────────────
  console.log(
    failures === 0
      ? `\nALL CHECKS PASSED${warnings ? ` (${warnings} warning${warnings === 1 ? '' : 's'})` : ''}`
      : `\n${failures} FAILURE(S)`
  )
  process.exit(failures === 0 ? 0 : 1)
})
