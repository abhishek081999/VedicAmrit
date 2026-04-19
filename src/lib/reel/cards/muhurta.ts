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
  truncate,
  type ReelStyle,
  formatDateDisplay,
} from '@/lib/reel/canvas-utils'

type Tone = 'good' | 'neutral' | 'warn'

function sectionLabel(ctx: CanvasRenderingContext2D, colors: ReturnType<typeof getBgColors>, y: number, text: string) {
  ctx.save()
  ctx.textAlign = 'center'
  ctx.font = 'bold 13px sans-serif'
  ctx.fillStyle = colors.accent
  ctx.letterSpacing = '0.12em'
  ctx.fillText(text.toUpperCase(), 540, y)
  ctx.letterSpacing = 'normal'
  ctx.restore()
}

function drawKeyCard(
  ctx: CanvasRenderingContext2D,
  colors: ReturnType<typeof getBgColors>,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  timeRange: string,
  hint: string,
  tone: Tone,
) {
  const fill =
    tone === 'good' ? 'rgba(34,197,94,0.14)' : tone === 'warn' ? 'rgba(220,38,38,0.12)' : `${colors.accent}12`
  const stroke =
    tone === 'good' ? 'rgba(34,197,94,0.45)' : tone === 'warn' ? 'rgba(248,113,113,0.45)' : `${colors.accent}38`
  const titleCol = tone === 'good' ? '#DCFCE7' : tone === 'warn' ? '#FECACA' : colors.text
  const timeCol = tone === 'good' ? '#BBF7D0' : tone === 'warn' ? '#FEE2E2' : colors.sub

  ctx.save()
  ctx.fillStyle = fill
  roundRect(ctx, x, y, w, h, 14)
  ctx.fill()
  ctx.strokeStyle = stroke
  ctx.lineWidth = 1.25
  roundRect(ctx, x, y, w, h, 14)
  ctx.stroke()
  ctx.restore()

  ctx.textAlign = 'left'
  ctx.font = 'bold 20px sans-serif'
  ctx.fillStyle = titleCol
  ctx.fillText(title, x + 16, y + 30)
  ctx.font = 'bold 22px sans-serif'
  ctx.fillStyle = timeCol
  ctx.fillText(timeRange, x + 16, y + 58)
  ctx.font = '15px sans-serif'
  ctx.fillStyle = `${colors.sub}DD`
  const h2 = truncate(hint, 44)
  ctx.fillText(h2, x + 16, y + 82)
}

function drawAvoidMini(
  ctx: CanvasRenderingContext2D,
  colors: ReturnType<typeof getBgColors>,
  x: number,
  y: number,
  w: number,
  label: string,
  start: string | undefined,
  end: string | undefined,
) {
  ctx.save()
  ctx.fillStyle = 'rgba(220,38,38,0.1)'
  roundRect(ctx, x, y, w, 72, 12)
  ctx.fill()
  ctx.strokeStyle = 'rgba(248,113,113,0.35)'
  ctx.lineWidth = 1
  roundRect(ctx, x, y, w, 72, 12)
  ctx.stroke()
  ctx.restore()
  ctx.textAlign = 'center'
  ctx.font = '16px sans-serif'
  ctx.fillStyle = '#FCA5A5'
  ctx.fillText(label, x + w / 2, y + 28)
  ctx.font = 'bold 18px sans-serif'
  ctx.fillStyle = '#FEE2E2'
  ctx.fillText(`${fmtTime(start)} – ${fmtTime(end)}`, x + w / 2, y + 54)
}

function drawMuhurtaSlideHero(
  ctx: CanvasRenderingContext2D,
  colors: ReturnType<typeof getBgColors>,
  settings: ReelSettings,
  vedaIcon: HTMLImageElement | null | undefined,
  titleSa: string,
  titleEn: string,
) {
  ctx.textAlign = 'center'
  drawLogo(ctx, colors, 88, settings.brandTitle, vedaIcon)
  ctx.font = 'bold 48px serif'
  ctx.fillStyle = colors.accent
  ctx.fillText(titleSa, 540, 188)
  ctx.font = '22px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText(titleEn, 540, 222)
  drawDivider(ctx, colors, 242, 920)
}

type Slot = { title: string; time: string; hint: string; tone: Tone }

