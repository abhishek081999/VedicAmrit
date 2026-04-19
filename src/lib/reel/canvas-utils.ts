import type { ReelSettings } from '@/lib/reel/reel-settings'
import { HASHTAG_PRESETS } from '@/lib/reel/reel-settings'

export type ReelStyle = 'cosmic' | 'traditional' | 'modern'

export interface BgColors {
  bg1: string
  bg2: string
  bg3: string
  accent: string
  /** Brand purple — aligns with app chrome */
  brand: string
  /** Teal accent — pairs with brand in UI */
  teal: string
  text: string
  sub: string
  divider: string
}

export function getBgColors(style: ReelStyle): BgColors {
  if (style === 'cosmic') {
    return {
      bg1: '#07051A',
      bg2: '#10082E',
      bg3: '#1A0F3D',
      accent: '#B794F6',
      brand: '#6C5CE7',
      teal: '#00B894',
      text: '#FAF8FF',
      sub: '#B8A5E8',
      divider: 'rgba(108,92,231,0.38)',
    }
  }
  if (style === 'traditional') {
    return {
      bg1: '#140804',
      bg2: '#241005',
      bg3: '#361A08',
      accent: '#E8B84A',
      brand: '#C4A052',
      teal: '#2D9B7A',
      text: '#FFF8ED',
      sub: '#E7C48A',
      divider: 'rgba(232,184,74,0.42)',
    }
  }
  return {
    bg1: '#020617',
    bg2: '#0B1224',
    bg3: '#151D32',
    accent: '#5ECFFF',
    brand: '#6C5CE7',
    teal: '#00B894',
    text: '#F8FAFC',
    sub: '#94A3B8',
    divider: 'rgba(94,207,255,0.28)',
  }
}

export const CHOGHADIYA_COLORS: Record<string, string> = {
  Amrit: '#00B894', Shubh: '#0984E3', Labh: '#6C5CE7',
  Char: '#FDCB6E', Udveg: '#E17055', Rog: '#D63031',
  Kaal: '#2D3436', Chal: '#74B9FF',
}

export const CHOGHADIYA_MEANING: Record<string, string> = {
  Amrit: 'Nectar — best for all work', Shubh: 'Auspicious — good beginnings',
  Labh: 'Profit — business & trade', Char: 'Movement — travel, change',
  Udveg: 'Anxiety — avoid new work', Rog: 'Illness — avoid health work',
  Kaal: 'Death — strictly avoid', Chal: 'Unstable — caution needed',
}

export function fmtTime(isoOrTime: string | undefined | null): string {
  if (!isoOrTime) return '—'
  try {
    const d = new Date(isoOrTime)
    if (isNaN(d.getTime())) return isoOrTime
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
    })
  } catch {
    return isoOrTime
  }
}

export function formatDateDisplay(dateStr: string): { weekday: string; day: string; month: string; year: string } {
  const d = new Date(`${dateStr}T12:00:00Z`)
  return {
    weekday: d.toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'UTC' }),
    day: String(d.getUTCDate()),
    month: d.toLocaleDateString('en-IN', { month: 'long', timeZone: 'UTC' }),
    year: String(d.getUTCFullYear()),
  }
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(' ')
  let line = ''
  let currentY = y
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY)
      line = word
      currentY += lineHeight
    } else {
      line = test
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY)
    currentY += lineHeight
  }
  return currentY
}

