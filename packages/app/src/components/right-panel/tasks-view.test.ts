import { describe, expect, test } from "bun:test"
import type { Todo } from "@opencode-ai/sdk/v2/client"
import { summarizeTodos } from "./tasks-view"

const make = (status: string): Todo => ({ content: "x", status, priority: "medium" })

describe("summarizeTodos", () => {
  test("counts completed/cancelled/total", () => {
    const summary = summarizeTodos([
      make("completed"),
      make("completed"),
      make("in_progress"),
      make("pending"),
      make("cancelled"),
    ])

    expect(summary.completed).toBe(2)
    expect(summary.cancelled).toBe(1)
    expect(summary.total).toBe(5)
  })

  test("handles empty input", () => {
    expect(summarizeTodos([])).toEqual({ completed: 0, cancelled: 0, total: 0 })
  })
})