function buildMuhurtaSlots(data: PanchangApiData): Slot[] {
  const slots: Slot[] = []
  if (data.brahmaMuhurta) {
    slots.push({
      title: 'Brahma Muhurta',
      time: `${fmtTime(data.brahmaMuhurta.start)} – ${fmtTime(data.brahmaMuhurta.end)}`,
      hint: 'Best for meditation, mantra, study',
      tone: 'good',
    })
  }
  if (data.abhijitMuhurta) {
    slots.push({
      title: 'Abhijit Muhurta',
      time: `${fmtTime(data.abhijitMuhurta.start)} – ${fmtTime(data.abhijitMuhurta.end)}`,
      hint: 'Midday auspicious window — new work',
      tone: 'good',
    })
  }
  if (data.godhuliMuhurat) {
    slots.push({
      title: 'Godhuli / Sandhyā',
      time: `${fmtTime(data.godhuliMuhurat.start)} – ${fmtTime(data.godhuliMuhurat.end)}`,
      hint: 'Twilight — light worship & transitions',
      tone: 'neutral',
    })
  }
  ;(data.durMuhurat || []).forEach((dm, i) => {
    slots.push({
      title: i === 0 ? 'Dur Muhurta I' : i === 1 ? 'Dur Muhurta II' : `Dur Muhurta ${i + 1}`,
      time: `${fmtTime(dm.start)} – ${fmtTime(dm.end)}`,
      hint: 'Avoid new ventures & major starts',
      tone: 'warn',
    })
  })
  return slots.slice(0, 8)
}

