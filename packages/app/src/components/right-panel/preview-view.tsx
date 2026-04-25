export function PreviewView() {
  return (
    <div data-component="right-panel-empty">
      <div data-slot="right-panel-empty-title">Preview</div>
      <div data-slot="right-panel-empty-body">
        Live markdown preview of files the agent writes — plans, specs, RFCs. Lands in the next step.
      </div>
    </div>
  )
}
