// @ts-ignore
import audioLinesScript from "./scripts/audioLines.inline"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const AudioPlayer: QuartzComponent = ({ children }: QuartzComponentProps) => {
  return <>{children}</>
}

AudioPlayer.afterDOMLoaded = audioLinesScript

export default (() => AudioPlayer) satisfies QuartzComponentConstructor
