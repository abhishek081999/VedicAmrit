import type { TransitPlanetRow } from '@/types/reel-transit'
import type { ReelSettings } from '@/lib/reel/reel-settings'
import type { GrahaId } from '@/types/astrology'
import { GRAHA_SANSKRIT } from '@/types/astrology'
import {
  drawBrandFooter,
  drawDivider,
  drawGeometricBg,
  drawHashtagFooter,
  drawLogo,
  drawReelSocialBackdrop,
  drawStars,
  getBgColors,
  roundRect,
  truncate,
  type ReelStyle,
  formatDateDisplay,
} from '@/lib/reel/canvas-utils'
import { drawPlanetDisk, sortNavagrahas } from '@/lib/reel/planet-disk'

function sectionLabel(ctx: CanvasRenderingContext2D, colors: ReturnType<typeof getBgColors>, y: number, text: string) {
  ctx.save()
  ctx.textAlign = 'center'
  ctx.font = 'bold 11px sans-serif'
  ctx.fillStyle = colors.accent
  ctx.letterSpacing = '0.14em'
  ctx.fillText(text.toUpperCase(), 540, y)
  ctx.letterSpacing = 'normal'
  ctx.restore()
}

function formatAyanamshaMode(mode: string | undefined): string {
  if (!mode) return ''
  const s = mode.replace(/_/g, ' ')
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

function drawSkyOrbits(ctx: CanvasRenderingContext2D, colors: ReturnType<typeof getBgColors>) {
  ctx.save()
  ctx.strokeStyle = `${colors.accent}10`
  ctx.lineWidth = 1.25
  for (let r = 280; r <= 520; r += 80) {
    ctx.beginPath()
    ctx.arc(540, 420, r, 0.2 * Math.PI, 0.8 * Math.PI)
    ctx.stroke()
  }
  ctx.restore()
}

export function drawTransitSkyCard(
  ctx: CanvasRenderingContext2D,
  grahas: TransitPlanetRow[],
  dateStr: string,
  dateInfo: ReturnType<typeof formatDateDisplay>,
  style: ReelStyle,
  settings: ReelSettings,
  seedKey: string,
  vedaIcon?: HTMLImageElement | null,
  skyMeta?: { ayanamshaMode?: string } | null,
) {
  const colors = getBgColors(style)
  drawGeometricBg(ctx, colors, style)
  drawStars(ctx, style, seedKey)
  drawReelSocialBackdrop(ctx, colors)
  drawSkyOrbits(ctx, colors)
  ctx.textAlign = 'center'

  drawLogo(ctx, colors, 88, settings.brandTitle, vedaIcon)

  ctx.font = 'bold 52px serif'
  ctx.fillStyle = colors.accent
  ctx.fillText('Sky Today', 540, 188)
  ctx.font = '22px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText('Navagraha snapshot · geocentric sidereal', 540, 222)
  ctx.font = '18px sans-serif'
  ctx.fillStyle = `${colors.sub}DD`
  const ay = formatAyanamshaMode(skyMeta?.ayanamshaMode)
  ctx.fillText(`${dateInfo.weekday} · ${dateStr}${ay ? ` · ${ay} ayanāṃśa` : ''}`, 540, 248)

  drawDivider(ctx, colors, 268, 920)
  sectionLabel(ctx, colors, 286, 'Nine grahas · sign · nakṣatra · dignity')
  ctx.textAlign = 'center'

  const sorted = sortNavagrahas(grahas).slice(0, 9)
  const cardW = 312
  const cardH = 158
  const gapX = 18
  const gapY = 16
  const originX = (1080 - (3 * cardW + 2 * gapX)) / 2
  const originY = 312
  const diskR = 44

  sorted.forEach((g, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = originX + col * (cardW + gapX)
    const y = originY + row * (cardH + gapY)

    ctx.save()
    const grad = ctx.createLinearGradient(x, y, x + cardW, y + cardH)
    grad.addColorStop(0, `${colors.accent}14`)
    grad.addColorStop(0.45, 'rgba(0,0,0,0.22)')
    grad.addColorStop(1, `${colors.accent}08`)
    ctx.fillStyle = grad
    roundRect(ctx, x, y, cardW, cardH, 16)
    ctx.fill()
    ctx.strokeStyle = `${colors.accent}38`
    ctx.lineWidth = 1.25
    roundRect(ctx, x, y, cardW, cardH, 16)
    ctx.stroke()
    ctx.restore()

    const cx = x + 26 + diskR
    const cy = y + cardH / 2
    drawPlanetDisk(ctx, cx, cy, diskR, g.id as GrahaId)

    const tx = x + 26 + diskR * 2 + 20
    ctx.textAlign = 'left'
    const sa = GRAHA_SANSKRIT[g.id as GrahaId] || g.name
    ctx.font = 'bold 22px sans-serif'
    ctx.fillStyle = colors.text
    ctx.fillText(truncate(g.name, 14), tx, y + 36)
    ctx.font = '14px sans-serif'
    ctx.fillStyle = colors.accent
    ctx.fillText(sa, tx, y + 56)

    ctx.font = '17px sans-serif'
    ctx.fillStyle = colors.sub
    const retro = g.isRetro ? '  ℞' : ''
    ctx.fillText(`${g.rashiSanskrit} · ${g.rashiName}${retro}`, tx, y + 82)

    ctx.font = '14px sans-serif'
    ctx.fillStyle = `${colors.sub}DD`
    ctx.fillText(
      truncate(`${g.nakshatraName} · pada ${g.pada} · ${g.dignity}`, 34),
      tx,
      y + 106,
    )

    ctx.font = '12px sans-serif'
    ctx.fillStyle = `${colors.sub}99`
    const sp = typeof g.speed === 'number' ? g.speed : Number(g.speed)
    const degStr = Number.isFinite(g.degree) ? `${g.degree.toFixed(1)}° in sign` : ''
    ctx.fillText(
      truncate(`${degStr}  ·  ${Number.isFinite(sp) ? `${sp >= 0 ? '+' : ''}${sp.toFixed(3)}°/day` : ''}`, 40),
      tx,
      y + 132,
    )
  })

  const gridBottom = originY + Math.ceil(sorted.length / 3) * (cardH + gapY) - gapY
  drawDivider(ctx, colors, gridBottom + 28, 920)

  ctx.textAlign = 'center'
  ctx.font = '17px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText('Noon ephemeris (UTC chart time) · sidereal longitudes · Rāhu/Ketu mean nodes', 540, gridBottom + 62)
  ctx.font = '15px sans-serif'
  ctx.fillStyle = `${colors.sub}BB`
  ctx.fillText(settings.ctaLine, 540, gridBottom + 92)

  const footerY = Math.max(1668, gridBottom + 130)
  drawDivider(ctx, colors, footerY, 920)
  drawBrandFooter(ctx, colors, settings, footerY + 48)
  drawHashtagFooter(ctx, colors, settings, footerY + 98)
}
