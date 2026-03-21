// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nakshatra.ts
//  Nakshatra, Pada, Tithi, Yoga, Karana, Vara calculations
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'
import { NAKSHATRA_NAMES, NAKSHATRA_LORDS } from '@/types/astrology'

// ── Constants ─────────────────────────────────────────────────

const NAKSHATRA_SPAN = 360 / 27        // 13.3333...°
const PADA_SPAN      = NAKSHATRA_SPAN / 4  // 3.3333...°
const TITHI_SPAN     = 12              // degrees (Sun-Moon angle per Tithi)
const YOGA_SPAN      = 360 / 27        // same as Nakshatra

// ── Nakshatra ─────────────────────────────────────────────────

export interface NakshatraResult {
  index:        number   // 0–26
  name:         string
  shortName:    string
  pada:         number   // 1–4
  lord:         GrahaId
  degreeInNak:  number   // 0–13.33° within nakshatra
  exactDegree:  number   // total sidereal degree
}

/**
 * Get Nakshatra details from sidereal longitude
 */
export function getNakshatra(lonSidereal: number): NakshatraResult {
  const normalized = ((lonSidereal % 360) + 360) % 360
  const index      = Math.floor(normalized / NAKSHATRA_SPAN)
  const degreeInNak = normalized % NAKSHATRA_SPAN
  const pada       = Math.floor(degreeInNak / PADA_SPAN) + 1

  return {
    index,
    name:        NAKSHATRA_NAMES[index],
    shortName:   NAKSHATRA_NAMES[index].substring(0, 3),
    pada,
    lord:        NAKSHATRA_LORDS[index],
    degreeInNak,
    exactDegree: normalized,
  }
}

// ── Tithi ─────────────────────────────────────────────────────

const TITHI_NAMES = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima/Amavasya',
]

const TITHI_LORDS: string[] = [
  'Agni','Brahma','Gauri','Ganesha','Naga','Kartikeya','Surya','Shiva',
  'Durga','Yama','Vishwedeva','Vishnu','Kamadeva','Shiva','Pitrus',
  'Agni','Brahma','Gauri','Ganesha','Naga','Kartikeya','Surya','Shiva',
  'Durga','Yama','Vishwedeva','Vishnu','Kamadeva','Shiva','Pitrus',
]

export interface TithiResult {
  number:  number   // 1–30
  name:    string
  paksha:  'shukla' | 'krishna'
  lord:    string
  percent: number   // 0–100% completion
}

/**
 * Calculate Tithi from Sun and Moon longitudes
 * Tithi = floor((Moon - Sun) / 12°)
 */
export function getTithi(
  moonLonSidereal: number,
  sunLonSidereal:  number,
): TithiResult {
  let diff = moonLonSidereal - sunLonSidereal
  diff     = ((diff % 360) + 360) % 360

  const tithiIndex  = Math.floor(diff / TITHI_SPAN)   // 0–29
  const tithiNumber = tithiIndex + 1                   // 1–30
  const percent     = (diff % TITHI_SPAN) / TITHI_SPAN * 100

  const paksha      = tithiIndex < 15 ? 'shukla' : 'krishna'
  const nameIndex   = tithiIndex < 15 ? tithiIndex : tithiIndex - 15

  return {
    number:  tithiNumber,
    name:    tithiIndex === 14 ? 'Purnima' : tithiIndex === 29 ? 'Amavasya' : TITHI_NAMES[nameIndex],
    paksha,
    lord:    TITHI_LORDS[tithiIndex],
    percent,
  }
}

// ── Yoga ──────────────────────────────────────────────────────

const YOGA_NAMES = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana',
  'Atiganda', 'Sukarma', 'Dhriti', 'Shula', 'Ganda',
  'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra',
  'Siddhi', 'Vyatipata', 'Variyan', 'Parigha', 'Shiva',
  'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma',
  'Indra', 'Vaidhriti',
]

const YOGA_QUALITY: Record<string, 'auspicious' | 'inauspicious' | 'neutral'> = {
  'Vishkambha':'inauspicious', 'Priti':'auspicious', 'Ayushman':'auspicious',
  'Saubhagya':'auspicious', 'Shobhana':'auspicious', 'Atiganda':'inauspicious',
  'Sukarma':'auspicious', 'Dhriti':'auspicious', 'Shula':'inauspicious',
  'Ganda':'inauspicious', 'Vriddhi':'auspicious', 'Dhruva':'auspicious',
  'Vyaghata':'inauspicious', 'Harshana':'auspicious', 'Vajra':'inauspicious',
  'Siddhi':'auspicious', 'Vyatipata':'inauspicious', 'Variyan':'neutral',
  'Parigha':'inauspicious', 'Shiva':'auspicious', 'Siddha':'auspicious',
  'Sadhya':'auspicious', 'Shubha':'auspicious', 'Shukla':'auspicious',
  'Brahma':'auspicious', 'Indra':'auspicious', 'Vaidhriti':'inauspicious',
}

