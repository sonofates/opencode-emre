#!/usr/bin/env bun
/**
 * HMR-enabled development mode for OpenCode Studio. electron-vite
 * dev gives sub-second renderer reloads on file save — far faster
 * than the rebuild + ditto + sign cycle. The userData dir is the
 * same as the installed Studio (channel=studio), so existing
 * sessions persist; just quit the installed /Applications/Studio.app
 * before starting this so two Electron processes don't fight over
 * the leveldb lock.
 *
 * Usage:
 *   bun run dev:studio
 */
import { $ } from "bun"

process.env.OPENCODE_CHANNEL = "studio"

console.log("\x1b[36m[dev:studio]\x1b[0m channel=studio — HMR enabled")

console.log("\x1b[36m[dev:studio]\x1b[0m quitting any running OpenCode Studio (data dir lock conflict)")
await $`osascript -e 'tell application "OpenCode Studio" to quit'`.nothrow().quiet()
await $`pkill -f "OpenCode Studio"`.nothrow().quiet()
await new Promise((resolve) => setTimeout(resolve, 1200))

console.log("\x1b[36m[dev:studio]\x1b[0m starting electron-vite dev")
console.log("\x1b[36m[dev:studio]\x1b[0m save any source file in packages/app/src or packages/desktop-electron/src to reload")
console.log()

await $`bun run dev`
