// Copies the sql.js WASM binary into public/ so it can be served as a static
// asset at /sql-wasm.wasm. queryEngine.ts points sql.js at that URL via
// locateFile(). Runs on postinstall (and can be run manually).
const fs = require('fs')
const path = require('path')

const src = path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
const dest = path.join(__dirname, '..', 'public', 'sql-wasm.wasm')

if (!fs.existsSync(path.dirname(dest))) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
}

fs.copyFileSync(src, dest)
console.log('Copied sql-wasm.wasm to public/')
