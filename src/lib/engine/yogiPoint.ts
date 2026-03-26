// ─────────────────────────────────────────────────────────────
//  src/lib/engine/yogiPoint.ts
//  Yogi Point, Sahayogi & Avayogi Calculations
//  Source: Jaimini Sutras, Kalpalatha
// ─────────────────────────────────────────────────────────────

import type { Rashi, GrahaId, YogiPointResult } from '@/types/astrology'

/**
 * Yogi Point System
 * 
 * The Yogi Point is a highly auspicious point in the chart that indicates
 * wealth, prosperity, and spiritual growth. It's calculated from the
 * relationship between the Sun and Moon positions.
 * 
 * Key Concepts:
 * - Yogi Point: The most auspicious point for prosperity
 * - Sahayogi: The helping point that supports the Yogi
 * - Avayogi: The obstructing point that hinders prosperity
 * - Yogi Graha: The planet ruling the Yogi sign
 * - Avayogi Graha: The planet that obstructs prosperity
 * 
 * This system is particularly used in:
 * - Financial analysis
 * - Dasha interpretation
 * - Timing of wealth-giving events
 * - Spiritual progress assessment
 */

// Natural friendship matrix for determining Yogi/Avayogi
const NATURAL_FRIENDS: Record<GrahaId, GrahaId[]> = {
  Su: ['Mo', 'Ma', 'Ju'],
  Mo: ['Su', 'Me'],
  Ma: ['Su', 'Mo', 'Ju'],
  Me: ['Su', 'Ve'],
  Ju: ['Su', 'Mo', 'Ma'],
  Ve: ['Me', 'Sa'],
  Sa: ['Me', 'Ve'],
  Ra: ['Ve', 'Sa'],
  Ke: ['Ve', 'Sa'],
  Ur: [], Ne: [], Pl: [],
}

// Sign lords
const SIGN_LORDS: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo',
  5: 'Su', 6: 'Me', 7: 'Ve', 8: 'Ma',
  9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

/**
 * Calculate Yogi Point and related points
 * 
 * Algorithm:
 * 1. Add Sun and Moon longitudes to get Yogi Point
 * 2. Add 93°20' (one sign + 3°20') to get Sahayogi
 * 3. Add 186°40' (six signs + 6°40') to get Avayogi
 * 4. Determine Yogi and Avayogi grahas based on sign lords
 * 
 * @param sunLon - Sidereal longitude of Sun
 * @param moonLon - Sidereal longitude of Moon
 * @returns YogiPointResult with all calculated points
 */
export function calculateYogiPoint(sunLon: number, moonLon: number): YogiPointResult {
  const sunNorm = ((sunLon % 360) + 360) % 360
  const moonNorm = ((moonLon % 360) + 360) % 360
  
  // Yogi Point = Sun + Moon
  const yogiPoint = (sunNorm + moonNorm) % 360
  const yogiRashi = (Math.floor(yogiPoint / 30) + 1) as Rashi
  const yogiDegreeInSign = yogiPoint % 30
  
  // Sahayogi Point = Yogi Point + 93°20' (one sign + 3°20')
  // This is 93.333... degrees
  const sahayogiPoint = (yogiPoint + 93 + 1/3) % 360
  const sahayogiRashi = (Math.floor(sahayogiPoint / 30) + 1) as Rashi
  const sahayogiDegreeInSign = sahayogiPoint % 30
  
  // Avayogi Point = Yogi Point + 186°40' (six signs + 6°40')
  // This is 186.666... degrees
  const avayogiPoint = (yogiPoint + 186 + 2/3) % 360
  const avayogiRashi = (Math.floor(avayogiPoint / 30) + 1) as Rashi
  const avayogiDegreeInSign = avayogiPoint % 30
  
  // Determine Yogi Graha (lord of Yogi sign)
  const yogiGraha = SIGN_LORDS[yogiRashi]
  
  // Determine Sahayogi Graha (lord of Sahayogi sign)
  const sahayogiGraha = SIGN_LORDS[sahayogiRashi]
  
  // Determine Avayogi Graha
  // This is the planet that is the enemy of the Yogi Graha
  // OR the 6th sign lord from Yogi sign (depending on tradition)
  const avayogiGraha = SIGN_LORDS[avayogiRashi]
  
  // Alternative Avayogi: Find enemy of Yogi Graha
  const yogiEnemies = Object.entries(NATURAL_FRIENDS)
    .filter(([_, friends]) => !friends.includes(yogiGraha) && !friends.includes('Su')) // simplified
    .map(([graha]) => graha as GrahaId)
  
  // Check if Avayogi Graha is a friend or enemy of Yogi Graha
  const isYogiGrahaFriend = NATURAL_FRIENDS[yogiGraha]?.includes(avayogiGraha) ?? false
  
  return {
    yogiPoint,
    yogiRashi,
    yogiDegreeInSign,
    yogiGraha,
    
    sahayogiPoint,
    sahayogiRashi,
    sahayogiDegreeInSign,
    sahayogiGraha,
    
    avayogiPoint,
    avayogiRashi,
    avayogiDegreeInSign,
    avayogiGraha,
    
    interpretation: {
      yogi: `Yogi Point at ${yogiDegreeInSign.toFixed(2)}° in sign ${yogiRashi}. Lord ${yogiGraha} is the Yogi Graha. This point indicates wealth and prosperity.`,
      sahayogi: `Sahayogi Point at ${sahayogiDegreeInSign.toFixed(2)}° in sign ${sahayogiRashi}. Lord ${sahayogiGraha} supports prosperity.`,
      avayogi: `Avayogi Point at ${avayogiDegreeInSign.toFixed(2)}° in sign ${avayogiRashi}. Lord ${avayogiGraha} may create obstacles to prosperity.`,
    },
    
    remedy: `Strengthen ${yogiGraha} (Yogi Graha) for prosperity. Be mindful of ${avayogiGraha} (Avayogi Graha) periods.`,
  }
}

