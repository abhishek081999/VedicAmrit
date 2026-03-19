// ─────────────────────────────────────────────────────────────
//  src/lib/engine/ayanamsha.ts
//  Ayanamsha calculation — all 7 supported modes
//  Wraps sweph with clean TypeScript interface
// ─────────────────────────────────────────────────────────────

import { getAyanamsha, toSidereal } from '@/lib/engine/ephemeris'
import type { AyanamshaMode } from '@/types/astrology'
import { AYANAMSHA_NAMES } from '@/types/astrology'

// ── Re-export for convenience ─────────────────────────────────

export { AYANAMSHA_NAMES }

// ── Ayanamsha values at J2000.0 for reference/validation ─────
// Source: Swiss Ephemeris documentation
export const AYANAMSHA_J2000_REF: Record<AyanamshaMode, number> = {
  lahiri:       23.85271,  // Chitrapaksha / IAU standard
  true_chitra:  23.81986,  // True Chitra (star-based)
  true_revati:  23.8565,   // True Revati (star-based)
  true_pushya:  23.8797,   // True Pushya (star-based)
  raman:        22.46071,  // B.V. Raman
  usha_shashi:  20.09167,  // Usha-Shashi
  yukteshwar:   22.46071,  // Sri Yukteshwar (≈ Raman at J2000)
}

/**
 * Get ayanamsha value for a given Julian Day and mode
 * Returns degrees (e.g. 23.85 for Lahiri at J2000)
 */
export function getAyanamshaValue(jd: number, mode: AyanamshaMode): number {
  return getAyanamsha(jd, mode)
}

/**
 * Convert tropical longitude to sidereal using specified ayanamsha
 */
export function tropicalToSidereal(
  tropicalLon: number,
  jd: number,
  mode: AyanamshaMode,
): number {
  const ayanamsha = getAyanamsha(jd, mode)
  return toSidereal(tropicalLon, ayanamsha)
}

/**
 * Get ayanamsha for a specific Gregorian date and mode
 * Convenience wrapper that computes JD internally
 */
export function getAyanamshaForDate(
  year: number,
  month: number,
  day: number,
  hourUT: number,
  mode: AyanamshaMode,
): number {
  const { toJulianDay } = require('@/lib/engine/ephemeris')
  const jd = toJulianDay(year, month, day, hourUT)
  return getAyanamsha(jd, mode)
}

/**
 * Get the annual rate of precession (degrees/year) for a mode
 * Approximated from the derivative at J2000
 * Useful for UI display of "precession rate"
 */
export function getPrecessionRate(_mode: AyanamshaMode): number {
  // Modern precession rate ≈ 50.28 arcseconds/year = 0.01397°/year
  // All sidereal ayanamshas track this (minor differences in reference star)
  return 0.013970  // degrees per year
}

/**
 * Return a summary object of all ayanamsha values for a given JD
 * Used in UI settings panels and chart export
 */
export function getAllAyanamshaValues(jd: number): Record<AyanamshaMode, number> {
  const modes: AyanamshaMode[] = [
    'lahiri', 'true_chitra', 'true_revati', 'true_pushya',
    'raman', 'usha_shashi', 'yukteshwar',
  ]
  const result = {} as Record<AyanamshaMode, number>
  for (const mode of modes) {
    result[mode] = getAyanamsha(jd, mode)
  }
  return result
}
