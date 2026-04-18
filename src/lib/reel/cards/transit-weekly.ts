import type { TransitEvent } from '@/lib/engine/transits'
import type { ReelSettings } from '@/lib/reel/reel-settings'
import {
  drawBrandFooter,
  drawDivider,
  drawGeometricBg,
  drawHashtagFooter,
  drawLogo,
  drawStars,
  getBgColors,
  roundRect,
  truncate,
  type ReelStyle,
} from '@/lib/reel/canvas-utils'

export function drawTransitWeeklyCard(
  ctx: CanvasRenderingContext2D,
  events: TransitEvent[],
  weekRangeLabel: string,
  lagnaRashiName: string,
  style: ReelStyle,
  settings: ReelSettings,
  seedKey: string,
  vedaIcon?: HTMLImageElement | null,
) {
  const colors = getBgColors(style)
  drawGeometricBg(ctx, colors, style)
  drawStars(ctx, style, seedKey)
  ctx.textAlign = 'center'

  drawLogo(ctx, colors, 96, settings.brandTitle, vedaIcon)
  ctx.font = 'bold 52px serif'
  ctx.fillStyle = colors.accent
  ctx.fillText('Weekly Transits', 540, 200)
  ctx.font = '26px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText(`Lagna: ${lagnaRashiName}`, 540, 242)
  ctx.font = '22px sans-serif'
  ctx.fillText(weekRangeLabel, 540, 274)
  drawDivider(ctx, colors, 300, 920)

  const list = events.slice(0, 8)
  if (list.length === 0) {
    ctx.font = '26px sans-serif'
    ctx.fillStyle = colors.sub
    ctx.fillText('No major slow-mover changes in this window.', 540, 420)
    ctx.fillText('Try another week or extend range in API.', 540, 460)
  } else {
    let y = 340
    list.forEach((ev) => {
      ctx.save()
      ctx.fillStyle = `${colors.accent}10`
      roundRect(ctx, 70, y, 940, 96, 14)
      ctx.strokeStyle = `${colors.accent}28`
      ctx.lineWidth = 1
      roundRect(ctx, 70, y, 940, 96, 14)
      ctx.stroke()
      ctx.restore()
      ctx.textAlign = 'left'
      ctx.font = 'bold 20px sans-serif'
      ctx.fillStyle = colors.accent
      ctx.fillText(`${ev.date} · ${ev.planetId} · ${ev.type.replace('_', ' ')}`, 100, y + 28)
      ctx.font = '19px sans-serif'
      ctx.fillStyle = colors.text
      const desc = truncate(ev.description, 120)
      ctx.fillText(desc, 100, y + 58)
      y += 108
    })
  }

  drawDivider(ctx, colors, 1680, 920)
  drawBrandFooter(ctx, colors, settings, 1730)
  ctx.font = '22px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.textAlign = 'center'
  ctx.fillText(settings.ctaLine, 540, 1770)
  drawHashtagFooter(ctx, colors, settings, 1820)
}
