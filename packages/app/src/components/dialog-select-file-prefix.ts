export type PalettePrefixMode = "default" | "commands" | "symbols"

export type PalettePrefixResult = {
  mode: PalettePrefixMode
  body: string
}

export function parsePalettePrefix(text: string): PalettePrefixResult {
  if (text.startsWith(">")) return { mode: "commands", body: text.slice(1).trim() }
  if (text.startsWith("@")) return { mode: "symbols", body: text.slice(1).trim() }
  return { mode: "default", body: text }
}
