import { describe, expect, test } from "bun:test"
import { parsePalettePrefix } from "./dialog-select-file-prefix"

describe("parsePalettePrefix", () => {
  test("treats plain text as default mode", () => {
    expect(parsePalettePrefix("readme")).toEqual({ mode: "default", body: "readme" })
  })

  test("treats empty input as default mode", () => {
    expect(parsePalettePrefix("")).toEqual({ mode: "default", body: "" })
  })

  test("'>' prefix switches to command mode and strips the marker", () => {
    expect(parsePalettePrefix(">terminal")).toEqual({ mode: "commands", body: "terminal" })
    expect(parsePalettePrefix("> open ")).toEqual({ mode: "commands", body: "open" })
  })

  test("'@' prefix switches to symbol mode and strips the marker", () => {
    expect(parsePalettePrefix("@useLayout")).toEqual({ mode: "symbols", body: "useLayout" })
  })

  test("only the leading character matters", () => {
    expect(parsePalettePrefix("text > with arrow")).toEqual({ mode: "default", body: "text > with arrow" })
    expect(parsePalettePrefix("e@mail")).toEqual({ mode: "default", body: "e@mail" })
  })
})
