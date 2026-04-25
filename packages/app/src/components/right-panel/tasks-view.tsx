import { createMemo, For, Show } from "solid-js"
import { useParams } from "@solidjs/router"
import type { Todo } from "@opencode-ai/sdk/v2/client"
import { useGlobalSync } from "@/context/global-sync"

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Done",
  cancelled: "Cancelled",
}

export function summarizeTodos(todos: readonly Todo[]) {
  const completed = todos.filter((t) => t.status === "completed").length
  const cancelled = todos.filter((t) => t.status === "cancelled").length
  const total = todos.length
  return { completed, cancelled, total }
}

export function TasksView() {
  const sync = useGlobalSync()
  const params = useParams<{ id?: string }>()
  const todos = createMemo<Todo[]>(() => {
    const id = params.id
    if (!id) return []
    return sync.data.session_todo[id] ?? []
  })

  return (
    <Show
      when={todos().length}
      fallback={
        <div data-component="right-panel-empty">
          <div data-slot="right-panel-empty-title">Tasks</div>
          <div data-slot="right-panel-empty-body">
            <Show
              when={params.id}
              fallback="Open a session to see the agent's task list here."
            >
              No tasks yet — when the agent uses the todo tool, items appear here in real time.
            </Show>
          </div>
        </div>
      }
    >
      <div data-component="task-list">
        <header data-slot="task-list-summary">
          {(() => {
            const { completed, total } = summarizeTodos(todos())
            return `${completed} / ${total} done`
          })()}
        </header>
        <ul>
          <For each={todos()}>
            {(todo) => {
              const isDone = todo.status === "completed"
              const isCancelled = todo.status === "cancelled"
              const isActive = todo.status === "in_progress"
              return (
                <li
                  data-slot="task-list-item"
                  data-status={todo.status}
                  data-completed={isDone ? "true" : undefined}
                  data-active={isActive ? "true" : undefined}
                  data-cancelled={isCancelled ? "true" : undefined}
                >
                  <span data-slot="task-list-marker" aria-hidden="true">
                    {isDone ? "✓" : isCancelled ? "✕" : isActive ? "→" : ""}
                  </span>
                  <div data-slot="task-list-body">
                    <div data-slot="task-list-content">{todo.content}</div>
                    <Show when={STATUS_LABEL[todo.status] && !isDone}>
                      <div data-slot="task-list-status">{STATUS_LABEL[todo.status]}</div>
                    </Show>
                  </div>
                </li>
              )
            }}
          </For>
        </ul>
      </div>
    </Show>
  )
}
