// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dasha/ashtottari.ts
//  Ashtottari Dasha (108-year cycle)
//  Used primarily when Rahu is in Kendra/Trikona from Lagna Lord
// ─────────────────────────────────────────────────────────────

import type { GrahaId, DashaNode } from '@/types/astrology'

// ── Ashtottari Constants ─────────────────────────────────────

export const ASHTOTTARI_YEARS: Record<string, number> = {
  Su: 6,  Mo: 15, Ma: 8,  Me: 17,
  Sa: 10, Ju: 19, Ra: 12, Ve: 21
}

export const ASHTOTTARI_TOTAL = 108

export const ASHTOTTARI_SEQUENCE: GrahaId[] = [
  'Su', 'Mo', 'Ma', 'Me', 'Sa', 'Ju', 'Ra', 'Ve'
]

/**
 * 28 Nakshatra Map for Ashtottari (including Abhijit)
 * Group 1: Sun (3 naks) - Krittika, Rohini, Mrigashira
 * Group 2: Moon (4 naks) - Ardra, Punarvasu, Pushya, Ashlesha
 * Group 3: Mars (3 naks) - Magha, P.Phalguni, U.Phalguni
 * Group 4: Mercury (4 naks) - Hasta, Chitra, Swati, Vishakha
 * Group 5: Saturn (3 naks) - Anuradha, Jyeshtha, Mula
 * Group 6: Jupiter (4 naks) - P.Ashadha, U.Ashadha, Abhijit, Shravana
 * Group 7: Rahu (3 naks) - Dhanishtha, Shatabhisha, P.Bhadrapada
 * Group 8: Venus (4 naks) - U.Bhadrapada, Revati, Ashwini, Bharani
 */

/**
 * Standard Ashtottari Mapping (28 Nakshatras)
 */
const LORD_MAP: { lord: GrahaId, naks: number[] }[] = [
  { lord: 'Su', naks: [2, 3, 4] },              // Krittika, Rohini, Mrigashira
  { lord: 'Mo', naks: [5, 6, 7, 8] },           // Ardra, Punarvasu, Pushya, Ashlesha
  { lord: 'Ma', naks: [9, 10, 11] },            // Magha, P.Phalguni, U.Phalguni
  { lord: 'Me', naks: [12, 13, 14, 15] },       // Hasta, Chitra, Swati, Vishakha
  { lord: 'Sa', naks: [16, 17, 18] },           // Anuradha, Jyeshtha, Mula
  { lord: 'Ju', naks: [19, 20, 99, 21] },       // P.Ashadha, U.Ashadha, Abhijit, Shravana (99 = Abhijit)
  { lord: 'Ra', naks: [22, 23, 24] },           // Dhanishtha, Shatabhisha, P.Bhadrapada
  { lord: 'Ve', naks: [25, 26, 0, 1] },         // U.Bhadrapada, Revati, Ashwini, Bharani
]

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000

function yearsToMs(years: number): number {
  return years * MS_PER_YEAR
}

/**
 * Calculate complete Ashtottari Dasha tree
 */
