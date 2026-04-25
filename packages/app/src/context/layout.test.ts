import { describe, expect, test } from "bun:test"
import { createRoot, createSignal } from "solid-js"
import {
  ACTIVITY_TABS,
  RIGHT_PANEL_TABS,
  clampRightPanelWidth,
  createSessionKeyReader,
  ensureSessionKey,
  isActivityTab,
  isRightPanelTab,
  pruneSessionKeys,
} from "./layout"

describe("layout session-key helpers", () => {
  test("couples touch and scroll seed in order", () => {
    const calls: string[] = []
    const result = ensureSessionKey(
      "dir/a",
      (key) => calls.push(`touch:${key}`),
      (key) => calls.push(`seed:${key}`),
    )

    expect(result).toBe("dir/a")
    expect(calls).toEqual(["touch:dir/a", "seed:dir/a"])
  })

  test("reads dynamic accessor keys lazily", () => {
    const seen: string[] = []

    createRoot((dispose) => {
      const [key, setKey] = createSignal("dir/one")
      const read = createSessionKeyReader(key, (value) => seen.push(value))

      expect(read()).toBe("dir/one")
      setKey("dir/two")
      expect(read()).toBe("dir/two")

      dispose()
    })

    expect(seen).toEqual(["dir/one", "dir/two"])
  })
})

describe("pruneSessionKeys", () => {
  test("keeps active key and drops lowest-used keys", () => {
    const drop = pruneSessionKeys({
      keep: "k4",
      max: 3,
      used: new Map([
        ["k1", 1],
        ["k2", 2],
        ["k3", 3],
        ["k4", 4],
      ]),
      view: ["k1", "k2", "k4"],
      tabs: ["k1", "k3", "k4"],
    })

    expect(drop).toEqual(["k1"])
    expect(drop.includes("k4")).toBe(false)
  })

  test("does not prune without keep key", () => {
    const drop = pruneSessionKeys({
      keep: undefined,
      max: 1,
      used: new Map([
        ["k1", 1],
        ["k2", 2],
      ]),
      view: ["k1"],
      tabs: ["k2"],
    })

    expect(drop).toEqual([])
  })
})

describe("isActivityTab", () => {
  test("accepts every declared tab", () => {
    for (const tab of ACTIVITY_TABS) {
      expect(isActivityTab(tab)).toBe(true)
    }
  })

  test("rejects unknown values", () => {
    expect(isActivityTab("unknown")).toBe(false)
    expect(isActivityTab(undefined)).toBe(false)
    expect(isActivityTab(42)).toBe(false)
    expect(isActivityTab(null)).toBe(false)
  })
})

describe("isRightPanelTab", () => {
  test("accepts every declared tab", () => {
    for (const tab of RIGHT_PANEL_TABS) {
      expect(isRightPanelTab(tab)).toBe(true)
    }
  })

  test("rejects unknown values", () => {
    expect(isRightPanelTab("chat")).toBe(false)
    expect(isRightPanelTab(undefined)).toBe(false)
  })
})

describe("clampRightPanelWidth", () => {
  test("enforces minimum width", () => {
    expect(clampRightPanelWidth(100, 1600)).toBe(280)
  })

  test("enforces half-viewport maximum", () => {
    expect(clampRightPanelWidth(2000, 1600)).toBe(800)
  })

  test("returns default when input is not finite", () => {
    expect(clampRightPanelWidth(Number.NaN, 1600)).toBe(360)
    expect(clampRightPanelWidth(Number.POSITIVE_INFINITY, 1600)).toBe(360)
  })

  test("rounds and passes valid widths through", () => {
    expect(clampRightPanelWidth(412.7, 1600)).toBe(413)
  })
})
