import { spring, useCurrentFrame, useVideoConfig } from "remotion"
import { FONT, TEXT } from "../theme"

/** One label centred above each side-by-side pane of a letterboxed clip */
export const PaneLabels = ({ labels, top, accent }: { labels: string[]; top: number; accent: string }) => {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const u = width / 1920
  const enter = spring({ frame: frame - 0.1 * fps, fps, config: { damping: 200 } })
  const paneTop = top * height

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: paneTop, display: "flex", alignItems: "flex-end" }}>
      {labels.map((label, i) => (
        <div key={i} style={{ flex: 1, display: "flex", justifyContent: "center", paddingBottom: 28 * u }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16 * u,
              opacity: enter,
              transform: `translateY(${(1 - enter) * 20 * u}px)`,
              fontFamily: FONT,
              fontSize: 40 * u,
              fontWeight: 700,
              color: TEXT,
            }}
          >
            <div style={{ width: 14 * u, height: 14 * u, borderRadius: "50%", background: accent }} />
            {label}
          </div>
        </div>
      ))}
    </div>
  )
}
