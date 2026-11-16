// Scans public/footage/<project>/ and writes analysis/<project>/:
//   report.md   durations, resolutions, scene cuts and busiest moments per clip
//   *.jpg       contact sheets with a timestamp on every frame, for picking in/out points
//
// Usage: npm run analyze -- <project> [--scene 0.3]
// Zoom into part of one recording with finer sheets (written to analysis/<project>/zoom/):
//        npm run analyze -- <project> --only "<part of file name>" --from 120 --to 150 [--every 1]

import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { basename, extname, join, relative } from "node:path"
import ffmpeg from "ffmpeg-static"

const VIDEO = /\.(mp4|mov|mkv|webm|avi|m4v)$/i
const IMAGE = /\.(png|jpe?g|webp|gif|svg)$/i
const FRAMES_PER_CLIP = 32
const TILE = "4x4"
const ACTIVITY_WINDOW = 5

const args = process.argv.slice(2)
const option = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const project = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"))
const sceneThreshold = Number(option("scene") ?? 0.3)
const only = option("only")
const zoom = option("from") !== undefined || option("to") !== undefined

if (!project) {
  console.error("Usage: npm run analyze -- <project>   (folder name inside public/footage)")
  process.exit(1)
}

const footageDir = join("public", "footage", project)
if (!existsSync(footageDir)) {
  console.error(`No folder ${footageDir}. Put the clips for this project there first.`)
  process.exit(1)
}

const outDir = zoom ? join("analysis", project, "zoom") : join("analysis", project)
if (!zoom) rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

const run = (ffArgs) => spawnSync(ffmpeg, ["-hide_banner", ...ffArgs], { encoding: "utf8", maxBuffer: 1 << 28 })

const probe = (file) => {
  const { stderr } = run(["-i", file])
  const d = stderr.match(/Duration: (\d+):(\d+):([\d.]+)/)
  const v = stderr.match(/Video: .*?, (\d{2,5})x(\d{2,5})/)
  const fps = stderr.match(/([\d.]+) fps/)
  return {
    duration: d ? Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3]) : 0,
    width: v ? Number(v[1]) : 0,
    height: v ? Number(v[2]) : 0,
    fps: fps ? Number(fps[1]) : 0,
    audio: /Audio: /.test(stderr),
  }
}

// One pass at 4 fps: per-frame scene-change scores give both hard cuts and a motion curve
const motion = (file) => {
  const { stderr } = run(["-i", file, "-an", "-vf", "scale=320:-2,fps=4,select='gte(scene,0)',metadata=print:key=lavfi.scene_score", "-f", "null", "-"])
  const samples = [...stderr.matchAll(/pts_time:([\d.]+)[\s\S]*?lavfi\.scene_score=([\d.]+)/g)].map((m) => ({ t: Number(m[1]), score: Number(m[2]) }))
  const cuts = samples.filter((s) => s.score > sceneThreshold).map((s) => Number(s.t.toFixed(2)))

  // Busiest non-overlapping windows: deals, cascades, win animations
  const windows = new Map()
  for (const { t, score } of samples) {
    const w = Math.floor(t / ACTIVITY_WINDOW)
    windows.set(w, (windows.get(w) ?? 0) + score)
  }
  const busiest = [...windows.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([w, sum]) => ({ from: w * ACTIVITY_WINDOW, to: (w + 1) * ACTIVITY_WINDOW, level: sum }))
  const top = busiest[0]?.level || 1
  return { cuts, busiest: busiest.map((b) => ({ ...b, level: Math.round((b.level / top) * 100) })) }
}

const contactSheets = (file, name, from, to, interval) => {
  const prefix = zoom ? `${name}_${from}-${to}` : name
  // Font path is relative so Windows drive colons never reach the filter string.
  // Input seeking resets timestamps, so the label adds the offset back.
  const label = `drawtext=fontfile=public/fonts/atkinson-bold.woff:text='%{pts\\:hms\\:${from}}':x=8:y=8:fontsize=26:fontcolor=white:box=1:boxcolor=black@0.7:boxborderw=6`
  run([
    "-ss", String(from), "-i", file, "-t", String(to - from), "-an",
    "-vf", `fps=1/${interval},scale=480:-2,${label},tile=${TILE}:padding=4:color=black`,
    "-q:v", "4",
    join(outDir, `${prefix}_sheet%02d.jpg`),
  ])
  return readdirSync(outDir).filter((f) => f.startsWith(`${prefix}_sheet`)).sort()
}

const fmt = (s) => {
  const m = Math.floor(s / 60)
  return `${m}:${(s - m * 60).toFixed(1).padStart(4, "0")}`
}

// Includes subfolders; sheet names flatten the folder into the file name
const files = readdirSync(footageDir, { recursive: true })
  .map((f) => f.replaceAll("\\", "/"))
  .filter((f) => VIDEO.test(f) || IMAGE.test(f))
  .filter((f) => !only || f.includes(only))
  .sort()
if (files.length === 0) {
  console.error(`${footageDir} has no matching videos or images.`)
  process.exit(1)
}

if (zoom) {
  for (const file of files.filter((f) => VIDEO.test(f))) {
    const path = join(footageDir, file)
    const from = Number(option("from") ?? 0)
    const to = Math.min(Number(option("to") ?? Infinity), probe(path).duration)
    const sheets = contactSheets(path, file.slice(0, -extname(file).length).replaceAll("/", "__"), from, to, Number(option("every") ?? 1))
    console.log(`${file} ${fmt(from)}-${fmt(to)}:\n${sheets.map((s) => `  analysis/${project}/zoom/${s}`).join("\n")}`)
  }
  process.exit(0)
}

const lines = [`# Footage analysis: ${project}`, "", `Scene threshold ${sceneThreshold}. Paths in reels/*.json are relative to public/.`, ""]

for (const file of files) {
  const path = join(footageDir, file)
  const src = relative("public", path).replaceAll("\\", "/")

  if (IMAGE.test(file)) {
    lines.push(`## ${file} (image)`, "", `- src: \`${src}\``, "")
    console.log(`image  ${file}`)
    continue
  }

  const name = file.slice(0, -extname(file).length).replaceAll("/", "__")
  const info = probe(path)
  console.log(`video  ${file}  ${fmt(info.duration)}  ${info.width}x${info.height}@${info.fps}  analysing...`)
  const { cuts, busiest } = motion(path)
  const interval = Math.max(0.5, Math.ceil((info.duration / FRAMES_PER_CLIP) * 2) / 2)
  const sheets = contactSheets(path, name, 0, info.duration, interval)

  lines.push(
    `## ${file}`,
    "",
    `- src: \`${src}\``,
    `- length ${info.duration.toFixed(2)}s (${fmt(info.duration)}), ${info.width}x${info.height}, ${info.fps} fps, ${info.audio ? "has audio" : "no audio"}`,
    `- scene cuts (s): ${cuts.length ? cuts.join(", ") : "none detected"}`,
    `- busiest ${ACTIVITY_WINDOW}s windows (relative motion): ${busiest.map((b) => `${fmt(b.from)}-${fmt(b.to)} (${b.level})`).join(", ")}`,
    `- contact sheets: one frame every ${interval}s, ${TILE} per sheet, timestamp burned into each frame`,
    ...sheets.map((s) => `  - analysis/${project}/${s}`),
    "",
  )
}

writeFileSync(join(outDir, "report.md"), lines.join("\n"))
console.log(`\nWrote ${join(outDir, "report.md")}`)
