/**
 * Session-scoped read-tool cache.
 *
 * Keyed by sessionID -> per-session map of `${path}:${offset}:${limit}` ->
 * cached output (stamped with the file's mtime). On hit the stored output is
 * returned with a `[cached from earlier read]` prefix so the model knows the
 * data came from cache; on mtime drift the entry is discarded and the read
 * falls through to the real filesystem path.
 */

const MAX_ENTRIES_PER_SESSION = 50
const CACHE_PREFIX = "[cached from earlier read]\n"

export type ReadCacheEntry = {
  mtime: number
  output: string
}

export function buildReadCacheKey(filepath: string, offset: number | undefined, limit: number | undefined) {
  return `${filepath}|o=${offset ?? 1}|l=${limit ?? "default"}`
}

export function withCachedPrefix(output: string) {
  if (output.startsWith(CACHE_PREFIX)) return output
  return CACHE_PREFIX + output
}

export class ReadCache {
  private readonly bySession = new Map<string, Map<string, ReadCacheEntry>>()

  get(sessionID: string, key: string, mtime: number): ReadCacheEntry | undefined {
    const session = this.bySession.get(sessionID)
    const entry = session?.get(key)
    if (!entry) return undefined
    if (entry.mtime !== mtime) {
      session!.delete(key)
      return undefined
    }
    // refresh recency by reinserting
    session!.delete(key)
    session!.set(key, entry)
    return entry
  }

  set(sessionID: string, key: string, entry: ReadCacheEntry) {
    let session = this.bySession.get(sessionID)
    if (!session) {
      session = new Map()
      this.bySession.set(sessionID, session)
    }
    if (session.has(key)) session.delete(key)
    session.set(key, entry)
    while (session.size > MAX_ENTRIES_PER_SESSION) {
      const oldest = session.keys().next().value
      if (oldest === undefined) break
      session.delete(oldest)
    }
  }

  drop(sessionID: string) {
    this.bySession.delete(sessionID)
  }

  clear() {
    this.bySession.clear()
  }

  size(sessionID?: string) {
    if (sessionID === undefined) {
      let total = 0
      for (const session of this.bySession.values()) total += session.size
      return total
    }
    return this.bySession.get(sessionID)?.size ?? 0
  }
}

export const readCache = new ReadCache()
