// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nakshatraAdvanced.ts
//  Advanced Nakshatra analytics:
//   • Nakshatra characteristics (deity, gana, yoni, nadi, varna, shakti, nature)
//   • Navtara Chakra (9 Tara groups counted from birth Nak)
//   • Tarabala (day-star strength)
//   • Panchaka Dosha
//   • Graha Nakshatra positions + KP sub-lord
//   • 27×27 Nakshatra compatibility grid
// ─────────────────────────────────────────────────────────────

import { NAKSHATRA_NAMES, NAKSHATRA_LORDS } from '@/types/astrology'
import type { GrahaId, GrahaData } from '@/types/astrology'

// ─────────────────────────────────────────────────────────────
//  Static tables
// ─────────────────────────────────────────────────────────────

/** Nakshatra deity (Devata) — one per nakshatra (0-26) */
export const NAKSHATRA_DEITY: string[] = [
  'Ashwini Kumars', 'Yama', 'Agni', 'Brahma / Prajapati', 'Chandra',
  'Rudra', 'Aditi', 'Brihaspati', 'Sarpas (Nagas)', 'Pitrs (Ancestors)',
  'Bhaga', 'Aryaman', 'Savitar (Surya)', 'Tvashtar / Vishvakarma', 'Vayu',
  'Indra-Agni', 'Mitra', 'Indra', 'Nirrti', 'Apas (Water)',
  'Vishvedevas', 'Vishnu', 'Asta Vasus', 'Varuna', 'Aja Ekapada',
  'Ahirbudhnya', 'Pusha',
]

/** Gana: Deva (divine), Manushya (human), Rakshasa (demonic) */
export const NAKSHATRA_GANA: ('Deva' | 'Manushya' | 'Rakshasa')[] = [
  'Deva','Manushya','Rakshasa','Deva',  'Deva',
  'Manushya','Deva','Deva','Rakshasa','Rakshasa',
  'Manushya','Manushya','Deva','Rakshasa','Deva',
  'Rakshasa','Deva','Rakshasa','Rakshasa','Manushya',
  'Manushya','Deva','Rakshasa','Deva','Manushya',
  'Manushya','Deva',
]

/** Yoni (animal symbol) */
export const NAKSHATRA_YONI: string[] = [
  'Horse','Elephant','Goat','Serpent','Serpent',
  'Dog','Cat','Goat','Cat','Rat',
  'Cow','Cow','Buffalo','Tiger','Buffalo',
  'Tiger','Hare','Hare','Dog','Monkey',
  'Mongoose','Monkey','Lion','Horse','Elephant',
  'Elephant','Fish',
]

/** Nadi: Vata, Pitta, Kapha (repeats 1-2-3, 3 cycles) */
export const NAKSHATRA_NADI: ('Vata' | 'Pitta' | 'Kapha')[] = [
  'Vata','Pitta','Kapha','Kapha','Pitta',
  'Vata','Vata','Pitta','Kapha','Kapha',
  'Pitta','Vata','Vata','Pitta','Kapha',
  'Kapha','Pitta','Vata','Vata','Pitta',
  'Kapha','Kapha','Pitta','Vata','Vata',
  'Pitta','Kapha',
]

/** Varna (caste classification) */
export const NAKSHATRA_VARNA: string[] = [
  'Vaishya','Shudra','Shudra','Brahmin','Brahmin',
  'Brahmin','Kshatriya','Kshatriya','Mleccha','Kshatriya',
  'Brahmin','Kshatriya','Vaishya','Shudra','Shudra',
  'Shudra','Kshatriya','Brahmin','Rakshasa','Brahmin',
  'Vaishya','Shudra','Vaishya','Shudra','Brahmin',
  'Kshatriya','Brahmin',
]

