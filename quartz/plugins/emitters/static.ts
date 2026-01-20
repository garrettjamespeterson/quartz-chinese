import { FilePath, QUARTZ, joinSegments } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import fs from "fs"
import { glob } from "../../util/glob"
import { dirname } from "path"

export const Static: QuartzEmitterPlugin = () => ({
  name: "Static",
  async *emit({ argv, cfg }) {
    const outputStaticPath = joinSegments(argv.output, "static")
    await fs.promises.mkdir(outputStaticPath, { recursive: true })

    // Copy from quartz/static
    const quartzStaticPath = joinSegments(QUARTZ, "static")
    const quartzFps = await glob("**", quartzStaticPath, cfg.configuration.ignorePatterns)
    for (const fp of quartzFps) {
      const src = joinSegments(quartzStaticPath, fp) as FilePath
      const dest = joinSegments(outputStaticPath, fp) as FilePath
      await fs.promises.mkdir(dirname(dest), { recursive: true })
      await fs.promises.copyFile(src, dest)
      yield dest
    }

    // Copy from root static folder
    const rootStaticPath = "static"
    if (fs.existsSync(rootStaticPath)) {
      const rootFps = await glob("**", rootStaticPath, cfg.configuration.ignorePatterns)
      for (const fp of rootFps) {
        const src = joinSegments(rootStaticPath, fp) as FilePath
        const dest = joinSegments(outputStaticPath, fp) as FilePath
        await fs.promises.mkdir(dirname(dest), { recursive: true })
        await fs.promises.copyFile(src, dest)
        yield dest
      }
    }
  },
  async *partialEmit() {},
})
