/**
 * CLI: `npm run reel:mp4` — `--images-dir`, `--output`, `--title`, `--seconds-per-image`, `--object-fit`,
 * `--durations`, `--preset` (vedaDefault | minimal | bold | chart | cinematic).
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderReel } from './render-core'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const parseArgValue = (key: string): string | undefined => {
  const index = process.argv.findIndex((arg) => arg === key)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

const main = async () => {
  const imagesDirArg = parseArgValue('--images-dir')
  const title = parseArgValue('--title')
  const secondsPerImageArg = parseArgValue('--seconds-per-image')
  const outputArg = parseArgValue('--output')
  const objectFitArg = parseArgValue('--object-fit') as 'cover' | 'contain' | undefined
  const durationsArg = parseArgValue('--durations')
  const presetArg = parseArgValue('--preset') as
    | 'vedaDefault'
    | 'minimal'
    | 'bold'
    | 'chart'
    | 'cinematic'
    | undefined

  const imagesDir = path.resolve(projectRoot, imagesDirArg ?? 'public/reel-remotion-assets')
  const outputPath = path.resolve(projectRoot, outputArg ?? 'out/reel.mp4')
  const secondsPerImage = secondsPerImageArg ? Number(secondsPerImageArg) : 2.5
  const objectFit = objectFitArg === 'cover' || objectFitArg === 'contain' ? objectFitArg : 'contain'
  const preset =
    presetArg === 'vedaDefault' ||
    presetArg === 'minimal' ||
    presetArg === 'bold' ||
    presetArg === 'chart' ||
    presetArg === 'cinematic'
      ? presetArg
      : undefined

  let imageDurations: number[] | undefined
  if (durationsArg) {
    imageDurations = durationsArg
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0)
    if (imageDurations.length === 0) imageDurations = undefined
  }

  await renderReel({
    imagesDir,
    outputPath,
    title,
    secondsPerImage,
    imageDurations,
    projectRoot,
    objectFit,
    preset,
  })

  console.log(`Rendered reel: ${outputPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
