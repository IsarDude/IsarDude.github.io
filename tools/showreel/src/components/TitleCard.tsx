import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion"
import { BG, FONT, MUTED, TEXT } from "../theme"

type Props = {
  title: string
  subtitle?: string
  role?: string
  tech?: string[]
  accent: string
}

export const TitleCard = ({ title, subtitle, role, tech = [], accent }: Props) => {
  const frame = useCurrentFrame()
  const { fps, width } = useVideoConfig()
  const u = width / 1920

  const enter = (delay: number) => spring({ frame: frame - delay * fps, fps, config: { damping: 200 } })
  const rise = (delay: number) => ({
    opacity: enter(delay),
    transform: `translateY(${interpolate(enter(delay), [0, 1], [40 * u, 0])}px)`,
  })
  const glow = interpolate(frame, [0, 6 * fps], [0, 1], { extrapolateRight: "clamp" })

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at ${30 + glow * 20}% 60%, ${accent}33 0%, ${BG} 60%)`,
        backgroundColor: BG,
        fontFamily: FONT,
        color: TEXT,
        justifyContent: "center",
        paddingLeft: 160 * u,
        paddingRight: 160 * u,
      }}
    >
      <div
        style={{
          width: 140 * u * enter(0),
          height: 8 * u,
          background: accent,
          borderRadius: 4 * u,
          marginBottom: 36 * u,
        }}
      />
      <div style={{ ...rise(0.1), fontSize: 120 * u, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 * u }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ ...rise(0.3), fontSize: 46 * u, color: MUTED, marginTop: 24 * u }}>{subtitle}</div>
      )}
      {role && (
        <div style={{ ...rise(0.5), fontSize: 38 * u, fontWeight: 700, color: accent, marginTop: 48 * u }}>
          {role}
        </div>
      )}
      {tech.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 * u, marginTop: 32 * u }}>
          {tech.map((t, i) => (
            <div
              key={t}
              style={{
                ...rise(0.7 + i * 0.08),
                fontSize: 28 * u,
                padding: `${10 * u}px ${24 * u}px`,
                border: `${2 * u}px solid ${accent}88`,
                borderRadius: 999,
                background: `${accent}1a`,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      )}
    </AbsoluteFill>
  )
}
