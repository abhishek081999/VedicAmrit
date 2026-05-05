
/**
 * src/lib/engine/kpEngine.ts
 *
 * Krishnamurti Padhdhati (KP) Engine.
 * Implements: 4-level stellar positions, Significators (A/B/C/D),
 * Cuspal Interlinks, and Ruling Planets.
 */

import { 
  GRAHA_NAMES, NAKSHATRA_LORDS, 
  type GrahaId, type Rashi, 
  type KPSignificatorResult, type KPCuspalInterlink, type KPRulingPlanets,
  type GrahaData, type KPSignificatorLevels
} from '@/types/astrology'
import { signOf, getPlanetPosition, dateToJD, SWISSEPH_IDS, NODE_IDS } from './ephemeris'
import { getNakshatra } from './nakshatra'
import { HouseData, planetHouse } from './houses'
import sweph from 'sweph'

// ── Constants ─────────────────────────────────────────────────

const KP_SEQUENCE: GrahaId[] = ['Ke', 'Ve', 'Su', 'Mo', 'Ma', 'Ra', 'Ju', 'Sa', 'Me']
const VIMSHOTTARI_YEARS: Record<GrahaId, number> = {
  Ke: 7, Ve: 20, Su: 6, Mo: 10, Ma: 7, Ra: 18, Ju: 16, Sa: 19, Me: 17,
  Ur: 0, Ne: 0, Pl: 0
}
const TOTAL_VIM_YEARS = 120

const SIGN_LORDS: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju'
}

// ── Stellar Position Calculations ──────────────────────────────

export interface StellarPosition {
  signLord: GrahaId
  starLord: GrahaId
  subLord:  GrahaId
  subSubLord: GrahaId
}

/**
 * Calculates the 4-level KP lords for any sidereal longitude.
 */
export function getKPStellar(longitude: number): StellarPosition {
  const normLon = ((longitude % 360) + 360) % 360
  
  // 1. Sign Lord
  const rashi = signOf(normLon) as Rashi
  const signLord = SIGN_LORDS[rashi]
  
  // 2. Star Lord
  const nakIdx = Math.floor(normLon / (360 / 27))
  const starLord = NAKSHATRA_LORDS[nakIdx % 27]
  
  // 3. Sub Lord
  // Span of 1 nakshatra = 800 arc minutes
  const nakStart = nakIdx * (360 / 27)
  const degInNak = normLon - nakStart
  const minInNak = degInNak * 60
  
  // Sub division logic
  // Starts with the Star Lord, then follows the sequence
  const startLordIdx = KP_SEQUENCE.indexOf(starLord)
  
  let subLord: GrahaId = 'Su'
  let subStart = 0
  let subEnd = 0
  let subSpan = 0
  
  let cursor = 0
  for (let i = 0; i < 9; i++) {
    const sId = KP_SEQUENCE[(startLordIdx + i) % 9]
    const span = (VIMSHOTTARI_YEARS[sId] / TOTAL_VIM_YEARS) * 800 // in minutes
    if (minInNak >= cursor && minInNak < cursor + span) {
      subLord = sId
      subStart = cursor
      subEnd = cursor + span
      subSpan = span
      break
    }
    cursor += span
  }
  
  // 4. Sub-Sub Lord
  // Sub-sub division logic
  // Starts with the Sub Lord, then follows the sequence
  const startSubLordIdx = KP_SEQUENCE.indexOf(subLord)
  const minInSub = minInNak - subStart
  
  let subSubLord: GrahaId = 'Su'
  cursor = 0
  for (let i = 0; i < 9; i++) {
    const ssId = KP_SEQUENCE[(startSubLordIdx + i) % 9]
    const span = (VIMSHOTTARI_YEARS[ssId] / TOTAL_VIM_YEARS) * subSpan // in minutes
    if (minInSub >= cursor && minInSub < cursor + span) {
      subSubLord = ssId
      break
    }
    cursor += span
  }
  
  return { signLord, starLord, subLord, subSubLord }
}

// ── Significators ─────────────────────────────────────────────

/**
 * Calculate KP Significators A, B, C, D for all houses and planets.
 */
