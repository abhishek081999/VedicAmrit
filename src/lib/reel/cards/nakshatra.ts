import type { PanchangApiData } from '@/types/reel-panchang'
import type { ReelSettings } from '@/lib/reel/reel-settings'
import type { GrahaId } from '@/types/astrology'
import { GRAHA_SANSKRIT, NAKSHATRA_LORDS } from '@/types/astrology'
import {
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
  truncate,
  wrapText,
  type ReelStyle,
  formatDateDisplay,
} from '@/lib/reel/canvas-utils'
import { NAK_BEST_FOR, NAK_COLOR, NAK_DEITY, NAK_QUALITY, NAK_SYMBOL } from '@/lib/reel/nakshatra-metadata'

function sectionLabel(ctx: CanvasRenderingContext2D, colors: ReturnType<typeof getBgColors>, y: number, text: string) {
  ctx.save()
  ctx.textAlign = 'center'
  ctx.font = 'bold 11px sans-serif'
  ctx.fillStyle = colors.accent
  ctx.letterSpacing = '0.12em'
  ctx.fillText(text.toUpperCase(), 540, y)
  ctx.letterSpacing = 'normal'
  ctx.restore()
}

function degFmt(n: number | undefined): string {
  if (n == null || Number.isNaN(n)) return '—'
  return `${n.toFixed(1)}°`
}

const PADA_PURUSHARTHA = ['Dharma', 'Artha', 'Kāma', 'Mokṣa'] as const

const NAK_HERO_TOP = 88

function drawNakshatraSlideLogo(ctx: CanvasRenderingContext2D, colors: ReturnType<typeof getBgColors>, settings: ReelSettings, vedaIcon: HTMLImageElement | null | undefined) {
  ctx.textAlign = 'center'
  drawLogo(ctx, colors, NAK_HERO_TOP, settings.brandTitle, vedaIcon)
}

