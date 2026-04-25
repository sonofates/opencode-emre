import { For } from "solid-js"
import { Icon, type IconProps } from "@opencode-ai/ui/icon"
import { Tooltip } from "@opencode-ai/ui/tooltip"
import { type ActivityTab, useLayout } from "@/context/layout"
import { useCommand } from "@/context/command"
import { useLanguage } from "@/context/language"
import "./activity-bar.css"

type ActivityItem = {
  tab: ActivityTab
  icon: IconProps["name"]
  labelKey: string
  fallback: string
}

const ITEMS: readonly ActivityItem[] = [
  { tab: "chat", icon: "speech-bubble", labelKey: "activityBar.chat", fallback: "Chat" },
  { tab: "files", icon: "file-tree", labelKey: "activityBar.files", fallback: "Files" },
  { tab: "search", icon: "magnifying-glass-menu", labelKey: "activityBar.search", fallback: "Search" },
  { tab: "tasks", icon: "checklist", labelKey: "activityBar.tasks", fallback: "Tasks" },
] as const

export function ActivityBar() {
  const layout = useLayout()
  const command = useCommand()
  const language = useLanguage()

  const label = (item: ActivityItem) => {
    const translated = language.t(item.labelKey)
    return translated === item.labelKey ? item.fallback : translated
  }

  const handleClick = (tab: ActivityTab) => {
    if (tab === "settings") {
      command.trigger("settings.open")
      return
    }

    if (tab === "tasks") {
      const alreadyOnTasks = layout.rightPanel.opened() && layout.rightPanel.tab() === "tasks"
      if (alreadyOnTasks) {
        layout.rightPanel.close()
        return
      }
      layout.rightPanel.setTab("tasks")
      return
    }

    const sameTab = layout.activityBar.tab() === tab
    if (sameTab && layout.sidebar.opened()) {
      layout.sidebar.close()
      return
    }
    layout.activityBar.setTab(tab)
    if (!layout.sidebar.opened()) layout.sidebar.open()
  }

  return (
    <nav data-component="activity-bar" aria-label="Activity">
      <ul>
        <For each={ITEMS}>
          {(item) => {
            const active = () => {
              if (item.tab === "settings") return false
              if (item.tab === "tasks") return layout.rightPanel.opened() && layout.rightPanel.tab() === "tasks"
              return layout.activityBar.tab() === item.tab && layout.sidebar.opened()
            }
            return (
              <li>
                <Tooltip placement="right" value={label(item)} openDelay={400}>
                  <button
                    type="button"
                    data-slot="activity-bar-button"
                    data-active={active() ? "true" : undefined}
                    aria-label={label(item)}
                    aria-pressed={active()}
                    onClick={() => handleClick(item.tab)}
                  >
                    <Icon name={item.icon} />
                  </button>
                </Tooltip>
              </li>
            )
          }}
        </For>
      </ul>
    </nav>
  )
}
