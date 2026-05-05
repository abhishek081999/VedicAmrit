// ─────────────────────────────────────────────────────────────
//  src/lib/engine/shadbala.ts
//  Comprehensive Shadbala — Six-fold planetary strength system
//  Reference: Brihat Parashara Hora Shastra (BPHS) Ch. 27-28
//  Unit: Rupas (1 Rupa = 60 Shashtiamsas)
// ─────────────────────────────────────────────────────────────

import type { GrahaData, LagnaData, GrahaId, ShadbalaPlanet, ShadbalaResult } from '@/types/astrology'
import { 
  D1, D2, D3, D7, D9, D12, D30 
} from './vargas'
import { 
  NATURAL_FRIENDS, 
  NATURAL_ENEMIES, 
  MOOLATRIKONA_SIGN,
  MOOLATRIKONA_RANGE,
  EXALTATION_SIGN,
  EXALTATION_DEGREE
} from './dignity'

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

function ratioBand(ratio: number): 'excellent' | 'strong' | 'average' | 'weak' {
  if (ratio >= 1.2) return 'excellent'
  if (ratio >= 1.0) return 'strong'
  if (ratio >= 0.85) return 'average'
  return 'weak'
}

function ratioInterpretation(ratio: number): string {
  const band = ratioBand(ratio)
  if (band === 'excellent') return 'Consistently productive strength with surplus bala.'
  if (band === 'strong') return 'Supportive strength above required baseline.'
  if (band === 'average') return 'Usable strength; benefits from targeted strengthening.'
  return 'Below required baseline; remedial and timing support advised.'
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
): { total: number; breakdown: NonNullable<ShadbalaPlanet['details']>['sthana'] } {
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
  
  const diffFromDebil = degDiff(g.totalDegree, debilLon)
  uccha = (diffFromDebil / 180) * 60
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
    // Check if sign is Moolatrikona for this planet
    const isMT = MOOLATRIKONA_SIGN[g.id] === sign
    const degInSign = (v.name === 'D1') ? g.degree : 15 // just use center for others since we don't have varga degrees easily
    const mtRange = MOOLATRIKONA_RANGE[g.id]
    
    if (isMT && v.name === 'D1' && mtRange && degInSign >= mtRange[0] && degInSign <= mtRange[1]) {
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
  ascLon: number,
  mcLon: number,
): { total: number; breakdown: NonNullable<ShadbalaPlanet['details']>['dig'] } {
  const DIG_POINTS: Record<string, number> = {
    Su: mcLon, Ma: mcLon,           // H10
    Mo: (mcLon + 180) % 360, Ve: (mcLon + 180) % 360, // H4
    Sa: (ascLon + 180) % 360,       // H7
    Me: ascLon, Ju: ascLon,         // H1
  }
  const target = DIG_POINTS[g.id] ?? ascLon
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
): { total: number; breakdown: NonNullable<ShadbalaPlanet['details']>['kala'] } {
  const birthMs = birthDate.getTime()
  // Add a 30-minute safety buffer to match JH daytime boundary
  const buffer = 30 * 60000
  const isDaytime = birthMs >= (sunrise.getTime() - buffer) && birthMs <= (sunset.getTime() + buffer)

  // Nathonnatha Bala (Scale 0-60 based on distance from peak)
  // Peak for Mo, Ma, Sa is Midnight; Peak for Su, Ju, Ve is Midday.
  // True Midday/Midnight calculation
  const midday = sunrise.getTime() + (sunset.getTime() - sunrise.getTime()) / 2
  // True Midnight is the center of the night (sunset to next sunrise)
  // Approximate next sunrise as current + 24h for high-speed calculation
  const nextSunrise = sunrise.getTime() + 24 * 3600000
  const midnight = sunset.getTime() + (nextSunrise - sunset.getTime()) / 2
  
  let distFromPeak = 0
  if (['Su', 'Ju', 'Ve'].includes(g.id)) {
    // Peak at Midday
    const diff = Math.abs(birthMs - midday) % (24 * 3600000)
    distFromPeak = Math.min(diff, 24 * 3600000 - diff)
  } else if (['Mo', 'Ma', 'Sa'].includes(g.id)) {
    // Peak at Midnight
    const diff = Math.abs(birthMs - midnight) % (24 * 3600000)
    distFromPeak = Math.min(diff, 24 * 3600000 - diff)
  } else {
    // Mercury is always 60
    distFromPeak = 0
  }
  
  let natho = (g.id === 'Me') ? 60 : (1 - distFromPeak / (12 * 3600000)) * 60

  // Paksha Bala (0-60)
  const distSunMoon = norm(moonLon - sunLon)
  
  // Mercury is benefic unless associated with malefics (Sun, Mars, Saturn)
  // Standard BPHS: Mercury with Sun (Krura) is malefic for Paksha Bala.
  // Proximity within 15 degrees is the standard for association in Shadbala.
  const isMeWithSun = g.id === 'Me' && degDiff(g.totalDegree, sunLon) < 15
  
  // BPHS: Moon is benefic from Shukla 8 (90 deg) to Krishna 8 (270 deg)
  const isBeneficNature = (['Ju', 'Ve'].includes(g.id)) || 
                          (g.id === 'Mo' && distSunMoon >= 90 && distSunMoon <= 270) ||
                          (g.id === 'Me' && !isMeWithSun)
  
  let paksha = 0
  const distFromSun = distSunMoon > 180 ? 360 - distSunMoon : distSunMoon
  const rawPaksha = distFromSun / 3
  
  if (isBeneficNature) {
    paksha = rawPaksha
  } else {
    paksha = 60 - rawPaksha
  }
  if (paksha > 60) paksha = 60
  if (paksha < 0) paksha = 0
  // BPHS Sloka 11: Moon's Paksha Bala is always doubled
  if (g.id === 'Mo') paksha = Math.min(60, paksha * 2)

  // Tribhaga Bala
  let tribhaga = 0
  const dayDur = sunset.getTime() - sunrise.getTime()
  const nightDur = 24 * 3600000 - dayDur
  const partDuration = isDaytime ? dayDur / 3 : nightDur / 3
  
  // Adjusted elapsed calculation to be more robust for night births across day boundaries
  let elapsed = 0
  if (isDaytime) {
    elapsed = birthMs - sunrise.getTime()
  } else {
    if (birthMs >= sunset.getTime()) {
      elapsed = birthMs - sunset.getTime()
    } else {
      // Birth is between 00:00 and Sunrise
      elapsed = (birthMs - sunset.getTime()) + 24 * 3600000
    }
  }
  
  const p = Math.floor(elapsed / partDuration)
  
  // ── (iii) Tribhaga Bala (BPHS Ch.27) ─────────────────────
  // Day: 1st Part=Mercury, 2nd=Sun, 3rd=Saturn
  // Night: 1st Part=Moon, 2nd=Venus, 3rd=Mars
  // Jupiter ALWAYS gets 60 pts
  const dayLords: GrahaId[] = ['Me', 'Su', 'Sa']
  const nightLords: GrahaId[] = ['Mo', 'Ve', 'Ma']
  const tribhagaLord = isDaytime ? dayLords[p] : nightLords[p]
  
  if (g.id === 'Ju') {
    tribhaga = 60
  } else if (g.id === tribhagaLord) {
    tribhaga = 60
  } else if (isDaytime && g.id === 'Me') {
    // Mercury is often granted daytime strength in Tribhaga logic
    tribhaga = 60
  }

  let vaara = (GRAHA_ORDER[weekday] === g.id) ? 45 : 0
  
  // Hora Bala (60 points for the lord of the Vedic hour)
  // JH Setting: "1/24th of sunrise-to-sunrise day" (Equal Horas)
  let hora = 0
  const horaOrder: GrahaId[] = ['Su', 'Ve', 'Me', 'Mo', 'Sa', 'Ju', 'Ma']
  const totalDayMs = 24 * 3600000 
  const horaDur = totalDayMs / 24
  
  // Time since sunrise (using birthMs vs sunrise)
  let elapsedSinceSunrise = 0
  if (birthMs >= sunrise.getTime()) {
    elapsedSinceSunrise = birthMs - sunrise.getTime()
  } else {
    // Birth before sunrise on the calendar day, but sunrise-to-sunrise day starts at prev day sunrise
    elapsedSinceSunrise = (birthMs - sunrise.getTime()) + 24 * 3600000
  }
  
  const horaIndex = Math.floor(elapsedSinceSunrise / horaDur)
  const startHoraIdx = horaOrder.indexOf(GRAHA_ORDER[weekday])
  const currentHoraLord = horaOrder[(startHoraIdx + horaIndex) % 7]
  if (currentHoraLord === g.id) hora = 60

  // Ayana Bala (improved BPHS approximation)
  const dec = g.declination || 0
  let ayana = 0
  if (['Su', 'Ma', 'Ju', 'Ve'].includes(g.id)) {
    ayana = ((24 + dec) / 48) * 60
  } else if (['Mo', 'Sa'].includes(g.id)) {
    ayana = ((24 - dec) / 48) * 60
  } else {
    ayana = 30 + Math.abs(dec)
  }
  if (ayana > 60) ayana = 60
  if (ayana < 0) ayana = 0
  // BPHS Sloka 17: Sun's Ayana Bala is always doubled
  if (g.id === 'Su') ayana = Math.min(60, ayana * 2)

  // Varsha Lord (15 points) and Maasa Lord (30 points)
  // Approximate Sankranti (Sun entry into sign)
  const daysSinceSankranti = (sunLon % 30) / 0.9856
  const maasaDate = new Date(birthMs - daysSinceSankranti * 86400000)
  const maasaJD = (maasaDate.getTime() / 86400000) + 2440587.5
  const maasaWeekday = (Math.floor(maasaJD + 1.5) % 7 + 0) % 7
  const maasaLord = GRAHA_ORDER[maasaWeekday]
  const maasa = (maasaLord === g.id) ? 30 : 0

  const daysSinceMesa = sunLon / 0.9856
  const varshaDate = new Date(birthMs - daysSinceMesa * 86400000)
  const varshaJD = (varshaDate.getTime() / 86400000) + 2440587.5
  const varshaWeekday = (Math.floor(varshaJD + 1.5) % 7 + 0) % 7
  const varshaLord = GRAHA_ORDER[varshaWeekday]
  const varsha = (varshaLord === g.id) ? 15 : 0

  return {
    total: natho + paksha + tribhaga + vaara + hora + maasa + varsha + ayana,
    breakdown: {
      natha: natho,
      paksha,
      tribhaga,
      vaara,
      hora,
      maasa,
      varsha,
      ayana,
      isDayBirth: isDaytime,
    },
  }
}

// ── 4. Chesta Bala ──────────────────────────────────────────

function chestaBala(
  g: GrahaData,
  ayanaBala: number,
  pakshaBala: number,
): { total: number; breakdown: NonNullable<ShadbalaPlanet['details']>['chesta'] } {
  if (g.id === 'Su') return { total: ayanaBala, breakdown: { method: 'sun_ayana', speedAbs: ayanaBala, meanSpeed: ayanaBala } }
  if (g.id === 'Mo') return { total: pakshaBala, breakdown: { method: 'moon_paksha', speedAbs: pakshaBala, meanSpeed: pakshaBala } }

  const speed = Math.abs(g.speed ?? 1)
  const MEAN_SPEED: Record<string, number> = {
    Ma: 0.524, Me: 1.383, Ju: 0.083, Ve: 1.200, Sa: 0.034,
  }
  const mean = MEAN_SPEED[g.id] ?? 1
  
  let total = 0
  if (g.isRetro) {
    total = 60 // Vakra
  } else {
    const ratio = speed / mean
    if (ratio < 0.1) total = 15      // Vikala
    else if (ratio < 0.5) total = 30 // Manda
    else if (ratio <= 1.25) total = 45 // Chara (Normal)
    else total = 30                  // Atichara
  }

  return {
    total,
    breakdown: {
      method: g.isRetro ? 'retrograde' : 'speed_ratio',
      speedAbs: speed,
      meanSpeed: mean,
    },
  }
}

// ── 6. Drik Bala ────────────────────────────────────────────

function drikBala(
  g: GrahaData,
  allGrahas: GrahaData[],
  sunLon: number,
): { total: number; breakdown: NonNullable<ShadbalaPlanet['details']>['drik'] } {
  let bala = 0
  let benefic = 0
  let malefic = 0
  for (const other of allGrahas) {
    if (other.id === g.id) continue
    const dist = norm(other.totalDegree - g.totalDegree)
    
    let pts = 0
    if (dist >= 30 && dist < 60) pts = (dist - 30) * 0.5
    else if (dist >= 60 && dist < 90) pts = 15 + (dist - 60)
    else if (dist >= 90 && dist < 120) pts = 45 - (dist - 90) * 0.5
    else if (dist >= 120 && dist < 150) pts = 30 - (dist - 120) * 0.5
    else if (dist >= 150 && dist <= 180) pts = 15 + (dist - 150) * 1.5
    else if (dist > 180) {
      const symDist = 360 - dist
      if (symDist >= 30 && symDist < 60) pts = (symDist - 30) * 0.5
      else if (symDist >= 60 && symDist < 90) pts = 15 + (symDist - 60)
      else if (symDist >= 90 && symDist < 120) pts = 45 - (symDist - 90) * 0.5
      else if (symDist >= 120 && symDist < 150) pts = 30 - (symDist - 120) * 0.5
      else if (symDist >= 150 && symDist < 180) pts = 15 + (symDist - 150) * 1.5
    }
    
    // Improved Benefic/Malefic logic for Drig Bala
    let isBenefic = ['Ju', 'Ve'].includes(other.id)
    if (other.id === 'Mo') {
      const moonSunDist = norm(other.totalDegree - sunLon)
      isBenefic = moonSunDist > 72 && moonSunDist < 288 // Shukla 7 to Krishna 7 approx
    } else if (other.id === 'Me') {
      isBenefic = !other.isCombust // Approximation
    }
    
    const finalPts = pts / 4
    if (isBenefic) {
      benefic += finalPts
      bala += finalPts
    } else {
      malefic += finalPts
      bala -= finalPts
    }
  }
  return {
    total: Math.max(0, bala), // Capped at 0 to match JH Mercury/Jupiter behavior
    breakdown: { benefic, malefic, net: bala },
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
  
  const jd = (birthDate.getTime() / 86400000) + 2440587.5
  const weekdayRaw = (Math.floor(jd + 1.5) % 7) // 0=Sun
  const weekday = birthDate.getTime() < sunrise.getTime() ? (weekdayRaw + 6) % 7 : weekdayRaw

  for (const id of GRAHA_ORDER) {
    const g = grahas.find(gr => gr.id === id)
    if (!g) continue

    const sthanOut  = sthanaBala(g, grahas, ascSign)
    const digOut    = digBala(g, lagnas.ascDegree, lagnas.mcDegree || 0)
    const kalaOut   = kalaBala(g, birthDate, sunrise, sunset, moonLon, sunLon, weekday)
    const chestaOut = chestaBala(g, kalaOut.breakdown?.ayana || 0, kalaOut.breakdown?.paksha || 0)
    const naisar    = NAISARGIKA_SHASH[id] ?? 30
    const drikOut   = drikBala(g, grahas, sunLon)

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
      qualityBand: ratioBand(ratio),
      interpretation: ratioInterpretation(ratio),
      componentShash: {
        sthana: +sthan.toFixed(3),
        dig: +dig.toFixed(3),
        kala: +kala.toFixed(3),
        chesta: +chesta.toFixed(3),
        naisargika: +naisar.toFixed(3),
        drik: +drik.toFixed(3),
      },
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
          hora: +(kalaOut.breakdown?.hora ?? 0).toFixed(3),
          maasa: +(kalaOut.breakdown?.maasa ?? 0).toFixed(3),
          varsha: +(kalaOut.breakdown?.varsha ?? 0).toFixed(3),
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
  const averageRatio = sorted.length
    ? sorted.reduce((acc, p) => acc + p.ratio, 0) / sorted.length
    : 0
  const generatedProfile: ShadbalaResult['generatedProfile'] =
    averageRatio >= 1.05 ? 'balanced'
      : sorted[0] && sorted[sorted.length - 1] && (sorted[0].ratio - sorted[sorted.length - 1].ratio) > 0.45
        ? 'top-heavy'
        : 'strained'

  return { planets, strongest, weakest, averageRatio: +averageRatio.toFixed(3), generatedProfile }
}