export function drawStars(ctx: CanvasRenderingContext2D, style: ReelStyle, seedStr: string) {
  if (style === 'modern') return
  let seed = 0
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 0xffffffff
  }
  ctx.save()
  const stars = style === 'cosmic' ? 180 : 80
  for (let i = 0; i < stars; i++) {
    const x = rnd() * 1080
    const y = rnd() * 700
    const r = rnd() * 1.8 + 0.3
    const alpha = rnd() * 0.7 + 0.1
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${alpha})`
    ctx.fill()
  }
  ctx.restore()
}

export function drawGeometricBg(ctx: CanvasRenderingContext2D, colors: BgColors, style: ReelStyle) {
  const { bg1, bg2, bg3, accent, brand, teal } = colors
  const grad = ctx.createLinearGradient(0, 0, 1080, 1920)
  grad.addColorStop(0, bg1)
  grad.addColorStop(0.42, bg2)
  grad.addColorStop(1, bg3)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1080, 1920)

  const vignette = ctx.createRadialGradient(540, 960, 280, 540, 960, 980)
  vignette.addColorStop(0, 'transparent')
  vignette.addColorStop(0.55, 'rgba(0,0,0,0.12)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.38)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, 1080, 1920)

  if (style === 'cosmic') {
    const orb = ctx.createRadialGradient(540, 320, 0, 540, 320, 520)
    orb.addColorStop(0, `${brand}33`)
    orb.addColorStop(0.45, `${teal}14`)
    orb.addColorStop(1, 'transparent')
    ctx.fillStyle = orb
    ctx.fillRect(0, 0, 1080, 820)
    const orb2 = ctx.createRadialGradient(540, 1680, 0, 540, 1680, 520)
    orb2.addColorStop(0, `${brand}22`)
    orb2.addColorStop(1, 'transparent')
    ctx.fillStyle = orb2
    ctx.fillRect(0, 1180, 1080, 740)
    ctx.save()
    ctx.strokeStyle = `${brand}22`
    ctx.lineWidth = 1.25
    ctx.beginPath()
    ctx.arc(540, 520, 380, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(540, 520, 300, 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = `${teal}18`
    ctx.beginPath()
    ctx.moveTo(0, 140)
    ctx.bezierCurveTo(360, 80, 720, 200, 1080, 120)
    ctx.stroke()
    ctx.restore()
  } else if (style === 'traditional') {
    ctx.save()
    for (let r = 200; r <= 520; r += 88) {
      ctx.beginPath()
      ctx.arc(540, 500, r, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(232,184,74,${0.05 + (520 - r) * 0.00015})`
      ctx.lineWidth = 1
      ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(196,160,82,0.07)'
    ctx.lineWidth = 1
    for (let i = -200; i < 1200; i += 64) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + 400, 720)
      ctx.stroke()
    }
    ctx.restore()
  } else {
    ctx.save()
    ctx.strokeStyle = `${accent}08`
    ctx.lineWidth = 1
    for (let x = 0; x <= 1080; x += 72) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, 1920)
      ctx.stroke()
    }
    for (let y = 0; y <= 1920; y += 72) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(1080, y)
      ctx.stroke()
    }
    ctx.strokeStyle = `${accent}14`
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(540, 500, 400, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  const topBar = ctx.createLinearGradient(0, 0, 1080, 0)
  topBar.addColorStop(0, `${brand}55`)
  topBar.addColorStop(0.5, `${teal}33`)
  topBar.addColorStop(1, `${brand}55`)
  ctx.fillStyle = topBar
  ctx.fillRect(0, 0, 1080, 5)
  ctx.fillRect(0, 1915, 1080, 5)
}

/** Instagram / Stories-style centered card — main copy sits in this column (≈900px wide, centered). */
export const REEL_CONTENT = {
  /** Horizontal center */
  cx: 540,
  /** Standard text / tile width used across templates */
  colWidth: 900,
  /** Left edge when using full-width rows */
  left: 90,
  /** Right edge */
  right: 990,
} as const

/**
 * Vertical band on 1080×1920 where slide “body” should be centered (below hero titles, above footers).
 */
export const REEL_BODY_LAYOUT = {
  regionTop: 248,
  regionBottom: 1690,
} as const

/**
 * Shift body content down so it sits in the middle of the frame (balances empty space top & bottom).
 * @param contentNaturalTop — first body line Y before translate (e.g. weekday baseline)
 * @param contentHeight — total height of the body block in px
 */
export function getReelBodyVerticalOffset(
  contentNaturalTop: number,
  contentHeight: number,
  regionTop = REEL_BODY_LAYOUT.regionTop,
  regionBottom = REEL_BODY_LAYOUT.regionBottom,
): number {
  const avail = regionBottom - regionTop
  if (contentHeight >= avail) return 0
  const idealTop = regionTop + (avail - contentHeight) / 2
  return Math.round(idealTop - contentNaturalTop)
}

