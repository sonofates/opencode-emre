import { createEffect, createMemo, createSignal, For, Show } from "solid-js"
import { useParams } from "@solidjs/router"
import { Markdown } from "@opencode-ai/ui/markdown"
import { getFilename } from "@opencode-ai/shared/util/path"
import { useGlobalSync } from "@/context/global-sync"
import { decode64 } from "@/utils/base64"

type WriteEntry = {
  path: string
  content: string
  ts: number
}

export function collectMarkdownWrites(input: {
  messages: ReadonlyArray<{ id: string }>
  parts: Record<string, ReadonlyArray<unknown>>
}): WriteEntry[] {
  const map = new Map<string, WriteEntry>()
  for (const message of input.messages) {
    const parts = input.parts[message.id] ?? []
    for (const part of parts) {
      const entry = readMarkdownWrite(part)
      if (!entry) continue
      const existing = map.get(entry.path)
      if (existing && existing.ts >= entry.ts) continue
      map.set(entry.path, entry)
    }
  }
  return Array.from(map.values()).sort((a, b) => b.ts - a.ts)
}

function readMarkdownWrite(part: unknown): WriteEntry | undefined {
  if (!part || typeof part !== "object") return
  const record = part as Record<string, unknown>
  if (record.type !== "tool" || record.tool !== "write") return
  const state = record.state as Record<string, unknown> | undefined
  if (!state) return
  const input = state.input as Record<string, unknown> | undefined
  if (!input) return
  const path = typeof input.filePath === "string" ? input.filePath : undefined
  if (!path || !path.toLowerCase().endsWith(".md")) return
  const content = typeof input.content === "string" ? input.content : undefined
  if (typeof content !== "string") return
  const time = state.time as Record<string, unknown> | undefined
  const ts = typeof time?.start === "number" ? time.start : 0
  return { path, content, ts }
}

export function PreviewView() {
  const sync = useGlobalSync()
  const params = useParams<{ dir?: string; id?: string }>()
  const [activePath, setActivePath] = createSignal<string | undefined>()

  const directory = createMemo(() => {
    const dir = params.dir
    if (!dir) return undefined
    return decode64(dir) || undefined
  })

  const writes = createMemo<WriteEntry[]>(() => {
    const dir = directory()
    const id = params.id
    if (!dir || !id) return []
    const child = sync.peek(dir, { bootstrap: false })
    if (!child) return []
    const state = child[0]
    const messages = state.message[id] ?? []
    return collectMarkdownWrites({ messages, parts: state.part })
  })

  createEffect(() => {
    const list = writes()
    if (list.length === 0) return
    const current = activePath()
    if (current && list.some((w) => w.path === current)) return
    setActivePath(list[0].path)
  })

  const selected = createMemo(() => {
    const list = writes()
    if (list.length === 0) return undefined
    const path = activePath()
    return list.find((w) => w.path === path) ?? list[0]
  })

  return (
    <Show
      when={writes().length > 0}
      fallback={
        <div data-component="right-panel-empty">
          <div data-slot="right-panel-empty-title">Preview</div>
          <div data-slot="right-panel-empty-body">
            <Show
              when={params.id}
              fallback="Open a session — when the agent writes a Markdown file, it renders here in real time."
            >
              No Markdown writes in this session yet. They appear here as the agent saves them.
            </Show>
          </div>
        </div>
      }
    >
      <div data-component="md-preview">
        <Show when={writes().length > 1}>
          <div data-slot="md-preview-tabs" role="tablist">
            <For each={writes()}>
              {(entry) => {
                const active = () => selected()?.path === entry.path
                return (
                  <button
                    type="button"
                    role="tab"
                    data-slot="md-preview-tab"
                    data-active={active() ? "true" : undefined}
                    aria-selected={active()}
                    aria-label={entry.path}
                    title={entry.path}
                    onClick={() => setActivePath(entry.path)}
                  >
                    {getFilename(entry.path)}
                  </button>
                )
              }}
            </For>
          </div>
        </Show>
        <Show when={selected()}>
          {(entry) => (
            <div data-slot="md-preview-body">
              <header data-slot="md-preview-path" title={entry().path}>
                {entry().path}
              </header>
              <Markdown
                data-slot="md-preview-content"
                text={entry().content}
                cacheKey={`${entry().path}:${entry().ts}`}
              />
            </div>
          )}
        </Show>
      </div>
    </Show>
  )
}
