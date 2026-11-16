import { AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion"
import { isImage, type Clip } from "../spec"
import { BG } from "../theme"
import { Caption } from "./Caption"
import { MessageLog } from "./MessageLog"
import { PaneLabels } from "./PaneLabels"
import { SpringGraph } from "./SpringGraph"

const Still = ({ src, captioned }: { src: string; captioned: boolean }) => {
  const frame = useCurrentFrame()
  const { durationInFrames, width, height } = useVideoConfig()
  // Slow push-in so screenshots don't sit dead on screen
  const scale = interpolate(frame, [0, durationInFrames], [1, 1.06])
  // With a caption, keep the image above the lower third so text like code stays readable
  const u = width / 1920
  const box = captioned ? { top: 40 * u, height: height - 220 * u } : { top: 0, height }

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <Img
        src={src}
        style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px) brightness(0.4)", transform: "scale(1.2)" }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, ...box, transform: `scale(${scale})`, transformOrigin: "50% 0%" }}>
        <Img src={src} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
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
        <Still src={src} captioned={Boolean(clip.caption)} />
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
      {clip.springGraph && (
        <SpringGraph graph={clip.springGraph} from={clip.from ?? 0} to={clip.to ?? 0} speed={clip.speed ?? 1} accent={accent} />
      )}
      {clip.labels && clip.pane && <PaneLabels labels={clip.labels} top={clip.pane.top} accent={accent} />}
      {clip.log && <MessageLog log={clip.log} from={clip.from ?? 0} speed={clip.speed ?? 1} accent={accent} />}
      {clip.caption && <Caption text={clip.caption} accent={accent} />}
    </AbsoluteFill>
  )
}
