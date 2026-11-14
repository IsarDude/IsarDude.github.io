import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion"
import { BG, FONT, MUTED, TEXT } from "../theme"

type Props = { name: string; lines?: string[]; url?: string; accent: string }

export const Outro = ({ name, lines = [], url, accent }: Props) => {
  const frame = useCurrentFrame()
  const { fps, width } = useVideoConfig()
  const u = width / 1920

  const enter = (delay: number) => spring({ frame: frame - delay * fps, fps, config: { damping: 200 } })
  const rise = (delay: number) => ({
    opacity: enter(delay),
    transform: `translateY(${interpolate(enter(delay), [0, 1], [30 * u, 0])}px)`,
  })

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 50%, ${accent}26 0%, ${BG} 60%)`,
        backgroundColor: BG,
        fontFamily: FONT,
        color: TEXT,
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <div style={{ ...rise(0.1), fontSize: 104 * u, fontWeight: 700, letterSpacing: -2 * u }}>{name}</div>
      {lines.map((line, i) => (
        <div key={line} style={{ ...rise(0.3 + i * 0.12), fontSize: 40 * u, color: MUTED, marginTop: 18 * u }}>
          {line}
        </div>
      ))}
      {url && (
        <div style={{ ...rise(0.4 + lines.length * 0.12), fontSize: 44 * u, fontWeight: 700, color: accent, marginTop: 48 * u }}>
          {url}
        </div>
      )}
    </AbsoluteFill>
  )
}
