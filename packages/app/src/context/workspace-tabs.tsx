import { batch, createMemo } from "solid-js"
import { createStore, reconcile } from "solid-js/store"
import { createSimpleContext } from "@opencode-ai/ui/context"
import { Persist, persisted } from "@/utils/persist"
import { uuid } from "@/utils/uuid"

/**
 * Multi-session workspace tabs (Faz 2).
 *
 * Goal: Claude Code style — multiple chat sessions open simultaneously,
 * one visible in the main panel, others remembered in a tab bar above
 * it. Click a tab → navigate to that route. The active tab is whichever
 * `(dir, sessionID)` pair matches the current URL — we don't track an
 * explicit `active` field; the URL is the source of truth.
 *
 * Memory pattern (8GB-friendly):
 *   - Only the active route renders the SessionRoute component (existing
 *     SolidJS routing semantics, unchanged).
 *   - Inactive tabs are pure metadata in this store — no React tree,
 *     no per-session reactive subscriptions, no extra cost.
 *   - Switching = `navigate(/dir/session/id)`; React mounts the new
 *     view; sync layer keeps the message data hot regardless.
 *
 * Persistence: tabs survive Studio restarts via the persist layer
 * (debounced + dedup'd in v0.4.2, see persist.ts).
 *
 * NOT YET WIRED INTO LAYOUT — this file lays the foundation. The
 * TabBar component and integration into pages/layout.tsx are the
 * next two steps in Faz 2.
 */

export type WorkspaceTab = {
  /** stable ID across reorders / persist */
  id: string
  /** raw directory path (NOT base64-encoded) */
  dir: string
  /** session ID inside that directory */
  sessionID: string
  /** cached title for the tab label, kept fresh by the consumer */
  title?: string
  /** pinned tabs sit at the front and are excluded from "close all" */
  pinned?: boolean
}

type Store = {
  tabs: WorkspaceTab[]
}

const MAX_TABS = 20

function tabKey(dir: string, sessionID: string) {
  return `${dir}\n${sessionID}`
}

export const { use: useWorkspaceTabs, provider: WorkspaceTabsProvider } = createSimpleContext({
  name: "WorkspaceTabs",
  init: () => {
    const [store, setStore] = persisted(
      Persist.global("workspace-tabs.v1"),
      createStore<Store>({
        tabs: [],
      }),
    )

    const tabs = createMemo(() => store.tabs)

    function findByRoute(dir: string, sessionID: string): WorkspaceTab | undefined {
      const key = tabKey(dir, sessionID)
      return store.tabs.find((tab) => tabKey(tab.dir, tab.sessionID) === key)
    }

    function activeTabId(dir: string | undefined, sessionID: string | undefined): string | undefined {
      if (!dir || !sessionID) return undefined
      return findByRoute(dir, sessionID)?.id
    }

    /**
     * Open a session as a tab. If a tab for the same (dir, sessionID)
     * already exists, return its ID without duplicating. Otherwise
     * append a new tab; if at capacity, evict the oldest non-pinned
     * tab.
     */
    function open(input: { dir: string; sessionID: string; title?: string }): WorkspaceTab {
      const existing = findByRoute(input.dir, input.sessionID)
      if (existing) {
        if (input.title && input.title !== existing.title) {
          setStore("tabs", (tabs) => tabs.map((t) => (t.id === existing.id ? { ...t, title: input.title } : t)))
        }
        return existing
      }

      const next: WorkspaceTab = {
        id: uuid(),
        dir: input.dir,
        sessionID: input.sessionID,
        title: input.title,
      }

      setStore("tabs", (current) => {
        const list = [...current, next]
        if (list.length <= MAX_TABS) return list
        // Evict oldest non-pinned tab to make room.
        const evictIdx = list.findIndex((t) => !t.pinned)
        if (evictIdx === -1) return list.slice(-MAX_TABS)
        return [...list.slice(0, evictIdx), ...list.slice(evictIdx + 1)]
      })

      return next
    }

    /**
     * Close a tab by ID. Returns the tab that should become active
     * (the right neighbor, falling back to the left). Caller is
     * responsible for navigating to that tab's route.
     */
    function close(id: string): WorkspaceTab | undefined {
      const idx = store.tabs.findIndex((t) => t.id === id)
      if (idx === -1) return undefined

      const neighbor = store.tabs[idx + 1] ?? store.tabs[idx - 1]
      setStore("tabs", (tabs) => tabs.filter((t) => t.id !== id))
      return neighbor
    }

    function closeAll() {
      setStore("tabs", (tabs) => tabs.filter((t) => t.pinned))
    }

    function setTitle(id: string, title: string) {
      const tab = store.tabs.find((t) => t.id === id)
      if (!tab || tab.title === title) return
      setStore("tabs", (tabs) => tabs.map((t) => (t.id === id ? { ...t, title } : t)))
    }

    function setPinned(id: string, pinned: boolean) {
      const tab = store.tabs.find((t) => t.id === id)
      if (!tab || !!tab.pinned === pinned) return
      setStore("tabs", (tabs) =>
        tabs.map((t) => (t.id === id ? { ...t, pinned: pinned || undefined } : t)),
      )
    }

    /**
     * Move a tab from one index to another. Used by drag/drop reorder.
     */
    function reorder(fromIdx: number, toIdx: number) {
      if (fromIdx === toIdx) return
      const list = store.tabs.slice()
      if (fromIdx < 0 || fromIdx >= list.length) return
      if (toIdx < 0 || toIdx > list.length) return
      const [moved] = list.splice(fromIdx, 1)
      list.splice(toIdx, 0, moved)
      setStore("tabs", reconcile(list))
    }

    /**
     * Replace the entire tab list (used during persist migration).
     */
    function replaceAll(next: WorkspaceTab[]) {
      batch(() => setStore("tabs", reconcile(next)))
    }

    return {
      tabs,
      activeTabId,
      open,
      close,
      closeAll,
      setTitle,
      setPinned,
      reorder,
      replaceAll,
    }
  },
})
