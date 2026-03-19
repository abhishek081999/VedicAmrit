// ─────────────────────────────────────────────────────────────
//  src/lib/engine/houses.ts
//  Ascendant + house cusp calculations
//  Supports: Whole Sign, Placidus, Equal, Bhava Chalita (Sripati)
// ─────────────────────────────────────────────────────────────

import sweph from 'sweph'
import { getAyanamsha, toSidereal, signOf, degreeInSign } from '@/lib/engine/ephemeris'
import type { AyanamshaMode, HouseSystem, Rashi } from '@/types/astrology'

// ── House system codes for sweph ─────────────────────────────
const HOUSE_SYSTEM_CODES: Record<HouseSystem, string> = {
  whole_sign:    'W',  // Whole Sign
  placidus:      'P',  // Placidus
  equal:         'A',  // Equal (from Ascendant)
  bhava_chalita: 'S',  // Sripati (used for Bhava Chalita midpoint system)
}

// ── Types ─────────────────────────────────────────────────────

export interface HouseData {
  ascendant:        number    // Tropical ascendant degree 0–360
  ascendantSidereal:number    // Sidereal ascendant
  ascRashi:         Rashi     // Ascendant sign 1–12
  ascDegreeInRashi: number    // 0–30 within sign
  mc:               number    // Midheaven (tropical)
  mcSidereal:       number    // Midheaven (sidereal)

  // House cusps (12 values, index 0 = cusp of house 1)
  cusps:         number[]    // Tropical cusps
  cuspsSidereal: number[]    // Sidereal cusps

  // For Bhava Chalita: midpoint (mid-bhava) of each house
  bhavas:        number[]    // Tropical bhava midpoints (Sripati)
  bhavasidereal: number[]    // Sidereal bhava midpoints
}

// ── Main house calculator ─────────────────────────────────────

/**
 * Calculate house cusps and ascendant for a given moment and location
 *
 * @param jd        Julian Day (UT)
 * @param lat       Geographic latitude (degrees N positive)
 * @param lng       Geographic longitude (degrees E positive)
 * @param mode      Ayanamsha mode for sidereal conversion
 * @param system    House system
 */
export function calcHouses(
  jd:   number,
  lat:  number,
  lng:  number,
  mode: AyanamshaMode,
  system: HouseSystem = 'whole_sign',
): HouseData {
  const ayanamsha = getAyanamsha(jd, mode)
  const code = HOUSE_SYSTEM_CODES[system]

  // sweph.houses returns { ascendant, mc, cusps: [0, csp1, csp2, ... csp12] }
  const r = sweph.houses(jd, lat, lng, code) as any
  if (r.error) throw new Error(`houses error: ${r.error}`)

  // Cusps: sweph returns 13-element array [0, h1, h2, ... h12]
  const rawCusps: number[] = r.data?.cusps ?? r.cusps ?? []
  // Slice to get [h1...h12] (1-indexed in sweph → 0-indexed here)
  const cuspsTropical = rawCusps.slice(1, 13)

  const ascTropical = r.data?.points?.[0] ?? r.ascendant ?? rawCusps[1]
  const mcTropical  = r.data?.points?.[1] ?? r.mc ?? 0

  const ascSidereal = toSidereal(ascTropical, ayanamsha)
  const mcSidereal  = toSidereal(mcTropical,  ayanamsha)

  // Sidereal cusps
  const cuspsSidereal = cuspsTropical.map((c: number) => toSidereal(c, ayanamsha))

  // Bhava Chalita midpoints (Sripati midpoint system)
  // Mid-bhava = midpoint between consecutive cusps
  const bhavas: number[] = []
  for (let i = 0; i < 12; i++) {
    const c1 = cuspsTropical[i]
    const c2 = cuspsTropical[(i + 1) % 12]
    let mid = (c1 + c2) / 2
    // Handle wrap-around at 360°
    if (c2 < c1) mid = ((c1 + c2 + 360) / 2) % 360
    bhavas.push(mid)
  }
  const bhavasidereal = bhavas.map((b) => toSidereal(b, ayanamsha))

  // For Whole Sign: cusps are simply 0° of each sign from Asc sign
  if (system === 'whole_sign') {
    const ascSign = signOf(ascSidereal)  // 1–12
    const wseCusps: number[] = []
    const wseSidereal: number[] = []
    for (let i = 0; i < 12; i++) {
      const sign = ((ascSign - 1 + i) % 12) + 1
      const sidDeg = (sign - 1) * 30
      wseSidereal.push(sidDeg)
      wseCusps.push((sidDeg + ayanamsha) % 360)
    }
    return {
      ascendant:         ascTropical,
      ascendantSidereal: ascSidereal,
      ascRashi:          signOf(ascSidereal) as Rashi,
      ascDegreeInRashi:  degreeInSign(ascSidereal),
      mc:                mcTropical,
      mcSidereal,
      cusps:         wseCusps,
      cuspsSidereal: wseSidereal,
      bhavas:        wseCusps,      // same as cusps for whole sign
      bhavasidereal: wseSidereal,
    }
  }

  return {
    ascendant:         ascTropical,
    ascendantSidereal: ascSidereal,
    ascRashi:          signOf(ascSidereal) as Rashi,
    ascDegreeInRashi:  degreeInSign(ascSidereal),
    mc:                mcTropical,
    mcSidereal,
    cusps:         cuspsTropical,
    cuspsSidereal,
    bhavas,
    bhavasidereal,
  }
}

/**
 * Determine which house (1–12) a planet is in
 * Works for both Whole Sign (uses sign) and Placidus/Sripati (uses cusps)
 *
 * @param planetSidereal  Planet sidereal longitude
 * @param houses          HouseData from calcHouses
 * @param useBhava        If true, use Bhava Chalita midpoints
 */
export function planetHouse(
  planetSidereal: number,
  houses: HouseData,
  useBhava = false,
): number {
  const cusps = useBhava ? houses.bhavasidereal : houses.cuspsSidereal
  const lon = ((planetSidereal % 360) + 360) % 360

  for (let i = 0; i < 12; i++) {
    const c1 = cusps[i]
    const c2 = cusps[(i + 1) % 12]

    if (c2 > c1) {
      if (lon >= c1 && lon < c2) return i + 1
    } else {
      // Wrap-around (crosses 0°/360°)
      if (lon >= c1 || lon < c2) return i + 1
    }
  }

  return 1  // fallback
}

/**
 * Get the sign (Rashi) that falls in a given house number
 * For Whole Sign only — house N has sign (Asc sign + N - 1) mod 12
 */
export function wholeSignHouseSign(ascRashi: Rashi, house: number): Rashi {
  return (((ascRashi - 1 + house - 1) % 12) + 1) as Rashi
}

/**
 * Get the lord of a house (Whole Sign)
 * Returns the ruling planet of the sign in that house
 */
export function houseSignLord(ascRashi: Rashi, house: number): string {
  const sign = wholeSignHouseSign(ascRashi, house)
  const SIGN_LORDS: Record<number, string> = {
    1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
    7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
  }
  return SIGN_LORDS[sign]
}
