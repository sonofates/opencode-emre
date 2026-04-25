import { Match, Switch, type JSX } from "solid-js"
import { Icon, type IconProps } from "@opencode-ai/ui/icon"
import { type ActivityTab, useLayout } from "@/context/layout"
import "./sidebar-tab-panel.css"

type Placeholder = {
  icon: IconProps["name"]
  title: string
  body: string
}

const PLACEHOLDERS: Record<Exclude<ActivityTab, "chat">, Placeholder> = {
  files: {
    icon: "file-tree",
    title: "Files",
    body: "Workspace file tree lands in a later step.",
  },
  search: {
    icon: "magnifying-glass-menu",
    title: "Search",
    body: "Cross-session search is not wired yet.",
  },
  tasks: {
    icon: "checklist",
    title: "Tasks",
    body: "Tool-call driven task list arrives with the right panel.",
  },
  settings: {
    icon: "settings-gear",
    title: "Settings",
    body: "Use the gear in the project rail to open settings for now.",
  },
}

export function SidebarTabPanel(props: { fallback: JSX.Element }) {
  const layout = useLayout()
  const tab = () => layout.activityBar.tab()

  return (
    <Switch>
      <Match when={tab() === "chat"}>{props.fallback}</Match>
      <Match when={tab() !== "chat"}>
        {(() => {
          const current = tab() as Exclude<ActivityTab, "chat">
          const data = PLACEHOLDERS[current]
          return (
            <div data-component="sidebar-tab-panel">
              <div data-slot="sidebar-tab-panel-icon">
                <Icon name={data.icon} size="medium" />
              </div>
              <div data-slot="sidebar-tab-panel-title">{data.title}</div>
              <div data-slot="sidebar-tab-panel-body">{data.body}</div>
            </div>
          )
        })()}
      </Match>
    </Switch>
  )
}