/** Shakti (power/purpose) */
export const NAKSHATRA_SHAKTI: string[] = [
  'Shīghra Shakti (to heal quickly)','Yama Shakti (to remove the life, take away)','Shikha Shakti (to give heat and light)',
  'Rohana Shakti (ability to grow)','Prīṇana Shakti (to give fulfillment)',
  'Yatana Shakti (to make achievements with effort)','Punargamana Shakti (to restore)',
  'Vardhanashakti (to nourish)','Vishleshana Shakti (to destroy and separate)',
  'Kshobhana Shakti (to leave)',
  'Prīti Shakti (to enjoy)','Chhardana Shakti (to give brightness, to shine)',
  'Sarva Shakti (power of giving everything)','Tvashti Shakti (to transform)',
  'Pradhvamsa Shakti (to scatter like wind)',
  'Vyapana Shakti (to spread, pervade)','Radhana Shakti (to worship, adhere)',
  'Bhardana Shakti (to give power over others)','Barhana Shakti (to destroy and remove)',
  'Tarpana Shakti (to refresh / invigorate)',
  'Apyayana Shakti (to expand, strengthen)','Sharvanaa Shakti (to give hearing abilities)',
  'Kshapa Shakti (to be brilliant and prosperous)','Bheshaja Shakti (to give healing)',
  'Yajana Shakti (to elevate through yajna)','Brahma Shakti (to become cosmic, unify)',
  'Poshana Shakti (to nourish, cherish)',
]

/** Nature: Chara (movable), Sthira (fixed), Misra (mixed/dual) */
export const NAKSHATRA_NATURE: ('Chara' | 'Sthira' | 'Mridu' | 'Tikshna' | 'Ugra' | 'Mixed')[] = [
  'Chara','Ugra','Mixed','Sthira','Mridu',
  'Tikshna','Mixed','Mridu','Tikshna','Ugra',
  'Ugra','Mridu','Chara','Mridu','Chara',
  'Mixed','Mridu','Tikshna','Tikshna','Ugra',
  'Mixed','Mridu','Chara','Chara','Ugra',
  'Sthira','Mridu',
]

/** Body part ruled */
export const NAKSHATRA_BODY_PART: string[] = [
  'Knees','Femur/Pelvis','Hips','Forehead/Eyes','Eyes/Eyebrows',
  'Eyes/Brain','Ears/Throat','Mouth/Face','Ears/Chin','Nose/Lips',
  'Right Hand','Left Hand','Hands/Fingers','Neck','Neck/Chest',
  'Chest/Stomach','Stomach/Breast','Neck/Right Side','Hips/Thighs','Back/Thighs',
  'Thighs/Knees','Ears/Knees','Ankles','Lower Legs/Ankles','Left Thigh/Abdomen',
  'Ribs/Sides','Feet/Abdomen',
]

// ─────────────────────────────────────────────────────────────
//  Navtara Chakra
// ─────────────────────────────────────────────────────────────

export type TaraName =
  | 'Janma'       // 1st (birth) — neutral/critical
  | 'Sampat'      // 2nd — wealth
  | 'Vipat'       // 3rd — danger/loss
  | 'Kshema'      // 4th — well-being
  | 'Pratyari'    // 5th — obstacle/enemy
  | 'Sadhaka'     // 6th — achievement
  | 'Vadha'       // 7th — death/destruction
  | 'Mitra'       // 8th — friend
  | 'Ati-Mitra'   // 9th — best friend

export const TARA_NAMES: TaraName[] = [
  'Janma','Sampat','Vipat','Kshema','Pratyari','Sadhaka','Vadha','Mitra','Ati-Mitra',
]

export interface TaraQuality {
  name:        TaraName
  taraNumber:  number   // 1-9
  quality:     'auspicious' | 'inauspicious' | 'neutral'
  meaning:     string
  recommendation: string
}

