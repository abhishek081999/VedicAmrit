/**
 * Transcode WebM (from MediaRecorder) to H.264 MP4 for Instagram / Reels uploads.
 * Uses ffmpeg.wasm in the browser; first run downloads ffmpeg-core (~tens of MB).
 */

import type { FFmpeg } from '@ffmpeg/ffmpeg'

let ffmpegPromise: Promise<FFmpeg> | null = null

async function getFfmpeg(): Promise<FFmpeg> {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const ffmpeg = new FFmpeg()
      await ffmpeg.load()
      return ffmpeg
    })()
  }
  return ffmpegPromise
}

export type WebmToMp4Options = {
  /** 0–1 while ffmpeg runs (best-effort). */
  onProgress?: (ratio: number) => void
}

const IN = 'reel-in.webm'
const OUT = 'reel-out.mp4'

/**
 * Instagram-friendly: H.264, yuv420p, faststart, no audio track.
 */
export async function webmToMp4ForInstagram(webm: Blob, options?: WebmToMp4Options): Promise<Blob> {
  const { fetchFile } = await import('@ffmpeg/util')
  const ffmpeg = await getFfmpeg()
  const onProgress = options?.onProgress
  const handler = onProgress
    ? ({ progress }: { progress: number }) => {
        onProgress(Math.min(1, Math.max(0, progress)))
      }
    : null
  if (handler) ffmpeg.on('progress', handler)
  try {
    return await runTranscode(ffmpeg, fetchFile, webm, onProgress)
  } finally {
    if (handler) ffmpeg.off('progress', handler)
  }
}

async function runTranscode(
  ffmpeg: FFmpeg,
  fetchFile: (f: Blob) => Promise<Uint8Array>,
  webm: Blob,
  onProgress?: (ratio: number) => void,
): Promise<Blob> {
  await ffmpeg.writeFile(IN, await fetchFile(webm))
  onProgress?.(0.05)

  const h264Args = [
    '-i',
    IN,
    '-c:v',
    'libx264',
    '-preset',
    'ultrafast',
    '-crf',
    '24',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    '-an',
    OUT,
  ]

  let code = await ffmpeg.exec(h264Args)
  if (code !== 0) {
    code = await ffmpeg.exec([
      '-i',
      IN,
      '-c:v',
      'mpeg4',
      '-q:v',
      '3',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-an',
      OUT,
    ])
  }

  if (code !== 0) {
    throw new Error('Video conversion failed (FFmpeg). Try Download WebM or use Remotion MP4.')
  }

  const data = await ffmpeg.readFile(OUT)
  const bytes: Uint8Array =
    typeof data === 'string' ? new TextEncoder().encode(data) : data

  try {
    await ffmpeg.deleteFile(IN)
  } catch {
    /* ignore */
  }
  try {
    await ffmpeg.deleteFile(OUT)
  } catch {
    /* ignore */
  }

  onProgress?.(1)
  return new Blob([bytes.slice()], { type: 'video/mp4' })
}
