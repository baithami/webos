// Headless verification of the SQL Detective game logic: for each case, build
// the in-memory DB from dbSetupSQL, run the intended "solution" query, and
// assert solution.validate() accepts the result. Also exercises a couple of
// friendly-error paths. Run: node scripts/verify-cases.js
const fs = require('fs')
const path = require('path')
const ts = require('typescript')
const initSqlJs = require('sql.js')

// Transpile a single TS case module (strips `import type`, compiles to CJS).
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
const typesStub = {} // case files only `import type` from ../types — erased
const cases = ['case001', 'case002', 'case003'].map((f) => {
  const mod = loadTs(path.join(base, 'cases', f + '.ts'), { '../types': typesStub })
  return Object.values(mod)[0]
})

// The intended solution query for each case (what a player would land on).
const solutionQueries = {
  'case-001':
    "SELECT e.* FROM break_room_log b JOIN employees e ON e.id = b.employee_id WHERE b.entry_time >= '09:00' AND b.exit_time <= '09:20' AND e.floor = 4",
  'case-002':
    "SELECT ce.* FROM uniform_assignments u JOIN city_employees ce ON ce.id = u.employee_id WHERE u.uniform_id LIKE '%447' AND u.department = 'Parks'",
  'case-003':
    'SELECT civilian_name, COUNT(*) AS count FROM jaywalking_citations GROUP BY civilian_name ORDER BY count DESC LIMIT 1',
}

initSqlJs().then((SQL) => {
  let failures = 0
  for (const gc of cases) {
    const db = new SQL.Database()
    db.run(gc.dbSetupSQL)
    const q = solutionQueries[gc.id]
    const res = db.exec(q)
    const { columns, values } = res[0]
    const rows = values.map((r) => Object.fromEntries(columns.map((c, i) => [c, r[i]])))
    const ok = gc.solution.validate(rows)
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${gc.id} (${gc.title}) — ${rows.length} row(s); validate=${ok}`)
    if (!ok) {
      failures++
      console.log('   rows:', JSON.stringify(rows))
    }
    // A clearly-wrong result should be rejected.
    const wrong = gc.solution.validate([{ name: 'Nobody', employee_id: 999, civilian_name: 'Nobody' }])
    if (wrong) {
      failures++
      console.log(`   FAIL ${gc.id}: validate accepted a wrong answer`)
    }
    db.close()
  }
  console.log(failures === 0 ? '\nALL CASES OK' : `\n${failures} FAILURE(S)`)
  process.exit(failures === 0 ? 0 : 1)
})