/**
 * Check if a planet is conjunct the Yogi Point
 */
export function isConjunctYogiPoint(
  planetLon: number,
  yogiPoint: number,
  orb: number = 5,
): boolean {
  let diff = Math.abs(planetLon - yogiPoint) % 360
  if (diff > 180) diff = 360 - diff
  return diff <= orb
}

/**
 * Get planets conjunct Yogi, Sahayogi, or Avayogi points
 */
export function getPlanetsAtYogiPoints(
  grahas: Array<{ id: string; lonSidereal: number }>,
  yogiResult: YogiPointResult,
  orb: number = 5,
): {
  conjunctYogi: string[]
  conjunctSahayogi: string[]
  conjunctAvayogi: string[]
} {
  const conjunctYogi: string[] = []
  const conjunctSahayogi: string[] = []
  const conjunctAvayogi: string[] = []
  
  for (const g of grahas) {
    if (isConjunctYogiPoint(g.lonSidereal, yogiResult.yogiPoint, orb)) {
      conjunctYogi.push(g.id)
    }
    if (isConjunctYogiPoint(g.lonSidereal, yogiResult.sahayogiPoint, orb)) {
      conjunctSahayogi.push(g.id)
    }
    if (isConjunctYogiPoint(g.lonSidereal, yogiResult.avayogiPoint, orb)) {
      conjunctAvayogi.push(g.id)
    }
  }
  
  return { conjunctYogi, conjunctSahayogi, conjunctAvayogi }
}

/**
 * Get wealth potential score based on Yogi system
 * 
 * Factors:
 * - Planets conjunct Yogi Point: +2 each
 * - Planets conjunct Sahayogi: +1 each
 * - Planets conjunct Avayogi: -1 each
 * - Yogi Graha well-placed: +2
 * - Avayogi Graha afflicted: +1 (paradoxically good)
 */
export function calculateYogiWealthScore(
  grahas: Array<{ id: string; lonSidereal: number; rashi: Rashi; dignity: string }>,
  yogiResult: YogiPointResult,
): {
  score: number
  factors: string[]
} {
  const factors: string[] = []
  let score = 0
  
  const { conjunctYogi, conjunctSahayogi, conjunctAvayogi } = getPlanetsAtYogiPoints(
    grahas, yogiResult, 5
  )
  
  // Yogi conjunctions
  for (const id of conjunctYogi) {
    score += 2
    factors.push(`${id} conjunct Yogi Point (+2)`)
  }
  
  // Sahayogi conjunctions
  for (const id of conjunctSahayogi) {
    score += 1
    factors.push(`${id} conjunct Sahayogi Point (+1)`)
  }
  
  // Avayogi conjunctions
  for (const id of conjunctAvayogi) {
    score -= 1
    factors.push(`${id} conjunct Avayogi Point (-1)`)
  }
  
  // Yogi Graha placement
  const yogiGrahaData = grahas.find(g => g.id === yogiResult.yogiGraha)
  if (yogiGrahaData) {
    if (yogiGrahaData.dignity === 'exalted' || yogiGrahaData.dignity === 'own') {
      score += 2
      factors.push(`Yogi Graha (${yogiResult.yogiGraha}) in good dignity (+2)`)
    } else if (yogiGrahaData.dignity === 'debilitated') {
      score -= 1
      factors.push(`Yogi Graha (${yogiResult.yogiGraha}) debilitated (-1)`)
    }
  }
  
  // Avayogi Graha placement (afflicted is good)
  const avayogiGrahaData = grahas.find(g => g.id === yogiResult.avayogiGraha)
  if (avayogiGrahaData) {
    if (avayogiGrahaData.dignity === 'debilitated') {
      score += 1
      factors.push(`Avayogi Graha (${yogiResult.avayogiGraha}) debilitated - obstacles reduced (+1)`)
    }
  }
  
  return { score, factors }
}
