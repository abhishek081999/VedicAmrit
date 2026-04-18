import type { ReelSettings } from '@/lib/reel/reel-settings'
import { HASHTAG_PRESETS } from '@/lib/reel/reel-settings'

export type ReelStyle = 'cosmic' | 'traditional' | 'modern'

export interface BgColors {
  bg1: string
  bg2: string
  bg3: string
  accent: string
  text: string
  sub: string
  divider: string
}

export function getBgColors(style: ReelStyle): BgColors {
  if (style === 'cosmic') {
    return {
      bg1: '#0A0015', bg2: '#12002A', bg3: '#1A0035', accent: '#C084FC',
      text: '#F5F0FF', sub: '#A78BFA', divider: 'rgba(192,132,252,0.3)',
    }
  }
  if (style === 'traditional') {
    return {
      bg1: '#1C0A00', bg2: '#2D1200', bg3: '#3D1800', accent: '#F59E0B',
      text: '#FEF3C7', sub: '#FBB040', divider: 'rgba(245,158,11,0.35)',
    }
  }
  return {
    bg1: '#030712', bg2: '#0F172A', bg3: '#1E293B', accent: '#38BDF8',
    text: '#F1F5F9', sub: '#94A3B8', divider: 'rgba(56,189,248,0.25)',
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
  const { bg1, bg2, bg3, accent } = colors
  const grad = ctx.createLinearGradient(0, 0, 0, 1920)
  grad.addColorStop(0, bg1)
  grad.addColorStop(0.4, bg2)
  grad.addColorStop(1, bg3)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1080, 1920)

  if (style === 'cosmic') {
    const orb = ctx.createRadialGradient(540, 280, 0, 540, 280, 420)
    orb.addColorStop(0, 'rgba(192,132,252,0.18)')
    orb.addColorStop(0.5, 'rgba(139,92,246,0.08)')
    orb.addColorStop(1, 'transparent')
    ctx.fillStyle = orb
    ctx.fillRect(0, 0, 1080, 700)
    const orb2 = ctx.createRadialGradient(540, 1700, 0, 540, 1700, 500)
    orb2.addColorStop(0, 'rgba(192,132,252,0.12)')
    orb2.addColorStop(1, 'transparent')
    ctx.fillStyle = orb2
    ctx.fillRect(0, 1200, 1080, 720)
    ctx.save()
    ctx.strokeStyle = 'rgba(192,132,252,0.12)'
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.arc(540, 500, 360, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(540, 500, 290, 0, Math.PI * 2); ctx.stroke()
    ctx.restore()
  } else if (style === 'traditional') {
    ctx.save()
    for (let r = 200; r <= 500; r += 80) {
      ctx.beginPath()
      ctx.arc(540, 480, r, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(245,158,11,${0.06 + (500 - r) * 0.0003})`
      ctx.lineWidth = 1
      ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(245,158,11,0.06)'
    ctx.lineWidth = 1
    for (let i = -200; i < 1200; i += 60) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 400, 700); ctx.stroke()
    }
    ctx.restore()
  } else {
    ctx.save()
    ctx.strokeStyle = 'rgba(56,189,248,0.05)'
    ctx.lineWidth = 1
    for (let x = 0; x <= 1080; x += 90) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1920); ctx.stroke()
    }
    for (let y = 0; y <= 1920; y += 90) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1080, y); ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(56,189,248,0.1)'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(540, 480, 380, 0, Math.PI * 2); ctx.stroke()
    ctx.restore()
  }

  const topBar = ctx.createLinearGradient(0, 0, 1080, 0)
  topBar.addColorStop(0, `${accent}30`)
  topBar.addColorStop(0.5, `${accent}18`)
  topBar.addColorStop(1, `${accent}30`)
  ctx.fillStyle = topBar
  ctx.fillRect(0, 0, 1080, 6)
  ctx.fillRect(0, 1914, 1080, 6)
}

export function drawLogo(
  ctx: CanvasRenderingContext2D,
  colors: BgColors,
  y: number,
  brandTitle: string,
  vedaIcon?: HTMLImageElement | null,
) {
  ctx.save()
  if (vedaIcon) {
    const size = 56
    const x = 540 - size / 2
    const iy = y - 54
    ctx.save()
    ctx.globalAlpha = 0.95
    roundRect(ctx, x - 8, iy - 8, size + 16, size + 16, 14)
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fill()
    ctx.drawImage(vedaIcon, x, iy, size, size)
    ctx.restore()
  }
  ctx.font = 'bold 36px serif'
  ctx.fillStyle = colors.accent
  ctx.textAlign = 'center'
  ctx.fillText('॥ वेदाँश ॥', 540, y)
  ctx.font = '22px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText(brandTitle, 540, y + 36)
  ctx.restore()
}

export function drawDivider(ctx: CanvasRenderingContext2D, colors: BgColors, y: number, width = 800) {
  ctx.save()
  ctx.strokeStyle = colors.divider
  ctx.lineWidth = 1
  const x0 = (1080 - width) / 2
  ctx.beginPath()
  ctx.moveTo(x0, y); ctx.lineTo(x0 + width, y)
  ctx.stroke()
  ctx.fillStyle = colors.accent
  ctx.save()
  ctx.translate(540, y)
  ctx.rotate(Math.PI / 4)
  ctx.fillRect(-5, -5, 10, 10)
  ctx.restore()
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
