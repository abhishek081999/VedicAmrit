// ─────────────────────────────────────────────────────────────
//  src/lib/engine/pushkara.ts
//  Puṣkara Aṃśa - Auspicious Degrees for Remedies
//  Source: Brihat Parashara Hora Shastra, Deva Keralam
// ─────────────────────────────────────────────────────────────

import type { Rashi, PushkaraResult } from '@/types/astrology'

/**
 * Puṣkara Aṃśa (Auspicious Degrees)
 * 
 * Puṣkara means "lotus" - these are highly auspicious degrees in each sign
 * where remedies and spiritual practices are 1000x more effective.
 * 
 * Each sign has TWO Puṣkara zones:
 * 1. Puṣkara Bhāga (Auspicious Degree Zone)
 * 2. Puṣkara Navāṃśa (Auspicious Navamsha)
 * 
 * Planets transiting or placed in these degrees:
 * - Have enhanced positive effects
 * - Remedies performed during these transits are highly effective
 * - Good for starting auspicious activities
 */

// Puṣkara degrees for each sign (in degrees within sign)
// Source: BPHS and traditional texts
export const PUSHKARA_DEGREES: Record<Rashi, { zone1: [number, number]; zone2: [number, number] }> = {
  1:  { zone1: [11.33, 13.33], zone2: [23.33, 25.33] },  // Aries: 11°20'-13°20', 23°20'-25°20'
  2:  { zone1: [7.33, 9.33],   zone2: [17.33, 19.33] },  // Taurus: 7°20'-9°20', 17°20'-19°20'
  3:  { zone1: [13.33, 15.33], zone2: [23.33, 25.33] },  // Gemini: 13°20'-15°20', 23°20'-25°20'
  4:  { zone1: [5.33, 7.33],   zone2: [19.33, 21.33] },  // Cancer: 5°20'-7°20', 19°20'-21°20'
  5:  { zone1: [1.33, 3.33],   zone2: [15.33, 17.33] },  // Leo: 1°20'-3°20', 15°20'-17°20'
  6:  { zone1: [11.33, 13.33], zone2: [25.33, 27.33] },  // Virgo: 11°20'-13°20', 25°20'-27°20'
  7:  { zone1: [9.33, 11.33],  zone2: [21.33, 23.33] },  // Libra: 9°20'-11°20', 21°20'-23°20'
  8:  { zone1: [3.33, 5.33],   zone2: [17.33, 19.33] },  // Scorpio: 3°20'-5°20', 17°20'-19°20'
  9:  { zone1: [7.33, 9.33],   zone2: [21.33, 23.33] },  // Sagittarius: 7°20'-9°20', 21°20'-23°20'
  10: { zone1: [5.33, 7.33],   zone2: [19.33, 21.33] },  // Capricorn: 5°20'-7°20', 19°20'-21°20'
  11: { zone1: [13.33, 15.33], zone2: [25.33, 27.33] },  // Aquarius: 13°20'-15°20', 25°20'-27°20'
  12: { zone1: [9.33, 11.33],  zone2: [23.33, 25.33] },  // Pisces: 9°20'-11°20', 23°20'-25°20'
}

// Puṣkara Navāṃśa for each sign (which navamsha is auspicious)
// These are the navamsha numbers (1-9) that are Pushkara navamshas
export const PUSHKARA_NAVAMSHA: Record<Rashi, number[]> = {
  1:  [4, 8],    // Aries: 4th and 8th navamsha
  2:  [3, 6],    // Taurus: 3rd and 6th navamsha
  3:  [5, 8],    // Gemini: 5th and 8th navamsha
  4:  [2, 7],    // Cancer: 2nd and 7th navamsha
  5:  [1, 6],    // Leo: 1st and 6th navamsha
  6:  [4, 9],    // Virgo: 4th and 9th navamsha
  7:  [3, 8],    // Libra: 3rd and 8th navamsha
  8:  [2, 6],    // Scorpio: 2nd and 6th navamsha
  9:  [3, 7],    // Sagittarius: 3rd and 7th navamsha
  10: [2, 7],    // Capricorn: 2nd and 7th navamsha
  11: [5, 9],    // Aquarius: 5th and 9th navamsha
  12: [4, 8],    // Pisces: 4th and 8th navamsha
}

