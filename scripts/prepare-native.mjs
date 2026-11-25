import { rmSync } from 'node:fs'
import { resolve } from 'node:path'

// public/app holds the sideloadable APK for the website. It must not ship
// inside the Play Store build, so drop it from dist/ before `cap sync`.
rmSync(resolve(process.cwd(), 'dist', 'app'), { recursive: true, force: true })

console.log('[native] Removed dist/app so the APK is not bundled into the app.')