/**
 * Frosted panel behind slide content so type reads clearly on feeds (centered, equal side margins).
 * Draw after {@link drawGeometricBg} + {@link drawStars}, before logo/titles/body.
 */
export function drawReelSocialBackdrop(ctx: CanvasRenderingContext2D, colors: BgColors) {
  const x = 42
  const y = 176
  const w = 996
  const h = 1588
  const r = 40
  ctx.save()
  const base = ctx.createLinearGradient(x, y, x + w, y + h)
  base.addColorStop(0, 'rgba(255,255,255,0.11)')
  base.addColorStop(0.45, 'rgba(255,255,255,0.04)')
  base.addColorStop(1, 'rgba(255,255,255,0.07)')
  roundRect(ctx, x, y, w, h, r)
  ctx.fillStyle = base
  ctx.fill()
  ctx.strokeStyle = `${colors.brand}40`
  ctx.lineWidth = 1.5
  roundRect(ctx, x, y, w, h, r)
  ctx.stroke()
  ctx.strokeStyle = `${colors.teal}22`
  ctx.lineWidth = 1
  roundRect(ctx, x + 1, y + 1, w - 2, h - 2, r - 1)
  ctx.stroke()
  ctx.restore()
}

/** Background layers shared by all reel slides (gradient, stars, frosted panel). */
export function drawReelSlideUnderlay(
  ctx: CanvasRenderingContext2D,
  colors: BgColors,
  style: ReelStyle,
  seedKey: string,
) {
  drawGeometricBg(ctx, colors, style)
  drawStars(ctx, style, seedKey)
  drawReelSocialBackdrop(ctx, colors)
}

export function drawLogo(
  ctx: CanvasRenderingContext2D,
  colors: BgColors,
  y: number,
  brandTitle: string,
  vedaIcon?: HTMLImageElement | null,
) {
  ctx.save()
  const cx = 540
  const iconCenterY = y - 46
  const size = 64
  const x = cx - size / 2
  const iy = iconCenterY - size / 2

  ctx.save()
  const ringGrad = ctx.createLinearGradient(x - 4, iy - 4, x + size + 4, iy + size + 4)
  ringGrad.addColorStop(0, colors.brand)
  ringGrad.addColorStop(0.5, colors.teal)
  ringGrad.addColorStop(1, colors.brand)
  ctx.strokeStyle = ringGrad
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.arc(cx, iconCenterY, size / 2 + 10, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, iconCenterY, size / 2 + 4, 0, Math.PI * 2)
  ctx.strokeStyle = `${colors.brand}44`
  ctx.lineWidth = 1
  ctx.stroke()

  const glow = ctx.createRadialGradient(cx, iconCenterY, 8, cx, iconCenterY, size)
  glow.addColorStop(0, `${colors.brand}40`)
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(cx, iconCenterY, size * 0.85, 0, Math.PI * 2)
  ctx.fill()

  roundRect(ctx, x - 6, iy - 6, size + 12, size + 12, 18)
  ctx.fillStyle = 'rgba(8,6,20,0.55)'
  ctx.fill()
  ctx.strokeStyle = `${colors.accent}35`
  ctx.lineWidth = 1
  roundRect(ctx, x - 6, iy - 6, size + 12, size + 12, 18)
  ctx.stroke()

  if (vedaIcon) {
    ctx.globalAlpha = 1
    ctx.drawImage(vedaIcon, x, iy, size, size)
  }
  ctx.restore()

  ctx.textAlign = 'center'
  ctx.font = 'bold 38px Georgia, "Noto Serif Devanagari", serif'
  const titleGrad = ctx.createLinearGradient(420, y - 20, 660, y + 8)
  titleGrad.addColorStop(0, colors.brand)
  titleGrad.addColorStop(0.5, colors.accent)
  titleGrad.addColorStop(1, colors.teal)
  ctx.fillStyle = titleGrad
  ctx.fillText('॥ वेदांश ॥', cx, y)
  ctx.font = '600 22px system-ui, -apple-system, "Segoe UI", sans-serif'
  ctx.fillStyle = colors.text
  ctx.fillText(brandTitle, cx, y + 34)
  ctx.restore()
}

