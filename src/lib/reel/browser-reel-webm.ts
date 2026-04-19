/**
 * Encode a vertical slideshow as WebM (VP8/VP9) in the browser via Canvas + MediaRecorder.
 * Optional title + gradient overlay approximates the videditz Remotion look (MP4 has full spring/zoom).
 */
const FPS = 30

function pickWebmMime(): string {
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c
  }
  return 'video/webm'
}

export type WebmReelEffects = {
  enableZoom: boolean
  zoomStart: number
  zoomEnd: number
}

function drawGradientOverlay(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const g = ctx.createLinearGradient(0, 0, 0, height)
  g.addColorStop(0, 'rgba(0, 0, 0, 0.65)')
  g.addColorStop(0.45, 'rgba(0, 0, 0, 0)')
  g.addColorStop(1, 'rgba(0, 0, 0, 0.6)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, width, height)
}

function drawTitle(ctx: CanvasRenderingContext2D, width: number, title: string) {
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.font = '700 36px Georgia, "Times New Roman", serif'
  ctx.shadowColor = 'rgba(0,0,0,0.55)'
  ctx.shadowBlur = 16
  ctx.fillText(title.toUpperCase(), width / 2, 110)
  ctx.restore()
}

function drawSlide(
  ctx: CanvasRenderingContext2D,
  bmp: ImageBitmap,
  width: number,
  height: number,
  localFrame: number,
  framesInSlide: number,
  objectFit: 'cover' | 'contain',
  effects: WebmReelEffects,
) {
  const iw = bmp.width
  const ih = bmp.height
  const baseScale =
    objectFit === 'cover' ? Math.max(width / iw, height / ih) : Math.min(width / iw, height / ih)
  let scale = baseScale
  if (effects.enableZoom && framesInSlide > 1) {
    const denom = Math.max(framesInSlide - 1, 1)
    const t = localFrame / denom
    const z = effects.zoomStart + (effects.zoomEnd - effects.zoomStart) * t
    scale *= z
  }
  const dw = iw * scale
  const dh = ih * scale
  const dx = (width - dw) / 2
  const dy = (height - dh) / 2
  ctx.fillStyle = '#0b1022'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(bmp, dx, dy, dw, dh)
}

export type EncodeReelWebmOptions = {
  width: number
  height: number
  /** Fallback when {@link imageDurationsSeconds} is missing or short. */
  secondsPerImage: number
  /**
   * Seconds on screen for each image (same order as `imageFiles`).
   * If length matches `imageFiles.length`, used in full; otherwise missing entries fall back to `secondsPerImage`.
   */
  imageDurationsSeconds?: number[]
  /** Optional top title (uppercase drawn like Remotion overlay). */
  title?: string
  objectFit?: 'cover' | 'contain'
  /** Simple linear zoom; Remotion MP4 uses spring fade + same zoom curve. */
  effects?: Partial<WebmReelEffects>
  /** 0–1 while frames are rendered to WebM (wall-clock encode). */
  onEncodeProgress?: (ratio: number) => void
}

function resolveDurationsSec(
  count: number,
  fallbackSec: number,
  custom?: number[],
): number[] {
  return Array.from({ length: count }, (_, i) => {
    const v = custom?.[i]
    if (v != null && Number.isFinite(v) && v > 0) return Math.min(120, Math.max(0.25, v))
    return Math.min(120, Math.max(0.25, fallbackSec))
  })
}

function frameToSlide(
  frame: number,
  framesPerSlide: number[],
): { slide: number; local: number; framesThisSlide: number } {
  let acc = 0
  for (let i = 0; i < framesPerSlide.length; i++) {
    const f = framesPerSlide[i]
    if (frame < acc + f) {
      return { slide: i, local: frame - acc, framesThisSlide: f }
    }
    acc += f
  }
  const last = framesPerSlide.length - 1
  return { slide: last, local: 0, framesThisSlide: framesPerSlide[last] ?? 1 }
}

const defaultFx: WebmReelEffects = {
  enableZoom: true,
  zoomStart: 1.06,
  zoomEnd: 1,
}

export async function encodeReelWebm(imageFiles: File[], options: EncodeReelWebmOptions): Promise<Blob> {
  const {
    width,
    height,
    secondsPerImage,
    imageDurationsSeconds,
    title,
    objectFit = 'contain',
    effects: fxIn,
    onEncodeProgress,
  } = options
  if (imageFiles.length === 0) {
    throw new Error('No images to encode')
  }

  const effects: WebmReelEffects = { ...defaultFx, ...fxIn }

  const images = await Promise.all(imageFiles.map((f) => createImageBitmap(f)))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D not available')

  const secPerSlide = resolveDurationsSec(images.length, secondsPerImage, imageDurationsSeconds)
  const framesPerSlide = secPerSlide.map((s) => Math.max(1, Math.round(FPS * s)))
  const totalFrames = framesPerSlide.reduce((a, b) => a + b, 0)

  const mimeType = pickWebmMime()
  const stream = canvas.captureStream(FPS)

  return new Promise((resolve, reject) => {
    const chunks: Blob[] = []
    const rec = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8_000_000,
    })
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    rec.onerror = () => reject(new Error('MediaRecorder failed'))
    rec.onstop = () => {
      images.forEach((im) => im.close())
      resolve(new Blob(chunks, { type: mimeType.startsWith('video/webm') ? 'video/webm' : mimeType }))
    }

    let frame = 0
    rec.start()

    const tick = () => {
      if (frame >= totalFrames) {
        onEncodeProgress?.(1)
        rec.stop()
        return
      }
      const { slide, local, framesThisSlide } = frameToSlide(frame, framesPerSlide)
      drawSlide(ctx, images[slide], width, height, local, framesThisSlide, objectFit, effects)
      drawGradientOverlay(ctx, width, height)
      if (title) drawTitle(ctx, width, title)
      onEncodeProgress?.(totalFrames > 0 ? (frame + 1) / totalFrames : 1)
      frame += 1
      setTimeout(tick, 1000 / FPS)
    }
    tick()
  })
}
