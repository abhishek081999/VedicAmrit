/**
 * Programmatic MP4 render (same pipeline as [videditz](https://github.com/abhishek081999/videditz)):
 * bundle Remotion → data-URL images → renderMedia.
 */
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { reelPropsSchema } from '../remotion/reel-schema'
import type { ReelEffects } from '../remotion/reel-schema'
import type { ReelPresetId } from '../src/lib/reel/reel-remotion-presets'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

const extensionToMimeType: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

export type ReelRenderOptions = {
  imagesDir: string
  outputPath: string
  title?: string
  secondsPerImage?: number
  imageDurations?: number[]
  effects?: Partial<ReelEffects>
  objectFit?: 'cover' | 'contain'
  /** Named look; merged with optional `effects` overrides. */
  preset?: ReelPresetId
  projectRoot: string
}

export async function listImages(imagesDir: string): Promise<string[]> {
  const files = await fs.readdir(imagesDir)
  return files
    .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => path.join(imagesDir, file))
}

async function prepareImageDataUrls(sourceImagePaths: string[]): Promise<string[]> {
  const urls: string[] = []
  for (const sourcePath of sourceImagePaths) {
    const extension = path.extname(sourcePath).toLowerCase()
    const mimeType = extensionToMimeType[extension]
    if (!mimeType) continue

    const fileBuffer = await fs.readFile(sourcePath)
    const dataUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`
    urls.push(dataUrl)
  }

  return urls
}

export async function renderReel({
  imagesDir,
  outputPath,
  title,
  secondsPerImage = 2.5,
  imageDurations,
  effects,
  objectFit = 'contain',
  preset,
  projectRoot,
}: ReelRenderOptions): Promise<string> {
  const imagePaths = await listImages(imagesDir)
  if (imagePaths.length === 0) {
    throw new Error(
      `No images found in ${imagesDir}. Add .jpg/.jpeg/.png/.webp files and try again.`,
    )
  }

  const images = await prepareImageDataUrls(imagePaths)

  const inputProps = reelPropsSchema.parse({
    images,
    title,
    secondsPerImage,
    imageDurations,
    effects,
    objectFit,
    preset,
  })

  await fs.mkdir(path.dirname(outputPath), { recursive: true })

  const bundleLocation = await bundle({
    entryPoint: path.resolve(projectRoot, 'remotion/index.ts'),
    webpackOverride: (config) => config,
  })

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'ImageReel',
    inputProps,
  })

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps,
  })

  return outputPath
}
