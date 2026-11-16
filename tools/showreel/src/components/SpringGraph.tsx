import { useCurrentFrame, useVideoConfig } from "remotion"
import type { SpringGraph as Spec } from "../spec"
import { FONT, MUTED, TEXT } from "../theme"

const STEP = 1 / 240

// Same integration as SpringRecoilBehaviour: impulse split into kick and velocity,
// then a = -k*x - c*v per step
const simulate = (g: Spec, from: number, to: number) => {
  const shots = [...g.shots].sort((a, b) => a - b)
  const points: { t: number; x: number }[] = []
  let x = 0
  let v = 0
  let next = 0
  for (let t = from; t <= to; t += STEP) {
    while (next < shots.length && shots[next] <= t) {
      v += g.strength * (1 - g.kickRatio)
      x += g.strength * g.kickRatio
      next++
    }
    v += (-g.stiffness * x - g.damping * v) * STEP
    x += v * STEP
    points.push({ t, x })
  }
  return points
}

/** Draws the recoil pitch offset over the clip, revealed up to the current source time */
export const SpringGraph = ({ graph, from, to, speed, accent }: { graph: Spec; from: number; to: number; speed: number; accent: string }) => {
  const frame = useCurrentFrame()
  const { fps, width } = useVideoConfig()
  const u = width / 1920
  const now = from + (frame / fps) * speed

  const points = simulate(graph, from, to)
  const peak = Math.max(...points.map((p) => p.x), 1e-6)
  const w = 560 * u
  const h = 200 * u
  const px = (t: number) => ((t - from) / (to - from)) * w
  const py = (x: number) => h - (x / peak) * h * 0.9
  const shown = points.filter((p) => p.t <= now)
  const path = shown.map((p, i) => `${i ? "L" : "M"}${px(p.t).toFixed(1)},${py(p.x).toFixed(1)}`).join(" ")
  const last = shown[shown.length - 1]

  return (
    <div
      style={{
        position: "absolute",
        top: 60 * u,
        right: 60 * u,
        padding: 24 * u,
        background: "rgba(7, 7, 11, 0.78)",
        borderRadius: 14 * u,
        fontFamily: FONT,
        color: TEXT,
      }}
    >
      <div style={{ fontSize: 26 * u, fontWeight: 700 }}>{graph.label}</div>
      <div style={{ fontSize: 20 * u, color: MUTED, marginTop: 4 * u, marginBottom: 16 * u }}>
        Stiffness {graph.stiffness} · Damping {graph.damping} · Strength {graph.strength} · Kick ratio {graph.kickRatio}
      </div>
      <svg width={w} height={h} style={{ overflow: "visible", display: "block" }}>
        <line x1={0} y1={h} x2={w} y2={h} stroke={MUTED} strokeOpacity={0.5} strokeWidth={2 * u} />
        {graph.shots
          .filter((s) => s >= from && s <= Math.min(now, to))
          .map((s) => (
            <g key={s}>
              <line x1={px(s)} y1={0} x2={px(s)} y2={h} stroke={accent} strokeOpacity={0.5} strokeDasharray={`${6 * u} ${6 * u}`} strokeWidth={2 * u} />
              <text x={px(s) + 8 * u} y={20 * u} fill={accent} fontSize={18 * u} fontFamily={FONT} fontWeight={700}>
                shot
              </text>
            </g>
          ))}
        <path d={path} fill="none" stroke={accent} strokeWidth={5 * u} strokeLinejoin="round" strokeLinecap="round" />
        {last && <circle cx={px(last.t)} cy={py(last.x)} r={8 * u} fill={TEXT} />}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18 * u, color: MUTED, marginTop: 8 * u }}>
        <span>Camera pitch offset</span>
        <span>{(to - from).toFixed(1)} s real time</span>
      </div>
    </div>
  )
}
