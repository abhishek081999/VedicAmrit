// ─────────────────────────────────────────────────────────────
//  src/lib/engine/sunrise.ts
//  Real sunrise / sunset using Swiss Ephemeris rise_trans
//  Replaces the 6:00 AM / 6:00 PM placeholder
// ─────────────────────────────────────────────────────────────

import sweph from 'sweph'
import { toJulianDay } from './ephemeris'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'

// ── swisseph rise_trans flags ─────────────────────────────────
// SE_CALC_RISE  = 1  (sunrise)
// SE_CALC_SET   = 2  (sunset)
const SE_CALC_RISE = 1
const SE_CALC_SET  = 2
// Atmospheric refraction flag
const SE_BIT_DISC_CENTER   = 256
const SEFLG_SWIEPH         = 2
const ATPRESS              = 1013.25   // average atmospheric pressure (mbar)
const ATTEMP               = 15        // average temperature (°C)

// sweph types are incomplete — cast to any for rise_trans
const swephAny = sweph as any
const SE_SUN = swephAny.SE_SUN ?? 0

/**
 * Calculate true astronomical sunrise for a given date and location.
 * Returns a Date in UTC. Falls back to 6:00 AM local if sweph fails.
 */
export function getSunrise(
  dateStr:   string,   // 'YYYY-MM-DD'
  lat:       number,
  lng:       number,
  tz:        string,
): Date {
  try {
    // Start search from midnight UT of the date
    const midnightLocal = fromZonedTime(`${dateStr}T00:00:00`, tz)
    const y = midnightLocal.getUTCFullYear()
    const m = midnightLocal.getUTCMonth() + 1
    const d = midnightLocal.getUTCDate()
    const jdMidnight = toJulianDay(y, m, d, 0)

    const geopos: [number, number, number] = [lng, lat, 0]   // sweph: [longitude, latitude, altitude]

    const result = swephAny.rise_trans(
      jdMidnight,
      SE_SUN,
      '',
      SEFLG_SWIEPH,
      SE_CALC_RISE,
      geopos,
      ATPRESS,
      ATTEMP,
    )

    if (result.error || !result.tret || result.tret[0] === 0) {
      return fallbackSunrise(dateStr, tz)
    }

    // tret[0] is Julian Day of rise event
    return julianDayToDate(result.tret[0])
  } catch {
    return fallbackSunrise(dateStr, tz)
  }
}

/**
 * Calculate true astronomical sunset for a given date and location.
 */
export function getSunset(
  dateStr:   string,
  lat:       number,
  lng:       number,
  tz:        string,
): Date {
  try {
    const midnightLocal = fromZonedTime(`${dateStr}T00:00:00`, tz)
    const y = midnightLocal.getUTCFullYear()
    const m = midnightLocal.getUTCMonth() + 1
    const d = midnightLocal.getUTCDate()
    const jdMidnight = toJulianDay(y, m, d, 0)

    const geopos: [number, number, number] = [lng, lat, 0]

    const result = swephAny.rise_trans(
      jdMidnight,
      SE_SUN,
      '',
      SEFLG_SWIEPH,
      SE_CALC_SET,
      geopos,
      ATPRESS,
      ATTEMP,
    )

    if (result.error || !result.tret || result.tret[0] === 0) {
      return fallbackSunset(dateStr, tz)
    }

    return julianDayToDate(result.tret[0])
  } catch {
    return fallbackSunset(dateStr, tz)
  }
}

/**
 * Get both sunrise and sunset in one call (more efficient).
 */
export function getSunriseSunset(
  dateStr: string,
  lat:     number,
  lng:     number,
  tz:      string,
): { sunrise: Date; sunset: Date } {
  return {
    sunrise: getSunrise(dateStr, lat, lng, tz),
    sunset:  getSunset(dateStr, lat, lng, tz),
  }
}

// ── Helpers ───────────────────────────────────────────────────

/**
 * Convert Julian Day Number to JavaScript Date (UTC).
 * JD 2440587.5 = 1970-01-01 00:00:00 UTC
 */
function julianDayToDate(jd: number): Date {
  const unixSeconds = (jd - 2440587.5) * 86400
  return new Date(unixSeconds * 1000)
}

function fallbackSunrise(dateStr: string, tz: string): Date {
  try { return fromZonedTime(`${dateStr}T06:00:00`, tz) }
  catch { return new Date(`${dateStr}T00:30:00Z`) }
}

function fallbackSunset(dateStr: string, tz: string): Date {
  try { return fromZonedTime(`${dateStr}T18:00:00`, tz) }
  catch { return new Date(`${dateStr}T12:30:00Z`) }
}