import { describe, expect, test } from "bun:test"
import { TurnCache, buildTurnCacheKey, withCachedTurnPrefix } from "../../src/tool/turn-cache"

describe("buildTurnCacheKey", () => {
  test("includes the op and a stable params signature", () => {
    expect(buildTurnCacheKey("grep", { pattern: "useState", path: "src" })).toBe(
      'grep|{"path":"src","pattern":"useState"}',
    )
  })

  test("treats key order in the input map as irrelevant", () => {
    const a = buildTurnCacheKey("grep", { pattern: "x", path: "src", include: "*.ts" })
    const b = buildTurnCacheKey("grep", { include: "*.ts", path: "src", pattern: "x" })
    expect(a).toBe(b)
  })
})

describe("withCachedTurnPrefix", () => {
  test("prepends the marker once, even on repeated calls", () => {
    const first = withCachedTurnPrefix("grep", "Found 3 matches")
    expect(first.startsWith("[cached from earlier grep]")).toBe(true)
    expect(withCachedTurnPrefix("grep", first)).toBe(first)
  })

  test("the marker carries the op so glob and grep are distinguishable", () => {
    expect(withCachedTurnPrefix("glob", "src/a.ts").startsWith("[cached from earlier glob]")).toBe(true)
  })
})

describe("TurnCache", () => {
  test("returns undefined for an unseen turn", () => {
    const cache = new TurnCache()
    expect(cache.get("ses_a", "msg_1", "k")).toBeUndefined()
  })

  test("hits when sessionID + messageID + key all match", () => {
    const cache = new TurnCache()
    cache.set("ses_a", "msg_1", "k", { output: "v1" })
    expect(cache.get("ses_a", "msg_1", "k")?.output).toBe("v1")
  })

  test("isolates entries across messageIDs (turn boundary)", () => {
    const cache = new TurnCache()
    cache.set("ses_a", "msg_1", "k", { output: "first turn" })
    expect(cache.get("ses_a", "msg_2", "k")).toBeUndefined()
  })

  test("isolates entries across sessions", () => {
    const cache = new TurnCache()
    cache.set("ses_a", "msg_1", "k", { output: "from-a" })
    cache.set("ses_b", "msg_1", "k", { output: "from-b" })
    expect(cache.get("ses_a", "msg_1", "k")?.output).toBe("from-a")
    expect(cache.get("ses_b", "msg_1", "k")?.output).toBe("from-b")
  })

  test("ignores empty session or message ids defensively", () => {
    const cache = new TurnCache()
    cache.set("", "msg_1", "k", { output: "x" })
    cache.set("ses_a", "", "k", { output: "x" })
    expect(cache.get("", "msg_1", "k")).toBeUndefined()
    expect(cache.get("ses_a", "", "k")).toBeUndefined()
  })

  test("evicts the least recently used key past the per-turn cap", () => {
    const cache = new TurnCache()
    for (let i = 0; i < 32; i++) cache.set("ses", "msg", `k${i}`, { output: `v${i}` })

    // touch k0 so it becomes most recent
    expect(cache.get("ses", "msg", "k0")?.output).toBe("v0")

    cache.set("ses", "msg", "k32", { output: "v32" })

    expect(cache.size("ses", "msg")).toBe(32)
    expect(cache.get("ses", "msg", "k0")?.output).toBe("v0")
    expect(cache.get("ses", "msg", "k1")).toBeUndefined()
    expect(cache.get("ses", "msg", "k32")?.output).toBe("v32")
  })

  test("drop with messageID removes a single turn", () => {
    const cache = new TurnCache()
    cache.set("ses", "msg_1", "k", { output: "x" })
    cache.set("ses", "msg_2", "k", { output: "y" })
    cache.drop("ses", "msg_1")
    expect(cache.get("ses", "msg_1", "k")).toBeUndefined()
    expect(cache.get("ses", "msg_2", "k")?.output).toBe("y")
  })

  test("drop without messageID clears the whole session", () => {
    const cache = new TurnCache()
    cache.set("ses_a", "msg_1", "k", { output: "x" })
    cache.set("ses_a", "msg_2", "k", { output: "y" })
    cache.set("ses_b", "msg_1", "k", { output: "z" })
    cache.drop("ses_a")
    expect(cache.size("ses_a")).toBe(0)
    expect(cache.get("ses_b", "msg_1", "k")?.output).toBe("z")
  })

  test("set replaces an existing entry without growing the bucket", () => {
    const cache = new TurnCache()
    cache.set("ses", "msg", "k", { output: "v1" })
    cache.set("ses", "msg", "k", { output: "v2" })
    expect(cache.size("ses", "msg")).toBe(1)
    expect(cache.get("ses", "msg", "k")?.output).toBe("v2")
  })
})
