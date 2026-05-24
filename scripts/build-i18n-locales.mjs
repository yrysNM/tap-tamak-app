/**
 * One-off helper: scan app for quoted Cyrillic/Latin UI strings.
 * Run: node scripts/build-i18n-locales.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'app')
const exts = new Set(['.vue', '.ts'])

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p, out)
    else if (exts.has(path.extname(ent.name))) out.push(p)
  }
  return out
}

const re =
  /(?:label|placeholder|title|aria-label|confirm\(|toast\.show\(|apiMessage\([^,]+,\s*|formError\.value\s*=\s*|error\.value\s*=\s*|return\s+)["'`]([^"'`]{2,120})["'`]/g

const cyr = /[А-Яа-яЁё]/
const skip = /^(GET|POST|PUT|PATCH|DELETE|USER|COOK|FAST|LONG|PENDING|material-symbols)/

const found = new Set()
for (const file of walk(root)) {
  const text = fs.readFileSync(file, 'utf8')
  let m
  while ((m = re.exec(text))) {
    const s = m[1].trim()
    if (!s || skip.test(s) || s.startsWith('l_') || s.includes('${') && s.includes('`')) continue
    if (cyr.test(s) || /^[A-Z]/.test(s) || /\s/.test(s)) found.add(s)
  }
}

console.log([...found].sort().join('\n'))
console.error('\nTotal:', found.size)
