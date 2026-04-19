import type { PanchangApiData } from '@/types/reel-panchang'
import type { ReelSettings } from '@/lib/reel/reel-settings'
import {
  CHOGHADIYA_COLORS,
  CHOGHADIYA_MEANING,
  drawBrandFooter,
  drawCarouselCompactFooter,
  drawCarouselSlideBadge,
  drawDivider,
  drawGeometricBg,
  drawHashtagFooter,
  drawLogo,
  drawReelSlideUnderlay,
  getReelBodyVerticalOffset,
  drawStars,
  fmtTime,
  getBgColors,
  roundRect,
  truncate,
  type ReelStyle,
  formatDateDisplay,
} from '@/lib/reel/canvas-utils'
import { NAK_DEITY, NAK_QUALITY } from '@/lib/reel/nakshatra-metadata'

function sectionLabel(ctx: CanvasRenderingContext2D, colors: ReturnType<typeof getBgColors>, y: number, text: string) {
  ctx.save()
  ctx.textAlign = 'center'
  ctx.font = 'bold 13px system-ui, sans-serif'
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

function truncateSafe(s: string, max: number): string {
  if (!s) return ''
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`
}

function drawLimbTile(
  ctx: CanvasRenderingContext2D,
  colors: ReturnType<typeof getBgColors>,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  lines: string[],
) {
  ctx.save()
  ctx.fillStyle = `${colors.accent}10`
  roundRect(ctx, x, y, w, h, 11)
  ctx.fill()
  ctx.strokeStyle = `${colors.accent}32`
  ctx.lineWidth = 1
  roundRect(ctx, x, y, w, h, 11)
  ctx.stroke()
  ctx.restore()

  ctx.textAlign = 'center'
  ctx.font = '13px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText(label, x + w / 2, y + 18)
  ctx.font = 'bold 18px serif'
  ctx.fillStyle = colors.text
  ctx.fillText(truncate(value, 13), x + w / 2, y + 42)
  ctx.font = '12px sans-serif'
  ctx.fillStyle = `${colors.sub}CC`
  let ly = y + 62
  for (const ln of lines) {
    if (!ln) continue
    ctx.fillText(truncateSafe(ln, 22), x + w / 2, ly)
    ly += 15
  }
}

function drawKeyTimeStrip(
  ctx: CanvasRenderingContext2D,
  colors: ReturnType<typeof getBgColors>,
  y: number,
  data: PanchangApiData,
): number {
  const slots: { title: string; range: string; tone: 'good' | 'neutral' | 'warn' }[] = []
  if (data.brahmaMuhurta?.start) {
    slots.push({
      title: 'Brahma Muhūrta',
      range: `${fmtTime(data.brahmaMuhurta.start)} – ${fmtTime(data.brahmaMuhurta.end)}`,
      tone: 'good',
    })
  }
  if (data.abhijitMuhurta?.start) {
    slots.push({
      title: 'Abhijit',
      range: `${fmtTime(data.abhijitMuhurta.start)} – ${fmtTime(data.abhijitMuhurta.end)}`,
      tone: 'good',
    })
  }
  if (data.godhuliMuhurat?.start) {
    slots.push({
      title: 'Godhuli / Sandhyā',
      range: `${fmtTime(data.godhuliMuhurat.start)} – ${fmtTime(data.godhuliMuhurat.end)}`,
      tone: 'neutral',
    })
  }
  const durs = (data.durMuhurat || []).slice(0, 2)
  durs.forEach((dm, i) => {
    slots.push({
      title: i === 0 ? 'Dur Muhūrta' : 'Dur II',
      range: `${fmtTime(dm.start)} – ${fmtTime(dm.end)}`,
      tone: 'warn',
    })
  })

  const maxSlots = 6
  const show = slots.slice(0, maxSlots)
  const gap = 10
  const colCount = 3
  const w = (900 - gap * (colCount - 1)) / colCount
  const rowH = 52
  if (show.length === 0) return y

  show.forEach((s, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = 90 + col * (w + gap)
    const yy = y + row * (rowH + gap)
    const fill =
      s.tone === 'good' ? 'rgba(34,197,94,0.12)' : s.tone === 'warn' ? 'rgba(220,38,38,0.1)' : `${colors.accent}10`
    const stroke =
      s.tone === 'good' ? 'rgba(34,197,94,0.38)' : s.tone === 'warn' ? 'rgba(248,113,113,0.35)' : `${colors.accent}30`
    ctx.save()
    ctx.fillStyle = fill
    roundRect(ctx, x, yy, w, rowH, 10)
    ctx.fill()
    ctx.strokeStyle = stroke
    ctx.lineWidth = 1
    roundRect(ctx, x, yy, w, rowH, 10)
    ctx.stroke()
    ctx.restore()
    ctx.textAlign = 'left'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillStyle = s.tone === 'good' ? '#DCFCE7' : s.tone === 'warn' ? '#FECACA' : colors.text
    ctx.fillText(s.title, x + 10, yy + 22)
    ctx.font = '13px sans-serif'
    ctx.fillStyle = s.tone === 'good' ? '#BBF7D0' : s.tone === 'warn' ? '#FEE2E2' : colors.sub
    ctx.fillText(s.range, x + 10, yy + 40)
  })
  const rows = Math.ceil(show.length / 3)
  return y + rows * (rowH + gap) - gap
}

function drawPanchangSlideHero(
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

export function drawPanchangFullCard(
  ctx: CanvasRenderingContext2D,
  data: PanchangApiData,
  dateInfo: ReturnType<typeof formatDateDisplay>,
  style: ReelStyle,
  settings: ReelSettings,
  seedKey: string,
  vedaIcon: HTMLImageElement | null | undefined,
  pageIndex = 0,
  totalPages = 5,
) {
  const colors = getBgColors(style)
  const cc = data.calendarContext
  const tEnd = fmtTime(data.limbEnds?.tithi ?? undefined)
  const nEnd = fmtTime(data.limbEnds?.nakshatra ?? undefined)
  const yEnd = fmtTime(data.limbEnds?.yoga ?? undefined)
  const tithiPct = data.tithi?.percent != null ? `${Math.round(data.tithi.percent)}% elapsed` : ''
  const yogaPct = data.yoga?.percent != null ? `${Math.round(data.yoga.percent)}%` : ''

  const limbSpecs: { label: string; value: string; lines: string[] }[] = [
    {
      label: 'Tithi',
      value: data.tithi?.name || '—',
      lines: [
        `until ${tEnd}`,
        [data.tithi?.paksha, `lord ${data.tithi?.lord || ''}`, tithiPct].filter(Boolean).join(' · '),
      ],
    },
    {
      label: 'Nakṣatra',
      value: data.nakshatra?.name || '—',
      lines: [
        `until ${nEnd}`,
        [`pada ${data.nakshatra?.pada ?? '—'}`, `lord ${data.nakshatra?.lord || ''}`, degFmt(data.nakshatra?.degree)]
          .filter((x) => x && !x.includes('—'))
          .join(' · ') || '—',
      ],
    },
    {
      label: 'Yoga',
      value: data.yoga?.name || '—',
      lines: [`until ${yEnd}`, [data.yoga?.quality, yogaPct].filter(Boolean).join(' · ')],
    },
    {
      label: 'Karaṇa',
      value: data.karana?.name || '—',
      lines: [[data.karana?.type, data.karana?.isBhadra ? 'Bhadra' : ''].filter(Boolean).join(' · ')],
    },
    {
      label: 'Vāra',
      value: data.vara?.name || '—',
      lines: [[data.vara?.sanskrit, `lord ${data.vara?.lord || ''}`].filter(Boolean).join(' · ')],
    },
  ]

  const boxW = 433
  const boxGap = 14
  const boxH = 80
  const drawRashiBox = (x: number, yy: number, title: string, en: string, sa: string, deg: string) => {
    ctx.save()
    ctx.fillStyle = `${colors.accent}0c`
    roundRect(ctx, x, yy, boxW, boxH, 12)
    ctx.strokeStyle = `${colors.accent}28`
    ctx.lineWidth = 1
    roundRect(ctx, x, yy, boxW, boxH, 12)
    ctx.stroke()
    ctx.restore()
    ctx.textAlign = 'left'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillStyle = colors.accent
    ctx.fillText(title, x + 14, yy + 22)
    ctx.font = 'bold 19px serif'
    ctx.fillStyle = colors.text
    ctx.fillText(truncate(`${en} (${sa})`, 24), x + 14, yy + 46)
    ctx.font = '13px sans-serif'
    ctx.fillStyle = colors.sub
    ctx.fillText(`${deg} in sign`, x + 14, yy + 68)
  }

  const drawAvoidRow = (ay: number) => {
    const aw = 280
    const ag = 15
    const ax0 = 90
    const drawAvoidMini = (x: number, label: string, start: string | undefined, end: string | undefined) => {
      ctx.save()
      ctx.fillStyle = 'rgba(220,38,38,0.1)'
      roundRect(ctx, x, ay, aw, 68, 11)
      ctx.strokeStyle = 'rgba(248,113,113,0.32)'
      ctx.lineWidth = 1
      roundRect(ctx, x, ay, aw, 68, 11)
      ctx.stroke()
      ctx.restore()
      ctx.textAlign = 'center'
      ctx.font = '15px sans-serif'
      ctx.fillStyle = '#FCA5A5'
      ctx.fillText(label, x + aw / 2, ay + 24)
      ctx.font = 'bold 17px sans-serif'
      ctx.fillStyle = '#FEE2E2'
      ctx.fillText(`${fmtTime(start)} – ${fmtTime(end)}`, x + aw / 2, ay + 48)
    }
    drawAvoidMini(ax0, 'Rāhu Kāla', data.rahuKalam?.start, data.rahuKalam?.end)
    drawAvoidMini(ax0 + aw + ag, 'Gulika Kāla', data.gulikaKalam?.start, data.gulikaKalam?.end)
    drawAvoidMini(ax0 + 2 * (aw + ag), 'Yamagaṇḍa', data.yamaganda?.start, data.yamaganda?.end)
  }

  if (pageIndex === 0) {
    drawReelSlideUnderlay(ctx, colors, style, seedKey)
    const blockBottom = 655
    const blockH = blockBottom - 88
    const vy = getReelBodyVerticalOffset(88, blockH)
    ctx.save()
    ctx.translate(0, vy)
    drawPanchangSlideHero(ctx, colors, settings, vedaIcon, 'पञ्चाङ्ग', 'Daily Panchang — limbs & calendar')
    ctx.textAlign = 'center'
    ctx.font = 'bold 34px sans-serif'
    ctx.fillStyle = colors.text
    ctx.fillText(dateInfo.weekday, 540, 278)
    ctx.font = '24px sans-serif'
    ctx.fillStyle = colors.sub
    ctx.fillText(`${dateInfo.day} ${dateInfo.month} ${dateInfo.year}`, 540, 310)

    if (cc) {
      ctx.font = '17px serif'
      ctx.fillStyle = colors.accent
      const vs = cc.vikramSamvat != null ? `V.S. ${cc.vikramSamvat}` : ''
      const sh = cc.shakaYear != null ? `Śaka ${cc.shakaYear}` : ''
      const cal1 = [cc.samvatsara, vs, sh].filter(Boolean).join('  ·  ')
      ctx.fillText(truncateSafe(cal1 || '—', 58), 540, 344)
      const masa = data.tithi?.paksha ? `${data.tithi.paksha}` : ''
      ctx.font = '15px serif'
      ctx.fillStyle = `${colors.accent}EE`
      ctx.fillText(
        truncateSafe(
          `${cc.sauraMasa || '—'} ${masa ? `(${masa})` : ''}  ·  ${cc.rituEn || cc.rituSa || ''}  ·  ${cc.ayanaEn || cc.ayanaSa || ''}`,
          58,
        ),
        540,
        368,
      )
    }

    ctx.font = '14px sans-serif'
    ctx.fillStyle = `${colors.sub}DD`
    ctx.fillText(truncateSafe(`Ayanāṃśa: ${data.ayanamsha || '—'}  ·  ${data.location?.tz || ''}`, 72), 540, 396)

    drawDivider(ctx, colors, 416, 920)

    const gap = 8
    const cardW = (900 - gap * 4) / 5
    const startX = 90
    const rowY = 448
    const limbH = 112
    limbSpecs.forEach((item, i) => {
      const x = startX + i * (cardW + gap)
      drawLimbTile(ctx, colors, x, rowY, cardW, limbH, item.label, item.value, item.lines)
    })

    drawDivider(ctx, colors, 590, 920)
    ctx.font = '16px sans-serif'
    ctx.fillStyle = colors.sub
    ctx.fillText('Swipe for Sun · Moon, muhūrtas, doṣa periods, Horā & grahas.', 540, 630)
    ctx.restore()
    drawCarouselSlideBadge(ctx, colors, pageIndex + 1, totalPages)
    drawCarouselCompactFooter(ctx, colors, settings)
    return
  }

  if (pageIndex === 1) {
    drawReelSlideUnderlay(ctx, colors, style, seedKey)
    const vy = getReelBodyVerticalOffset(88, 880)
    ctx.save()
    ctx.translate(0, vy)
    drawPanchangSlideHero(ctx, colors, settings, vedaIcon, 'पञ्चाङ्ग · II', 'Sun & Moon — luminaries & key muhūrtas')
    ctx.textAlign = 'center'
    ctx.font = '20px sans-serif'
    ctx.fillStyle = colors.sub
    ctx.fillText(`${dateInfo.weekday}, ${dateInfo.day} ${dateInfo.month} ${dateInfo.year}`, 540, 278)

    let rowY = 318
    sectionLabel(ctx, colors, rowY, 'Sun & Moon (sidereal)')
    rowY += 28
    const sunNak =
      data.sunNakshatra?.name != null
        ? `Sun nakṣatra: ${data.sunNakshatra.name} · pada ${data.sunNakshatra.pada} · ${data.sunNakshatra.lord}`
        : ''
    drawRashiBox(90, rowY, 'Sun (Sūrya)', data.sunRashi?.en || '—', data.sunRashi?.sa || '—', degFmt(data.sunRashi?.degInSign))
    drawRashiBox(
      90 + boxW + boxGap,
      rowY,
      'Moon (Chandra)',
      data.moonRashi?.en || '—',
      data.moonRashi?.sa || '—',
      degFmt(data.moonRashi?.degInSign),
    )
    rowY += boxH + 14
    ctx.font = '13px sans-serif'
    ctx.fillStyle = `${colors.sub}CC`
    if (sunNak) ctx.fillText(truncate(sunNak, 78), 540, rowY)
    rowY += sunNak ? 28 : 12

    drawDivider(ctx, colors, rowY, 920)
    rowY += 22
    sectionLabel(ctx, colors, rowY, 'Sunrise · Sunset · Moon')
    rowY += 28
    ctx.font = 'bold 30px sans-serif'
    ctx.fillStyle = colors.text
    ctx.fillText(`${fmtTime(data.sunrise)}  ·  ${fmtTime(data.sunset)}`, 540, rowY)
    rowY += 36
    ctx.font = '18px sans-serif'
    ctx.fillStyle = colors.sub
    ctx.fillText(
      `Moonrise ${data.moonrise ? fmtTime(data.moonrise) : '—'}  ·  Moonset ${data.moonset ? fmtTime(data.moonset) : '—'}`,
      540,
      rowY,
    )
    rowY += 40

    drawDivider(ctx, colors, rowY, 920)
    rowY += 22
    sectionLabel(ctx, colors, rowY, 'Key muhūrtas')
    rowY += 28
    rowY = drawKeyTimeStrip(ctx, colors, rowY, data) + 16
    ctx.restore()
    drawCarouselSlideBadge(ctx, colors, pageIndex + 1, totalPages)
    drawCarouselCompactFooter(ctx, colors, settings)
    return
  }

  if (pageIndex === 2) {
    drawReelSlideUnderlay(ctx, colors, style, seedKey)
    const vy = getReelBodyVerticalOffset(88, 1100)
    ctx.save()
    ctx.translate(0, vy)
    drawPanchangSlideHero(ctx, colors, settings, vedaIcon, 'पञ्चाङ्ग · III', 'Doṣa periods & Choghadiya')
    ctx.font = '20px sans-serif'
    ctx.fillStyle = colors.sub
    ctx.fillText(`${dateInfo.weekday}, ${dateInfo.day} ${dateInfo.month}`, 540, 278)

    let rowY = 318
    sectionLabel(ctx, colors, rowY, 'Avoid today')
    rowY += 28
    drawAvoidRow(rowY)
    rowY += 92

    if (data.riktaTithi?.active) {
      drawDivider(ctx, colors, rowY, 920)
      rowY += 18
      ctx.save()
      ctx.fillStyle = 'rgba(234,179,8,0.12)'
      roundRect(ctx, 90, rowY, 900, 44, 10)
      ctx.fill()
      ctx.restore()
      ctx.textAlign = 'center'
      ctx.font = '15px sans-serif'
      ctx.fillStyle = '#FDE68A'
      ctx.fillText(truncateSafe(`Rikta tithi: ${data.riktaTithi.detail}`, 78), 540, rowY + 28)
      rowY += 58
    }

    drawDivider(ctx, colors, rowY, 920)
    rowY += 22

    const chozDay = data.choghadiya?.day || []
    if (chozDay.length > 0) {
      sectionLabel(ctx, colors, rowY, 'Choghadiya — day')
      rowY += 28
      chozDay.forEach((slot, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const x = 90 + col * 470
        const yy = rowY + row * 132
        const colC = CHOGHADIYA_COLORS[slot.name] || colors.accent
        const meaning = CHOGHADIYA_MEANING[slot.name] || ''
        ctx.save()
        ctx.fillStyle = `${colC}18`
        roundRect(ctx, x, yy, 440, 118, 12)
        ctx.strokeStyle = `${colC}55`
        ctx.lineWidth = 1.1
        roundRect(ctx, x, yy, 440, 118, 12)
        ctx.stroke()
        ctx.restore()
        ctx.textAlign = 'left'
        ctx.font = 'bold 24px sans-serif'
        ctx.fillStyle = colC
        ctx.fillText(slot.name, x + 16, yy + 32)
        ctx.font = '16px sans-serif'
        ctx.fillStyle = colors.sub
        ctx.fillText(`${fmtTime(slot.start)} – ${fmtTime(slot.end)} · ${slot.quality}`, x + 16, yy + 58)
        ctx.font = '14px sans-serif'
        ctx.fillStyle = `${colors.sub}AA`
        ctx.fillText(truncate(meaning, 48), x + 16, yy + 84)
      })
      rowY += Math.ceil(chozDay.length / 2) * 132 + 8
    }

    drawDivider(ctx, colors, rowY, 920)
    rowY += 22
    const chozNight = data.choghadiya?.night || []
    if (chozNight.length > 0) {
      sectionLabel(ctx, colors, rowY, 'Choghadiya — night')
      rowY += 28
      chozNight.forEach((slot, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const x = 90 + col * 470
        const yy = rowY + row * 96
        const colC = CHOGHADIYA_COLORS[slot.name] || '#94A3B8'
        ctx.save()
        ctx.fillStyle = 'rgba(148,163,184,0.12)'
        roundRect(ctx, x, yy, 440, 82, 10)
        ctx.strokeStyle = `${colC}44`
        ctx.lineWidth = 1
        roundRect(ctx, x, yy, 440, 82, 10)
        ctx.stroke()
        ctx.restore()
        ctx.textAlign = 'left'
        ctx.font = 'bold 20px sans-serif'
        ctx.fillStyle = colors.text
        ctx.fillText(slot.name, x + 14, yy + 30)
        ctx.font = '15px sans-serif'
        ctx.fillStyle = colors.sub
        ctx.fillText(`${fmtTime(slot.start)} – ${fmtTime(slot.end)}`, x + 14, yy + 58)
      })
    }
    ctx.restore()
    drawCarouselSlideBadge(ctx, colors, pageIndex + 1, totalPages)
    drawCarouselCompactFooter(ctx, colors, settings)
    return
  }

  if (pageIndex === 3) {
    drawReelSlideUnderlay(ctx, colors, style, seedKey)
    const vy = getReelBodyVerticalOffset(88, 1050)
    ctx.save()
    ctx.translate(0, vy)
    drawPanchangSlideHero(ctx, colors, settings, vedaIcon, 'पञ्चाङ्ग · IV', 'Horā table & nine grahas')
    ctx.font = '20px sans-serif'
    ctx.fillStyle = colors.sub
    ctx.fillText(`${dateInfo.weekday}, ${dateInfo.day} ${dateInfo.month}`, 540, 278)

    let rowY = 318
    const horasDay = (data.horaTable || []).filter((h) => h.isDaytime)
    if (horasDay.length > 0) {
      sectionLabel(ctx, colors, rowY, 'Day Horā (planetary hours)')
      rowY += 28
      const cols = 3
      const hw = 280
      const hg = 20
      const hh = 46
      const vGap = 7
      horasDay.forEach((h, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        const x = 90 + col * (hw + hg)
        const yy = rowY + row * (hh + vGap)
        ctx.save()
        ctx.fillStyle = `${colors.accent}0d`
        roundRect(ctx, x, yy, hw, hh, 9)
        ctx.strokeStyle = `${colors.accent}28`
        ctx.lineWidth = 1
        roundRect(ctx, x, yy, hw, hh, 9)
        ctx.stroke()
        ctx.restore()
        ctx.textAlign = 'left'
        ctx.font = 'bold 15px sans-serif'
        ctx.fillStyle = colors.accent
        ctx.fillText(h.lord, x + 10, yy + 20)
        ctx.font = '12px sans-serif'
        ctx.fillStyle = colors.sub
        ctx.fillText(`${fmtTime(h.start)} – ${fmtTime(h.end)}`, x + 10, yy + 38)
      })
      rowY += Math.ceil(horasDay.length / cols) * (hh + vGap) + 16
    }

    const horasNight = (data.horaTable || []).filter((h) => !h.isDaytime)
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
      rowY += Math.ceil(horasNight.length / ncols) * (nh + 6) + 12
    }

    drawDivider(ctx, colors, rowY, 920)
    rowY += 22
    sectionLabel(ctx, colors, rowY, 'Grahas (sidereal longitudes)')
    rowY += 28
    const planets = (data.planets || []).slice(0, 9)
    const colW = 300
    const planetRowPitch = 36
    planets.forEach((p, i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const x = 90 + col * colW
      const yy = rowY + row * planetRowPitch
      ctx.textAlign = 'left'
      ctx.font = '15px sans-serif'
      const retro = p.retro ? ' ℞' : ''
      const comb = p.combust ? ' ○' : ''
      ctx.fillStyle = colors.text
      const line = `${p.sa} · ${p.rashiSa} ${degFmt(p.degInSign)}${retro}${comb}`
      ctx.fillText(truncate(line, 34), x, yy + 20)
    })
    ctx.restore()
    drawCarouselSlideBadge(ctx, colors, pageIndex + 1, totalPages)
    drawCarouselCompactFooter(ctx, colors, settings)
    return
  }

  drawReelSlideUnderlay(ctx, colors, style, seedKey)
  const vy = getReelBodyVerticalOffset(88, 780)
  ctx.save()
  ctx.translate(0, vy)
  drawPanchangSlideHero(ctx, colors, settings, vedaIcon, 'पञ्चाङ्ग · V', 'Moon nakṣatra — qualities & note')
  ctx.font = '20px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText(`${dateInfo.weekday}, ${dateInfo.day} ${dateInfo.month}`, 540, 278)

  const nakIdx = data.nakshatra?.index ?? 0
  let rowY = 330
  sectionLabel(ctx, colors, rowY, 'Moon nakṣatra — qualities')
  rowY += 28
  ctx.textAlign = 'center'
  ctx.font = 'bold 28px serif'
  ctx.fillStyle = colors.text
  ctx.fillText(`${data.nakshatra?.name || '—'} (pada ${data.nakshatra?.pada ?? '—'})`, 540, rowY)
  rowY += 36
  ctx.font = '17px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText(
    truncate(`Devatā: ${NAK_DEITY[nakIdx] || '—'}  ·  Guṇa: ${NAK_QUALITY[nakIdx] || '—'}  ·  Lord: ${data.nakshatra?.lord || '—'}`, 68),
    540,
    rowY,
  )
  rowY += 44
  drawDivider(ctx, colors, rowY, 920)
  rowY += 36
  ctx.font = '17px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText('Pañcāṅga varies by location & siddhānta — verify for muhūrta decisions.', 540, rowY)
  rowY += 36
  ctx.fillText(truncate(settings.ctaLine, 72), 540, rowY)
  rowY += 48
  drawDivider(ctx, colors, rowY, 920)
  ctx.restore()
  drawCarouselSlideBadge(ctx, colors, pageIndex + 1, totalPages)
  drawBrandFooter(ctx, colors, settings, 1710)
  drawHashtagFooter(ctx, colors, settings, 1760)
}
