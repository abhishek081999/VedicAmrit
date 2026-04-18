import type { PanchangApiData } from '@/types/reel-panchang'
import type { ReelSettings } from '@/lib/reel/reel-settings'
import type { GrahaId } from '@/types/astrology'
import { GRAHA_SANSKRIT, NAKSHATRA_LORDS } from '@/types/astrology'
import {
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

export function drawNakshatraCard(
  ctx: CanvasRenderingContext2D,
  data: PanchangApiData,
  dateInfo: ReturnType<typeof formatDateDisplay>,
  style: ReelStyle,
  settings: ReelSettings,
  seedKey: string,
  vedaIcon?: HTMLImageElement | null,
) {
  const colors = getBgColors(style)
  const nakIdx = data.nakshatra?.index ?? 0
  const nakColor = NAK_COLOR[nakIdx] || colors.accent
  const pada = Math.min(4, Math.max(1, data.nakshatra?.pada ?? 1))
  const vimLord: GrahaId | undefined = NAKSHATRA_LORDS[nakIdx]
  const puru = PADA_PURUSHARTHA[pada - 1]

  drawGeometricBg(ctx, colors, style)
  drawStars(ctx, style, seedKey)

  ctx.textAlign = 'center'
  drawLogo(ctx, colors, 88, settings.brandTitle, vedaIcon)

  ctx.font = '15px sans-serif'
  ctx.fillStyle = `${colors.sub}DD`
  ctx.fillText(`${dateInfo.weekday}, ${dateInfo.day} ${dateInfo.month} ${dateInfo.year}`, 540, 158)

  drawDivider(ctx, colors, 176, 920)

  ctx.font = 'bold 64px serif'
  ctx.fillStyle = nakColor
  ctx.fillText(truncate(data.nakshatra?.name || 'Nakṣatra', 14), 540, 248)
  ctx.font = '20px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText('Moon’s lunar mansion (janma rāśi’s finer slice)', 540, 282)

  ctx.save()
  ctx.fillStyle = `${nakColor}22`
  roundRect(ctx, 120, 296, 840, 52, 18)
  ctx.strokeStyle = `${nakColor}55`
  ctx.lineWidth = 1.25
  roundRect(ctx, 120, 296, 840, 52, 18)
  ctx.stroke()
  ctx.restore()
  ctx.font = 'bold 18px sans-serif'
  ctx.fillStyle = nakColor
  const lord = data.nakshatra?.lord || '—'
  const moonR = data.moonRashi?.en || '—'
  const moonDeg = degFmt(data.moonRashi?.degInSign)
  ctx.fillText(`Lunar day ${nakIdx + 1} of 27  ·  Pada ${pada} of 4  ·  Vimśottari lord: ${lord}`, 540, 322)
  ctx.font = '15px sans-serif'
  ctx.fillStyle = `${colors.sub}EE`
  ctx.fillText(`Moon in ${moonR} (${data.moonRashi?.sa || '—'}) at ${moonDeg} in sign`, 540, 342)

  drawDivider(ctx, colors, 364, 920)

  ctx.font = '14px sans-serif'
  ctx.fillStyle = colors.sub
  const panchangStrip = [
    data.tithi?.name ? `${data.tithi.name} (${data.tithi.paksha || '—'})` : '',
    data.vara?.name ? `Vāra: ${data.vara.name}` : '',
    data.tithi?.lord ? `Tithi lord: ${data.tithi.lord}` : '',
  ]
    .filter(Boolean)
    .join('  ·  ')
  if (panchangStrip) ctx.fillText(truncate(panchangStrip, 68), 540, 386)

  if (data.sunNakshatra?.name) {
    ctx.font = '13px sans-serif'
    ctx.fillStyle = `${colors.sub}BB`
    ctx.fillText(
      `Sun nakṣatra: ${data.sunNakshatra.name} · pada ${data.sunNakshatra.pada} · lord ${data.sunNakshatra.lord}`,
      540,
      408,
    )
  }

  drawDivider(ctx, colors, 428, 920)

  ctx.save()
  ctx.beginPath()
  ctx.arc(540, 568, 138, 0, Math.PI * 2)
  const orb = ctx.createRadialGradient(540, 568, 40, 540, 568, 160)
  orb.addColorStop(0, `${nakColor}35`)
  orb.addColorStop(0.55, `${nakColor}12`)
  orb.addColorStop(1, 'transparent')
  ctx.fillStyle = orb
  ctx.fill()
  ctx.strokeStyle = `${nakColor}45`
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(540, 568, 98, 0, Math.PI * 2)
  ctx.strokeStyle = `${nakColor}28`
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.restore()

  ctx.font = '72px serif'
  ctx.fillStyle = nakColor
  ctx.fillText('✦', 540, 586)

  ctx.font = 'bold 22px sans-serif'
  ctx.fillStyle = colors.text
  ctx.fillText(`Symbol: ${truncate(NAK_SYMBOL[nakIdx] || '—', 42)}`, 540, 722)

  drawDivider(ctx, colors, 748, 920)

  sectionLabel(ctx, colors, 766, 'Core attributes')
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
  const ty = 786
  tiles.forEach((t, i) => {
    const x = tx0 + i * (tw + tg)
    ctx.save()
    ctx.fillStyle = `${nakColor}14`
    roundRect(ctx, x, ty, tw, 96, 12)
    ctx.strokeStyle = `${nakColor}40`
    ctx.lineWidth = 1
    roundRect(ctx, x, ty, tw, 96, 12)
    ctx.stroke()
    ctx.restore()
    ctx.textAlign = 'center'
    ctx.font = '13px sans-serif'
    ctx.fillStyle = colors.sub
    ctx.fillText(t.k, x + tw / 2, ty + 24)
    ctx.font = 'bold 17px serif'
    ctx.fillStyle = colors.text
    const vs = t.v.length > 22 ? `${t.v.slice(0, 20)}…` : t.v
    ctx.fillText(vs, x + tw / 2, ty + 56)
  })

  drawDivider(ctx, colors, 898, 920)
  sectionLabel(ctx, colors, 916, 'Pada & life-area tone')
  ctx.font = '17px sans-serif'
  ctx.fillStyle = colors.text
  ctx.fillText(
    `Pada ${pada} often read with a ${puru} flavour in classical timing texts (simplified reel note).`,
    540,
    944,
  )
  ctx.font = '14px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText(`Full chart work still needs lagna, daśā, and transits — this card highlights the Moon’s field only.`, 540, 972)

  drawDivider(ctx, colors, 996, 920)

  sectionLabel(ctx, colors, 1014, 'Favourable flavour today')
  ctx.save()
  ctx.fillStyle = `${colors.accent}10`
  roundRect(ctx, 72, 1032, 936, 168, 16)
  ctx.strokeStyle = `${nakColor}35`
  ctx.lineWidth = 1.25
  roundRect(ctx, 72, 1032, 936, 168, 16)
  ctx.stroke()
  ctx.restore()
  ctx.textAlign = 'center'
  ctx.font = '22px sans-serif'
  ctx.fillStyle = colors.text
  wrapText(ctx, NAK_BEST_FOR[nakIdx] || '—', 540, 1070, 880, 32)

  drawDivider(ctx, colors, 1218, 920)
  sectionLabel(ctx, colors, 1236, 'Times to ease intensity')
  const avoid = [
    { label: 'Rāhu Kāla', start: data.rahuKalam?.start, end: data.rahuKalam?.end },
    { label: 'Yamagaṇḍa', start: data.yamaganda?.start, end: data.yamaganda?.end },
    { label: 'Gulika Kāla', start: data.gulikaKalam?.start, end: data.gulikaKalam?.end },
  ]
  const aw = 292
  const ag = 12
  const ax = (1080 - (3 * aw + 2 * ag)) / 2
  const ay = 1256
  avoid.forEach((a, i) => {
    const x = ax + i * (aw + ag)
    ctx.save()
    ctx.fillStyle = 'rgba(220,38,38,0.11)'
    roundRect(ctx, x, ay, aw, 76, 12)
    ctx.strokeStyle = 'rgba(248,113,113,0.32)'
    ctx.lineWidth = 1
    roundRect(ctx, x, ay, aw, 76, 12)
    ctx.stroke()
    ctx.restore()
    ctx.textAlign = 'center'
    ctx.font = '15px sans-serif'
    ctx.fillStyle = '#FCA5A5'
    ctx.fillText(a.label, x + aw / 2, ay + 26)
    ctx.font = 'bold 17px sans-serif'
    ctx.fillStyle = '#FEE2E2'
    ctx.fillText(`${fmtTime(a.start)} – ${fmtTime(a.end)}`, x + aw / 2, ay + 54)
  })

  drawDivider(ctx, colors, 1356, 920)

  ctx.font = '200px serif'
  ctx.fillStyle = `${nakColor}0C`
  ctx.fillText(`${nakIdx + 1}`, 540, 1520)

  ctx.font = '16px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText('Use nakṣatra with tithi, vāra, and muhūrta for fine electional work.', 540, 1608)
  ctx.font = '15px sans-serif'
  ctx.fillStyle = `${colors.sub}CC`
  ctx.fillText(truncate(settings.ctaLine, 72), 540, 1636)

  const footerY = 1692
  drawDivider(ctx, colors, footerY, 920)
  drawBrandFooter(ctx, colors, settings, footerY + 48)
  drawHashtagFooter(ctx, colors, settings, footerY + 98)
}
