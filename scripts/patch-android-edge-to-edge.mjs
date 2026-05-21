/**
 * Ensures Android MainActivity enables edge-to-edge (required by @capacitor-community/safe-area).
 * Run after `npx cap sync` — android/ is gitignored and generated locally.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const androidDir = join(process.cwd(), 'android')

function findMainActivity() {
  const candidates = [
    join(androidDir, 'app/src/main/java/com/tap/tamak/app/MainActivity.java'),
    join(androidDir, 'app/src/main/java/com/tap/tamak/app/MainActivity.kt'),
  ]

  for (const path of candidates) {
    if (existsSync(path)) {
      return path
    }
  }

  const javaRoot = join(androidDir, 'app/src/main/java')
  if (!existsSync(javaRoot)) {
    return null
  }

  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        const found = walk(full)
        if (found) return found
      } else if (entry === 'MainActivity.java' || entry === 'MainActivity.kt') {
        return full
      }
    }
    return null
  }

  return walk(javaRoot)
}

function patchJava(source) {
  if (source.includes('EdgeToEdge.enable')) {
    return source
  }

  let next = source
  if (!next.includes('import androidx.activity.EdgeToEdge')) {
    next = next.replace(
      /(import com\.getcapacitor\.BridgeActivity;?\r?\n)/,
      '$1import androidx.activity.EdgeToEdge;\n',
    )
  }

  next = next.replace(
    /super\.onCreate\(savedInstanceState\);/,
    'super.onCreate(savedInstanceState);\n        EdgeToEdge.enable(this);',
  )

  return next
}

function patchKotlin(source) {
  if (source.includes('enableEdgeToEdge()')) {
    return source
  }

  let next = source
  if (!next.includes('import androidx.activity.enableEdgeToEdge')) {
    next = next.replace(
      /(import com\.getcapacitor\.BridgeActivity\r?\n)/,
      '$1import androidx.activity.enableEdgeToEdge\n',
    )
  }

  next = next.replace(
    /super\.onCreate\(savedInstanceState\)/,
    'super.onCreate(savedInstanceState)\n        enableEdgeToEdge()',
  )

  return next
}

function main() {
  if (!existsSync(androidDir)) {
    console.log('[patch-android-edge-to-edge] android/ not found — skip (run cap add android first)')
    return
  }

  const mainActivityPath = findMainActivity()
  if (!mainActivityPath) {
    console.warn('[patch-android-edge-to-edge] MainActivity not found — skip')
    return
  }

  const original = readFileSync(mainActivityPath, 'utf8')
  const patched = mainActivityPath.endsWith('.kt')
    ? patchKotlin(original)
    : patchJava(original)

  if (patched === original) {
    console.log('[patch-android-edge-to-edge] Already patched:', mainActivityPath)
    return
  }

  writeFileSync(mainActivityPath, patched, 'utf8')
  console.log('[patch-android-edge-to-edge] Patched:', mainActivityPath)
}

try {
  main()
} catch (error) {
  console.error('[patch-android-edge-to-edge]', error)
  process.exit(1)
}
