// Renders reels/<name>.json.
//
// Usage: npm run render -- <name> [--full] [--loop] [--stills] [--draft]
//   (no flags)  full reel + website loop
//   --full      out/<name>.mp4       1080p reel with titles, music and outro
//   --loop      out/<name>-loop.mp4  720p, muted, clips only, for autoplay on the portfolio
//   --stills    out/<name>-stills/   one frame per scene, for a quick review without rendering video
//   --draft     half resolution, faster, for checking cuts
//
// Before rendering, each clip's segment is cut, cropped and scaled with ffmpeg into
// .cache/<name>/public/clips/. Remotion then only bundles those small files instead of
// copying all raw footage, and long variable-frame-rate screen recordings play back reliably.

import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import ffmpeg from "ffmpeg-static"
import { fpsOf, isImage, timeline } from "../src/spec.ts"

const args = process.argv.slice(2)
const name = args.find((a) => !a.startsWith("--"))
const flag = (f) => args.includes(`--${f}`)

if (!name) {
  console.error("Usage: npm run render -- <name>   (reads reels/<name>.json)")
  process.exit(1)
}

const specPath = join("reels", `${name}.json`)
if (!existsSync(specPath)) {
  console.error(`No reel file ${specPath}`)
  process.exit(1)
}
const spec = JSON.parse(readFileSync(specPath, "utf8"))

// Catch bad paths and out-of-range times before Remotion spends minutes rendering
const durations = new Map()
const videoLength = (src) => {
  if (!durations.has(src)) {
    const { stderr } = spawnSync(ffmpeg, ["-hide_banner", "-i", join("public", src)], { encoding: "utf8" })
    const d = stderr.match(/Duration: (\d+):(\d+):([\d.]+)/)
    durations.set(src, d ? Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3]) : Infinity)
  }
  return durations.get(src)
}
const problems = []
for (const [i, clip] of spec.clips.entries()) {
  const where = `clip ${i + 1} (${clip.src})`
  if (!existsSync(join("public", clip.src))) {
    problems.push(`${where}: file not found in public/`)
    continue
  }
  if (isImage(clip.src)) continue
  if (clip.to === undefined) problems.push(`${where}: missing "to"`)
  else if (clip.to <= (clip.from ?? 0)) problems.push(`${where}: "to" must be after "from"`)
  else if (clip.to > videoLength(clip.src) + 0.05) problems.push(`${where}: "to" ${clip.to}s is past the end (${videoLength(clip.src).toFixed(2)}s)`)
}
if (spec.music && !existsSync(join("public", spec.music))) problems.push(`music ${spec.music}: file not found in public/`)
if (problems.length) {
  console.error(`Problems in ${specPath}:\n  ${problems.join("\n  ")}`)
  process.exit(1)
}

// Stage a minimal public dir with pre-cut clips
const cacheDir = join(".cache", name)
const stageDir = join(cacheDir, "public")
const bundleDir = join(cacheDir, "bundle")
mkdirSync(join(stageDir, "clips"), { recursive: true })
cpSync(join("public", "fonts"), join(stageDir, "fonts"), { recursive: true })

const stageFile = (src) => {
  const to = join(stageDir, src)
  if (!existsSync(to) || statSync(to).size !== statSync(join("public", src)).size) {
    mkdirSync(dirname(to), { recursive: true })
    copyFileSync(join("public", src), to)
  }
}

const width = spec.width ?? 1920
const height = spec.height ?? 1080
const fps = fpsOf(spec)
const used = new Set()

const stageClip = (clip, i) => {
  if (isImage(clip.src)) {
    stageFile(clip.src)
    return clip
  }
  const source = join("public", clip.src)
  const from = clip.from ?? 0
  const crop = clip.crop ?? spec.crop
  const { mtimeMs, size } = statSync(source)
  const key = createHash("sha1").update(JSON.stringify([clip.src, mtimeMs, size, from, clip.to, crop, width, height, fps])).digest("hex").slice(0, 12)
  const file = `clips/${key}.mp4`
  used.add(`${key}.mp4`)

  if (!existsSync(join(stageDir, file))) {
    console.log(`Cutting clip ${i + 1}: ${clip.src} ${from}s-${clip.to}s`)
    const filters = [
      crop && `crop=${crop.width}:${crop.height}:${crop.x}:${crop.y}`,
      `scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos`,
      `crop=${width}:${height}`,
      `fps=${fps}`,
      "setsar=1",
    ].filter(Boolean)
    const result = spawnSync(ffmpeg, [
      "-hide_banner", "-loglevel", "error", "-y",
      "-ss", String(from), "-i", source,
      // A little extra so the last frame never runs out
      "-t", String(clip.to - from + 0.25),
      "-vf", filters.join(","),
      "-c:v", "libx264", "-preset", "fast", "-crf", "14", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "192k",
      join(stageDir, file),
    ], { stdio: "inherit" })
    if (result.status !== 0) process.exit(result.status ?? 1)
  }

  const { crop: _, ...rest } = clip
  return { ...rest, src: file, from: 0, to: clip.to - from }
}

const staged = { ...spec, crop: undefined, clips: spec.clips.map(stageClip) }
if (spec.music) stageFile(spec.music)
for (const f of readdirSync(join(stageDir, "clips"))) {
  if (!used.has(f)) rmSync(join(stageDir, "clips", f))
}

const cli = join("node_modules", "@remotion", "cli", "remotion-cli.js")
const run = (cliArgs) => {
  const result = spawnSync(process.execPath, [cli, ...cliArgs], { stdio: "inherit" })
  if (result.status !== 0) process.exit(result.status ?? 1)
}
run(["bundle", "src/index.ts", `--public-dir=${stageDir}`, `--out-dir=${bundleDir}`, "--log=error"])

mkdirSync("out", { recursive: true })
const remotion = (cmd, props, extra) => {
  const propsPath = join(cacheDir, "props.json")
  writeFileSync(propsPath, JSON.stringify(props))
  run([cmd, bundleDir, "Showreel", ...extra, `--props=${propsPath}`])
}

const draft = flag("draft") ? ["--scale=0.5"] : []
const any = flag("full") || flag("loop") || flag("stills")

if (flag("stills")) {
  const dir = join("out", `${name}-stills`)
  rmSync(dir, { recursive: true, force: true })
  const { segments, transitions } = timeline(staged)
  let start = 0
  segments.forEach((length, i) => {
    start -= transitions[i].frames
    // 70% in: past the transition, with captions and titles fully on screen
    const frame = start + Math.floor(length * 0.7)
    remotion("still", staged, [join(dir, `${String(i + 1).padStart(2, "0")}.jpg`), `--frame=${frame}`, "--image-format=jpeg", "--log=error", ...draft])
    start += length
  })
  console.log(`Stills in ${dir}`)
}

if (flag("full") || !any) {
  remotion("render", staged, [join("out", `${name}.mp4`), "--codec=h264", "--crf=18", ...draft])
}

if (flag("loop") || !any) {
  // Resize via props rather than --scale so the dimensions stay whole, even numbers
  const loopWidth = Math.min(width, 1280)
  const loopHeight = Math.round((height * loopWidth) / width / 2) * 2
  remotion("render", { ...staged, variant: "loop", width: loopWidth, height: loopHeight }, [join("out", `${name}-loop.mp4`), "--codec=h264", "--crf=26", "--muted"])
}