export function drawDivider(ctx: CanvasRenderingContext2D, colors: BgColors, y: number, width = 800) {
  ctx.save()
  const x0 = (1080 - width) / 2
  const x1 = x0 + width
  const g = ctx.createLinearGradient(x0, y, x1, y)
  g.addColorStop(0, 'transparent')
  g.addColorStop(0.12, colors.divider)
  g.addColorStop(0.5, `${colors.brand}88`)
  g.addColorStop(0.88, colors.divider)
  g.addColorStop(1, 'transparent')
  ctx.strokeStyle = g
  ctx.lineWidth = 1.25
  ctx.beginPath()
  ctx.moveTo(x0, y)
  ctx.lineTo(x1, y)
  ctx.stroke()
  ctx.fillStyle = colors.accent
  ctx.save()
  ctx.translate(540, y)
  ctx.rotate(Math.PI / 4)
  ctx.fillRect(-4, -4, 8, 8)
  ctx.strokeStyle = `${colors.teal}99`
  ctx.lineWidth = 1
  ctx.strokeRect(-4, -4, 8, 8)
  ctx.restore()
  ctx.restore()
}

/** Carousel slide indicator — top-right (drawn before body so body can use full height). */
export function drawCarouselSlideBadge(
  ctx: CanvasRenderingContext2D,
  colors: BgColors,
  oneBasedIndex: number,
  total: number,
) {
  ctx.save()
  const label = `${oneBasedIndex} / ${total}`
  ctx.font = '600 21px system-ui, sans-serif'
  const w = ctx.measureText(label).width + 36
  const x = 1080 - w - 28
  const y = 32
  roundRect(ctx, x, y, w, 44, 22)
  const bg = ctx.createLinearGradient(x, y, x + w, y + 44)
  bg.addColorStop(0, `${colors.brand}33`)
  bg.addColorStop(1, `${colors.teal}22`)
  ctx.fillStyle = bg
  ctx.fill()
  ctx.strokeStyle = `${colors.accent}55`
  ctx.lineWidth = 1
  roundRect(ctx, x, y, w, 44, 22)
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.fillStyle = colors.text
  ctx.fillText(label, x + w / 2, y + 29)
  ctx.restore()
}

/** Compact footer on non-final carousel slides */
export function drawCarouselCompactFooter(
  ctx: CanvasRenderingContext2D,
  colors: BgColors,
  settings: ReelSettings,
  y = 1788,
) {
  ctx.save()
  ctx.textAlign = 'center'
  ctx.font = '22px system-ui, sans-serif'
  ctx.fillStyle = `${colors.sub}EE`
  ctx.fillText(`${settings.brandTitle}  ·  ${settings.instagramHandle}`, 540, y)
  ctx.restore()
}

export function drawSafeGuides(ctx: CanvasRenderingContext2D, style: ReelStyle) {
  ctx.save()
  const colors = getBgColors(style)
  ctx.strokeStyle = `${colors.accent}70`
  ctx.setLineDash([12, 10])
  ctx.lineWidth = 2
  roundRect(ctx, 54, 140, 972, 1640, 16)
  ctx.stroke()
  ctx.fillStyle = `${colors.accent}BB`
  ctx.font = '20px sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('Safe Zone', 1010, 172)
  ctx.restore()
}

export function drawHashtagFooter(
  ctx: CanvasRenderingContext2D,
  colors: BgColors,
  settings: ReelSettings,
  y0 = 1840,
) {
  const hashtags = HASHTAG_PRESETS[settings.hashtagPreset].join(' ')
  ctx.font = '22px sans-serif'
  ctx.fillStyle = `${colors.sub}99`
  ctx.textAlign = 'center'
  ctx.fillText(hashtags.slice(0, 70), 540, y0)
  ctx.fillText(hashtags.slice(70), 540, y0 + 34)
}

export function drawBrandFooter(
  ctx: CanvasRenderingContext2D,
  colors: BgColors,
  settings: ReelSettings,
  y = 1808,
) {
  ctx.textAlign = 'center'
  ctx.font = '24px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText(`${settings.brandTitle}  ·  ${settings.instagramHandle}`, 540, y)
}

export function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return `${s.slice(0, max - 1)}…`
}