export const TARA_QUALITIES: Record<TaraName, { quality: 'auspicious' | 'inauspicious' | 'neutral'; meaning: string; recommendation: string }> = {
  'Janma':    { quality: 'neutral',     meaning: 'Birth star – mixed results, intense energy',         recommendation: 'Caution for new beginnings; spiritual activity favoured' },
  'Sampat':   { quality: 'auspicious',  meaning: 'Star of wealth and prosperity',                      recommendation: 'Excellent for financial and material pursuits' },
  'Vipat':    { quality: 'inauspicious',meaning: 'Star of danger and obstacles',                       recommendation: 'Avoid travel, major decisions, or risky ventures' },
  'Kshema':   { quality: 'auspicious',  meaning: 'Star of comfort and well-being',                     recommendation: 'Ideal for health, family, and nurturing activities' },
  'Pratyari': { quality: 'inauspicious',meaning: 'Star of enmity and opposition',                      recommendation: 'Be alert for adversaries; avoid confrontations' },
  'Sadhaka':  { quality: 'auspicious',  meaning: 'Star of achievement and success',                    recommendation: 'Best for creative work, skills, and accomplishments' },
  'Vadha':    { quality: 'inauspicious',meaning: 'Star of destruction and endings',                    recommendation: 'Highly inauspicious; postpone important matters' },
  'Mitra':    { quality: 'auspicious',  meaning: 'Star of friendship and allies',                      recommendation: 'Excellent for partnerships, networking, social matters' },
  'Ati-Mitra':{ quality: 'auspicious',  meaning: 'Star of best friend — highly auspicious',            recommendation: 'Most favourable; ideal for all auspicious activities' },
}

/**
 * Calculate Navtara Chakra for all 27 nakshatras, relative to a birth nakshatra.
 */
export function getNavtaraChakra(birthNakIndex: number): Array<{
  nakshatraIndex: number
  nakshatraName:  string
  tara:           TaraName
  taraNumber:     number
  quality:        'auspicious' | 'inauspicious' | 'neutral'
  meaning:        string
}> {
  return NAKSHATRA_NAMES.map((name, i) => {
    const diff = (i - birthNakIndex + 27) % 27
    const taraIdx = diff % 9
    const taraName = TARA_NAMES[taraIdx]
    const q = TARA_QUALITIES[taraName]
    return {
      nakshatraIndex: i,
      nakshatraName:  name,
      tara:           taraName,
      taraNumber:     taraIdx + 1,
      quality:        q.quality,
      meaning:        q.meaning,
    }
  })
}

/**
 * Get Tarabala for a given day's nakshatra relative to birth nakshatra.
 */
export function getTarabala(birthNakIndex: number, dayNakIndex: number): TaraQuality & { taraNumber: number } {
  const diff = (dayNakIndex - birthNakIndex + 27) % 27
  const taraIdx = diff % 9
  const name = TARA_NAMES[taraIdx]
  const q = TARA_QUALITIES[name]
  return {
    name,
    taraNumber: taraIdx + 1,
    ...q,
  }
}

// ─────────────────────────────────────────────────────────────
//  Nakshatra Characteristics
// ─────────────────────────────────────────────────────────────

export interface NakshatraCharacteristics {
  index:       number
  name:        string
  pada:        number
  lord:        GrahaId
  deity:       string
  gana:        'Deva' | 'Manushya' | 'Rakshasa'
  yoni:        string
  nadi:        'Vata' | 'Pitta' | 'Kapha'
  varna:       string
  shakti:      string
  nature:      string
  bodyPart:    string
  symbol:      string
}

const NAKSHATRA_SYMBOL: string[] = [
  'Horse Head (Ashwa)','Yoni (Female organ)','Razor / Flame','Cart / Chariot','Deer Head',
  'Teardrop / Diamond','Bow and Quiver','Flower (Lotus)','Coiled Serpent','Throne Room',
  'Couch (Palang)','Fig Tree / Bed','Hand (Open Palm)','Pearl / Lamp','Coral / Flame',
  'Potter\'s Wheel','Umbrella / Canopy','Umbrella / Ear-Ring','Elephant Goad (Ankusha)','Fan / Tusk',
  'Elephant Tusk / Bed','Ear (Shravana = hearing)','Drum (Mridanga)','100 Stars / Empty Circle',
  'Sword / Two Front Legs of Funeral Cot','Snake in Water / Last Two Legs of Funeral Cot','Drum / Fish in Water',
]

