import { interpolate, useCurrentFrame, useVideoConfig } from "remotion"
import type { Clip } from "../spec"
import { FONT, MUTED, TEXT } from "../theme"

const VISIBLE = 4

/** Console-style panel that prints each recorded line when the source video reaches its time */
export const MessageLog = ({ log, from, speed, accent }: { log: NonNullable<Clip["log"]>; from: number; speed: number; accent: string }) => {
  const frame = useCurrentFrame()
  const { fps, width } = useVideoConfig()
  const u = width / 1920
  const now = from + (frame / fps) * speed

  const shown = log.lines.filter((l) => l.at <= now).slice(-VISIBLE)
  if (shown.length === 0) return null

  return (
    <div
      style={{
        position: "absolute",
        top: 60 * u,
        right: 60 * u,
        width: 820 * u,
        padding: `${18 * u}px ${24 * u}px`,
        background: "rgba(7, 7, 11, 0.82)",
        borderRadius: 14 * u,
        borderLeft: `${6 * u}px solid ${accent}`,
      }}
    >
      {log.title && (
        <div style={{ fontFamily: FONT, fontSize: 20 * u, fontWeight: 700, color: MUTED, marginBottom: 10 * u }}>{log.title}</div>
      )}
      {shown.map((line) => {
        // Newest line flashes in the accent colour, then settles to white
        const age = now - line.at
        const fresh = interpolate(age, [0, 0.6 * speed], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        return (
          <div
            key={`${line.at}-${line.text}`}
            style={{
              fontFamily: "Consolas, 'Cascadia Mono', monospace",
              fontSize: 24 * u,
              lineHeight: 1.5,
              color: fresh > 0.05 ? accent : TEXT,
              opacity: interpolate(age, [0, 0.15 * speed], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              whiteSpace: "nowrap",
            }}
          >
            {line.text}
          </div>
        )
      })}
    </div>
  )
}
