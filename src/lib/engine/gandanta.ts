// ─────────────────────────────────────────────────────────────
//  src/lib/engine/gandanta.ts
//  Gandanta Detection — Karmic Knots at Water-Fire Junctions
//  Source: Brihat Parashara Hora Shastra, Phaladipika
// ─────────────────────────────────────────────────────────────

import type { Rashi, GandantaResult, GandantaType } from '@/types/astrology'

/**
 * Gandanta Points (Karmic Knots)
 * 
 * Gandanta occurs at the junction points where water signs meet fire signs.
 * These are the most spiritually significant points in the zodiac, representing
 * past-life karma that needs to be resolved in this lifetime.
 * 
 * Three Gandanta Junctions:
 * 1. Revatī → Aśvinī (Pisces → Aries) - 0° Aries
 * 2. Āśleṣā → Maghā (Cancer → Leo) - 0° Leo  
 * 3. Jyeṣṭhā → Mūla (Scorpio → Sagittarius) - 0° Sagittarius
 */

// Gandanta junction definitions
export const GANDANTA_JUNCTIONS: Array<{
  type: GandantaType
  fromSign: Rashi
  toSign: Rashi
  fromNakshatra: number  // 0-indexed
  toNakshatra: number
  junctionDegree: number // Degree in the "to" sign where gandanta occurs
}> = [
  {
    type: 'revati-ashwini',
    fromSign: 12,  // Pisces
    toSign: 1,     // Aries
    fromNakshatra: 26, // Revati (index 26)
    toNakshatra: 0,    // Ashwini (index 0)
    junctionDegree: 0, // 0° Aries
  },
  {
    type: 'ashlesha-magha',
    fromSign: 4,   // Cancer
    toSign: 5,     // Leo
    fromNakshatra: 8,  // Ashlesha (index 8)
    toNakshatra: 9,    // Magha (index 9)
    junctionDegree: 0, // 0° Leo
  },
  {
    type: 'jyeshtha-mula',
    fromSign: 8,   // Scorpio
    toSign: 9,     // Sagittarius
    fromNakshatra: 17, // Jyeshtha (index 17)
    toNakshatra: 18,   // Mula (index 18)
    junctionDegree: 0, // 0° Sagittarius
  },
]

// Nakshatra boundaries (each nakshatra = 13°20' = 13.333... degrees)
const NAKSHATRA_SIZE = 360 / 27 // 13.333... degrees

/**
 * Get the nakshatra index (0-26) from sidereal longitude
 */
function getNakshatraIndex(lon: number): number {
  const normalized = ((lon % 360) + 360) % 360
  return Math.floor(normalized / NAKSHATRA_SIZE)
}

/**
 * Get degree within current nakshatra
 */
function getDegreeInNakshatra(lon: number): number {
  const normalized = ((lon % 360) + 360) % 360
  return normalized % NAKSHATRA_SIZE
}

/**
 * Check if a planet is in Gandanta
 * 
 * @param lonSidereal - Sidereal longitude of the planet
 * @param orb - Orb in degrees for detection (default: 1° for exact, 3° for near)
 * @returns GandantaResult with type, severity, and distance from junction
 */
