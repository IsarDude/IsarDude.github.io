import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion"
import { FONT, TEXT } from "../theme"

// Lower-third that slides in after the transition and fades before the next one
export const Caption = ({ text, accent }: { text: string; accent: string }) => {
  const frame = useCurrentFrame()
  const { fps, width, durationInFrames } = useVideoConfig()
  const u = width / 1920

  const enter = spring({ frame: frame - 0.25 * fps, fps, config: { damping: 200 } })
  const exit = interpolate(frame, [durationInFrames - 0.5 * fps, durationInFrames - 0.2 * fps], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", padding: 80 * u, fontFamily: FONT }}>
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          alignSelf: "flex-start",
          opacity: enter * exit,
          transform: `translateX(${interpolate(enter, [0, 1], [-60 * u, 0])}px)`,
        }}
      >
        <div style={{ width: 8 * u, background: accent, borderRadius: 4 * u }} />
        <div
          style={{
            color: TEXT,
            fontSize: 44 * u,
            fontWeight: 700,
            padding: `${14 * u}px ${28 * u}px`,
            background: "rgba(7, 7, 11, 0.72)",
            borderRadius: `0 ${10 * u}px ${10 * u}px 0`,
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  )
}
