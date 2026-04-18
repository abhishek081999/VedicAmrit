import type { GrahaId } from '@/types/astrology'

/** Classical + Unicode astronomy glyphs; renders well in most system fonts. */
const GLYPH: Record<string, string> = {
  Su: '\u2609',
  Mo: '\u263D',
  Ma: '\u2642',
  Me: '\u263F',
  Ju: '\u2643',
  Ve: '\u2640',
  Sa: '\u2644',
  Ra: '\u260A',
  Ke: '\u260B',
  Ur: '\u2645',
  Ne: '\u2646',
  Pl: '\u2647',
}

export const NAVAGRAHA_ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

type DiskStyle = { highlight: string; shadow: string; ring: string; glyph: string }

const DISK: Record<string, DiskStyle> = {
  Su: { highlight: '#FDE68A', shadow: '#B45309', ring: '#FBBF24', glyph: '#1C1917' },
  Mo: { highlight: '#E0E7FF', shadow: '#4338CA', ring: '#A5B4FC', glyph: '#1E1B4B' },
  Ma: { highlight: '#FECACA', shadow: '#991B1B', ring: '#F87171', glyph: '#450A0A' },
  Me: { highlight: '#DDD6FE', shadow: '#5B21B6', ring: '#A78BFA', glyph: '#2E1065' },
  Ju: { highlight: '#FEF3C7', shadow: '#B45309', ring: '#F59E0B', glyph: '#422006' },
  Ve: { highlight: '#FBCFE8', shadow: '#9D174D', ring: '#F472B6', glyph: '#500724' },
  Sa: { highlight: '#CBD5E1', shadow: '#334155', ring: '#94A3B8', glyph: '#0F172A' },
  Ra: { highlight: '#EDE9FE', shadow: '#4C1D95', ring: '#8B5CF6', glyph: '#2E1065' },
  Ke: { highlight: '#E2E8F0', shadow: '#475569', ring: '#64748B', glyph: '#0F172A' },
  Ur: { highlight: '#CFFAFE', shadow: '#0E7490', ring: '#22D3EE', glyph: '#164E63' },
  Ne: { highlight: '#BFDBFE', shadow: '#1E40AF', ring: '#60A5FA', glyph: '#172554' },
  Pl: { highlight: '#E9D5FF', shadow: '#6B21A8', ring: '#C084FC', glyph: '#3B0764' },
}

const DEFAULT_DISK: DiskStyle = {
  highlight: '#E2E8F0',
  shadow: '#475569',
  ring: '#94A3B8',
  glyph: '#0F172A',
}

export function sortNavagrahas<T extends { id: GrahaId }>(rows: T[]): T[] {
  const order = new Map(NAVAGRAHA_ORDER.map((id, i) => [id, i]))
  return [...rows].sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99))
}

export function drawPlanetDisk(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  id: GrahaId,
) {
  const st = DISK[id] || DEFAULT_DISK
  const g = ctx.createRadialGradient(cx - radius * 0.35, cy - radius * 0.35, radius * 0.15, cx, cy, radius * 1.05)
  g.addColorStop(0, st.highlight)
  g.addColorStop(0.55, st.shadow)
  g.addColorStop(1, `${st.shadow}EE`)

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fillStyle = g
  ctx.fill()
  ctx.strokeStyle = st.ring
  ctx.lineWidth = 2.25
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, cy, radius * 0.88, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold ${Math.round(radius * 1.55)}px "Segoe UI Symbol", "Noto Sans Symbols", "DejaVu Sans", serif`
  ctx.fillStyle = st.glyph
  ctx.fillText(GLYPH[id] || '●', cx, cy + radius * 0.04)
  ctx.restore()
}