export function getNakshatraCharacteristics(index: number, pada: number = 1): NakshatraCharacteristics {
  const i = ((index % 27) + 27) % 27
  return {
    index:    i,
    name:     NAKSHATRA_NAMES[i],
    pada,
    lord:     NAKSHATRA_LORDS[i],
    deity:    NAKSHATRA_DEITY[i],
    gana:     NAKSHATRA_GANA[i],
    yoni:     NAKSHATRA_YONI[i],
    nadi:     NAKSHATRA_NADI[i],
    varna:    NAKSHATRA_VARNA[i],
    shakti:   NAKSHATRA_SHAKTI[i],
    nature:   NAKSHATRA_NATURE[i] as string,
    bodyPart: NAKSHATRA_BODY_PART[i],
    symbol:   NAKSHATRA_SYMBOL[i],
  }
}

// ─────────────────────────────────────────────────────────────
//  Panchaka Dosha
// ─────────────────────────────────────────────────────────────

export type PanchakaType =
  | 'Mrityu Panchaka'   // death-like
  | 'Agni Panchaka'     // fire/danger
  | 'Raja Panchaka'     // obstacles from authorities
  | 'Chora Panchaka'    // theft/loss
  | 'Roga Panchaka'     // illness
  | null                // no panchaka

export interface PanchakaResult {
  nakshatraIndex: number
  nakshatraName:  string
  panchaka:       PanchakaType
  description:    string
}

/**
 * Panchaka occurs when Moon transits one of 5 inauspicious nakshatras:
 * Dhanishtha (23), Shatabhisha (24), Purva Bhadra (25), Uttara Bhadra (26), Revati (27=0)
 * Type is determined by Vara (weekday) + Tithi combination.
 */
export function isPanchaka(nakIndex: number): PanchakaType {
  const panchakaSet = [22, 23, 24, 25, 26] // 0-indexed: Dhanishtha to Revati
  if (!panchakaSet.includes(nakIndex)) return null
  const types: Record<number, PanchakaType> = {
    22: 'Mrityu Panchaka',
    23: 'Agni Panchaka',
    24: 'Raja Panchaka',
    25: 'Chora Panchaka',
    26: 'Roga Panchaka',
  }
  return types[nakIndex]
}

const PANCHAKA_DESCRIPTIONS: Record<Exclude<PanchakaType, null>, string> = {
  'Mrityu Panchaka': 'Death-like events possible; avoid surgery, travel, or signing documents',
  'Agni Panchaka':   'Risk of fire, accidents, disputes; avoid electrical work and confrontations',
  'Raja Panchaka':   'Trouble from authorities, government, or elders; avoid legal matters',
  'Chora Panchaka':  'Risk of theft, fraud, or loss; safeguard valuables and contracts',
  'Roga Panchaka':   'Health vulnerability; avoid medical procedures if possible, rest is advised',
}

export function checkPanchaka(nakIndex: number): PanchakaResult {
  const pType = isPanchaka(nakIndex)
  return {
    nakshatraIndex: nakIndex,
    nakshatraName:  NAKSHATRA_NAMES[nakIndex],
    panchaka:       pType,
    description:    pType ? PANCHAKA_DESCRIPTIONS[pType] : 'No Panchaka dosha present',
  }
}

// ─────────────────────────────────────────────────────────────
//  KP Sub-Lords (Krishnamurti Paddhati)
// ─────────────────────────────────────────────────────────────

/**
 * KP uses a 249-division system.
 * Each Nakshatra (13°20') is divided into sub-lords in proportion
 * to Vimshottari dasha years.
 */

const VIMSHOTTARI_YEARS: Record<GrahaId, number> = {
  Ke: 7, Ve: 20, Su: 6, Mo: 10, Ma: 7, Ra: 18, Ju: 16, Sa: 19, Me: 17,
  Ur: 0, Ne: 0, Pl: 0,
}