export function calcAshtottari(
  moonLonSidereal: number,
  birthDate: Date,
  depth: number = 4
): DashaNode[] {
  const lon = ((moonLonSidereal % 360) + 360) % 360
  const now = Date.now()

  // 1. Identify 28-grouping index
  // Each nakshatra in the 27-system is 13° 20'.
  // Abhijit is formed by 3° 20' of U.Ashadha (last quarter) and 1° 13' 20" of Shravana?
  // Common rule: 266°40' to 276°40' = U.Ashadha (3 quarters)
  // 276°40' to 280°53'20" = Abhijit
  // 280°53'20" to 293°20' = Shravana
  
  let nak28Index = -1
  let elapsedInNak = 0
  let nakSpan = 13.333333333333334

  if (lon >= 276.6666666666667 && lon < 280.8888888888889) {
    nak28Index = 99 // Abhijit
    elapsedInNak = lon - 276.6666666666667
    nakSpan = 4.222222222222222 // (1/4 of U.Ashadha + something)
  } else if (lon >= 266.6666666666667 && lon < 276.6666666666667) {
    nak28Index = 20 // U.Ashadha
    elapsedInNak = lon - 266.6666666666667
    nakSpan = 10.0 // 3 quarters
  } else if (lon >= 280.8888888888889 && lon < 293.3333333333333) {
    nak28Index = 21 // Shravana
    elapsedInNak = lon - 280.8888888888889
    nakSpan = 12.444444444444445
  } else {
    nak28Index = Math.floor(lon / 13.333333333333334)
    elapsedInNak = lon % 13.333333333333334
    nakSpan = 13.333333333333334
  }

  // 2. Find Lord and group progress
  let groupIdx = -1
  let elapsedInGroup = 0
  let totalGroupSpan = 0

  for (let i = 0; i < LORD_MAP.length; i++) {
    const g = LORD_MAP[i]
    if (g.naks.includes(nak28Index)) {
      groupIdx = i
      // Sum up spans of preceding naks in group
      let precedingSpan = 0
      for (const n of g.naks) {
        if (n === nak28Index) break
        // Span depends on if it is U.Ashadha/Abhijit/Shravana
        if (n === 20) precedingSpan += 10.0
        else if (n === 99) precedingSpan += 4.222222222222222
        else if (n === 21) precedingSpan += 12.444444444444445
        else precedingSpan += 13.333333333333334
      }
      elapsedInGroup = precedingSpan + elapsedInNak
      
      // Total group span
      totalGroupSpan = 0
      for (const n of g.naks) {
        if (n === 20) totalGroupSpan += 10.0
        else if (n === 99) totalGroupSpan += 4.222222222222222
        else if (n === 21) totalGroupSpan += 12.444444444444445
        else totalGroupSpan += 13.333333333333334
      }
      break
    }
  }

  if (groupIdx === -1) groupIdx = 0 // Fallback

  const birthLord = LORD_MAP[groupIdx].lord
  const fractionElapsed = elapsedInGroup / totalGroupSpan
  const remainingFraction = Math.max(0, 1 - fractionElapsed)
  const balanceYears = remainingFraction * ASHTOTTARI_YEARS[birthLord]

  // 2. Build Sequence
  const nodes: DashaNode[] = []
  let cursor = birthDate.getTime()

  for (let i = 0; i < 8; i++) {
    const lordIdx = (groupIdx + i) % 8
    const lord = ASHTOTTARI_SEQUENCE[lordIdx]
    const years = (i === 0) ? balanceYears : ASHTOTTARI_YEARS[lord]
    const durationMs = yearsToMs(years)

    const start = new Date(cursor)
    const end = new Date(cursor + durationMs)
    const isCurrent = now >= start.getTime() && now < end.getTime()

    nodes.push({
      lord,
      start,
      end,
      durationMs,
      level: 1,
      isCurrent,
      children: depth > 1 
        ? buildSubDashas(lord, start, end, durationMs, 2, depth, now)
        : []
    })

    cursor += durationMs
  }

  return nodes
}

/**
 * Sub-dashas in Ashtottari are also proportional.
 * Sub-period = (SubLordYears / 108) * ParentDuration
 */
function buildSubDashas(
  mahaLord: GrahaId,
  parentStart: Date,
  parentEnd: Date,
  parentMs: number,
  currentLevel: number,
  maxDepth: number,
  now: number
): DashaNode[] {
  const mahaIdx = ASHTOTTARI_SEQUENCE.indexOf(mahaLord)
  const nodes: DashaNode[] = []
  let cursor = parentStart.getTime()

  for (let i = 0; i < 8; i++) {
    const lord = ASHTOTTARI_SEQUENCE[(mahaIdx + i) % 8]
    const fraction = ASHTOTTARI_YEARS[lord] / ASHTOTTARI_TOTAL
    const durationMs = parentMs * fraction

    const start = new Date(cursor)
    const end = new Date(cursor + durationMs)
    const isCurrent = now >= cursor && now < cursor + durationMs

    const shouldGoDeeper = currentLevel < maxDepth && (currentLevel <= 3 || isCurrent)

    nodes.push({
      lord,
      start,
      end,
      durationMs,
      level: currentLevel,
      isCurrent,
      children: shouldGoDeeper
        ? buildSubDashas(lord, start, end, durationMs, currentLevel + 1, maxDepth, now)
        : []
    })

    cursor += durationMs
  }

  return nodes
}
