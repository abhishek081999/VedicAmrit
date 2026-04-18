import type { TransitEvent } from '@/lib/engine/transits'
import type { ReelSettings } from '@/lib/reel/reel-settings'
import { RASHI_FORECAST_HOOK } from '@/lib/reel/rashi-forecast-hooks'
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
  wrapText,
  type ReelStyle,
} from '@/lib/reel/canvas-utils'
import type { Rashi } from '@/types/astrology'

export function drawRashiForecastCard(
  ctx: CanvasRenderingContext2D,
  forecastRashi: Rashi,
  rashiName: string,
  events: TransitEvent[],
  weekRangeLabel: string,
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
  ctx.font = 'bold 54px serif'
  ctx.fillStyle = colors.accent
  ctx.fillText('Rāśi Outlook', 540, 200)
  ctx.font = 'bold 36px sans-serif'
  ctx.fillStyle = colors.text
  ctx.fillText(rashiName, 540, 258)
  ctx.font = '22px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText(weekRangeLabel, 540, 294)
  drawDivider(ctx, colors, 318, 920)

  const hook = RASHI_FORECAST_HOOK[forecastRashi]
  ctx.textAlign = 'center'
  ctx.font = '24px sans-serif'
  ctx.fillStyle = colors.text
  wrapText(ctx, hook, 540, 360, 900, 36)

  drawDivider(ctx, colors, 460, 920)

  ctx.font = 'bold 28px sans-serif'
  ctx.fillStyle = colors.accent
  ctx.fillText('Transit highlights (slow grahas)', 540, 510)

  const list = events.slice(0, 5)
  let y = 540
  if (list.length === 0) {
    ctx.font = '22px sans-serif'
    ctx.fillStyle = colors.sub
    ctx.fillText('No events in this window for the selected range.', 540, y + 40)
    y += 80
  } else {
    list.forEach((ev) => {
      ctx.save()
      ctx.fillStyle = `${colors.accent}0c`
      roundRect(ctx, 70, y, 940, 100, 14)
      ctx.strokeStyle = `${colors.accent}25`
      ctx.lineWidth = 1
      roundRect(ctx, 70, y, 940, 100, 14)
      ctx.stroke()
      ctx.restore()
      ctx.textAlign = 'left'
      ctx.font = 'bold 20px sans-serif'
      ctx.fillStyle = colors.accent
      ctx.fillText(`${ev.date} · ${ev.planetId}`, 100, y + 30)
      ctx.font = '19px sans-serif'
      ctx.fillStyle = colors.text
      wrapText(ctx, truncate(ev.description, 200), 100, y + 56, 880, 28)
      y += 118
    })
  }

  drawDivider(ctx, colors, 1680, 920)
  drawBrandFooter(ctx, colors, settings, 1730)
  ctx.font = '22px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.textAlign = 'center'
  ctx.fillText(settings.ctaLine, 540, 1775)
  drawHashtagFooter(ctx, colors, settings, 1820)
}
