// ─────────────────────────────────────────────────────────────
//  src/lib/engine/varshaphal.ts
//  Varshaphal — Solar Return (Annual Chart)
//  Finds the exact moment the Sun returns to its natal longitude
//  each year using bisection search on swisseph
// ─────────────────────────────────────────────────────────────

import { toJulianDay, getPlanetPosition, getAyanamsha, PLANET_IDS } from './ephemeris'
import type { AyanamshaMode } from '@/types/astrology'

export const runtime = 'nodejs'

// ── Find Solar Return JD ──────────────────────────────────────

/**
 * Find the Julian Day when Sun returns to natal sidereal longitude
 * for a given Gregorian year (local).
 * Uses bisection search within ±2 days of estimated return.
 */
export function findSolarReturnJD(
  natalSunSidereal: number,  // natal Sun longitude in sidereal degrees
  returnYear:       number,  // the year to find the return in
  ayanamshaMode:    string,  // ayanamsha mode string
): number {
  const mode = ayanamshaMode as AyanamshaMode

  // Estimate: use the same calendar date of birth in the return year
  // JD starts around Jan 1 of return year
  const jdJan1 = toJulianDay(returnYear, 1, 1, 12)

  // Get current Sun position at Jan 1 to orient the search
  const sunAtJan1  = getSunSidereal(jdJan1, mode)
  
  // Compute how many degrees Sun needs to travel to reach natal position
  let diff = ((natalSunSidereal - sunAtJan1) + 360) % 360
  
  // Sun moves ~1°/day → estimated days to return
  const estimatedJD = jdJan1 + diff

  // Bisection search in ±3 day window around estimate
  let lo = estimatedJD - 3
  let hi = estimatedJD + 3

  for (let i = 0; i < 50; i++) {
    const mid    = (lo + hi) / 2
    const sunMid = getSunSidereal(mid, mode)
    
    // Angular difference (normalised to -180..180)
    let d = sunMid - natalSunSidereal
    if (d > 180)  d -= 360
    if (d < -180) d += 360
    
    if (Math.abs(d) < 0.0001) return mid   // within 0.36 arc-seconds — close enough
    
    if (d < 0) lo = mid
    else       hi = mid
  }

  return (lo + hi) / 2
}

function getSunSidereal(jd: number, mode: AyanamshaMode): number {
  // sun is 0 (sweph.constants.SE_SUN), which is what PLANET_IDS.Su resolves to
  const planet = getPlanetPosition(jd, PLANET_IDS.Su ?? 0)
  const ayan   = getAyanamsha(jd, mode)
  
  return ((planet.longitude - ayan) + 360) % 360
}

/**
 * Convert Julian Day to UTC Date
 */
export function jdToDate(jd: number): Date {
  const unix = (jd - 2440587.5) * 86400
  return new Date(unix * 1000)
}

/**
 * Get the year range of Solar Returns for age-based lookup
 */
export function getVarshaphalYears(
  birthYear: number,
  currentYear: number,
): number[] {
  const years: number[] = []
  for (let y = Math.max(birthYear + 1, currentYear - 2); y <= currentYear + 5; y++) {
    years.push(y)
  }
  return years
}