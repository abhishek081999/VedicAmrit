// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dignity.ts
//  Planetary dignity tables: exaltation, debilitation,
//  own sign, moolatrikona, friendships
//  Source: Brihat Parashara Hora Shastra
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi, Dignity } from '@/types/astrology'

// ── Exaltation signs and exact degrees ───────────────────────

export const EXALTATION_SIGN: Record<GrahaId, Rashi> = {
  Su: 1,   // Aries (exact: 10°)
  Mo: 2,   // Taurus (exact: 3°)
  Ma: 10,  // Capricorn (exact: 28°)
  Me: 6,   // Virgo (exact: 15°)
  Ju: 4,   // Cancer (exact: 5°)
  Ve: 12,  // Pisces (exact: 27°)
  Sa: 7,   // Libra (exact: 20°)
  Ra: 2,   // Taurus (traditional: Gemini in some schools)
  Ke: 8,   // Scorpio (opposite of Rahu)
}

export const EXALTATION_DEGREE: Partial<Record<GrahaId, number>> = {
  Su: 10, Mo: 3, Ma: 28, Me: 15, Ju: 5, Ve: 27, Sa: 20,
}

export const DEBILITATION_SIGN: Record<GrahaId, Rashi> = {
  Su: 7,   // Libra
  Mo: 8,   // Scorpio
  Ma: 4,   // Cancer
  Me: 12,  // Pisces
  Ju: 10,  // Capricorn
  Ve: 6,   // Virgo
  Sa: 1,   // Aries
  Ra: 8,   // Scorpio
  Ke: 2,   // Taurus
}

// ── Own signs (Swakshetra) ────────────────────────────────────

export const OWN_SIGNS: Record<GrahaId, Rashi[]> = {
  Su: [5],           // Leo
  Mo: [4],           // Cancer
  Ma: [1, 8],        // Aries, Scorpio
  Me: [3, 6],        // Gemini, Virgo
  Ju: [9, 12],       // Sagittarius, Pisces
  Ve: [2, 7],        // Taurus, Libra
  Sa: [10, 11],      // Capricorn, Aquarius
  Ra: [],            // No own sign
  Ke: [],
}

// ── Moolatrikona signs and degree ranges ──────────────────────

export const MOOLATRIKONA_SIGN: Partial<Record<GrahaId, Rashi>> = {
  Su: 5,   // Leo (0°–20°)
  Mo: 2,   // Taurus (4°–20°) — some texts: 4–30°
  Ma: 1,   // Aries (0°–12°)
  Me: 6,   // Virgo (15°–20°)
  Ju: 9,   // Sagittarius (0°–10°)
  Ve: 7,   // Libra (0°–15°)
  Sa: 11,  // Aquarius (0°–20°)
}

export const MOOLATRIKONA_RANGE: Partial<Record<GrahaId, [number, number]>> = {
  Su: [0, 20],
  Mo: [4, 20],
  Ma: [0, 12],
  Me: [15, 20],
  Ju: [0, 10],
  Ve: [0, 15],
  Sa: [0, 20],
}

// ── Natural friendship table (Naisargika Maitri) ─────────────
// Source: BPHS Chapter 3

export const NATURAL_FRIENDS: Record<GrahaId, GrahaId[]> = {
  Su: ['Mo', 'Ma', 'Ju'],
  Mo: ['Su', 'Me'],
  Ma: ['Su', 'Mo', 'Ju'],
  Me: ['Su', 'Ve'],
  Ju: ['Su', 'Mo', 'Ma'],
  Ve: ['Me', 'Sa'],
  Sa: ['Me', 'Ve'],
  Ra: ['Ve', 'Sa'],
  Ke: ['Ve', 'Sa'],
}

export const NATURAL_ENEMIES: Record<GrahaId, GrahaId[]> = {
  Su: ['Ve', 'Sa'],
  Mo: ['Ra', 'Ke'],
  Ma: ['Me'],
  Me: ['Mo'],
  Ju: ['Me', 'Ve'],
  Ve: ['Su', 'Mo'],
  Sa: ['Su', 'Mo', 'Ma'],
  Ra: ['Su', 'Mo', 'Ma'],
  Ke: ['Su', 'Mo', 'Ma'],
}

// ── Dignity calculation ───────────────────────────────────────

/**
 * Get the dignity of a planet in a given sign and degree
 */
export function getDignity(
  graha: GrahaId,
  rashi: Rashi,
  degreeInSign: number,
): Dignity {
  // Exaltation (within orb of 3° of exact = "deepest exaltation")
  if (EXALTATION_SIGN[graha] === rashi) return 'exalted'

  // Debilitation
  if (DEBILITATION_SIGN[graha] === rashi) return 'debilitated'

  // Moolatrikona
  const mtrSign  = MOOLATRIKONA_SIGN[graha]
  const mtrRange = MOOLATRIKONA_RANGE[graha]
  if (
    mtrSign === rashi &&
    mtrRange &&
    degreeInSign >= mtrRange[0] &&
    degreeInSign <= mtrRange[1]
  ) {
    return 'moolatrikona'
  }

  // Own sign (also catches moolatrikona sign outside the range → 'own')
  if (OWN_SIGNS[graha]?.includes(rashi)) return 'own'

  return 'neutral'  // friends/enemies calculated separately in shadbala
}

/**
 * Get dignity for all grahas given their rashi placements
 */
export function getAllDignities(
  grahas: Array<{ id: GrahaId; rashi: Rashi; degree: number }>,
): Record<GrahaId, Dignity> {
  const result = {} as Record<GrahaId, Dignity>
  for (const g of grahas) {
    result[g.id] = getDignity(g.id, g.rashi, g.degree)
  }
  return result
}

/**
 * Is the planet combust (too close to Sun)?
 * Combustion orbs per BPHS
 */
const COMBUST_ORBS: Partial<Record<GrahaId, number>> = {
  Mo: 12, Ma: 17, Me: 14, Ju: 11, Ve: 10, Sa: 15,
}

export function isCombust(
  graha: GrahaId,
  planetLon: number,
  sunLon: number,
): boolean {
  const orb = COMBUST_ORBS[graha]
  if (!orb) return false
  let diff = Math.abs(planetLon - sunLon) % 360
  if (diff > 180) diff = 360 - diff
  return diff < orb
}

/**
 * Is a planet in its deepest exaltation (within 1° of exact degree)?
 */
export function isDeepExaltation(
  graha: GrahaId,
  rashi: Rashi,
  degreeInSign: number,
): boolean {
  if (EXALTATION_SIGN[graha] !== rashi) return false
  const exactDeg = EXALTATION_DEGREE[graha]
  if (exactDeg === undefined) return false
  return Math.abs(degreeInSign - exactDeg) <= 1
}

/**
 * Natural relationship between two planets
 */
export function naturalRelationship(
  graha: GrahaId,
  other: GrahaId,
): 'friend' | 'neutral' | 'enemy' {
  if (NATURAL_FRIENDS[graha]?.includes(other)) return 'friend'
  if (NATURAL_ENEMIES[graha]?.includes(other)) return 'enemy'
  return 'neutral'
}
