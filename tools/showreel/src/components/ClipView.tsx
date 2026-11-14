import { AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion"
import { isImage, type Clip } from "../spec"
import { BG } from "../theme"
import { Caption } from "./Caption"

const Still = ({ src }: { src: string }) => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  // Slow push-in so screenshots don't sit dead on screen
  const scale = interpolate(frame, [0, durationInFrames], [1, 1.06])

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <Img
        src={src}
        style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px) brightness(0.4)", transform: "scale(1.2)" }}
      />
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        <Img src={src} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

export const ClipView = ({ clip, accent, hasMusic }: { clip: Clip; accent: string; hasMusic: boolean }) => {
  const { fps } = useVideoConfig()
  const src = staticFile(clip.src)
  const volume = clip.volume ?? (hasMusic ? 0 : 1)

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      {isImage(clip.src) ? (
        <Still src={src} />
      ) : (
        <OffthreadVideo
          src={src}
          trimBefore={Math.round((clip.from ?? 0) * fps)}
          playbackRate={clip.speed ?? 1}
          volume={volume}
          muted={volume === 0}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
      {clip.caption && <Caption text={clip.caption} accent={accent} />}
    </AbsoluteFill>
  )
}
