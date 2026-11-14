import { Composition } from "remotion"
import example from "../reels/example.json"
import { Showreel } from "./Showreel"
import { timeline, type ReelSpec } from "./spec"

// Render any reel with: npm run render -- <name>   (reads reels/<name>.json)
export const Root = () => (
  <Composition
    id="Showreel"
    component={Showreel}
    defaultProps={example as ReelSpec}
    calculateMetadata={({ props }) => {
      const { total, fps } = timeline(props)
      return { durationInFrames: total, fps, width: props.width ?? 1920, height: props.height ?? 1080 }
    }}
  />
)
