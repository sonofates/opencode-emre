/**
 * Turn-scoped read-only cache for grep / glob.
 *
 * Within a single agent turn (one assistant `messageID`) it is common
 * for the model to issue the same grep or glob multiple times — for
 * example, scanning broadly first, then narrowing. We don't cache
 * across turns because `bash`, `edit`, and `write` can mutate the
 * filesystem and we have no cheap way to detect that. Resetting per
 * `messageID` is the conservative choice: at the start of every new
 * turn the cache for that turn is empty.
 *
 * The output string is what the tool would have returned, including
 * the wrapper headers. We prefix with "[cached from earlier <op>]"
 * so the model recognises the data came from cache, the same way
 * `read-cache.ts` does for the read tool.
 */

const MAX_ENTRIES_PER_TURN = 32
const PREFIX = (op: string) => `[cached from earlier ${op}]\n`

export type TurnCacheEntry = {
  output: string
}

export function buildTurnCacheKey(op: string, params: Record<string, unknown>): string {
  // stable JSON: sort keys so equivalent params hit the same key
  const sorted = Object.keys(params)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = params[key]
      return acc
    }, {})
  return `${op}|${JSON.stringify(sorted)}`
}

export function withCachedTurnPrefix(op: string, output: string): string {
  if (output.startsWith(PREFIX(op))) return output
  return PREFIX(op) + output
}

export class TurnCache {
  private readonly buckets = new Map<string, Map<string, TurnCacheEntry>>()

  private bucket(sessionID: string, messageID: string) {
    const key = `${sessionID}::${messageID}`
    let map = this.buckets.get(key)
    if (!map) {
      map = new Map()
      this.buckets.set(key, map)
    }
    return map
  }

  get(sessionID: string, messageID: string, key: string): TurnCacheEntry | undefined {
    if (!sessionID || !messageID) return undefined
    const bucket = this.buckets.get(`${sessionID}::${messageID}`)
    const entry = bucket?.get(key)
    if (!entry || !bucket) return entry
    // refresh recency by reinserting (Map preserves insertion order)
    bucket.delete(key)
    bucket.set(key, entry)
    return entry
  }

  set(sessionID: string, messageID: string, key: string, entry: TurnCacheEntry): void {
    if (!sessionID || !messageID) return
    const bucket = this.bucket(sessionID, messageID)
    if (bucket.has(key)) bucket.delete(key)
    bucket.set(key, entry)
    while (bucket.size > MAX_ENTRIES_PER_TURN) {
      const oldest = bucket.keys().next().value
      if (oldest === undefined) break
      bucket.delete(oldest)
    }
    // also evict whole buckets to avoid unbounded growth across long sessions
    while (this.buckets.size > 200) {
      const oldest = this.buckets.keys().next().value
      if (oldest === undefined) break
      this.buckets.delete(oldest)
    }
  }

  drop(sessionID: string, messageID?: string) {
    if (messageID === undefined) {
      for (const key of [...this.buckets.keys()]) {
        if (key.startsWith(`${sessionID}::`)) this.buckets.delete(key)
      }
      return
    }
    this.buckets.delete(`${sessionID}::${messageID}`)
  }

  clear() {
    this.buckets.clear()
  }

  size(sessionID?: string, messageID?: string): number {
    if (sessionID === undefined) {
      let total = 0
      for (const bucket of this.buckets.values()) total += bucket.size
      return total
    }
    if (messageID !== undefined) {
      return this.buckets.get(`${sessionID}::${messageID}`)?.size ?? 0
    }
    let total = 0
    const prefix = `${sessionID}::`
    for (const [key, bucket] of this.buckets) {
      if (key.startsWith(prefix)) total += bucket.size
    }
    return total
  }
}

export const turnCache = new TurnCache()
