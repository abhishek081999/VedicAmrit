// ─────────────────────────────────────────────────────────────
//  src/lib/engine/shadbala.ts
//  Comprehensive Shadbala — Six-fold planetary strength system
//  Reference: Brihat Parashara Hora Shastra (BPHS) Ch. 27-28
//  Unit: Rupas (1 Rupa = 60 Shashtiamsas)
// ─────────────────────────────────────────────────────────────

import type { GrahaData, LagnaData, GrahaId } from '@/types/astrology'
import { 
  D1, D2, D3, D7, D9, D12, D30 
} from './vargas'
import { 
  NATURAL_FRIENDS, 
  NATURAL_ENEMIES, 
  MOOLATRIKONA_SIGN,
  EXALTATION_SIGN,
  EXALTATION_DEGREE
} from './dignity'

// ── Types ─────────────────────────────────────────────────────

export interface ShadbalaPlanet {
  id:           string
  sthanaBala:   number   // Positional strength
  digBala:      number   // Directional strength
  kalaBala:     number   // Temporal strength
  chestaBala:   number   // Motional strength
  naisargikaBala: number // Natural strength
  drikBala:     number   // Aspectual strength
  total:        number   // Total Shadbala in Rupas
  totalShash:   number   // Total in Shashtiamsas (×60)
  required:     number   // Minimum required Rupas
  ratio:        number   // total / required
  isStrong:     boolean
  details?: {
    sthana?: {
      uccha: number
      saptavargaja: number
      ojhayugma: number
      kendradi: number
      drekkana: number
    }
    dig?: {
      targetDegree: number
      angularDistance: number
    }
    kala?: {
      natha: number
      paksha: number
      tribhaga: number
      vaara: number
      ayana: number
      isDayBirth: boolean
    }
    chesta?: {
      method: 'retrograde_max' | 'luminary_constant' | 'speed_ratio'
      speedAbs: number
      meanSpeed: number
    }
    drik?: {
      benefic: number
      malefic: number
      net: number
    }
  }
}

export interface ShadbalaResult {
  planets: Record<string, ShadbalaPlanet>
  strongest: string
  weakest:   string
}

// ── Constants ─────────────────────────────────────────────────

const GRAHA_ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']

const NAISARGIKA_SHASH: Record<string, number> = {
  Su: 60.0, Mo: 51.43, Ve: 42.86, Ju: 34.29,
  Me: 25.71, Ma: 17.14, Sa: 8.57,
}

const REQUIRED_RUPAS: Record<string, number> = {
  Su: 6.5, Mo: 6.0, Ma: 5.0, Me: 7.0,
  Ju: 6.5, Ve: 5.5, Sa: 5.0,
}

// Signs ruled by each planet
const RASHI_LORD: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju'
}

// ── Helpers ───────────────────────────────────────────────────

function norm(d: number) { return ((d % 360) + 360) % 360 }

function degDiff(a: number, b: number): number {
  const d = Math.abs(norm(a - b))
  return d > 180 ? 360 - d : d
}

/**
 * Get temporal relationship (Tatkalika Maitri)
 * Planets in 2, 3, 4, 10, 11, 12 houses from each other are friends
 */
function getTemporalFriendship(p1Sign: number, p2Sign: number): boolean {
  const diff = (p2Sign - p1Sign + 12) % 12
  return [1, 2, 3, 9, 10, 11].includes(diff) // Houses 2,3,4,10,11,12 (1-based index diff)
}

/**
 * Get compound relationship (Naisargika + Tatkalika)
 */
function getCompoundDignity(planet: GrahaId, rashi: number, allGrahas: GrahaData[]): number {
  const lord = RASHI_LORD[rashi]
  if (lord === planet) return 30 // Swakshetra (Own)

  const naturalFriend = NATURAL_FRIENDS[planet]?.includes(lord)
  const naturalEnemy = NATURAL_ENEMIES[planet]?.includes(lord)
  
  const p1 = allGrahas.find(g => g.id === planet)
  const p2 = allGrahas.find(g => g.id === lord)
  
  const temporalFriend = (p1 && p2) ? getTemporalFriendship(p1.rashi, p2.rashi) : false

  let base = 0 // 1=friend, 0=neutral, -1=enemy
  if (naturalFriend) base = 1
  else if (naturalEnemy) base = -1
  
  let temp = temporalFriend ? 1 : -1
  const sum = base + temp
  
  if (sum === 2) return 22.5
  if (sum === 1) return 15
  if (sum === 0) return 7.5
  if (sum === -1) return 3.75
  return 1.875 // sum === -2
}

