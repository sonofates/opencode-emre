export function ContextView() {
  return (
    <div data-component="right-panel-empty">
      <div data-slot="right-panel-empty-title">Context</div>
      <div data-slot="right-panel-empty-body">
        Token usage, cost, attached files, and active model. Wired up alongside the ⌘I popover.
      </div>
    </div>
  )
}
