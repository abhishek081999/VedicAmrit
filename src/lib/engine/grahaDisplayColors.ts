// Fixed colors for graha labels on charts (not dignity / avastha based).
import type { GrahaId } from '@/types/astrology'

export const GRAHA_DISPLAY_COLOR: Record<GrahaId, string> = {
  Su: '#FF8C00',
  Mo: '#A8C8E8',
  Ma: '#E84040',
  Me: '#48C774',
  Ju: '#FFD700',
  Ve: '#FF69B4',
  Sa: '#8B9DC3',
  Ra: '#8B4513',
  Ke: '#9B59B6',
  Ur: '#00CED1',
  Ne: '#4169E1',
  Pl: '#800000',
}

/** SVG / chart text: each planet has a fixed color; AS uses lagna accent. */
export function grahaChartFill(id: string): string {
  if (id === 'AS') return 'var(--text-gold, #c9a84c)'
  return GRAHA_DISPLAY_COLOR[id as GrahaId] ?? 'var(--text-secondary, #aaaaaa)'
}