export function drawMuhurtaCard(
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
  const displaySlots = buildMuhurtaSlots(data)
  const gap = 18
  const cardW = (900 - gap) / 2
  const cardH = 96

  const panchangSub = [
    data.vara?.name ? `Vāra: ${data.vara.name}` : '',
    data.tithi?.name ? `Tithi: ${data.tithi.name}` : '',
    data.tithi?.paksha ? `(${data.tithi.paksha})` : '',
  ]
    .filter(Boolean)
    .join('  ·  ')

  if (pageIndex === 0) {
    drawReelSlideUnderlay(ctx, colors, style, seedKey)
    const vy = getReelBodyVerticalOffset(88, 560)
    ctx.save()
    ctx.translate(0, vy)
    drawMuhurtaSlideHero(ctx, colors, settings, vedaIcon, 'आज का मुहूर्त · I', 'Key windows — first muhūrtas')
    ctx.font = 'bold 30px sans-serif'
    ctx.fillStyle = colors.text
    ctx.fillText(`${dateInfo.weekday}`, 540, 278)
    ctx.font = '22px sans-serif'
    ctx.fillStyle = colors.sub
    ctx.fillText(`${dateInfo.day} ${dateInfo.month} ${dateInfo.year}`, 540, 310)
    if (panchangSub) {
      ctx.font = '17px sans-serif'
      ctx.fillStyle = `${colors.sub}EE`
      ctx.fillText(truncate(panchangSub, 52), 540, 342)
    }
    ctx.font = '16px sans-serif'
    ctx.fillStyle = colors.text
    ctx.fillText(`Sunrise ${fmtTime(data.sunrise)}  ·  Sunset ${fmtTime(data.sunset)}`, 540, 372)

    drawDivider(ctx, colors, 396, 920)
    sectionLabel(ctx, colors, 420, 'Key muhurtas')
    let rowY = 448
    const page0 = displaySlots.slice(0, 4)
    for (let i = 0; i < page0.length; i += 2) {
      const left = page0[i]
      const right = page0[i + 1]
      if (left) drawKeyCard(ctx, colors, 90, rowY, cardW, cardH, left.title, left.time, left.hint, left.tone)
      if (right) {
        drawKeyCard(ctx, colors, 90 + cardW + gap, rowY, cardW, cardH, right.title, right.time, right.hint, right.tone)
      }
      rowY += cardH + gap
    }
    ctx.restore()
    drawCarouselSlideBadge(ctx, colors, pageIndex + 1, totalPages)
    drawCarouselCompactFooter(ctx, colors, settings)
    return
  }

  if (pageIndex === 1) {
    drawReelSlideUnderlay(ctx, colors, style, seedKey)
    const vy = getReelBodyVerticalOffset(88, 620)
    ctx.save()
    ctx.translate(0, vy)
    drawMuhurtaSlideHero(ctx, colors, settings, vedaIcon, 'मुहूर्त · II', 'More muhūrtas & doṣa periods')
    ctx.font = '18px sans-serif'
    ctx.fillStyle = colors.sub
    ctx.fillText(`${dateInfo.weekday}, ${dateInfo.day} ${dateInfo.month}`, 540, 278)

    sectionLabel(ctx, colors, 318, 'Key muhurtas (continued)')
    let rowY = 352
    const page1 = displaySlots.slice(4, 8)
    if (page1.length === 0) {
      ctx.font = '18px sans-serif'
      ctx.fillStyle = colors.sub
      ctx.fillText('No additional muhūrta rows in this dataset.', 540, rowY + 40)
      rowY += 80
    } else {
      for (let i = 0; i < page1.length; i += 2) {
        const left = page1[i]
        const right = page1[i + 1]
        if (left) drawKeyCard(ctx, colors, 90, rowY, cardW, cardH, left.title, left.time, left.hint, left.tone)
        if (right) {
          drawKeyCard(ctx, colors, 90 + cardW + gap, rowY, cardW, cardH, right.title, right.time, right.hint, right.tone)
        }
        rowY += cardH + gap
      }
    }

    drawDivider(ctx, colors, rowY + 12, 920)
    rowY += 36
    sectionLabel(ctx, colors, rowY, 'Avoid today')
    rowY += 28
    const aw = 280
    const ag = 15
    const ax0 = 90
    drawAvoidMini(ctx, colors, ax0, rowY, aw, 'Rāhu Kāla', data.rahuKalam?.start, data.rahuKalam?.end)
    drawAvoidMini(ctx, colors, ax0 + aw + ag, rowY, aw, 'Gulika Kāla', data.gulikaKalam?.start, data.gulikaKalam?.end)
    drawAvoidMini(ctx, colors, ax0 + 2 * (aw + ag), rowY, aw, 'Yamagaṇḍa', data.yamaganda?.start, data.yamaganda?.end)
    ctx.restore()
    drawCarouselSlideBadge(ctx, colors, pageIndex + 1, totalPages)
    drawCarouselCompactFooter(ctx, colors, settings)
    return
  }

  if (pageIndex === 2) {
    drawReelSlideUnderlay(ctx, colors, style, seedKey)
    const vy = getReelBodyVerticalOffset(88, 1000)
    ctx.save()
    ctx.translate(0, vy)
    drawMuhurtaSlideHero(ctx, colors, settings, vedaIcon, 'मुहूर्त · III', 'Horā — day & night')
    ctx.font = '18px sans-serif'
    ctx.fillStyle = colors.sub
    ctx.fillText(`${dateInfo.weekday}, ${dateInfo.day} ${dateInfo.month}`, 540, 278)

    let rowY = 318
    const horasDay = (data.horaTable || []).filter((h) => h.isDaytime)
    const cols = 3
    const hw = 280
    const hg = 20
    const hh = 48
    const maxH = 12
    sectionLabel(ctx, colors, rowY, 'Day Horā (planetary hours)')
    rowY += 28
    horasDay.slice(0, maxH).forEach((h, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = 90 + col * (hw + hg)
      const yy = rowY + row * (hh + 6)
      ctx.save()
      ctx.fillStyle = `${colors.accent}0f`
      roundRect(ctx, x, yy, hw, hh, 10)
      ctx.strokeStyle = `${colors.accent}30`
      ctx.lineWidth = 1
      roundRect(ctx, x, yy, hw, hh, 10)
      ctx.stroke()
      ctx.restore()
      ctx.textAlign = 'left'
      ctx.font = 'bold 17px sans-serif'
      ctx.fillStyle = colors.accent
      ctx.fillText(h.lord, x + 12, yy + 22)
      ctx.font = '14px sans-serif'
      ctx.fillStyle = colors.sub
      ctx.fillText(`${fmtTime(h.start)} – ${fmtTime(h.end)}`, x + 12, yy + 40)
    })
    rowY += Math.ceil(Math.min(horasDay.length, maxH) / cols) * (hh + 6) + 16

    const horasNight = (data.horaTable || []).filter((h) => !h.isDaytime).slice(0, 8)
    if (horasNight.length > 0) {
      drawDivider(ctx, colors, rowY, 920)
      rowY += 22
      sectionLabel(ctx, colors, rowY, 'Night Horā')
      rowY += 28
      const ncols = 2
      const nw = 430
      const ng = 20
      const nh = 44
      horasNight.forEach((h, i) => {
        const col = i % ncols
        const row = Math.floor(i / ncols)
        const x = 90 + col * (nw + ng)
        const yy = rowY + row * (nh + 6)
        ctx.save()
        ctx.fillStyle = 'rgba(148,163,184,0.12)'
        roundRect(ctx, x, yy, nw, nh, 10)
        ctx.strokeStyle = 'rgba(148,163,184,0.28)'
        ctx.lineWidth = 1
        roundRect(ctx, x, yy, nw, nh, 10)
        ctx.stroke()
        ctx.restore()
        ctx.textAlign = 'left'
        ctx.font = 'bold 16px sans-serif'
        ctx.fillStyle = colors.text
        ctx.fillText(h.lord, x + 12, yy + 20)
        ctx.font = '14px sans-serif'
        ctx.fillStyle = colors.sub
        ctx.fillText(`${fmtTime(h.start)} – ${fmtTime(h.end)}`, x + 12, yy + 38)
      })
    }
    ctx.restore()
    drawCarouselSlideBadge(ctx, colors, pageIndex + 1, totalPages)
    drawCarouselCompactFooter(ctx, colors, settings)
    return
  }

  drawReelSlideUnderlay(ctx, colors, style, seedKey)
  const vy = getReelBodyVerticalOffset(88, 720)
  ctx.save()
  ctx.translate(0, vy)
  drawMuhurtaSlideHero(ctx, colors, settings, vedaIcon, 'मुहूर्त · IV', 'Auspicious Choghadiya & tips')
  ctx.font = '18px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText(`${dateInfo.weekday}, ${dateInfo.day} ${dateInfo.month}`, 540, 278)

  let rowY = 318
  sectionLabel(ctx, colors, rowY, 'Auspicious Choghadiya (day)')
  rowY += 32
  const goodSlots = (data.choghadiya?.day || []).filter((s) => s.quality === 'good').slice(0, 4)
  if (goodSlots.length === 0) {
    ctx.textAlign = 'center'
    ctx.font = '18px sans-serif'
    ctx.fillStyle = colors.sub
    ctx.fillText('No “good” day slots in returned data.', 540, rowY + 24)
    rowY += 56
  } else {
    goodSlots.forEach((slot, i) => {
      const x = 90 + i * 225
      const yy = rowY
      const col = CHOGHADIYA_COLORS[slot.name] || colors.accent
      const meaning = CHOGHADIYA_MEANING[slot.name] || ''
      ctx.save()
      ctx.fillStyle = `${col}1a`
      roundRect(ctx, x, yy, 200, 78, 12)
      ctx.strokeStyle = `${col}66`
      ctx.lineWidth = 1.25
      roundRect(ctx, x, yy, 200, 78, 12)
      ctx.stroke()
      ctx.restore()
      ctx.textAlign = 'center'
      ctx.font = 'bold 22px sans-serif'
      ctx.fillStyle = col
      ctx.fillText(slot.name, x + 100, yy + 28)
      ctx.font = '15px sans-serif'
      ctx.fillStyle = colors.sub
      ctx.fillText(`${fmtTime(slot.start)} – ${fmtTime(slot.end)}`, x + 100, yy + 50)
      ctx.font = '12px sans-serif'
      ctx.fillStyle = `${colors.sub}CC`
      ctx.fillText(truncate(meaning, 28), x + 100, yy + 68)
    })
    rowY += 100
  }

  drawDivider(ctx, colors, rowY + 12, 920)
  rowY += 40
  ctx.textAlign = 'center'
  ctx.font = '18px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText('Use Brahma / Abhijit for sādhanā & beginnings; avoid Dur & Rāhu kāla for important starts.', 540, rowY)
  ctx.fillText(settings.ctaLine, 540, rowY + 36)
  rowY += 80
  drawDivider(ctx, colors, rowY, 920)
  ctx.restore()
  drawCarouselSlideBadge(ctx, colors, pageIndex + 1, totalPages)
  drawBrandFooter(ctx, colors, settings, 1710)
  drawHashtagFooter(ctx, colors, settings, 1760)
}
