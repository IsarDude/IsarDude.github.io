// Shape of a reel file in reels/*.json. Paths are relative to public/.

export type TransitionKind = "fade" | "slide" | "wipe" | "cut"

/** Region of the source video to keep, in source pixels. Scaled up to fill the frame */
export type Crop = { x: number; y: number; width: number; height: number }

export type Clip = {
  /** Video (mp4/mov/webm) or still image (png/jpg/webp/svg) under public/ */
  src: string
  /** Start time in the source video, seconds */
  from?: number
  /** End time in the source video, seconds. For images: from/to only give the on-screen length */
  to?: number
  /** On-screen length for images, seconds (default 2.5) */
  duration?: number
  /** Lower-third text shown over the clip */
  caption?: string
  /** Playback speed, e.g. 0.5 for slow motion */
  speed?: number
  /** Game audio volume 0..1 (default: muted when the reel has music) */
  volume?: number
  /** Overrides the reel's crop for this clip */
  crop?: Crop
  /** Transition into this clip, overriding the reel's */
  transition?: TransitionKind
  /** Log lines that appear at their real time in the source video, e.g. a recorded message bus */
  log?: { title?: string; lines: { at: number; text: string }[] }
  /** Recoil curve simulated from a weapon's real spring values, with impulses at the real shot times */
  springGraph?: SpringGraph
  /** "cover" (default) fills the frame and crops; "contain" letterboxes, e.g. for side-by-side captures */
  fit?: "cover" | "contain"
  /** One label per side-by-side pane, left to right, shown above the picture */
  labels?: string[]
  /** Set by the render script for "contain": where the picture sits, as fractions of the frame height */
  pane?: { top: number; height: number }
}

export type SpringGraph = {
  label: string
  stiffness: number
  damping: number
  strength: number
  /** Share of each impulse applied as an instant offset; the rest becomes velocity */
  kickRatio: number
  /** Shot times in the source video, seconds */
  shots: number[]
}

export type ReelSpec = {
  title: string
  subtitle?: string
  role?: string
  tech?: string[]
  accent?: string
  fps?: number
  width?: number
  height?: number
  /** Seconds the title card stays up */
  introSeconds?: number
  /** Number of clips that play before the title card, e.g. a cold-open montage (default 0) */
  introAt?: number
  /** Transition into the title card when it follows clips (default cut) */
  introTransition?: TransitionKind
  music?: string
  musicVolume?: number
  /** Skip into the music track, seconds */
  musicStart?: number
  /** Loop the track if the reel outlasts it (default true). Set false when the track's own ending is timed to the reel */
  musicLoop?: boolean
  transition?: TransitionKind
  transitionSeconds?: number
  /** Crop for every video clip, e.g. to cut browser bars out of a screen recording */
  crop?: Crop
  clips: Clip[]
  outro?: {
    name: string
    lines?: string[]
    url?: string
    seconds?: number
    transition?: TransitionKind
  }
  /** "loop" drops the title card and outro for a short autoplay loop on the website */
  variant?: "full" | "loop"
}

export const IMAGE_EXT = /\.(png|jpe?g|webp|gif|svg)$/i

export const isImage = (src: string) => IMAGE_EXT.test(src)

export const fpsOf = (spec: ReelSpec) => spec.fps ?? 30

export const clipSeconds = (clip: Clip) => {
  if (isImage(clip.src)) {
    return clip.duration ?? (clip.to !== undefined ? clip.to - (clip.from ?? 0) : 2.5)
  }
  if (clip.to === undefined) {
    throw new Error(`Clip ${clip.src} needs a "to" time`)
  }
  return (clip.to - (clip.from ?? 0)) / (clip.speed ?? 1)
}

export type Scene =
  | { type: "intro"; seconds: number; transition: TransitionKind }
  | { type: "clip"; clip: Clip; seconds: number; transition: TransitionKind }
  | { type: "outro"; seconds: number; transition: TransitionKind }

/** Title card, clips and outro in playback order */
export const scenes = (spec: ReelSpec): Scene[] => {
  const full = spec.variant !== "loop"
  const fallback = spec.transition ?? "fade"
  const list: Scene[] = spec.clips.map((clip) => ({
    type: "clip",
    clip,
    seconds: clipSeconds(clip),
    transition: clip.transition ?? fallback,
  }))
  if (full) {
    const at = Math.min(spec.introAt ?? 0, list.length)
    list.splice(at, 0, { type: "intro", seconds: spec.introSeconds ?? 3, transition: spec.introTransition ?? "cut" })
    if (spec.outro) list.push({ type: "outro", seconds: spec.outro.seconds ?? 3.5, transition: spec.outro.transition ?? fallback })
  }
  return list
}

/**
 * Frame lengths of every segment in order, and the transition into each one
 * (transitions[0] is always a cut, since nothing comes before the first segment)
 */
export const timeline = (spec: ReelSpec) => {
  const fps = fpsOf(spec)
  const toFrames = (s: number) => Math.max(1, Math.round(s * fps))

  const list = scenes(spec)
  const segments = list.map((s) => toFrames(s.seconds))
  const kinds = list.map((s) => s.transition)
  kinds[0] = "cut"

  const wanted = toFrames(spec.transitionSeconds ?? 0.4)
  const transitions = kinds.map((kind, i) => ({
    kind,
    // A transition can never be longer than half of either segment it joins
    frames: kind === "cut" ? 0 : Math.min(wanted, Math.floor(segments[i - 1] / 2), Math.floor(segments[i] / 2)),
  }))

  const total = segments.reduce((a, b) => a + b, 0) - transitions.reduce((a, t) => a + t.frames, 0)
  return { segments, transitions, total, fps }
}
