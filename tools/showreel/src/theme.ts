import { loadFont } from "@remotion/fonts"
import { staticFile } from "remotion"

// Same typeface as the portfolio site
export const FONT = "Atkinson"

loadFont({ family: FONT, url: staticFile("fonts/atkinson-regular.woff"), weight: "400" })
loadFont({ family: FONT, url: staticFile("fonts/atkinson-bold.woff"), weight: "700" })

export const BG = "#07070b"
export const TEXT = "#f5f5f7"
export const MUTED = "#a1a1aa"
export const DEFAULT_ACCENT = "#38bdf8"