const KP_SEQUENCE: GrahaId[] = ['Ke','Ve','Su','Mo','Ma','Ra','Ju','Sa','Me']
const KP_TOTAL_YEARS = 120

export interface KPSubLord {
  planet:      GrahaId
  startDeg:    number   // degree within 360° (sidereal)
  endDeg:      number
}

let _kpTable: KPSubLord[] | null = null

function buildKPTable(): KPSubLord[] {
  if (_kpTable) return _kpTable
  const table: KPSubLord[] = []
  const NAK_SPAN = 360 / 27          // 13.333...°
  const SUB_SPAN = NAK_SPAN / KP_TOTAL_YEARS  // per year

  for (let nak = 0; nak < 27; nak++) {
    const nakStart = nak * NAK_SPAN
    // Each nakshatra starts sub-division from its own lord
    const nakLordIdx = KP_SEQUENCE.indexOf(NAKSHATRA_LORDS[nak])
    let cursor = nakStart
    for (let i = 0; i < 9; i++) {
      const subLordId = KP_SEQUENCE[(nakLordIdx + i) % 9]
      const span = SUB_SPAN * VIMSHOTTARI_YEARS[subLordId]
      table.push({ planet: subLordId, startDeg: cursor, endDeg: cursor + span })
      cursor += span
    }
  }
  _kpTable = table
  return table
}

export function getKPSubLord(siderealDeg: number): { nakshatra: string; nakshatraLord: GrahaId; subLord: GrahaId; subSubLord: GrahaId } {
  const normalized = ((siderealDeg % 360) + 360) % 360
  const NAK_SPAN = 360 / 27
  const nakIdx = Math.floor(normalized / NAK_SPAN)

  const table = buildKPTable()
  // Find the sub-lord entry
  const subEntry = table.find(e => normalized >= e.startDeg && normalized < e.endDeg)
    || table[table.length - 1]

  // Sub-sub lord: sub-divide the sub span further
  const subSpan = subEntry.endDeg - subEntry.startDeg
  const subSubSpan = subSpan / KP_TOTAL_YEARS
  const posInSub = normalized - subEntry.startDeg
  const subSubSeqIdx = Math.floor(posInSub / subSubSpan) % 9
  const subLordSeqIdx = KP_SEQUENCE.indexOf(subEntry.planet)
  const subSubLord = KP_SEQUENCE[(subLordSeqIdx + subSubSeqIdx) % 9]

  return {
    nakshatra:    NAKSHATRA_NAMES[nakIdx],
    nakshatraLord: NAKSHATRA_LORDS[nakIdx],
    subLord:      subEntry.planet,
    subSubLord,
  }
}

// ─────────────────────────────────────────────────────────────
//  Graha Nakshatra Positions
// ─────────────────────────────────────────────────────────────

export interface GraNakPosition {
  grahaId:       GrahaId
  grahaName:     string
  nakshatraIndex: number
  nakshatraName: string
  pada:          number
  lord:          GrahaId
  deity:         string
  gana:          'Deva' | 'Manushya' | 'Rakshasa'
  yoni:          string
  nadi:          'Vata' | 'Pitta' | 'Kapha'
  kp:            { subLord: GrahaId; subSubLord: GrahaId }
  degree:        number
  panchaka:      PanchakaType
}

export function getGraNakPositions(grahas: GrahaData[]): GraNakPosition[] {
  return grahas.map(g => {
    const chars = getNakshatraCharacteristics(g.nakshatraIndex, g.pada)
    const kp    = getKPSubLord(g.lonSidereal)
    return {
      grahaId:       g.id,
      grahaName:     g.name,
      nakshatraIndex: g.nakshatraIndex,
      nakshatraName:  g.nakshatraName,
      pada:          g.pada,
      lord:          chars.lord,
      deity:         chars.deity,
      gana:          chars.gana,
      yoni:          chars.yoni,
      nadi:          chars.nadi,
      kp:            { subLord: kp.subLord, subSubLord: kp.subSubLord },
      degree:        g.lonSidereal,
      panchaka:      isPanchaka(g.nakshatraIndex),
    }
  })
}

