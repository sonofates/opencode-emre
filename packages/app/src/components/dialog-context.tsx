import { createMemo, For, Show } from "solid-js"
import { useParams } from "@solidjs/router"
import { Dialog } from "@opencode-ai/ui/dialog"
import { Icon } from "@opencode-ai/ui/icon"
import { getFilename } from "@opencode-ai/shared/util/path"
import { useGlobalSync } from "@/context/global-sync"
import { decode64 } from "@/utils/base64"
import "./dialog-context.css"

type Row = {
  label: string
  value: string
  icon?: Parameters<typeof Icon>[0]["name"]
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "0"
  if (Math.abs(value) >= 1000) return value.toLocaleString()
  return String(value)
}

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return "$0.00"
  return `$${value.toFixed(value >= 100 ? 0 : 2)}`
}

export function DialogContext() {
  const sync = useGlobalSync()
  const params = useParams<{ dir?: string; id?: string }>()

  const directory = createMemo(() => {
    const dir = params.dir
    if (!dir) return undefined
    return decode64(dir) || undefined
  })

  const session = createMemo(() => {
    const dir = directory()
    const id = params.id
    if (!dir || !id) return undefined
    const child = sync.peek(dir, { bootstrap: false })
    if (!child) return undefined
    return child[0].session.find((s) => s.id === id)
  })

  const todos = createMemo(() => {
    const id = params.id
    if (!id) return []
    return sync.data.session_todo[id] ?? []
  })

  const stats = createMemo(() => {
    const dir = directory()
    const id = params.id
    if (!dir || !id) return { tokensInput: 0, tokensOutput: 0, cost: 0, parts: 0, messages: 0 }
    const child = sync.peek(dir, { bootstrap: false })
    if (!child) return { tokensInput: 0, tokensOutput: 0, cost: 0, parts: 0, messages: 0 }
    const messages = child[0].message[id] ?? []
    let tokensInput = 0
    let tokensOutput = 0
    let cost = 0
    let parts = 0
    for (const msg of messages) {
      const ps = child[0].part[msg.id] ?? []
      parts += ps.length
      for (const p of ps) {
        if ((p as { type?: string }).type !== "step-finish") continue
        const stepP = p as { tokens?: { input?: number; output?: number }; cost?: number }
        tokensInput += stepP.tokens?.input ?? 0
        tokensOutput += stepP.tokens?.output ?? 0
        cost += stepP.cost ?? 0
      }
    }
    return { tokensInput, tokensOutput, cost, parts, messages: messages.length }
  })

  const rows = createMemo<Row[]>(() => {
    const result: Row[] = []
    const dir = directory()
    if (dir) result.push({ icon: "folder", label: "Workspace", value: getFilename(dir) || dir })

    const s = session()
    if (s) {
      result.push({ icon: "speech-bubble", label: "Session", value: s.title || s.id })
    }

    const stat = stats()
    result.push({
      icon: "arrow-up",
      label: "Tokens (in / out)",
      value: `${formatNumber(stat.tokensInput)} / ${formatNumber(stat.tokensOutput)}`,
    })
    result.push({ icon: "status", label: "Cost", value: formatCurrency(stat.cost) })
    result.push({ icon: "code-lines", label: "Messages / parts", value: `${stat.messages} / ${stat.parts}` })

    const t = todos()
    if (t.length > 0) {
      const completed = t.filter((x) => x.status === "completed").length
      result.push({ icon: "checklist", label: "Tasks", value: `${completed} / ${t.length}` })
    }

    return result
  })

  return (
    <Dialog title="Context" size="normal">
      <div data-component="dialog-context">
        <Show
          when={params.id}
          fallback={
            <div data-slot="dialog-context-empty">
              Open a session to see token usage, cost, and active model.
            </div>
          }
        >
          <ul data-slot="dialog-context-rows">
            <For each={rows()}>
              {(row) => (
                <li data-slot="dialog-context-row">
                  <span data-slot="dialog-context-icon">
                    <Show when={row.icon}>
                      <Icon name={row.icon!} size="small" />
                    </Show>
                  </span>
                  <span data-slot="dialog-context-label">{row.label}</span>
                  <span data-slot="dialog-context-value">{row.value}</span>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>
    </Dialog>
  )
}