export function checkGandanta(
  lonSidereal: number,
  orb: { exact: number; near: number } = { exact: 1, near: 3 },
): GandantaResult {
  const normalized = ((lonSidereal % 360) + 360) % 360
  const rashi = (Math.floor(normalized / 30) + 1) as Rashi
  const degreeInSign = normalized % 30
  const nakshatraIdx = getNakshatraIndex(normalized)
  const degInNakshatra = getDegreeInNakshatra(normalized)

  // Check each gandanta junction
  for (const junction of GANDANTA_JUNCTIONS) {
    // Case 1: Planet is at the END of the "from" sign (water sign)
    // E.g., last degrees of Pisces (Revati), Cancer (Ashlesha), Scorpio (Jyeshtha)
    if (rashi === junction.fromSign) {
      // Check if in last nakshatra of the sign
      if (nakshatraIdx === junction.fromNakshatra) {
        // Last pada of nakshatra = last 3°20' of the sign
        // Gandanta zone: last ~3° of the sign
        const distFromJunction = 30 - degreeInSign
        
        if (distFromJunction <= orb.exact) {
          return {
            isGandanta: true,
            type: junction.type,
            severity: 'exact',
            position: 'end-of-water',
            distanceFromJunction: distFromJunction,
            rashi,
            nakshatraIndex: nakshatraIdx,
            degreeInNakshatra: degInNakshatra,
          }
        }
        
        if (distFromJunction <= orb.near) {
          return {
            isGandanta: true,
            type: junction.type,
            severity: 'near',
            position: 'end-of-water',
            distanceFromJunction: distFromJunction,
            rashi,
            nakshatraIndex: nakshatraIdx,
            degreeInNakshatra: degInNakshatra,
          }
        }
      }
    }

    // Case 2: Planet is at the BEGINNING of the "to" sign (fire sign)
    // E.g., first degrees of Aries (Ashwini), Leo (Magha), Sagittarius (Mula)
    if (rashi === junction.toSign) {
      // Check if in first nakshatra of the sign
      if (nakshatraIdx === junction.toNakshatra) {
        // First pada of nakshatra = first 3°20' of the sign
        // Gandanta zone: first ~3° of the sign
        const distFromJunction = degreeInSign
        
        if (distFromJunction <= orb.exact) {
          return {
            isGandanta: true,
            type: junction.type,
            severity: 'exact',
            position: 'beginning-of-fire',
            distanceFromJunction: distFromJunction,
            rashi,
            nakshatraIndex: nakshatraIdx,
            degreeInNakshatra: degInNakshatra,
          }
        }
        
        if (distFromJunction <= orb.near) {
          return {
            isGandanta: true,
            type: junction.type,
            severity: 'near',
            position: 'beginning-of-fire',
            distanceFromJunction: distFromJunction,
            rashi,
            nakshatraIndex: nakshatraIdx,
            degreeInNakshatra: degInNakshatra,
          }
        }
      }
    }
  }

  // Not in gandanta
  return {
    isGandanta: false,
    type: null,
    severity: 'none',
    position: null,
    distanceFromJunction: null,
    rashi,
    nakshatraIndex: nakshatraIdx,
    degreeInNakshatra: degInNakshatra,
  }
}

/**
 * Get human-readable description of gandanta type
 */
export function getGandantaDescription(type: GandantaType): {
  name: string
  sanskrit: string
  meaning: string
  significance: string
  remedy: string
} {
  const descriptions = {
    'revati-ashwini': {
      name: 'Revatī-Aśvinī Gandanta',
      sanskrit: 'रेवत्याश्विनी गन्धान्त',
      meaning: 'The Knot of Transition',
      significance: 'Represents the soul\'s journey from the spiritual realm (Pisces) to physical incarnation (Aries). Past life karma related to endings and new beginnings.',
      remedy: 'Worship Lord Ganesha for removing obstacles. Perform ancestral rites (pitru tarpana) on Amavasya.',
    },
    'ashlesha-magha': {
      name: 'Āśleṣā-Maghā Gandanta',
      sanskrit: 'आश्लेषामघा गन्धान्त',
      meaning: 'The Knot of Power',
      significance: 'Represents transformation from emotional attachment (Cancer) to spiritual authority (Leo). Past life karma related to family, authority, and self-expression.',
      remedy: 'Worship Lord Shiva or the Sun God (Surya). Perform charity on Sundays. Recite Aditya Hridayam.',
    },
    'jyeshtha-mula': {
      name: 'Jyeṣṭhā-Mūla Gandanta',
      sanskrit: 'ज्येष्ठामूल गन्धान्त',
      meaning: 'The Knot of Destruction',
      significance: 'Represents the journey from emotional intensity (Scorpio) to spiritual wisdom (Sagittarius). Past life karma related to transformation, occult, and hidden matters.',
      remedy: 'Worship Goddess Durga or Lord Hanuman. Perform Rudra Abhishekam. Charity to the poor on Tuesdays.',
    },
  }
  
  return descriptions[type]
}

/**
 * Check gandanta for all grahas and return a map
 */
export function checkAllGandanta(
  grahas: Array<{ id: string; lonSidereal: number }>,
): Record<string, GandantaResult> {
  const result: Record<string, GandantaResult> = {}
  for (const g of grahas) {
    result[g.id] = checkGandanta(g.lonSidereal)
  }
  return result
}

/**
 * Check if Lagna (Ascendant) is in Gandanta
 * This is especially significant as it affects the entire chart
 */
export function checkLagnaGandanta(ascendantSidereal: number): GandantaResult & {
  significance: string
} {
  const result = checkGandanta(ascendantSidereal)
  
  if (!result.isGandanta) {
    return { ...result, significance: 'Lagna is not in Gandanta.' }
  }
  
  const desc = getGandantaDescription(result.type!)
  
  return {
    ...result,
    significance: `Lagna in ${desc.name} indicates a life of profound spiritual transformation. ${desc.significance} The native may face significant life changes at the junction points of their life.`,
  }
}