export interface YogaResult {
  number:  number   // 1–27
  name:    string
  quality: 'auspicious' | 'inauspicious' | 'neutral'
  percent: number
}

/**
 * Calculate Yoga from Sun + Moon longitude sum
 * Yoga = floor((Sun + Moon) / 13.33°)
 */
export function getYoga(
  sunLonSidereal:  number,
  moonLonSidereal: number,
): YogaResult {
  const sum   = (sunLonSidereal + moonLonSidereal) % 360
  const index = Math.floor(sum / YOGA_SPAN)
  const name  = YOGA_NAMES[index]

  return {
    number:  index + 1,
    name,
    quality: YOGA_QUALITY[name] || 'neutral',
    percent: (sum % YOGA_SPAN) / YOGA_SPAN * 100,
  }
}

// ── Karana ────────────────────────────────────────────────────

// Fixed Karanas (appear once in a lunar month)
const FIXED_KARANAS = ['Kimstughna', 'Shakuni', 'Chatushpada', 'Naga']

// Movable Karanas (repeat 8 times)
const MOVABLE_KARANAS = [
  'Bava', 'Balava', 'Kaulava', 'Taitila',
  'Garija', 'Vanija', 'Vishti',
]

export interface KaranaResult {
  number:  number   // 1–60
  name:    string
  type:    'fixed' | 'movable'
  isBhadra:boolean  // Vishti (inauspicious)
}

/**
 * Calculate Karana (half-Tithi)
 * There are 60 Karanas in a lunar month
 */
export function getKarana(
  moonLonSidereal: number,
  sunLonSidereal:  number,
): KaranaResult {
  let diff = moonLonSidereal - sunLonSidereal
  diff     = ((diff % 360) + 360) % 360

  const karanaIndex = Math.floor(diff / 6)  // each Karana = 6°

  let name: string
  let type: 'fixed' | 'movable'

  if (karanaIndex === 0) {
    // First Karana of the month — Kimstughna (fixed)
    name = 'Kimstughna'
    type = 'fixed'
  } else if (karanaIndex >= 57) {
    // Last 3 Karanas — fixed
    const fixedIndex = karanaIndex - 57 + 1
    name = FIXED_KARANAS[fixedIndex] || 'Shakuni'
    type = 'fixed'
  } else {
    // Movable Karanas (repeat)
    const movableIndex = (karanaIndex - 1) % 7
    name = MOVABLE_KARANAS[movableIndex]
    type = 'movable'
  }

  return {
    number:   karanaIndex + 1,
    name,
    type,
    isBhadra: name === 'Vishti',
  }
}

// ── Vara (Weekday) ────────────────────────────────────────────

const VARA_NAMES   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const VARA_LORDS: GrahaId[] = ['Su','Mo','Ma','Me','Ju','Ve','Sa']
const VARA_SANSKRIT = ['Ravivāra','Somavāra','Maṅgalavāra','Budhavāra','Guruvāra','Śukravāra','Śanivāra']

export interface VaraResult {
  number:   number   // 0=Sun, 1=Mon, ..., 6=Sat
  name:     string
  sanskrit: string
  lord:     GrahaId
}

/**
 * Get Vara (weekday) from Julian Day
 * JD 0 = Monday (Jan 1, 4713 BC)
 */
export function getVara(jd: number): VaraResult {
  // JD 2451545.0 = Jan 1 2000 = Saturday
  // (JD + 1) % 7 where 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const dow = Math.floor(jd + 1.5) % 7
  return {
    number:   dow,
    name:     VARA_NAMES[dow],
    sanskrit: VARA_SANSKRIT[dow],
    lord:     VARA_LORDS[dow],
  }
}

// ── Hora ──────────────────────────────────────────────────────

// Hora sequence starting from sunrise for each weekday lord
const HORA_SEQUENCE: GrahaId[] = ['Su','Ve','Me','Mo','Sa','Ju','Ma']

/**
 * Get Hora (planetary hour) lord for a given moment
 *
 * @param dayLord   Lord of the current day (Vara)
 * @param horaIndex Which hora we are in (0-based from sunrise)
 */
export function getHoraLord(dayLord: GrahaId, horaIndex: number): GrahaId {
  const dayLordIndex = HORA_SEQUENCE.indexOf(dayLord)
  return HORA_SEQUENCE[(dayLordIndex + horaIndex) % 7]
}

/**
 * Generate full Hora table for a day
 * Returns 24 Horas with their lords and times
 */