export function calculateKPSignificators(
  grahas: GrahaData[],
  houses: HouseData
): KPSignificatorResult {
  const houseSigs: Record<number, KPSignificatorLevels> = {}
  const planetSigs: Record<string, number[]> = {}
  
  // Initialize
  for (let i = 1; i <= 12; i++) {
    houseSigs[i] = { A: [], B: [], C: [], D: [] }
  }
  
  const occupants: Record<number, GrahaId[]> = {}
  const houseLords: Record<number, GrahaId> = {}
  
  // 1. Identify occupants and lords
  grahas.forEach(g => {
    const h = planetHouse(g.lonSidereal, houses)
    if (!occupants[h]) occupants[h] = []
    occupants[h].push(g.id)
    
    // Planet Significations Initialization
    planetSigs[g.id] = []
  })
  
  for (let i = 1; i <= 12; i++) {
    const rashi = signOf(houses.cuspsSidereal[i - 1]) as Rashi
    houseLords[i] = SIGN_LORDS[rashi]
  }
  
  // 2. Build Levels
  for (let h = 1; h <= 12; h++) {
    const hLords: KPSignificatorLevels = houseSigs[h]
    
    // Level B: Occupants
    hLords.B = occupants[h] || []
    
    // Level D: House Lord
    hLords.D = [houseLords[h]];
    
    // Level A: Planet in Star of Occupant
    (occupants[h] || []).forEach((occId: GrahaId) => {
      grahas.forEach(p => {
        if (p.kp?.starLord === occId) {
          if (!hLords.A.includes(p.id)) hLords.A.push(p.id)
        }
      })
    })
    
    // Level C: Planet in Star of House Lord
    const lordId = houseLords[h];
    grahas.forEach(p => {
      if (p.kp?.starLord === lordId) {
        if (!hLords.C.includes(p.id)) hLords.C.push(p.id)
      }
    })
  }
  
  // 3. Build Inverse (Planet -> Houses)
  grahas.forEach(g => {
    for (let h = 1; h <= 12; h++) {
      const levels = houseSigs[h]
      if (
        levels.A.includes(g.id) || 
        levels.B.includes(g.id) || 
        levels.C.includes(g.id) || 
        levels.D.includes(g.id)
      ) {
        planetSigs[g.id].push(h)
      }
    }
  })
  
  return { houseSignificators: houseSigs, planetSignificators: planetSigs }
}

// ── Cuspal Interlinks ─────────────────────────────────────────

export function calculateKPCusps(houses: HouseData): KPCuspalInterlink[] {
  return houses.cuspsSidereal.map((lon, i) => {
    const stellar = getKPStellar(lon)
    return {
      house:      i + 1,
      ...stellar,
      degree:     lon % 30,
      rashi:      signOf(lon) as Rashi
    }
  })
}

// ── Ruling Planets ────────────────────────────────────────────

/**
 * Calculates Ruling Planets (RP) for a given date and location.
 */
export function calculateRulingPlanets(
  jd: number,
  lat: number,
  lng: number,
  ayanValue: number
): KPRulingPlanets {
  // 1. Day Lord
  // Standard Vara logic
  const days = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']
  // JD 0 was a Monday? sweph.day_of_week
  const dOfWeek = (Math.floor(jd + 1.5) % 7) // 0=Mon, 1=Tue, ... 6=Sun
  const dayLordId = ['Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Su'][dOfWeek] as GrahaId
  
  // 2. Moon Star/Sign Lords
  const moonPos = getPlanetPosition(jd, SWISSEPH_IDS.Mo, true)
  const moonStellar = getKPStellar(moonPos.longitude)
  
  // 3. Lagna Star/Sign Lords
  // We need to calculate Ascendant for this JD
  const r = sweph.houses(jd, lat, lng, 'P') as any // Placidus
  const ascTropical = r.ascendant || r.data?.points?.[0] || 0
  const ascSidereal = (ascTropical - ayanValue + 360) % 360
  const ascStellar = getKPStellar(ascSidereal)
  
  return {
    dayLord:      dayLordId,
    moonStarLord: moonStellar.starLord,
    moonSignLord: moonStellar.signLord,
    lagnaStarLord: ascStellar.starLord,
    lagnaSignLord: ascStellar.signLord
  }
}

/**
 * Returns the starting sidereal degree for a KP Horary seed number (1-249).
 */
export function getKPSeedDegree(seed: number): number {
  const NAK_SPAN = 360 / 27
  const SUB_SPAN = NAK_SPAN / 120
  if (seed < 1 || seed > 249) return 0
  
  let currentSeed = 1
  for (let nak = 0; nak < 27; nak++) {
    const nakStart = nak * NAK_SPAN
    const nakLord = NAKSHATRA_LORDS[nak]
    const nakLordIdx = KP_SEQUENCE.indexOf(nakLord)
    
    let cursor = nakStart
    for (let i = 0; i < 9; i++) {
       const subLordId = KP_SEQUENCE[(nakLordIdx + i) % 9]
       const span = (VIMSHOTTARI_YEARS[subLordId] || 0) * SUB_SPAN
       
       if (currentSeed === seed) {
          return cursor 
       }
       
       cursor += span
       currentSeed++
       if (currentSeed > 249) break
    }
    if (currentSeed > 249) break
  }
  return 0
}
