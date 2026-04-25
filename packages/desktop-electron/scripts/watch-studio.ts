#!/usr/bin/env bun
/**
 * File watcher that auto-runs the full ship pipeline whenever
 * source files in packages/app/src or packages/desktop-electron/src
 * change. Use this when you want the *installed* /Applications/Studio
 * to stay current — for active development prefer dev:studio (HMR
 * mode is much faster). watch:studio is the right tool when you're
 * iterating on something that ONLY surfaces in the packaged binary
 * (channel-specific behavior, native module changes, code signing).
 *
 * Debounce: 500ms. A burst of saves coalesces into one ship run.
 *
 * Usage:
 *   bun run watch:studio          # watch + ship + leave Studio quit
 *   bun run watch:studio -- --launch   # also relaunches Studio after each ship
 */
import { watch } from "node:fs"
import path from "node:path"
import { $ } from "bun"

const repoRoot = path.resolve(import.meta.dir, "..", "..", "..")
const watched = [
  path.join(repoRoot, "packages/app/src"),
  path.join(repoRoot, "packages/desktop-electron/src"),
  path.join(repoRoot, "packages/ui/src"),
]
const launch = process.argv.includes("--launch")
const DEBOUNCE_MS = 500

let pending: ReturnType<typeof setTimeout> | undefined
let running = false
let queued = false

function trigger(reason: string) {
  if (running) {
    queued = true
    return
  }
  if (pending) clearTimeout(pending)
  pending = setTimeout(() => {
    pending = undefined
    void runShip(reason)
  }, DEBOUNCE_MS)
}

async function runShip(reason: string) {
  running = true
  console.log(`\n\x1b[33m[watch:studio]\x1b[0m triggered by ${reason}`)
  try {
    if (launch) await $`bun ./scripts/ship.ts --launch`
    else await $`bun ./scripts/ship.ts`
  } catch (error) {
    console.error("\x1b[31m[watch:studio]\x1b[0m ship failed:", error)
  } finally {
    running = false
    if (queued) {
      queued = false
      trigger("queued")
    }
  }
}

console.log("\x1b[36m[watch:studio]\x1b[0m watching:")
for (const dir of watched) console.log(`  ${dir}`)
console.log(`\x1b[36m[watch:studio]\x1b[0m debounce=${DEBOUNCE_MS}ms${launch ? " · relaunch on each ship" : ""}`)
console.log("\x1b[36m[watch:studio]\x1b[0m saving any source file will trigger a full rebuild + reinstall")
console.log()

for (const dir of watched) {
  watch(dir, { recursive: true }, (_event, filename) => {
    if (!filename) return
    // Skip churny files
    if (filename.includes("node_modules")) return
    if (filename.endsWith("~") || filename.startsWith(".")) return
    trigger(filename)
  })
}

// Keep process alive
await new Promise(() => {})
