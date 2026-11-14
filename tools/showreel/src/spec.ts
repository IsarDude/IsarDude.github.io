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
  music?: string
  musicVolume?: number
  /** Skip into the music track, seconds */
  musicStart?: number
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

/**
 * Frame lengths of every segment in order, and the transition into each one
 * (transitions[0] is always a cut, since nothing comes before the first segment)
 */
export const timeline = (spec: ReelSpec) => {
  const fps = fpsOf(spec)
  const full = spec.variant !== "loop"
  const toFrames = (s: number) => Math.max(1, Math.round(s * fps))

  const segments: number[] = []
  const kinds: TransitionKind[] = []
  const fallback = spec.transition ?? "fade"
  if (full) {
    segments.push(toFrames(spec.introSeconds ?? 3))
    kinds.push("cut")
  }
  for (const clip of spec.clips) {
    segments.push(toFrames(clipSeconds(clip)))
    kinds.push(clip.transition ?? fallback)
  }
  if (full && spec.outro) {
    segments.push(toFrames(spec.outro.seconds ?? 3.5))
    kinds.push(spec.outro.transition ?? fallback)
  }
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