// ── 1. Sthana Bala ──────────────────────────────────────────

function sthanaBala(
  g: GrahaData,
  allGrahas: GrahaData[],
  ascSign: number,
): { total: number; breakdown: ShadbalaPlanet['details']['sthana'] } {
  let bala = 0
  let uccha = 0
  let saptavargaja = 0
  let ojhayugma = 0
  let kendradi = 0
  let drekkana = 0

  // (a) Uccha Bala (Max 60)
  const exalt = EXALTATION_DEGREE[g.id] ?? 0
  const exaltLon = ( (EXALTATION_SIGN[g.id]! - 1) * 30 + exalt )
  const debilLon = (exaltLon + 180) % 360
  
  let diff = norm(g.totalDegree - debilLon)
  uccha = (diff / 180) * 60
  bala += uccha

  // (b) Saptavargaja Bala
  const vargas = [
    { fn: D1, name: 'D1' }, { fn: D2, name: 'D2' }, { fn: D3, name: 'D3' },
    { fn: D7, name: 'D7' }, { fn: D9, name: 'D9' }, { fn: D12, name: 'D12' },
    { fn: D30, name: 'D30' }
  ]
  
  let sapta = 0
  vargas.forEach(v => {
    const sign = v.fn(g.totalDegree)
    if (v.name === 'D1' && MOOLATRIKONA_SIGN[g.id] === sign) {
      sapta += 45
    } else {
      sapta += getCompoundDignity(g.id as GrahaId, sign, allGrahas)
    }
  })
  saptavargaja = sapta
  bala += saptavargaja

  // (c) Ojhayugma Bala
  const isOddRashi = g.rashi % 2 !== 0
  const isOddNav = D9(g.totalDegree) % 2 !== 0
  if (['Su', 'Ma', 'Ju', 'Me', 'Sa'].includes(g.id)) {
    if (isOddRashi) ojhayugma += 15
    if (isOddNav)   ojhayugma += 15
  } else {
    if (!isOddRashi) ojhayugma += 15
    if (!isOddNav)   ojhayugma += 15
  }
  bala += ojhayugma

  // (d) Kendradi Bala
  const house = (g.rashi - ascSign + 12) % 12 + 1
  if ([1, 4, 7, 10].includes(house)) kendradi = 60
  else if ([2, 5, 8, 11].includes(house)) kendradi = 30
  else kendradi = 15
  bala += kendradi

  // (e) Drekkana Bala
  const decanate = Math.floor(g.degree / 10)
  if (['Su', 'Ma', 'Ju'].includes(g.id) && decanate === 0) drekkana += 15
  if (['Mo', 'Ve'].includes(g.id) && decanate === 2) drekkana += 15
  if (['Me', 'Sa'].includes(g.id) && decanate === 1) drekkana += 15
  bala += drekkana

  return {
    total: bala,
    breakdown: {
      uccha,
      saptavargaja,
      ojhayugma,
      kendradi,
      drekkana,
    },
  }
}

// ── 2. Dig Bala ──────────────────────────────────────────────

function digBala(
  g: GrahaData,
  ascDeg: number,
  cusps: number[],
): { total: number; breakdown: ShadbalaPlanet['details']['dig'] } {
  if (!cusps || cusps.length < 12) {
    return {
      total: 30,
      breakdown: { targetDegree: ascDeg, angularDistance: 90 },
    }
  }
  const DIG_POINTS: Record<string, number> = {
    Su: cusps[9], Ma: cusps[9], // H10
    Mo: cusps[3], Ve: cusps[3], // H4
    Sa: cusps[6],                // H7
    Me: cusps[0], Ju: cusps[0], // H1
  }
  const target = DIG_POINTS[g.id] ?? cusps[0]
  let diff = degDiff(g.totalDegree, target)
  return {
    total: (180 - diff) / 3,
    breakdown: {
      targetDegree: target,
      angularDistance: diff,
    },
  }
}

// ── 3. Kala Bala ─────────────────────────────────────────────

