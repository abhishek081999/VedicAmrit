// ─────────────────────────────────────────────────────────────
//  src/lib/engine/mrityuBhaga.ts
//  Mṛtyu Bhāga - Death-Inflicting Degrees
//  Source: Phaladipika, Sarvartha Chintamani
// ─────────────────────────────────────────────────────────────

import type { Rashi, MrityuBhagaResult } from '@/types/astrology'

/**
 * Mṛtyu Bhāga (Death Degrees)
 * 
 * These are specific degrees in each sign that have a connection to
 * death, transformation, and major life changes. Planets at these
 * degrees can indicate:
 * - Health vulnerabilities
 * - Transformation periods
 * - Near-death experiences
 * - Major life transitions
 * 
 * The term "Mṛtyu" means death, but in Vedic astrology it often
 * refers to transformation and spiritual rebirth rather than
 * physical death.
 * 
 * Source: Phaladipika Chapter 4, Sarvartha Chintamani
 */

// Mṛtyu Bhāga degrees for each sign
// These are the exact degrees considered inauspicious for health/longevity
export const MRITYU_BHAGA_DEGREES: Record<Rashi, number> = {
  1:  19,   // Aries: 19°
  2:  7,    // Taurus: 7°
  3:  25,   // Gemini: 25°
  4:  13,   // Cancer: 13°
  5:  1,    // Leo: 1°
  6:  19,   // Virgo: 19°
  7:  7,    // Libra: 7°
  8:  25,   // Scorpio: 25°
  9:  13,   // Sagittarius: 13°
  10: 1,    // Capricorn: 1°
  11: 19,   // Aquarius: 19°
  12: 7,    // Pisces: 7°
}

// Alternative Mṛtyu Bhāga from different texts (Sarvartha Chintamani)
export const MRITYU_BHAGA_ALT: Record<Rashi, number> = {
  1:  10,   // Aries
  2:  22,   // Taurus
  3:  14,   // Gemini
  4:  26,   // Cancer
  5:  18,   // Leo
  6:  2,    // Virgo
  7:  22,   // Libra
  8:  14,   // Scorpio
  9:  6,    // Sagittarius
  10: 26,   // Capricorn
  11: 18,   // Aquarius
  12: 10,   // Pisces
}

// Orbs for Mṛtyu Bhāga detection
const MRITYU_ORB_EXACT = 0.5   // Within 0.5° is exact
const MRITYU_ORB_NEAR = 1.5    // Within 1.5° is near
const MRITYU_ORB_WIDE = 3.0    // Within 3° is wide

/**
 * Check if a planet is in Mṛtyu Bhāga
 * 
 * @param lonSidereal - Sidereal longitude of the planet
 * @param useAlt - Use alternative degrees from Sarvartha Chintamani
 * @returns MrityuBhagaResult with severity and interpretation
 */
export function checkMrityuBhaga(
  lonSidereal: number,
  useAlt = false,
): MrityuBhagaResult {
  const normalized = ((lonSidereal % 360) + 360) % 360
  const rashi = (Math.floor(normalized / 30) + 1) as Rashi
  const degreeInSign = normalized % 30
  
  const mrityuDegrees = useAlt ? MRITYU_BHAGA_ALT : MRITYU_BHAGA_DEGREES
  const mrityuDegree = mrityuDegrees[rashi]
  
  const distance = Math.abs(degreeInSign - mrityuDegree)
  
  // Check severity levels
  if (distance <= MRITYU_ORB_EXACT) {
    return {
      isMrityuBhaga: true,
      severity: 'exact',
      rashi,
      degreeInSign,
      mrityuDegree,
      distanceFromMrityu: distance,
      interpretation: 'Planet is at exact Mṛtyu Bhāga degree. This indicates significant transformation potential and health sensitivity. Strong spiritual practices and remedies are recommended.',
      remedy: 'Worship Lord Shiva or Mrityunjaya. Recite Maha Mrityunjaya Mantra. Perform Rudra Abhishekam.',
    }
  }
  
  if (distance <= MRITYU_ORB_NEAR) {
    return {
      isMrityuBhaga: true,
      severity: 'near',
      rashi,
      degreeInSign,
      mrityuDegree,
      distanceFromMrityu: distance,
      interpretation: 'Planet is near Mṛtyu Bhāga degree. Indicates potential for transformation and health awareness.',
      remedy: 'Regular prayers and health awareness. Consider Mrityunjaya Japa.',
    }
  }
  
  if (distance <= MRITYU_ORB_WIDE) {
    return {
      isMrityuBhaga: true,
      severity: 'wide',
      rashi,
      degreeInSign,
      mrityuDegree,
      distanceFromMrityu: distance,
      interpretation: 'Planet is in the wider Mṛtyu Bhāga zone. Minor health awareness suggested.',
      remedy: 'Maintain good health practices. Regular meditation.',
    }
  }
  
  return {
    isMrityuBhaga: false,
    severity: 'none',
    rashi,
    degreeInSign,
    mrityuDegree,
    distanceFromMrityu: distance,
    interpretation: null,
    remedy: null,
  }
}

/**
 * Check both Mṛtyu Bhāga systems
 */
export function checkMrityuBhagaBoth(lonSidereal: number): {
  primary: MrityuBhagaResult
  alternative: MrityuBhagaResult
} {
  return {
    primary: checkMrityuBhaga(lonSidereal, false),
    alternative: checkMrityuBhaga(lonSidereal, true),
  }
}

/**
 * Check Mṛtyu Bhāga for all grahas
 */
export function checkAllMrityuBhaga(
  grahas: Array<{ id: string; lonSidereal: number }>,
): Record<string, MrityuBhagaResult> {
  const result: Record<string, MrityuBhagaResult> = {}
  for (const g of grahas) {
    result[g.id] = checkMrityuBhaga(g.lonSidereal)
  }
  return result
}

/**
 * Get planets in Mṛtyu Bhāga from a chart
 */
export function getPlanetsInMrityuBhaga(
  grahas: Array<{ id: string; lonSidereal: number }>,
): Array<{ id: string; result: MrityuBhagaResult }> {
  const results: Array<{ id: string; result: MrityuBhagaResult }> = []
  
  for (const g of grahas) {
    const result = checkMrityuBhaga(g.lonSidereal)
    if (result.isMrityuBhaga) {
      results.push({ id: g.id, result })
    }
  }
  
  return results.sort((a, b) => a.result.distanceFromMrityu - b.result.distanceFromMrityu)
}
