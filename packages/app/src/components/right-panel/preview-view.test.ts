import { describe, expect, test } from "bun:test"
import { collectMarkdownWrites } from "./preview-view"

const writePart = (id: string, messageID: string, path: string, content: string, start: number) => ({
  id,
  sessionID: "ses_1",
  messageID,
  type: "tool" as const,
  callID: id,
  tool: "write",
  state: {
    status: "completed",
    input: { filePath: path, content },
    time: { start, end: start + 1 },
    output: "",
    title: "",
    metadata: {},
  },
})

describe("collectMarkdownWrites", () => {
  test("keeps the latest write per markdown path and sorts newest first", () => {
    const result = collectMarkdownWrites({
      messages: [{ id: "msg_1" }, { id: "msg_2" }],
      parts: {
        msg_1: [
          writePart("p1", "msg_1", "PLAN.md", "# v1", 100),
          writePart("p2", "msg_1", "src/index.ts", "ignored", 110),
        ],
        msg_2: [
          writePart("p3", "msg_2", "PLAN.md", "# v2", 200),
          writePart("p4", "msg_2", "NOTES.MD", "# notes", 150),
        ],
      },
    })

    expect(result.map((entry) => entry.path)).toEqual(["PLAN.md", "NOTES.MD"])
    expect(result[0]).toMatchObject({ path: "PLAN.md", content: "# v2", ts: 200 })
    expect(result[1]).toMatchObject({ path: "NOTES.MD", content: "# notes", ts: 150 })
  })

  test("ignores non-markdown writes and malformed parts", () => {
    const result = collectMarkdownWrites({
      messages: [{ id: "m" }],
      parts: {
        m: [
          { type: "text" },
          { type: "tool", tool: "edit", state: { input: { filePath: "x.md", content: "ignored" } } },
          writePart("p", "m", "src/foo.ts", "code", 1),
          { type: "tool", tool: "write", state: { input: { filePath: "no-content.md" } } },
          { type: "tool", tool: "write", state: { input: { filePath: 42, content: "x" } } },
        ],
      },
    })

    expect(result).toEqual([])
  })

  test("treats missing timestamp as 0 and lets later writes win", () => {
    const a = writePart("p1", "m", "doc.md", "old", 0)
    a.state.time = undefined as unknown as { start: number; end: number }

    const result = collectMarkdownWrites({
      messages: [{ id: "m" }],
      parts: {
        m: [a, writePart("p2", "m", "doc.md", "new", 1)],
      },
    })

    expect(result).toEqual([{ path: "doc.md", content: "new", ts: 1 }])
  })
})
