import { describe, expect, test } from "bun:test"
import { ReadCache, buildReadCacheKey, withCachedPrefix } from "../../src/tool/read-cache"

describe("buildReadCacheKey", () => {
  test("includes path, offset, and limit", () => {
    expect(buildReadCacheKey("/a/b.ts", 1, 250)).toBe("/a/b.ts|o=1|l=250")
  })

  test("uses defaults when params are omitted", () => {
    expect(buildReadCacheKey("/a.ts", undefined, undefined)).toBe("/a.ts|o=1|l=default")
  })
})

describe("withCachedPrefix", () => {
  test("prepends marker only once", () => {
    const first = withCachedPrefix("hello")
    expect(first.startsWith("[cached from earlier read]")).toBe(true)
    expect(withCachedPrefix(first)).toBe(first)
  })
})

describe("ReadCache", () => {
  test("returns undefined for unseen sessions", () => {
    const cache = new ReadCache()
    expect(cache.get("ses_a", "k", 100)).toBeUndefined()
  })

  test("hits when path + mtime match", () => {
    const cache = new ReadCache()
    cache.set("ses_a", "k", { mtime: 100, output: "v1" })
    expect(cache.get("ses_a", "k", 100)?.output).toBe("v1")
  })

  test("invalidates entry when mtime drifts", () => {
    const cache = new ReadCache()
    cache.set("ses_a", "k", { mtime: 100, output: "v1" })
    expect(cache.get("ses_a", "k", 200)).toBeUndefined()
    // entry should have been dropped on the miss
    expect(cache.get("ses_a", "k", 100)).toBeUndefined()
  })

  test("isolates entries per session", () => {
    const cache = new ReadCache()
    cache.set("ses_a", "k", { mtime: 100, output: "from-a" })
    cache.set("ses_b", "k", { mtime: 100, output: "from-b" })
    expect(cache.get("ses_a", "k", 100)?.output).toBe("from-a")
    expect(cache.get("ses_b", "k", 100)?.output).toBe("from-b")
  })

  test("drop clears a single session without touching others", () => {
    const cache = new ReadCache()
    cache.set("ses_a", "k", { mtime: 1, output: "a" })
    cache.set("ses_b", "k", { mtime: 1, output: "b" })
    cache.drop("ses_a")
    expect(cache.get("ses_a", "k", 1)).toBeUndefined()
    expect(cache.get("ses_b", "k", 1)?.output).toBe("b")
  })

  test("evicts the least-recently-used entry past the per-session cap", () => {
    const cache = new ReadCache()
    for (let i = 0; i < 50; i++) {
      cache.set("ses", `k${i}`, { mtime: 1, output: `v${i}` })
    }
    // re-read the oldest so it becomes the most recently used
    expect(cache.get("ses", "k0", 1)?.output).toBe("v0")
    cache.set("ses", "k50", { mtime: 1, output: "v50" })
    expect(cache.size("ses")).toBe(50)
    // k1 should be the new oldest; it gets evicted, k0 stays
    expect(cache.get("ses", "k0", 1)?.output).toBe("v0")
    expect(cache.get("ses", "k1", 1)).toBeUndefined()
    expect(cache.get("ses", "k50", 1)?.output).toBe("v50")
  })

  test("set replaces an existing entry without growing the cache", () => {
    const cache = new ReadCache()
    cache.set("ses", "k", { mtime: 1, output: "v1" })
    cache.set("ses", "k", { mtime: 2, output: "v2" })
    expect(cache.size("ses")).toBe(1)
    expect(cache.get("ses", "k", 2)?.output).toBe("v2")
  })
})
