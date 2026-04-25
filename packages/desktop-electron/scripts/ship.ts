#!/usr/bin/env bun
/**
 * One-shot pipeline: prebuild → vite build → package macOS .app →
 * quit running Studio → ditto into /Applications → ad-hoc resign →
 * clear quarantine → relaunch.
 *
 * Replaces the manual ~90 second flow with a single command:
 *   bun run ship:studio
 *
 * Honors OPENCODE_CHANNEL (defaults to "studio" — studio is what the
 * primary developer ships; dev/beta/prod live in CI).
 */
import { $ } from "bun"
import { resolveChannel } from "./utils"

const t0 = Date.now()
const channel = process.env.OPENCODE_CHANNEL ?? "studio"
process.env.OPENCODE_CHANNEL = channel
const productName = channel === "studio" ? "OpenCode Studio" : channel === "dev" ? "OpenCode Dev" : channel === "beta" ? "OpenCode Beta" : "OpenCode"
const appName = `${productName}.app`
const appPath = `/Applications/${appName}`
const builtAppPath = `dist/mac-arm64/${appName}`

const log = (label: string) => console.log(`\n\x1b[36m[ship]\x1b[0m ${label}  +${((Date.now() - t0) / 1000).toFixed(1)}s`)

log(`channel=${channel} productName="${productName}"`)

log("clean dist/")
await $`rm -rf out dist`.quiet()

log("prebuild (icons + opencode core)")
await $`bun ./scripts/prebuild.ts`

log("electron-vite build (renderer + main + preload)")
await $`bun run build`

log("electron-builder package macOS (--dir, skip dmg/zip for ~70% speedup)")
// --dir produces only the .app folder, skipping DMG and ZIP archive
// creation. We don't distribute from local builds — those are CI's
// job — so the archives are dead weight here.
await $`bunx electron-builder --mac --dir --config electron-builder.config.ts`

log(`quit running ${productName}`)
await $`osascript -e ${`tell application "${productName}" to quit`}`.nothrow().quiet()
await $`pkill -f ${productName}`.nothrow().quiet()
await new Promise((resolve) => setTimeout(resolve, 1500))

log(`install → ${appPath}`)
await $`rm -rf ${appPath}`
await $`ditto ${builtAppPath} ${appPath}`

log("ad-hoc resign + clear quarantine")
await $`codesign --force --deep --sign - ${appPath}`.quiet()
await $`xattr -cr ${appPath}`

const version = (await $`defaults read ${appPath}/Contents/Info.plist CFBundleShortVersionString`.text()).trim()
log(`installed ${productName} v${version}`)

if (process.argv.includes("--launch")) {
  log("launching")
  await $`open -a ${productName}`
}

log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`)
console.log()
const _ = resolveChannel  // touch unused import
