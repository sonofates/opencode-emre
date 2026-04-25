import { For, Match, Show, Switch } from "solid-js"
import { Icon, type IconProps } from "@opencode-ai/ui/icon"
import { Tooltip } from "@opencode-ai/ui/tooltip"
import { RIGHT_PANEL_TABS, type RightPanelTab, useLayout } from "@/context/layout"
import { useLanguage } from "@/context/language"
import { TasksView } from "./tasks-view"
import { PreviewView } from "./preview-view"
import { ContextView } from "./context-view"
import "./index.css"

type TabConfig = {
  tab: RightPanelTab
  icon: IconProps["name"]
  labelKey: string
  fallback: string
}

const TABS: readonly TabConfig[] = [
  { tab: "tasks", icon: "checklist", labelKey: "rightPanel.tasks", fallback: "Tasks" },
  { tab: "preview", icon: "eye", labelKey: "rightPanel.preview", fallback: "Preview" },
  { tab: "context", icon: "status", labelKey: "rightPanel.context", fallback: "Context" },
] as const

export function RightPanel() {
  const layout = useLayout()
  const language = useLanguage()

  const label = (cfg: TabConfig) => {
    const translated = language.t(cfg.labelKey)
    return translated === cfg.labelKey ? cfg.fallback : translated
  }

  const closeLabel = () => {
    const t = language.t("rightPanel.close")
    return t === "rightPanel.close" ? "Close panel" : t
  }

  return (
    <Show when={layout.rightPanel.opened()}>
      <aside
        data-component="right-panel"
        aria-label="Right panel"
        style={{ width: `${layout.rightPanel.width()}px` }}
      >
        <header data-slot="right-panel-header">
          <div data-slot="right-panel-tabs" role="tablist">
            <For each={TABS}>
              {(cfg) => {
                const active = () => layout.rightPanel.tab() === cfg.tab
                return (
                  <Tooltip placement="bottom" value={label(cfg)} openDelay={400}>
                    <button
                      type="button"
                      role="tab"
                      data-slot="right-panel-tab"
                      data-active={active() ? "true" : undefined}
                      aria-selected={active()}
                      aria-label={label(cfg)}
                      onClick={() => layout.rightPanel.setTab(cfg.tab)}
                    >
                      <Icon name={cfg.icon} size="small" />
                      <span>{label(cfg)}</span>
                    </button>
                  </Tooltip>
                )
              }}
            </For>
          </div>
          <Tooltip placement="bottom" value={closeLabel()} openDelay={400}>
            <button
              type="button"
              data-slot="right-panel-close"
              aria-label={closeLabel()}
              onClick={() => layout.rightPanel.close()}
            >
              <Icon name="close-small" size="small" />
            </button>
          </Tooltip>
        </header>
        <div data-slot="right-panel-body">
          <Switch fallback={<TasksView />}>
            <Match when={layout.rightPanel.tab() === "tasks"}>
              <TasksView />
            </Match>
            <Match when={layout.rightPanel.tab() === "preview"}>
              <PreviewView />
            </Match>
            <Match when={layout.rightPanel.tab() === "context"}>
              <ContextView />
            </Match>
          </Switch>
        </div>
      </aside>
    </Show>
  )
}

export { RIGHT_PANEL_TABS }
