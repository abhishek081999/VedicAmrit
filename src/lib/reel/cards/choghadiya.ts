import type { PanchangApiData } from '@/types/reel-panchang'
import type { ReelSettings } from '@/lib/reel/reel-settings'
import {
  CHOGHADIYA_COLORS,
  CHOGHADIYA_MEANING,
  drawBrandFooter,
  drawDivider,
  drawGeometricBg,
  drawHashtagFooter,
  drawLogo,
  drawStars,
  fmtTime,
  getBgColors,
  roundRect,
  type ReelStyle,
  formatDateDisplay,
} from '@/lib/reel/canvas-utils'

export function drawChoghadiyaCard(
  ctx: CanvasRenderingContext2D,
  data: PanchangApiData,
  dateInfo: ReturnType<typeof formatDateDisplay>,
  style: ReelStyle,
  settings: ReelSettings,
  seedKey: string,
  vedaIcon?: HTMLImageElement | null,
) {
  const colors = getBgColors(style)
  drawGeometricBg(ctx, colors, style)
  drawStars(ctx, style, seedKey)

  ctx.textAlign = 'center'
  drawLogo(ctx, colors, 110, settings.brandTitle, vedaIcon)

  ctx.font = 'bold 72px serif'
  ctx.fillStyle = colors.accent
  ctx.fillText('चौघड़िया', 540, 236)
  ctx.font = '30px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText(`Auspicious Time Windows — ${dateInfo.day} ${dateInfo.month}`, 540, 278)

  drawDivider(ctx, colors, 310)

  ctx.font = 'bold 34px sans-serif'
  ctx.fillStyle = colors.text
  ctx.fillText('Day Choghadiya', 540, 360)

  const dayChoz = data.choghadiya?.day || []
  dayChoz.forEach((slot, i) => {
    const row = Math.floor(i / 2)
    const col = i % 2
    const x = 90 + col * 470
    const y = 390 + row * 140
    const col2 = CHOGHADIYA_COLORS[slot.name] || '#888'
    const isGood = slot.quality === 'good'
    const isMixed = slot.quality === 'mixed'

    ctx.save()
    ctx.fillStyle = `${col2}20`
    roundRect(ctx, x, y, 440, 120, 16)
    ctx.fill()
    ctx.strokeStyle = `${col2}${isGood ? 'CC' : isMixed ? '88' : '44'}`
    ctx.lineWidth = isGood ? 2 : 1
    roundRect(ctx, x, y, 440, 120, 16)
    ctx.stroke()
    ctx.restore()

    ctx.beginPath()
    ctx.arc(x + 28, y + 30, 8, 0, Math.PI * 2)
    ctx.fillStyle = isGood ? '#22C55E' : isMixed ? '#EAB308' : '#EF4444'
    ctx.fill()

    ctx.textAlign = 'left'
    ctx.font = 'bold 30px serif'
    ctx.fillStyle = col2
    ctx.fillText(slot.name, x + 48, y + 38)

    ctx.font = '22px sans-serif'
    ctx.fillStyle = colors.sub
    ctx.fillText(`${fmtTime(slot.start)} – ${fmtTime(slot.end)}`, x + 48, y + 70)

    ctx.font = '19px sans-serif'
    ctx.fillStyle = `${colors.sub}AA`
    const meaning = CHOGHADIYA_MEANING[slot.name] || ''
    ctx.fillText(meaning.length > 32 ? `${meaning.slice(0, 30)}…` : meaning, x + 48, y + 100)
  })

  drawDivider(ctx, colors, 1140)

  ctx.textAlign = 'center'
  ctx.font = 'bold 34px sans-serif'
  ctx.fillStyle = colors.text
  ctx.fillText('Night Choghadiya', 540, 1190)

  const nightChoz = data.choghadiya?.night || []
  nightChoz.forEach((slot, i) => {
    const row = Math.floor(i / 2)
    const col = i % 2
    const x = 90 + col * 470
    const y = 1220 + row * 130
    const col2 = CHOGHADIYA_COLORS[slot.name] || '#888'
    const isGood = slot.quality === 'good'
    const isMixed = slot.quality === 'mixed'

    ctx.save()
    ctx.fillStyle = `${col2}15`
    roundRect(ctx, x, y, 440, 110, 14)
    ctx.fill()
    ctx.strokeStyle = `${col2}${isGood ? 'AA' : isMixed ? '66' : '33'}`
    ctx.lineWidth = isGood ? 1.5 : 1
    roundRect(ctx, x, y, 440, 110, 14)
    ctx.stroke()
    ctx.restore()

    ctx.textAlign = 'left'
    ctx.font = 'bold 28px serif'
    ctx.fillStyle = col2
    ctx.fillText(slot.name, x + 20, y + 36)
    ctx.font = '22px sans-serif'
    ctx.fillStyle = colors.sub
    ctx.fillText(`${fmtTime(slot.start)} – ${fmtTime(slot.end)}`, x + 20, y + 66)
    ctx.font = '18px sans-serif'
    ctx.fillStyle = `${colors.sub}99`
    ctx.fillText(isGood ? '✓ Auspicious' : isMixed ? '~ Mixed' : '✗ Avoid', x + 20, y + 94)
  })

  drawDivider(ctx, colors, 1760)
  drawBrandFooter(ctx, colors, settings, 1808)
  drawHashtagFooter(ctx, colors, settings, 1848)
}
