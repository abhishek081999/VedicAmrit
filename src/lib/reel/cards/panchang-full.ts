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
  truncate,
  type ReelStyle,
  formatDateDisplay,
} from '@/lib/reel/canvas-utils'
import { NAK_DEITY, NAK_QUALITY } from '@/lib/reel/nakshatra-metadata'

function sectionLabel(ctx: CanvasRenderingContext2D, colors: ReturnType<typeof getBgColors>, y: number, text: string) {
  ctx.save()
  ctx.textAlign = 'center'
  ctx.font = 'bold 12px sans-serif'
  ctx.fillStyle = colors.accent
  ctx.letterSpacing = '0.1em'
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

export function drawPanchangFullCard(
  ctx: CanvasRenderingContext2D,
  data: PanchangApiData,
  dateInfo: ReturnType<typeof formatDateDisplay>,
  style: ReelStyle,
  settings: ReelSettings,
  seedKey: string,
  vedaIcon?: HTMLImageElement | null,
) {
  const colors = getBgColors(style)
  const cc = data.calendarContext

  drawGeometricBg(ctx, colors, style)
  drawStars(ctx, style, seedKey)
  ctx.textAlign = 'center'

  drawLogo(ctx, colors, 88, settings.brandTitle, vedaIcon)

  ctx.font = 'bold 52px serif'
  ctx.fillStyle = colors.accent
  ctx.fillText('पञ्चाङ्ग', 540, 192)
  ctx.font = '24px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText('Daily Panchang — full day snapshot', 540, 226)

  drawDivider(ctx, colors, 244, 920)

  ctx.font = 'bold 36px sans-serif'
  ctx.fillStyle = colors.text
  ctx.fillText(dateInfo.weekday, 540, 286)
  ctx.font = '24px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText(`${dateInfo.day} ${dateInfo.month} ${dateInfo.year}`, 540, 316)

  if (cc) {
    ctx.font = '17px serif'
    ctx.fillStyle = colors.accent
    const vs = cc.vikramSamvat != null ? `V.S. ${cc.vikramSamvat}` : ''
    const sh = cc.shakaYear != null ? `Śaka ${cc.shakaYear}` : ''
    const cal1 = [cc.samvatsara, vs, sh].filter(Boolean).join('  ·  ')
    ctx.fillText(truncateSafe(cal1 || '—', 58), 540, 342)
    const masa = data.tithi?.paksha ? `${data.tithi.paksha}` : ''
    ctx.font = '15px serif'
    ctx.fillStyle = `${colors.accent}EE`
    ctx.fillText(
      truncateSafe(
        `${cc.sauraMasa || '—'} ${masa ? `(${masa})` : ''}  ·  ${cc.rituEn || cc.rituSa || ''}  ·  ${cc.ayanaEn || cc.ayanaSa || ''}`,
        58,
      ),
      540,
      364,
    )
  }

  ctx.font = '14px sans-serif'
  ctx.fillStyle = `${colors.sub}DD`
  ctx.fillText(
    truncateSafe(`Ayanāṃśa: ${data.ayanamsha || '—'}  ·  ${data.location?.tz || ''}`, 72),
    540,
    386,
  )

  drawDivider(ctx, colors, 404, 920)

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

  const gap = 8
  const cardW = (900 - gap * 4) / 5
  const startX = 90
  let rowY = 418
  const limbH = 112
  limbSpecs.forEach((item, i) => {
    const x = startX + i * (cardW + gap)
    drawLimbTile(ctx, colors, x, rowY, cardW, limbH, item.label, item.value, item.lines)
  })
  rowY += limbH + 14

  drawDivider(ctx, colors, rowY, 920)
  rowY += 20

  sectionLabel(ctx, colors, rowY, 'Sun & Moon (sidereal)')
  rowY += 22

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
  rowY += boxH + 10

  ctx.textAlign = 'center'
  ctx.font = '13px sans-serif'
  ctx.fillStyle = `${colors.sub}CC`
  if (sunNak) ctx.fillText(truncate(sunNak, 78), 540, rowY)
  rowY += sunNak ? 22 : 8

  drawDivider(ctx, colors, rowY, 920)
  rowY += 18

  sectionLabel(ctx, colors, rowY, 'Sunrise · Sunset · Moon')
  rowY += 24
  ctx.font = 'bold 28px sans-serif'
  ctx.fillStyle = colors.text
  ctx.fillText(`${fmtTime(data.sunrise)}  ·  ${fmtTime(data.sunset)}`, 540, rowY)
  rowY += 30
  ctx.font = '17px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText(
    `Moonrise ${data.moonrise ? fmtTime(data.moonrise) : '—'}  ·  Moonset ${data.moonset ? fmtTime(data.moonset) : '—'}`,
    540,
    rowY,
  )
  rowY += 28

  drawDivider(ctx, colors, rowY, 920)
  rowY += 18

  sectionLabel(ctx, colors, rowY, 'Key muhūrtas')
  rowY += 22
  rowY = drawKeyTimeStrip(ctx, colors, rowY, data) + 10

  drawDivider(ctx, colors, rowY, 920)
  rowY += 18

  sectionLabel(ctx, colors, rowY, 'Avoid today')
  rowY += 22
  const aw = 280
  const ag = 15
  const ax0 = 90
  const ay = rowY
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
  rowY += 78

  if (data.riktaTithi?.active) {
    drawDivider(ctx, colors, rowY + 4, 920)
    rowY += 16
    ctx.save()
    ctx.fillStyle = 'rgba(234,179,8,0.12)'
    roundRect(ctx, 90, rowY, 900, 40, 10)
    ctx.fill()
    ctx.restore()
    ctx.textAlign = 'center'
    ctx.font = '15px sans-serif'
    ctx.fillStyle = '#FDE68A'
    ctx.fillText(truncateSafe(`Rikta tithi: ${data.riktaTithi.detail}`, 78), 540, rowY + 26)
    rowY += 48
  }

  drawDivider(ctx, colors, rowY, 920)
  rowY += 18

  const chozDay = (data.choghadiya?.day || []).slice(0, 4)
  if (chozDay.length > 0) {
    sectionLabel(ctx, colors, rowY, 'Choghadiya — day (first slots)')
    rowY += 24
    chozDay.forEach((slot, i) => {
      const x = 90 + i * 225
      const yy = rowY
      const col = CHOGHADIYA_COLORS[slot.name] || colors.accent
      const meaning = CHOGHADIYA_MEANING[slot.name] || ''
      ctx.save()
      ctx.fillStyle = `${col}18`
      roundRect(ctx, x, yy, 200, 72, 11)
      ctx.strokeStyle = `${col}55`
      ctx.lineWidth = 1.1
      roundRect(ctx, x, yy, 200, 72, 11)
      ctx.stroke()
      ctx.restore()
      ctx.textAlign = 'center'
      ctx.font = 'bold 19px sans-serif'
      ctx.fillStyle = col
      ctx.fillText(slot.name, x + 100, yy + 24)
      ctx.font = '13px sans-serif'
      ctx.fillStyle = colors.sub
      ctx.fillText(`${fmtTime(slot.start)} – ${fmtTime(slot.end)} · ${slot.quality}`, x + 100, yy + 44)
      ctx.font = '11px sans-serif'
      ctx.fillStyle = `${colors.sub}BB`
      ctx.fillText(truncate(meaning, 30), x + 100, yy + 62)
    })
    rowY += 86
  }

  const chozNight = (data.choghadiya?.night || []).slice(0, 4)
  if (chozNight.length > 0 && rowY < 1280) {
    drawDivider(ctx, colors, rowY + 4, 920)
    rowY += 20
    sectionLabel(ctx, colors, rowY, 'Choghadiya — night (first slots)')
    rowY += 22
    chozNight.forEach((slot, i) => {
      const x = 90 + i * 225
      const yy = rowY
      const col = CHOGHADIYA_COLORS[slot.name] || '#94A3B8'
      ctx.save()
      ctx.fillStyle = 'rgba(148,163,184,0.12)'
      roundRect(ctx, x, yy, 200, 48, 10)
      ctx.strokeStyle = `${col}44`
      ctx.lineWidth = 1
      roundRect(ctx, x, yy, 200, 48, 10)
      ctx.stroke()
      ctx.restore()
      ctx.textAlign = 'center'
      ctx.font = 'bold 16px sans-serif'
      ctx.fillStyle = colors.text
      ctx.fillText(slot.name, x + 100, yy + 22)
      ctx.font = '12px sans-serif'
      ctx.fillStyle = colors.sub
      ctx.fillText(`${fmtTime(slot.start)} – ${fmtTime(slot.end)}`, x + 100, yy + 40)
    })
    rowY += 58
  }

  drawDivider(ctx, colors, rowY, 920)
  rowY += 18

  const horasDay = (data.horaTable || []).filter((h) => h.isDaytime)
  const maxH = rowY < 1200 ? 12 : 9
  if (horasDay.length > 0) {
    sectionLabel(ctx, colors, rowY, 'Day Horā (planetary hours)')
    rowY += 24
    const cols = 3
    const hw = 280
    const hg = 20
    const hh = 46
    const vGap = 7
    horasDay.slice(0, maxH).forEach((h, i) => {
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
    rowY += Math.ceil(Math.min(horasDay.length, maxH) / cols) * (hh + vGap) + 10
  }

  drawDivider(ctx, colors, rowY, 920)
  rowY += 18

  sectionLabel(ctx, colors, rowY, 'Grahas (sidereal longitudes)')
  rowY += 24
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
  rowY += Math.ceil(planets.length / 3) * planetRowPitch + 12

  drawDivider(ctx, colors, rowY + 4, 920)
  rowY += 20

  const nakIdx = data.nakshatra?.index ?? 0
  sectionLabel(ctx, colors, rowY, 'Moon nakṣatra — qualities')
  rowY += 24
  ctx.textAlign = 'center'
  ctx.font = 'bold 20px serif'
  ctx.fillStyle = colors.text
  ctx.fillText(`${data.nakshatra?.name || '—'} (pada ${data.nakshatra?.pada ?? '—'})`, 540, rowY)
  rowY += 28
  ctx.font = '15px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText(
    truncate(`Devatā: ${NAK_DEITY[nakIdx] || '—'}  ·  Guṇa: ${NAK_QUALITY[nakIdx] || '—'}  ·  Lord: ${data.nakshatra?.lord || '—'}`, 68),
    540,
    rowY,
  )
  rowY += 30

  drawDivider(ctx, colors, rowY + 8, 920)
  rowY += 28

  ctx.textAlign = 'center'
  ctx.font = '15px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText('Pañcāṅga varies by location & siddhānta — verify for muhūrta decisions.', 540, rowY)
  rowY += 26
  ctx.fillText(truncate(settings.ctaLine, 72), 540, rowY)
  rowY += 32

  const footerDividerY = Math.max(1660, rowY + 14)
  drawDivider(ctx, colors, footerDividerY, 920)
  drawBrandFooter(ctx, colors, settings, footerDividerY + 48)
  drawHashtagFooter(ctx, colors, settings, footerDividerY + 98)
}