export function getHoraTable(
  sunrise: Date,
  sunset:  Date,
  varaLord: GrahaId,
): Array<{ lord: GrahaId; start: Date; end: Date; isDaytime: boolean }> {
  const sunriseMs  = sunrise.getTime()
  const sunsetMs   = sunset.getTime()
  const dayDuration = sunsetMs - sunriseMs
  const nightDuration = (24 * 60 * 60 * 1000) - dayDuration

  const dayHoraDuration   = dayDuration / 12
  const nightHoraDuration = nightDuration / 12

  const horas: Array<{ lord: GrahaId; start: Date; end: Date; isDaytime: boolean }> = []

  // 12 day horas
  for (let i = 0; i < 12; i++) {
    const start = new Date(sunriseMs + i * dayHoraDuration)
    const end   = new Date(sunriseMs + (i + 1) * dayHoraDuration)
    horas.push({
      lord: getHoraLord(varaLord, i),
      start, end,
      isDaytime: true,
    })
  }

  // 12 night horas
  for (let i = 0; i < 12; i++) {
    const start = new Date(sunsetMs + i * nightHoraDuration)
    const end   = new Date(sunsetMs + (i + 1) * nightHoraDuration)
    horas.push({
      lord: getHoraLord(varaLord, i + 12),
      start, end,
      isDaytime: false,
    })
  }

  return horas
}

// ── Rahu Kalam, Gulika Kalam ──────────────────────────────────

// Rahu Kalam portion of the day by weekday (0=Sun...6=Sat)
// Expressed as 8ths of the day (daytime)
const RAHU_KALAM_PORTIONS: number[] = [7, 1, 6, 4, 5, 3, 2] // portion index (1-8)

// Gulika Kalam — standard (Phaladipika) portion by weekday
const GULIKA_KALAM_PORTIONS: number[] = [6, 7, 5, 6, 6, 5, 6]

// Gulika Kalam — Kaala Hora method (different tradition)
// Gulika = Son of Saturn, appears at specific hora windows
const GULIKA_KALAM_HORA: number[] = [5, 4, 3, 2, 1, 7, 6]

const YAMAGANDA_PORTIONS: number[]  = [4, 3, 2, 1, 0, 6, 5]

export type GulikaMode = 'begin' | 'middle' | 'end' | 'phaladipika'

function getTimePortion(
  sunrise: Date,
  sunset:  Date,
  portionIndex: number,
): { start: Date; end: Date } {
  const duration = (sunset.getTime() - sunrise.getTime()) / 8
  const start = new Date(sunrise.getTime() + (portionIndex - 1) * duration)
  const end   = new Date(sunrise.getTime() + portionIndex * duration)
  return { start, end }
}

function getTimePortionWithOffset(
  sunrise: Date,
  sunset:  Date,
  portionIndex: number,
  offset: 0 | 0.5 | 1,  // fraction within the portion slot
): { start: Date; end: Date } {
  const slotDuration = (sunset.getTime() - sunrise.getTime()) / 8
  const slotStart = sunrise.getTime() + (portionIndex - 1) * slotDuration
  const start = new Date(slotStart + offset * slotDuration)
  const end   = new Date(slotStart + (offset + 0.5) * slotDuration)
  return { start, end }
}

export function getRahuKalam(
  sunrise: Date,
  sunset:  Date,
  varaNumber: number,  // 0=Sun...6=Sat
): { start: Date; end: Date } {
  return getTimePortion(sunrise, sunset, RAHU_KALAM_PORTIONS[varaNumber])
}

export function getGulikaKalam(
  sunrise:    Date,
  sunset:     Date,
  varaNumber: number,
  mode:       GulikaMode = 'phaladipika',
): { start: Date; end: Date } {
  if (mode === 'phaladipika') {
    // Standard Phaladipika: 1 slot = 1/8 of daytime, at the given portion
    return getTimePortion(sunrise, sunset, GULIKA_KALAM_PORTIONS[varaNumber])
  }
  // begin/middle/end: use the hora-based table, offset within that slot
  const portionIdx = GULIKA_KALAM_HORA[varaNumber]
  const offsetMap: Record<GulikaMode, 0 | 0.5 | 1> = {
    begin: 0, middle: 0.5, end: 1, phaladipika: 0,
  }
  return getTimePortionWithOffset(sunrise, sunset, portionIdx, offsetMap[mode])
}

export function getYamaganda(
  sunrise: Date,
  sunset:  Date,
  varaNumber: number,
): { start: Date; end: Date } {
  return getTimePortion(sunrise, sunset, YAMAGANDA_PORTIONS[varaNumber] + 1)
}

/**
 * Get Abhijit Muhurta — the auspicious period around solar noon
 * It spans 24 minutes centered on local solar noon
 */
export function getAbhijitMuhurta(
  sunrise: Date,
  sunset:  Date,
): { start: Date; end: Date } | null {
  const solarNoon = new Date((sunrise.getTime() + sunset.getTime()) / 2)
  const halfWidth = 12 * 60 * 1000  // 12 minutes

  // Not available on Wednesdays (traditionally)
  return {
    start: new Date(solarNoon.getTime() - halfWidth),
    end:   new Date(solarNoon.getTime() + halfWidth),
  }
}
