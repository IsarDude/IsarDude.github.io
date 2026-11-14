import { linearTiming, TransitionSeries, type TransitionPresentation } from "@remotion/transitions"
import { fade } from "@remotion/transitions/fade"
import { slide } from "@remotion/transitions/slide"
import { wipe } from "@remotion/transitions/wipe"
import { Fragment, type ReactNode } from "react"
import { AbsoluteFill, Audio, interpolate, staticFile, useVideoConfig } from "remotion"
import { ClipView } from "./components/ClipView"
import { Outro } from "./components/Outro"
import { TitleCard } from "./components/TitleCard"
import { timeline, type ReelSpec, type TransitionKind } from "./spec"
import { BG, DEFAULT_ACCENT } from "./theme"

const presentations: Record<Exclude<TransitionKind, "cut">, () => TransitionPresentation<Record<string, unknown>>> = {
  fade: () => fade() as TransitionPresentation<Record<string, unknown>>,
  slide: () => slide({ direction: "from-right" }) as TransitionPresentation<Record<string, unknown>>,
  wipe: () => wipe({ direction: "from-left" }) as TransitionPresentation<Record<string, unknown>>,
}

const Music = ({ spec }: { spec: ReelSpec }) => {
  const { fps, durationInFrames } = useVideoConfig()
  const level = spec.musicVolume ?? 0.8
  return (
    <Audio
      src={staticFile(spec.music!)}
      trimBefore={Math.round((spec.musicStart ?? 0) * fps)}
      loop
      volume={(f) =>
        level *
        interpolate(f, [0, 0.5 * fps, durationInFrames - 1.5 * fps, durationInFrames], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      }
    />
  )
}

export const Showreel = (spec: ReelSpec) => {
  const accent = spec.accent ?? DEFAULT_ACCENT
  const full = spec.variant !== "loop"
  const hasMusic = Boolean(spec.music) && full
  const { segments, transitions } = timeline(spec)

  const scenes: ReactNode[] = []
  if (full) {
    scenes.push(<TitleCard title={spec.title} subtitle={spec.subtitle} role={spec.role} tech={spec.tech} accent={accent} />)
  }
  for (const clip of spec.clips) {
    scenes.push(<ClipView clip={clip} accent={accent} hasMusic={Boolean(spec.music)} />)
  }
  if (full && spec.outro) {
    scenes.push(<Outro {...spec.outro} accent={accent} />)
  }

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <TransitionSeries>
        {scenes.map((scene, i) => (
          <Fragment key={i}>
            {transitions[i].kind !== "cut" && transitions[i].frames > 0 && (
              <TransitionSeries.Transition
                presentation={presentations[transitions[i].kind as Exclude<TransitionKind, "cut">]()}
                timing={linearTiming({ durationInFrames: transitions[i].frames })}
              />
            )}
            <TransitionSeries.Sequence durationInFrames={segments[i]}>{scene}</TransitionSeries.Sequence>
          </Fragment>
        ))}
      </TransitionSeries>
      {hasMusic && <Music spec={spec} />}
    </AbsoluteFill>
  )
}