export function drawNakshatraCard(
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
  const nakIdx = data.nakshatra?.index ?? 0
  const nakColor = NAK_COLOR[nakIdx] || colors.accent
  const pada = Math.min(4, Math.max(1, data.nakshatra?.pada ?? 1))
  const vimLord: GrahaId | undefined = NAKSHATRA_LORDS[nakIdx]
  const puru = PADA_PURUSHARTHA[pada - 1]

  if (pageIndex === 0) {
    drawReelSlideUnderlay(ctx, colors, style, seedKey)
    const vy = getReelBodyVerticalOffset(NAK_HERO_TOP, 820)
    ctx.save()
    ctx.translate(0, vy)
    drawNakshatraSlideLogo(ctx, colors, settings, vedaIcon)
    ctx.font = '15px sans-serif'
    ctx.fillStyle = `${colors.sub}DD`
    ctx.fillText(`${dateInfo.weekday}, ${dateInfo.day} ${dateInfo.month} ${dateInfo.year}`, 540, 158)
    drawDivider(ctx, colors, 176, 920)
    ctx.font = 'bold 60px serif'
    ctx.fillStyle = nakColor
    ctx.fillText(truncate(data.nakshatra?.name || 'Nakṣatra', 14), 540, 248)
    ctx.font = '20px sans-serif'
    ctx.fillStyle = colors.sub
    ctx.fillText('Moon’s lunar mansion (janma rāśi’s finer slice)', 540, 288)
    ctx.save()
    ctx.fillStyle = `${nakColor}22`
    roundRect(ctx, 120, 304, 840, 52, 18)
    ctx.strokeStyle = `${nakColor}55`
    ctx.lineWidth = 1.25
    roundRect(ctx, 120, 304, 840, 52, 18)
    ctx.stroke()
    ctx.restore()
    ctx.font = 'bold 18px sans-serif'
    ctx.fillStyle = nakColor
    const lord = data.nakshatra?.lord || '—'
    const moonR = data.moonRashi?.en || '—'
    const moonDeg = degFmt(data.moonRashi?.degInSign)
    ctx.fillText(`Lunar day ${nakIdx + 1} of 27  ·  Pada ${pada} of 4  ·  Vimśottari lord: ${lord}`, 540, 330)
    ctx.font = '15px sans-serif'
    ctx.fillStyle = `${colors.sub}EE`
    ctx.fillText(`Moon in ${moonR} (${data.moonRashi?.sa || '—'}) at ${moonDeg} in sign`, 540, 354)
    drawDivider(ctx, colors, 380, 920)
    ctx.font = '14px sans-serif'
    ctx.fillStyle = colors.sub
    const panchangStrip = [
      data.tithi?.name ? `${data.tithi.name} (${data.tithi.paksha || '—'})` : '',
      data.vara?.name ? `Vāra: ${data.vara.name}` : '',
      data.tithi?.lord ? `Tithi lord: ${data.tithi.lord}` : '',
    ]
      .filter(Boolean)
      .join('  ·  ')
    if (panchangStrip) ctx.fillText(truncate(panchangStrip, 68), 540, 412)
    if (data.sunNakshatra?.name) {
      ctx.font = '13px sans-serif'
      ctx.fillStyle = `${colors.sub}BB`
      ctx.fillText(
        `Sun nakṣatra: ${data.sunNakshatra.name} · pada ${data.sunNakshatra.pada} · lord ${data.sunNakshatra.lord}`,
        540,
        438,
      )
    }
    drawDivider(ctx, colors, 462, 920)
    ctx.save()
    ctx.beginPath()
    ctx.arc(540, 640, 150, 0, Math.PI * 2)
    const orb = ctx.createRadialGradient(540, 640, 40, 540, 640, 170)
    orb.addColorStop(0, `${nakColor}35`)
    orb.addColorStop(0.55, `${nakColor}12`)
    orb.addColorStop(1, 'transparent')
    ctx.fillStyle = orb
    ctx.fill()
    ctx.strokeStyle = `${nakColor}45`
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()
    ctx.font = '80px serif'
    ctx.fillStyle = nakColor
    ctx.fillText('✦', 540, 658)
    ctx.font = 'bold 24px sans-serif'
    ctx.fillStyle = colors.text
    ctx.fillText(`Symbol: ${truncate(NAK_SYMBOL[nakIdx] || '—', 42)}`, 540, 820)
    ctx.font = '17px sans-serif'
    ctx.fillStyle = colors.sub
    ctx.fillText('Swipe for attributes, flavour, and doṣa times.', 540, 860)
    ctx.restore()
    drawCarouselSlideBadge(ctx, colors, pageIndex + 1, totalPages)
    drawCarouselCompactFooter(ctx, colors, settings)
    return
  }

  if (pageIndex === 1) {
    drawReelSlideUnderlay(ctx, colors, style, seedKey)
    const vy = getReelBodyVerticalOffset(NAK_HERO_TOP, 520)
    ctx.save()
    ctx.translate(0, vy)
    drawNakshatraSlideLogo(ctx, colors, settings, vedaIcon)
    ctx.font = '22px sans-serif'
    ctx.fillStyle = nakColor
    ctx.fillText(truncate(data.nakshatra?.name || 'Nakṣatra', 18), 540, 168)
    drawDivider(ctx, colors, 196, 920)
    sectionLabel(ctx, colors, 224, 'Core attributes')
    const nakEnd = fmtTime(data.limbEnds?.nakshatra ?? undefined)
    const tiles = [
      { k: 'Devatā', v: NAK_DEITY[nakIdx] || '—' },
      { k: 'Nature (guṇa)', v: NAK_QUALITY[nakIdx] || '—' },
      {
        k: 'Vimśottari tārā',
        v: vimLord ? `${GRAHA_SANSKRIT[vimLord] || vimLord} (${vimLord})` : '—',
      },
      { k: 'Until (change)', v: nakEnd },
    ]
    const tw = 210
    const tg = 14
    const tx0 = (1080 - (4 * tw + 3 * tg)) / 2
    const ty = 258
    tiles.forEach((t, i) => {
      const x = tx0 + i * (tw + tg)
      ctx.save()
      ctx.fillStyle = `${nakColor}14`
      roundRect(ctx, x, ty, tw, 108, 12)
      ctx.strokeStyle = `${nakColor}40`
      ctx.lineWidth = 1
      roundRect(ctx, x, ty, tw, 108, 12)
      ctx.stroke()
      ctx.restore()
      ctx.textAlign = 'center'
      ctx.font = '13px sans-serif'
      ctx.fillStyle = colors.sub
      ctx.fillText(t.k, x + tw / 2, ty + 26)
      ctx.font = 'bold 17px serif'
      ctx.fillStyle = colors.text
      const vs = t.v.length > 22 ? `${t.v.slice(0, 20)}…` : t.v
      ctx.fillText(vs, x + tw / 2, ty + 62)
    })
    drawDivider(ctx, colors, 396, 920)
    sectionLabel(ctx, colors, 424, 'Pada & life-area tone')
    ctx.font = '18px sans-serif'
    ctx.fillStyle = colors.text
    ctx.fillText(
      `Pada ${pada} often read with a ${puru} flavour in classical timing texts (simplified reel note).`,
      540,
      460,
    )
    ctx.font = '15px sans-serif'
    ctx.fillStyle = colors.sub
    wrapText(
      ctx,
      `Full chart work still needs lagna, daśā, and transits — this card highlights the Moon’s field only.`,
      540,
      510,
      920,
      26,
    )
    ctx.restore()
    drawCarouselSlideBadge(ctx, colors, pageIndex + 1, totalPages)
    drawCarouselCompactFooter(ctx, colors, settings)
    return
  }

  if (pageIndex === 2) {
    drawReelSlideUnderlay(ctx, colors, style, seedKey)
    const vy = getReelBodyVerticalOffset(NAK_HERO_TOP, 620)
    ctx.save()
    ctx.translate(0, vy)
    drawNakshatraSlideLogo(ctx, colors, settings, vedaIcon)
    ctx.font = '22px sans-serif'
    ctx.fillStyle = nakColor
    ctx.fillText(truncate(data.nakshatra?.name || 'Nakṣatra', 18), 540, 168)
    drawDivider(ctx, colors, 196, 920)
    sectionLabel(ctx, colors, 224, 'Favourable flavour today')
    ctx.save()
    ctx.fillStyle = `${colors.accent}10`
    roundRect(ctx, 72, 252, 936, 220, 16)
    ctx.strokeStyle = `${nakColor}35`
    ctx.lineWidth = 1.25
    roundRect(ctx, 72, 252, 936, 220, 16)
    ctx.stroke()
    ctx.restore()
    ctx.textAlign = 'center'
    ctx.font = '22px sans-serif'
    ctx.fillStyle = colors.text
    wrapText(ctx, NAK_BEST_FOR[nakIdx] || '—', 540, 300, 880, 32)
    drawDivider(ctx, colors, 498, 920)
    sectionLabel(ctx, colors, 526, 'Times to ease intensity')
    const avoid = [
      { label: 'Rāhu Kāla', start: data.rahuKalam?.start, end: data.rahuKalam?.end },
      { label: 'Yamagaṇḍa', start: data.yamaganda?.start, end: data.yamaganda?.end },
      { label: 'Gulika Kāla', start: data.gulikaKalam?.start, end: data.gulikaKalam?.end },
    ]
    const aw = 292
    const ag = 12
    const ax = (1080 - (3 * aw + 2 * ag)) / 2
    const ay = 562
    avoid.forEach((a, i) => {
      const x = ax + i * (aw + ag)
      ctx.save()
      ctx.fillStyle = 'rgba(220,38,38,0.11)'
      roundRect(ctx, x, ay, aw, 88, 12)
      ctx.strokeStyle = 'rgba(248,113,113,0.32)'
      ctx.lineWidth = 1
      roundRect(ctx, x, ay, aw, 88, 12)
      ctx.stroke()
      ctx.restore()
      ctx.textAlign = 'center'
      ctx.font = '15px sans-serif'
      ctx.fillStyle = '#FCA5A5'
      ctx.fillText(a.label, x + aw / 2, ay + 30)
      ctx.font = 'bold 17px sans-serif'
      ctx.fillStyle = '#FEE2E2'
      ctx.fillText(`${fmtTime(a.start)} – ${fmtTime(a.end)}`, x + aw / 2, ay + 62)
    })
    ctx.restore()
    drawCarouselSlideBadge(ctx, colors, pageIndex + 1, totalPages)
    drawCarouselCompactFooter(ctx, colors, settings)
    return
  }

  drawReelSlideUnderlay(ctx, colors, style, seedKey)
  const vy = getReelBodyVerticalOffset(NAK_HERO_TOP, 760)
  ctx.save()
  ctx.translate(0, vy)
  drawNakshatraSlideLogo(ctx, colors, settings, vedaIcon)
  ctx.font = '22px sans-serif'
  ctx.fillStyle = nakColor
  ctx.fillText(truncate(data.nakshatra?.name || 'Nakṣatra', 18), 540, 168)
  drawDivider(ctx, colors, 196, 920)
  ctx.font = '200px serif'
  ctx.fillStyle = `${nakColor}0C`
  ctx.fillText(`${nakIdx + 1}`, 540, 520)
  ctx.font = '20px sans-serif'
  ctx.fillStyle = colors.text
  ctx.fillText(`Nakṣatra ${nakIdx + 1} of 27`, 540, 620)
  ctx.font = '18px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText('Use nakṣatra with tithi, vāra, and muhūrta for fine electional work.', 540, 700)
  ctx.font = '16px sans-serif'
  ctx.fillStyle = `${colors.sub}CC`
  ctx.fillText(truncate(settings.ctaLine, 72), 540, 742)
  const footerY = 820
  drawDivider(ctx, colors, footerY, 920)
  ctx.restore()
  drawCarouselSlideBadge(ctx, colors, pageIndex + 1, totalPages)
  drawBrandFooter(ctx, colors, settings, 1710)
  drawHashtagFooter(ctx, colors, settings, 1760)
}