function kalaBala(
  g: GrahaData,
  birthDate: Date,
  sunrise: Date,
  sunset: Date,
  moonLon: number,
  sunLon: number,
  weekday: number,
): { total: number; breakdown: ShadbalaPlanet['details']['kala'] } {
  const birthMs = birthDate.getTime()
  const isDaytime = birthMs >= sunrise.getTime() && birthMs <= sunset.getTime()

  let natho = 0
  if (g.id === 'Me') natho = 60
  else if (['Su', 'Ju', 'Ve'].includes(g.id)) natho = isDaytime ? 60 : 0
  else natho = isDaytime ? 0 : 60

  const dist = norm(moonLon - sunLon)
  const isBenefic = ['Ju', 'Ve', 'Me', 'Mo'].includes(g.id)
  let paksha = isBenefic ? dist / 3 : (360 - dist) / 3 
  if (paksha > 60) paksha = 60

  let tribhaga = 0
  const dayDur = sunset.getTime() - sunrise.getTime()
  const nightDur = 24 * 3600000 - dayDur
  const partDuration = isDaytime ? dayDur / 3 : nightDur / 3
  const elapsed = isDaytime ? (birthMs - sunrise.getTime()) : (birthMs - sunset.getTime() + (birthMs < sunset.getTime() ? 24 * 3600000 : 0))
  const p = Math.floor(elapsed / partDuration)
  
  if (isDaytime) {
    if (p === 0 && g.id === 'Ju') tribhaga = 60
    if (p === 1 && g.id === 'Su') tribhaga = 60
    if (p === 2 && g.id === 'Sa') tribhaga = 60
  } else {
    if (p === 0 && g.id === 'Ve') tribhaga = 60
    if (p === 1 && g.id === 'Ma') tribhaga = 60
    if (p === 2 && g.id === 'Mo') tribhaga = 60
  }
  if (g.id === 'Me') tribhaga = 60

  let vaara = (GRAHA_ORDER[weekday] === g.id) ? 45 : 0
  let ayana = 30 
  return {
    total: natho + paksha + tribhaga + vaara + ayana,
    breakdown: {
      natha: natho,
      paksha,
      tribhaga,
      vaara,
      ayana,
      isDayBirth: isDaytime,
    },
  }
}

// ── 4. Chesta Bala ──────────────────────────────────────────

function chestaBala(g: GrahaData): { total: number; breakdown: ShadbalaPlanet['details']['chesta'] } {
  if (g.isRetro) {
    return {
      total: 60,
      breakdown: {
        method: 'retrograde_max',
        speedAbs: Math.abs(g.speed ?? 0),
        meanSpeed: 0,
      },
    }
  }
  if (g.id === 'Su' || g.id === 'Mo') {
    return {
      total: 30,
      breakdown: {
        method: 'luminary_constant',
        speedAbs: Math.abs(g.speed ?? 0),
        meanSpeed: 0,
      },
    }
  }
  const speed = Math.abs(g.speed ?? 1)
  const MEAN_SPEED: Record<string, number> = {
    Ma: 0.524, Me: 1.383, Ju: 0.083, Ve: 1.200, Sa: 0.034,
  }
  const mean = MEAN_SPEED[g.id] ?? 1
  return {
    total: Math.min(60, (mean / speed) * 30),
    breakdown: {
      method: 'speed_ratio',
      speedAbs: speed,
      meanSpeed: mean,
    },
  }
}

// ── 6. Drik Bala ────────────────────────────────────────────

function drikBala(
  g: GrahaData,
  allGrahas: GrahaData[],
): { total: number; breakdown: ShadbalaPlanet['details']['drik'] } {
  let bala = 0
  let benefic = 0
  let malefic = 0
  for (const other of allGrahas) {
    if (other.id === g.id) continue
    const dist = norm(other.totalDegree - g.totalDegree)
    let pts = 0
    if (dist > 30 && dist <= 60) pts = (dist - 30) / 2
    else if (dist > 60 && dist <= 90) pts = 15 + (dist - 60) 
    else if (dist > 90 && dist <= 120) pts = 45 - (dist - 90) / 2
    else if (dist > 120 && dist <= 150) pts = 30 + (dist - 120) / 2
    else if (dist > 150 && dist <= 180) pts = 45 + (dist - 150) / 2
    
    const isBenefic = ['Ju', 'Ve', 'Me', 'Mo'].includes(other.id)
    if (isBenefic) {
      const add = pts / 4
      benefic += add
      bala += add
    } else {
      const sub = pts / 4
      malefic += sub
      bala -= sub
    }
  }
  return {
    total: bala,
    breakdown: {
      benefic,
      malefic,
      net: bala,
    },
  }
}

