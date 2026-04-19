import type { ReelSettings } from '@/lib/reel/reel-settings'
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
  wrapText,
  type ReelStyle,
  formatDateDisplay,
} from '@/lib/reel/canvas-utils'

export interface FestivalCardFields {
  title: string
  subtitle: string
  countdownLabel: string
  line1: string
  line2: string
}

export function drawFestivalManualCard(
  ctx: CanvasRenderingContext2D,
  fields: FestivalCardFields,
  dateInfo: ReturnType<typeof formatDateDisplay>,
  style: ReelStyle,
  settings: ReelSettings,
  seedKey: string,
  vedaIcon?: HTMLImageElement | null,
) {
  const colors = getBgColors(style)
  drawGeometricBg(ctx, colors, style)
  drawStars(ctx, style, seedKey)
  drawReelSocialBackdrop(ctx, colors)
  ctx.textAlign = 'center'

  drawLogo(ctx, colors, 100, settings.brandTitle, vedaIcon)

  if (fields.countdownLabel.trim()) {
    ctx.save()
    ctx.fillStyle = `${colors.accent}18`
    roundRect(ctx, 120, 148, 840, 48, 24)
    ctx.strokeStyle = `${colors.accent}40`
    ctx.lineWidth = 1
    roundRect(ctx, 120, 148, 840, 48, 24)
    ctx.stroke()
    ctx.restore()
    ctx.font = 'bold 22px sans-serif'
    ctx.fillStyle = colors.accent
    ctx.fillText(fields.countdownLabel.trim(), 540, 180)
  }

  ctx.font = 'bold 64px serif'
  ctx.fillStyle = colors.accent
  const title = fields.title.trim() || 'Festival'
  ctx.fillText(title.length > 18 ? `${title.slice(0, 16)}…` : title, 540, 280)

  ctx.textAlign = 'center'
  ctx.font = '26px sans-serif'
  ctx.fillStyle = colors.sub
  wrapText(ctx, fields.subtitle.trim() || dateInfo.weekday, 540, 320, 920, 34)

  drawDivider(ctx, colors, 400, 920)

  ctx.save()
  ctx.fillStyle = `${colors.accent}0d`
  roundRect(ctx, 80, 430, 920, 420, 20)
  ctx.strokeStyle = `${colors.accent}30`
  ctx.lineWidth = 1.5
  roundRect(ctx, 80, 430, 920, 420, 20)
  ctx.stroke()
  ctx.restore()

  ctx.font = '28px sans-serif'
  ctx.fillStyle = colors.text
  let y = wrapText(ctx, fields.line1.trim() || 'Add timings and notes in the panel.', 540, 480, 880, 40)
  y = Math.max(y, 520)
  wrapText(ctx, fields.line2.trim(), 540, y + 20, 880, 40)

  ctx.font = '22px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText(`${dateInfo.day} ${dateInfo.month} ${dateInfo.year}`, 540, 900)

  drawDivider(ctx, colors, 960, 920)

  ctx.font = 'bold 32px sans-serif'
  ctx.fillStyle = colors.accent
  ctx.fillText('Muhurta / observance', 540, 1020)
  ctx.font = '22px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText('Edit all lines before export — no automation.', 540, 1060)

  drawDivider(ctx, colors, 1680, 920)
  drawBrandFooter(ctx, colors, settings, 1730)
  ctx.font = '22px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText(settings.ctaLine, 540, 1775)
  drawHashtagFooter(ctx, colors, settings, 1820)
}