// ─────────────────────────────────────────────────────────────
//  27×27 Nakshatra Compatibility (Shadashtak / Tarabala Grid)
// ─────────────────────────────────────────────────────────────

export interface NakCompatibility {
  score:       number    // 0–100
  taraScore:   number    // based on Tara (0-3)
  ganaScore:   number    // based on Gana match (0-3)
  nadiScore:   number    // Nadi match, 0 or 3
  yoniScore:   number    // Yoni match 0-4
  taraName:    TaraName
  ganaMatch:   boolean
  nadiMatch:   boolean   // true = dosha (same nadi = bad)
  summary:     'Excellent' | 'Good' | 'Average' | 'Poor' | 'Incompatible'
}

export function getNakCompatibility(nak1: number, nak2: number): NakCompatibility {
  // Tara from nak1's perspective
  const diff1 = (nak2 - nak1 + 27) % 27
  const taraIdx = diff1 % 9
  const taraName = TARA_NAMES[taraIdx]
  const taraScoreMap: Record<string, number> = {
    'Janma': 1, 'Sampat': 3, 'Vipat': 0, 'Kshema': 3, 'Pratyari': 0,
    'Sadhaka': 2, 'Vadha': 0, 'Mitra': 3, 'Ati-Mitra': 3,
  }
  const taraScore = taraScoreMap[taraName] ?? 1

  // Gana compatibility
  const g1 = NAKSHATRA_GANA[nak1], g2 = NAKSHATRA_GANA[nak2]
  let ganaScore = 0
  if (g1 === g2) ganaScore = 3
  else if ((g1 === 'Deva' && g2 === 'Manushya') || (g1 === 'Manushya' && g2 === 'Deva')) ganaScore = 2
  else if ((g1 === 'Deva' && g2 === 'Rakshasa') || (g1 === 'Rakshasa' && g2 === 'Deva')) ganaScore = 0
  else ganaScore = 1

  // Nadi (same nadi = dosha)
  const nadiMatch = NAKSHATRA_NADI[nak1] === NAKSHATRA_NADI[nak2]
  const nadiScore = nadiMatch ? 0 : 3

  // Yoni
  const y1 = NAKSHATRA_YONI[nak1], y2 = NAKSHATRA_YONI[nak2]
  const hostileYonis: [string, string][] = [
    ['Cow','Tiger'],['Horse','Buffalo'],['Dog','Hare'],
    ['Serpent','Mongoose'],['Monkey','Elephant'],['Goat','Deer'],
    ['Cat','Rat'],
  ]
  let yoniScore = 2
  if (y1 === y2) yoniScore = 4
  else if (hostileYonis.some(p => (p[0]===y1&&p[1]===y2)||(p[1]===y1&&p[0]===y2))) yoniScore = 0

  // Total (max 13), mapped to 0-100
  const total = taraScore + ganaScore + nadiScore + yoniScore
  const score = Math.round((total / 13) * 100)

  const summary: NakCompatibility['summary'] =
    score >= 80 ? 'Excellent' :
    score >= 60 ? 'Good' :
    score >= 40 ? 'Average' :
    score >= 20 ? 'Poor' : 'Incompatible'

  return {
    score, taraScore, ganaScore, nadiScore, yoniScore,
    taraName, ganaMatch: g1 === g2, nadiMatch, summary,
  }
}

/**
 * Generate half the 27×27 compatibility matrix (upper triangle).
 */
export function getNakCompatibilityMatrix(): NakCompatibility[][] {
  return Array.from({ length: 27 }, (_, i) =>
    Array.from({ length: 27 }, (_, j) => getNakCompatibility(i, j))
  )
}
