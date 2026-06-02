/**
 * Adds location permissions required by @capacitor/geolocation.
 * Run after `npx cap sync` — android/ is gitignored and generated locally.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const manifestPath = join(process.cwd(), 'android/app/src/main/AndroidManifest.xml')

const LOCATION_PERMISSIONS = [
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION',
]

function patchManifest(source) {
  const missing = LOCATION_PERMISSIONS.filter((name) => !source.includes(name))
  if (!missing.length) {
    return source
  }

  const lines = missing.map(
    (name) => `    <uses-permission android:name="${name}" />`,
  )

  if (source.includes('<!-- Permissions -->')) {
    return source.replace(
      /(<!-- Permissions -->)\r?\n/,
      `$1\n${lines.join('\n')}\n`,
    )
  }

  return source.replace(
    /<\/manifest>/,
    `${lines.join('\n')}\n</manifest>`,
  )
}

function main() {
  if (!existsSync(manifestPath)) {
    console.log('[patch-android-geolocation] AndroidManifest not found — skip (run cap add android first)')
    return
  }

  const original = readFileSync(manifestPath, 'utf8')
  const patched = patchManifest(original)

  if (patched === original) {
    console.log('[patch-android-geolocation] Already patched:', manifestPath)
    return
  }

  writeFileSync(manifestPath, patched, 'utf8')
  console.log('[patch-android-geolocation] Patched:', manifestPath)
}

try {
  main()
} catch (error) {
  console.error('[patch-android-geolocation]', error)
  process.exit(1)
}
