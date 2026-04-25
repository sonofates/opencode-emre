import { createMemo, Show } from "solid-js"
import { useParams } from "@solidjs/router"
import { Icon } from "@opencode-ai/ui/icon"
import { useLayout } from "@/context/layout"
import { useLanguage } from "@/context/language"
import { decode64 } from "@/utils/base64"
import { getFilename } from "@opencode-ai/shared/util/path"
import "./status-bar.css"

const ACTIVITY_TAB_FALLBACKS: Record<string, string> = {
  chat: "Chat",
  files: "Files",
  search: "Search",
  tasks: "Tasks",
  settings: "Settings",
}

export function StatusBar() {
  const layout = useLayout()
  const language = useLanguage()
  const params = useParams<{ dir?: string }>()

  const workspaceLabel = createMemo(() => {
    const dir = params.dir
    if (!dir) return language.t("statusBar.noWorkspace") || "No workspace"
    const decoded = decode64(dir)
    if (!decoded) return dir
    return getFilename(decoded) || decoded
  })

  const tab = () => layout.activityBar.tab()
  const tabLabel = () => {
    const key = `activityBar.${tab()}`
    const translated = language.t(key)
    return translated === key ? ACTIVITY_TAB_FALLBACKS[tab()] : translated
  }

  return (
    <footer data-component="status-bar" aria-label="Status bar">
      <div data-slot="status-bar-left">
        <span data-slot="status-bar-pill">
          <Icon name="folder" size="small" />
          <span>{workspaceLabel()}</span>
        </span>
        <Show when={params.dir}>
          <span data-slot="status-bar-pill" data-muted="true">
            <Icon name="branch" size="small" />
            <span>main</span>
          </span>
        </Show>
      </div>
      <div data-slot="status-bar-right">
        <span data-slot="status-bar-pill" data-muted="true">
          <Icon name="dot-grid" size="small" />
          <span>{tabLabel()}</span>
        </span>
        <button
          type="button"
          data-slot="status-bar-pill"
          data-action="true"
          aria-label="Open context"
          onClick={() => layout.rightPanel.setTab("context")}
        >
          <Icon name="status" size="small" />
          <span>Context</span>
        </button>
      </div>
    </footer>
  )
}
