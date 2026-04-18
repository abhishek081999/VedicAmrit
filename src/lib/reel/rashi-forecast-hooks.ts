import type { Rashi } from '@/types/astrology'

/** Short hook line per ascendant / forecast sign (hybrid with live transit text). */
export const RASHI_FORECAST_HOOK: Record<Rashi, string> = {
  1: 'Aries: lead with courage; pace big commitments.',
  2: 'Taurus: stabilize resources; refine comfort vs. excess.',
  3: 'Gemini: sharpen messaging; short journeys favor learning.',
  4: 'Cancer: nurture home base; emotional clarity ripples outward.',
  5: 'Leo: creative visibility; heart-led choices win trust.',
  6: 'Virgo: refine routines; health and craft get traction.',
  7: 'Libra: balance contracts; partnerships need honest terms.',
  8: 'Scorpio: depth work; shared assets and trust themes.',
  9: 'Sagittarius: widen perspective; dharma and travel open doors.',
  10: 'Capricorn: career structure; long-game discipline pays.',
  11: 'Aquarius: networks and ideals; innovate without scattering.',
  12: 'Pisces: rest, intuition, release; compassion needs boundaries.',
}
