// Headless verification of the SQL Detective game logic: for each case, build
// the in-memory DB from dbSetupSQL (sanity-checks the seed SQL runs and the
// intended solution query returns the suspect), then assert the accusation
// matcher checkAnswer() accepts the canonical answer + last name and rejects a
// wrong name. Run: node scripts/verify-cases.js
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
    const sol = gc.solution

    // 1. Seed SQL builds and the intended solution query runs without error.
    const db = new SQL.Database()
    db.run(gc.dbSetupSQL)
    const res = db.exec(solutionQueries[gc.id])
    const rowCount = res[0] ? res[0].values.length : 0
    db.close()

    // 2. The accusation matcher accepts the canonical answer and the last name…
    const lastName = sol.answer.split(' ').pop()
    const accepts =
      checkAnswer(sol.answer, sol) &&
      checkAnswer(sol.answer.toLowerCase(), sol) &&
      checkAnswer('  ' + lastName + '  ', sol)
    // …and rejects a clearly-wrong name and empty input.
    const rejects = !checkAnswer('Nobody McNothing', sol) && !checkAnswer('', sol)

    const ok = accepts && rejects && rowCount > 0
    console.log(
      `${ok ? 'PASS' : 'FAIL'}  ${gc.id} (${gc.title}) — answer="${sol.answer}"; ` +
        `query rows=${rowCount}; accepts=${accepts}; rejects-wrong=${rejects}`
    )
    if (!ok) failures++
  }
  console.log(failures === 0 ? '\nALL CASES OK' : `\n${failures} FAILURE(S)`)
  process.exit(failures === 0 ? 0 : 1)
})
