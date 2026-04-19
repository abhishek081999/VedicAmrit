import type { PanchangApiData } from '@/types/reel-panchang'
import type { ReelSettings } from '@/lib/reel/reel-settings'
import {
  CHOGHADIYA_COLORS,
  CHOGHADIYA_MEANING,
  drawBrandFooter,
  drawCarouselCompactFooter,
  drawCarouselSlideBadge,
  drawDivider,
  drawHashtagFooter,
  drawLogo,
  drawReelSlideUnderlay,
  getReelBodyVerticalOffset,
  fmtTime,
  getBgColors,
  roundRect,
  type ReelStyle,
  formatDateDisplay,
} from '@/lib/reel/canvas-utils'

const CHOGH_HERO_TOP = 110

function drawChoghadiyaSlideHero(
  ctx: CanvasRenderingContext2D,
  colors: ReturnType<typeof getBgColors>,
  settings: ReelSettings,
  vedaIcon: HTMLImageElement | null | undefined,
  titleSa: string,
  titleEn: string,
) {
  ctx.textAlign = 'center'
  drawLogo(ctx, colors, CHOGH_HERO_TOP, settings.brandTitle, vedaIcon)
  ctx.font = 'bold 56px serif'
  ctx.fillStyle = colors.accent
  ctx.fillText(titleSa, 540, 210)
  ctx.font = '24px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText(titleEn, 540, 252)
  drawDivider(ctx, colors, 278, 920)
}

function drawDaySlot(
  ctx: CanvasRenderingContext2D,
  colors: ReturnType<typeof getBgColors>,
  slot: { name: string; quality: string; start: string; end: string },
  x: number,
  y: number,
) {
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
}

function drawNightSlot(
  ctx: CanvasRenderingContext2D,
  colors: ReturnType<typeof getBgColors>,
  slot: { name: string; quality: string; start: string; end: string },
  x: number,
  y: number,
) {
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
}

export function drawChoghadiyaCard(
  ctx: CanvasRenderingContext2D,
  data: PanchangApiData,
  dateInfo: ReturnType<typeof formatDateDisplay>,
  style: ReelStyle,
  settings: ReelSettings,
  seedKey: string,
  vedaIcon: HTMLImageElement | null | undefined,
  pageIndex = 0,
  totalPages = 4,
) {
  const colors = getBgColors(style)
  const dayChoz = data.choghadiya?.day || []
  const nightChoz = data.choghadiya?.night || []

  if (pageIndex === 0) {
    drawReelSlideUnderlay(ctx, colors, style, seedKey)
    const vy = getReelBodyVerticalOffset(CHOGH_HERO_TOP, 560)
    ctx.save()
    ctx.translate(0, vy)
    drawChoghadiyaSlideHero(
      ctx,
      colors,
      settings,
      vedaIcon,
      'चौघड़िया · I',
      `Day windows — ${dateInfo.day} ${dateInfo.month}`,
    )
    ctx.font = 'bold 32px sans-serif'
    ctx.fillStyle = colors.text
    ctx.fillText('Day Choghadiya', 540, 340)
    const slice = dayChoz.slice(0, 4)
    slice.forEach((slot, i) => {
      const row = Math.floor(i / 2)
      const col = i % 2
      const x = 90 + col * 470
      const y = 368 + row * 140
      drawDaySlot(ctx, colors, slot, x, y)
    })
    ctx.restore()
    drawCarouselSlideBadge(ctx, colors, pageIndex + 1, totalPages)
    drawCarouselCompactFooter(ctx, colors, settings)
    return
  }

  if (pageIndex === 1) {
    drawReelSlideUnderlay(ctx, colors, style, seedKey)
    const vy = getReelBodyVerticalOffset(CHOGH_HERO_TOP, 560)
    ctx.save()
    ctx.translate(0, vy)
    drawChoghadiyaSlideHero(ctx, colors, settings, vedaIcon, 'चौघड़िया · II', 'Day Choghadiya (continued)')
    ctx.font = 'bold 32px sans-serif'
    ctx.fillStyle = colors.text
    ctx.fillText('Day Choghadiya', 540, 340)
    const slice = dayChoz.slice(4, 8)
    if (slice.length === 0) {
      ctx.font = '20px sans-serif'
      ctx.fillStyle = colors.sub
      ctx.fillText('No additional day segments in dataset.', 540, 520)
    } else {
      slice.forEach((slot, i) => {
        const row = Math.floor(i / 2)
        const col = i % 2
        const x = 90 + col * 470
        const y = 368 + row * 140
        drawDaySlot(ctx, colors, slot, x, y)
      })
    }
    ctx.restore()
    drawCarouselSlideBadge(ctx, colors, pageIndex + 1, totalPages)
    drawCarouselCompactFooter(ctx, colors, settings)
    return
  }

  if (pageIndex === 2) {
    drawReelSlideUnderlay(ctx, colors, style, seedKey)
    const vy = getReelBodyVerticalOffset(CHOGH_HERO_TOP, 540)
    ctx.save()
    ctx.translate(0, vy)
    drawChoghadiyaSlideHero(ctx, colors, settings, vedaIcon, 'चौघड़िया · III', 'Night Choghadiya — first half')
    ctx.font = 'bold 32px sans-serif'
    ctx.fillStyle = colors.text
    ctx.fillText('Night Choghadiya', 540, 340)
    const slice = nightChoz.slice(0, 4)
    slice.forEach((slot, i) => {
      const row = Math.floor(i / 2)
      const col = i % 2
      const x = 90 + col * 470
      const y = 368 + row * 130
      drawNightSlot(ctx, colors, slot, x, y)
    })
    ctx.restore()
    drawCarouselSlideBadge(ctx, colors, pageIndex + 1, totalPages)
    drawCarouselCompactFooter(ctx, colors, settings)
    return
  }

  drawReelSlideUnderlay(ctx, colors, style, seedKey)
  const vy = getReelBodyVerticalOffset(CHOGH_HERO_TOP, 520)
  ctx.save()
  ctx.translate(0, vy)
  drawChoghadiyaSlideHero(ctx, colors, settings, vedaIcon, 'चौघड़िया · IV', 'Night Choghadiya — close')
  ctx.font = 'bold 32px sans-serif'
  ctx.fillStyle = colors.text
  ctx.fillText('Night Choghadiya', 540, 340)
  const slice = nightChoz.slice(4, 8)
  if (slice.length === 0) {
    ctx.font = '20px sans-serif'
    ctx.fillStyle = colors.sub
    ctx.fillText('No extra night segments.', 540, 520)
  } else {
    slice.forEach((slot, i) => {
      const row = Math.floor(i / 2)
      const col = i % 2
      const x = 90 + col * 470
      const y = 368 + row * 130
      drawNightSlot(ctx, colors, slot, x, y)
    })
  }
  ctx.restore()
  drawCarouselSlideBadge(ctx, colors, pageIndex + 1, totalPages)
  drawBrandFooter(ctx, colors, settings, 1710)
  drawHashtagFooter(ctx, colors, settings, 1760)
}