// ── Main Calculator ───────────────────────────────────────────

export function calculateShadbala(
  grahas:    GrahaData[],
  lagnas:    LagnaData,
  birthDate: Date,
  sunrise:   Date,
  sunset:    Date,
  moonLon:   number,
  sunLon:    number,
): ShadbalaResult {
  const planets: Record<string, ShadbalaPlanet> = {}
  const ascSign = lagnas.ascRashi
  const ascDeg = lagnas.ascDegree
  
  const jd = (birthDate.getTime() / 86400000) + 2440587.5
  const weekday = (Math.floor(jd + 1.5) % 7 + 0) % 7 // 0=Sun

  for (const id of GRAHA_ORDER) {
    const g = grahas.find(gr => gr.id === id)
    if (!g) continue

    const sthanOut  = sthanaBala(g, grahas, ascSign)
    const digOut    = digBala(g, ascDeg, lagnas.cusps ?? [])
    const kalaOut   = kalaBala(g, birthDate, sunrise, sunset, moonLon, sunLon, weekday)
    const chestaOut = chestaBala(g)
    const naisar = NAISARGIKA_SHASH[id] ?? 30
    const drikOut   = drikBala(g, grahas)

    const sthan = sthanOut.total
    const dig = digOut.total
    const kala = kalaOut.total
    const chesta = chestaOut.total
    const drik = drikOut.total

    const totalShash = sthan + dig + kala + chesta + naisar + drik
    const total      = totalShash / 60
    const required   = REQUIRED_RUPAS[id] ?? 5.0
    const ratio      = total / required

    planets[id] = {
      id, 
      sthanaBala: +(sthan / 60).toFixed(3), 
      digBala: +(dig / 60).toFixed(3),
      kalaBala: +(kala / 60).toFixed(3), 
      chestaBala: +(chesta / 60).toFixed(3),
      naisargikaBala: +(naisar / 60).toFixed(3), 
      drikBala: +(drik / 60).toFixed(3),
      total: +total.toFixed(3), 
      totalShash: +totalShash.toFixed(1),
      required, 
      ratio: +ratio.toFixed(3), 
      isStrong: ratio >= 1.0,
      details: {
        sthana: {
          uccha: +(sthanOut.breakdown?.uccha ?? 0).toFixed(3),
          saptavargaja: +(sthanOut.breakdown?.saptavargaja ?? 0).toFixed(3),
          ojhayugma: +(sthanOut.breakdown?.ojhayugma ?? 0).toFixed(3),
          kendradi: +(sthanOut.breakdown?.kendradi ?? 0).toFixed(3),
          drekkana: +(sthanOut.breakdown?.drekkana ?? 0).toFixed(3),
        },
        dig: {
          targetDegree: +(digOut.breakdown?.targetDegree ?? 0).toFixed(3),
          angularDistance: +(digOut.breakdown?.angularDistance ?? 0).toFixed(3),
        },
        kala: {
          natha: +(kalaOut.breakdown?.natha ?? 0).toFixed(3),
          paksha: +(kalaOut.breakdown?.paksha ?? 0).toFixed(3),
          tribhaga: +(kalaOut.breakdown?.tribhaga ?? 0).toFixed(3),
          vaara: +(kalaOut.breakdown?.vaara ?? 0).toFixed(3),
          ayana: +(kalaOut.breakdown?.ayana ?? 0).toFixed(3),
          isDayBirth: Boolean(kalaOut.breakdown?.isDayBirth),
        },
        chesta: {
          method: chestaOut.breakdown?.method ?? 'speed_ratio',
          speedAbs: +(chestaOut.breakdown?.speedAbs ?? 0).toFixed(4),
          meanSpeed: +(chestaOut.breakdown?.meanSpeed ?? 0).toFixed(4),
        },
        drik: {
          benefic: +(drikOut.breakdown?.benefic ?? 0).toFixed(3),
          malefic: +(drikOut.breakdown?.malefic ?? 0).toFixed(3),
          net: +(drikOut.breakdown?.net ?? 0).toFixed(3),
        },
      },
    }
  }

  const sorted   = Object.values(planets).sort((a, b) => b.total - a.total)
  const strongest = sorted[0]?.id  ?? 'Su'
  const weakest   = sorted[sorted.length - 1]?.id ?? 'Sa'

  return { planets, strongest, weakest }
}