/**
 * Check if a planet is in Puṣkara Aṃśa
 * 
 * @param lonSidereal - Sidereal longitude of the planet
 * @returns PushkaraResult with zone info and remedy recommendations
 */
export function checkPushkara(lonSidereal: number): PushkaraResult {
  const normalized = ((lonSidereal % 360) + 360) % 360
  const rashi = (Math.floor(normalized / 30) + 1) as Rashi
  const degreeInSign = normalized % 30
  
  // Calculate navamsha (1-9)
  const navamsha = Math.floor(degreeInSign / (30 / 9)) + 1
  
  const pushkaraData = PUSHKARA_DEGREES[rashi]
  const pushkaraNav = PUSHKARA_NAVAMSHA[rashi]
  
  // Check if in Puṣkara Bhāga (degree zone)
  const inZone1 = degreeInSign >= pushkaraData.zone1[0] && degreeInSign <= pushkaraData.zone1[1]
  const inZone2 = degreeInSign >= pushkaraData.zone2[0] && degreeInSign <= pushkaraData.zone2[1]
  
  // Check if in Puṣkara Navāṃśa
  const inPushkaraNavamsha = pushkaraNav.includes(navamsha)
  
  if (inZone1) {
    return {
      isPushkara: true,
      type: 'pushkara_bhaga',
      zone: 1,
      rashi,
      degreeInSign,
      navamsha,
      isPushkaraNavamsha: inPushkaraNavamsha,
      distanceFromCenter: Math.abs(degreeInSign - (pushkaraData.zone1[0] + pushkaraData.zone1[1]) / 2),
      remedy: 'Excellent time for spiritual practices, charity, and new beginnings. Remedies are 1000x effective.',
    }
  }
  
  if (inZone2) {
    return {
      isPushkara: true,
      type: 'pushkara_bhaga',
      zone: 2,
      rashi,
      degreeInSign,
      navamsha,
      isPushkaraNavamsha: inPushkaraNavamsha,
      distanceFromCenter: Math.abs(degreeInSign - (pushkaraData.zone2[0] + pushkaraData.zone2[1]) / 2),
      remedy: 'Excellent time for spiritual practices, charity, and new beginnings. Remedies are 1000x effective.',
    }
  }
  
  if (inPushkaraNavamsha) {
    return {
      isPushkara: true,
      type: 'pushkara_navamsha',
      zone: null,
      rashi,
      degreeInSign,
      navamsha,
      isPushkaraNavamsha: true,
      distanceFromCenter: null,
      remedy: 'Planet is in Pushkara Navamsha. Good for remedies and spiritual activities.',
    }
  }
  
  return {
    isPushkara: false,
    type: null,
    zone: null,
    rashi,
    degreeInSign,
    navamsha,
    isPushkaraNavamsha: false,
    distanceFromCenter: null,
    remedy: null,
  }
}

/**
 * Get the nearest Puṣkara zone for a given longitude
 * Useful for timing remedies
 */
export function getNearestPushkara(lonSidereal: number): {
  distance: number
  direction: 'forward' | 'backward'
  zoneDegrees: number
} {
  const normalized = ((lonSidereal % 360) + 360) % 360
  const rashi = (Math.floor(normalized / 30) + 1) as Rashi
  const degreeInSign = normalized % 30
  const pushkaraData = PUSHKARA_DEGREES[rashi]
  
  // Calculate distance to each zone center
  const center1 = (pushkaraData.zone1[0] + pushkaraData.zone1[1]) / 2
  const center2 = (pushkaraData.zone2[0] + pushkaraData.zone2[1]) / 2
  
  const dist1 = Math.abs(degreeInSign - center1)
  const dist2 = Math.abs(degreeInSign - center2)
  
  if (dist1 < dist2) {
    return {
      distance: dist1,
      direction: degreeInSign < center1 ? 'forward' : 'backward',
      zoneDegrees: center1,
    }
  }
  
  return {
    distance: dist2,
    direction: degreeInSign < center2 ? 'forward' : 'backward',
    zoneDegrees: center2,
  }
}

/**
 * Check Puṣkara for all grahas
 */
export function checkAllPushkara(
  grahas: Array<{ id: string; lonSidereal: number }>,
): Record<string, PushkaraResult> {
  const result: Record<string, PushkaraResult> = {}
  for (const g of grahas) {
    result[g.id] = checkPushkara(g.lonSidereal)
  }
  return result
}
