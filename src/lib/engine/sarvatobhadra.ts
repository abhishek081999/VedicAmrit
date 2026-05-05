/**
 * src/lib/engine/sarvatobhadra.ts
 * ─────────────────────────────────────────────────────────────
 * Sarvatobhadra Chakra (SBC) — Classical Vedic 9×9 Predictive Grid
 *
 * The SBC is used for:
 *  - Transit Vedha (obstructive aspect) analysis
 *  - Body-part affliction detection
 *  - Financial pulse timing (Dhana Vedha)
 *  - Muhurta electional support
 *
 * Functions accept SBCGrahaInput (just id + lonSidereal).
 * Full GrahaData objects are compatible via structural typing.
 *
 * Grid layout (9×9):
 *  - 27 Nakshatras on the outer ring (perimeter, clockwise from top-left)
 *  - 12 Rashis in interior cells
 *  - 7 Varas (weekday lords) in interior cells
 *  - Sanskrit vowels/consonants fill remaining cells (with body-part mapping)
 *  - Center cell [4,4] = the native
 */

import { NAKSHATRA_NAMES, RASHI_SANSKRIT } from '@/types/astrology'
import type { GrahaId } from '@/types/astrology'

/** Minimal planet data needed by SBC functions — structural subset of GrahaData */
export interface SBCGrahaInput {
  id:           GrahaId
  lonSidereal:  number
}

// ─────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────

export type SBCCellType = 'nakshatra' | 'rashi' | 'vara' | 'vowel' | 'consonant' | 'anga' | 'center' | 'empty'

export interface SBCCell {
  type:             SBCCellType
  row:              number
  col:              number
  label:            string      // Primary display text
  sublabel?:        string      // Secondary text
  nakshatraIndex?:  number      // 0-26
  rashiIndex?:      number      // 1-12
  varaLord?:        GrahaId
  bodyPart?:        string      // Sanskrit-letter body-part association
}

export interface PlanetOnSBC {
  planet:          GrahaId
  nakshatraIndex:  number
  row:             number
  col:             number
  isNatal:         boolean
  isMalefic:       boolean
  color:           string
  label:           string
}

export interface VedhaResult {
  planet:               GrahaId
  sourceNak:            number         // 0-26
  sourceCell:           [number, number]
  isMalefic:            boolean
  affectedNakshatras:   number[]
  affectedRashis:       number[]
  affectedVaras:        GrahaId[]
}

export interface SBCActivation {
  natalPlanet:    GrahaId
  transitPlanet:  GrahaId
  nakshatra:      number
  nakshatraName:  string
  type:           'shubha' | 'papa'
  strength:       number          // 0-100
  meaning:        string
}

export interface SBCAnalysis {
  vedhas:           VedhaResult[]
  activations:      SBCActivation[]
  bodyPartsAlerted: Array<{ part: string; by: GrahaId }>
  financialPulse: {
    score:          number            // -50 to +50
    trend:          'expansion' | 'contraction' | 'neutral'
    bullish:        string[]
    bearish:        string[]
  }
}

// ─────────────────────────────────────────────────────────────
//  Static layout tables
// ─────────────────────────────────────────────────────────────

/**
 * [row, col] for each nakshatra 0-26 (Ashwini..Revati) in classical
 * Sarvatobhadra perimeter order as commonly drawn:
 *   Top row (→): 23..27, 1, 2
 *   Right col (↓): 3..9
 *   Bottom row (←): 10..16
 *   Left col (↑): 17,18,19,20,21,Abhijit,22
 *
 * Abhijit is handled as a dedicated perimeter cell in buildSBCGrid()
 * and is intentionally not part of this 0-26 map.
 */
export const SBC_NAK_POS: [number, number][] = [
  [0, 6], //  0 Ashwini
  [0, 7], //  1 Bharani
  [1, 8], //  2 Krittika
  [2, 8], //  3 Rohini
  [3, 8], //  4 Mrigashira
  [4, 8], //  5 Ardra
  [5, 8], //  6 Punarvasu
  [6, 8], //  7 Pushya
  [7, 8], //  8 Ashlesha
  [8, 7], //  9 Magha
  [8, 6], // 10 Purva Phalguni
  [8, 5], // 11 Uttara Phalguni
  [8, 4], // 12 Hasta
  [8, 3], // 13 Chitra
  [8, 2], // 14 Swati
  [8, 1], // 15 Vishakha
  [7, 0], // 16 Anuradha
  [6, 0], // 17 Jyeshtha
  [5, 0], // 18 Moola
  [4, 0], // 19 Purva Ashadha
  [3, 0], // 20 Uttara Ashadha
  [1, 0], // 21 Shravana
  [0, 1], // 22 Dhanishtha
  [0, 2], // 23 Shatabhisha
  [0, 3], // 24 Purva Bhadrapada
  [0, 4], // 25 Uttara Bhadrapada
  [0, 5], // 26 Revati
]

/** rashiIndex (1-12) → [row, col] in the interior (classical SBC layout variant) */
export const SBC_RASHI_POS: Record<number, [number, number]> = {
  1:  [5,2],   // Aries
  2:  [3,6],   // Taurus
  3:  [4,6],   // Gemini
  4:  [5,6],   // Cancer
  5:  [6,5],   // Leo
  6:  [6,4],   // Virgo
  7:  [6,3],   // Libra
  8:  [2,5],   // Scorpio
  9:  [2,4],   // Sagittarius
  10: [2,3],   // Capricorn
  11: [3,2],   // Aquarius
  12: [4,2],   // Pisces
}

const RASHI_LABEL: Record<number, string> = {
  1:'Ar', 2:'Ta', 3:'Ge', 4:'Cn',
  5:'Le', 6:'Vi', 7:'Li', 8:'Sc',
  9:'Sg', 10:'Cp', 11:'Aq', 12:'Pi',
}

const NAK_SHORT: string[] = [
  'Aśw', 'Bha', 'Kṛt', 'Roh', 'Mṛg', 'Ārd', 'Pun',
  'Puṣ', 'Āśl', 'Mag', 'PPh', 'UPh', 'Has', 'Cit',
  'Swā', 'Viś', 'Anu', 'Jye', 'Mūl', 'PĀṣ', 'UĀṣ',
  'Śra', 'Dha', 'Śat', 'PBh', 'UBh', 'Rev',
]

/**
 * Interior cell definitions — varas, vowels, consonants.
 * Key = "row,col"
 */
const INTERIOR: Record<string, Pick<SBCCell, 'type' | 'label' | 'sublabel' | 'varaLord' | 'bodyPart'>> = {
  '1,1': { type: 'vowel',     label: 'ṝ ॠ' },
  '1,2': { type: 'consonant', label: 'g ग' },
  '1,3': { type: 'consonant', label: 's स\nśa श' },
  '1,4': { type: 'consonant', label: 'd द\njh झ\nth थ\nñ ञ' },
  '1,5': { type: 'consonant', label: 'c च' },
  '1,6': { type: 'consonant', label: 'l ल' },
  '1,7': { type: 'vowel',     label: 'u उ' },

  '2,1': { type: 'consonant', label: 'kh ख\nṣ ष' },
  '2,2': { type: 'vowel',     label: 'ai ऐ' },
  '2,6': { type: 'vowel',     label: 'lṛ लृ' },
  '2,7': { type: 'consonant', label: 'a अ' },

  '3,1': { type: 'consonant', label: 'j ज\ny य' },
  '3,3': { type: 'vowel',     label: 'aḥ अः' },
  '3,4': { type: 'anga',      label: 'Ṛkta\n4 9 14\nFr' },
  '3,5': { type: 'vowel',     label: 'o ओ' },
  '3,7': { type: 'consonant', label: 'v व\nb ब' },

  '4,1': { type: 'consonant', label: 'bh भ\ndh ध\nph फ\nḍh ढ' },
  '4,3': { type: 'anga',      label: 'Jāya\n3 8 13\nTh' },
  '4,4': { type: 'anga',      label: 'Pūrṇa\n5 10 15\nSa' },
  '4,5': { type: 'anga',      label: 'Nanda\n1 6 11\nSu Tu' },
  '4,7': { type: 'consonant', label: 'k क\nc च\ngh घ\nṅ ङ' },

  '5,1': { type: 'consonant', label: 'y य\nj ज' },
  '5,3': { type: 'vowel',     label: 'aṃ अं' },
  '5,4': { type: 'anga',      label: 'Bhadra\n2 7 12\nMo We' },
  '5,5': { type: 'vowel',     label: 'au औ' },
  '5,7': { type: 'consonant', label: 'h ह' },

  '6,1': { type: 'consonant', label: 'n न' },
  '6,2': { type: 'vowel',     label: 'e ए' },
  '6,6': { type: 'vowel',     label: 'lṝ लॄ' },
  '6,7': { type: 'consonant', label: 'ḍ ड' },

  '7,1': { type: 'vowel',     label: 'ṛ ऋ' },
  '7,2': { type: 'consonant', label: 't त' },
  '7,3': { type: 'consonant', label: 'r र' },
  '7,4': { type: 'consonant', label: 'p प\nṣ ष\nṇ ण\nṭh ठ' },
  '7,5': { type: 'consonant', label: 'ṭ ट' },
  '7,6': { type: 'consonant', label: 'm म' },
  '7,7': { type: 'vowel',     label: 'ū ऊ' },
}

/** Corner vowels and Abhijit marker on the outer perimeter */
const PERIMETER_SPECIAL: Record<string, Pick<SBCCell, 'type' | 'label' | 'sublabel'>> = {
  '0,0': { type: 'vowel',     label: 'ई ī' },
  '0,8': { type: 'vowel',     label: 'a अ' },
  '8,0': { type: 'vowel',     label: 'i इ' },
  '8,8': { type: 'vowel',     label: 'ā आ' },
  '2,0': { type: 'nakshatra', label: '00 Abh', sublabel: 'Abhijit' },
}

// ─────────────────────────────────────────────────────────────
//  Grid builder
// ─────────────────────────────────────────────────────────────

export function buildSBCGrid(): SBCCell[][] {
  // Start with empty cells
  const grid: SBCCell[][] = Array.from({ length: 9 }, (_, r) =>
    Array.from({ length: 9 }, (_, c) => ({
      type:  'empty' as SBCCellType,
      row:   r,
      col:   c,
      label: '',
    }))
  )

  // Place nakshatras on perimeter
  SBC_NAK_POS.forEach(([r, c], i) => {
    grid[r][c] = {
      type:            'nakshatra',
      row:             r,
      col:             c,
      label:           `${String(i + 1).padStart(2, '0')} ${NAK_SHORT[i]}`,
      sublabel:        NAKSHATRA_NAMES[i],
      nakshatraIndex:  i,
    }
  })

  // Place rashis in interior
  Object.entries(SBC_RASHI_POS).forEach(([rStr, [r, c]]) => {
    const ri = parseInt(rStr)
    grid[r][c] = {
      type:        'rashi',
      row:         r,
      col:         c,
      label:       RASHI_LABEL[ri],
      sublabel:    RASHI_SANSKRIT[ri as keyof typeof RASHI_SANSKRIT],
      rashiIndex:  ri,
    }
  })

  // Place interior vara/vowel/consonant/center cells
  Object.entries(INTERIOR).forEach(([key, data]) => {
    const [r, c] = key.split(',').map(Number)
    if (grid[r][c].type === 'empty') {
      grid[r][c] = { row: r, col: c, ...data }
    }
  })

  // Place corner vowels + Abhijit perimeter marker
  Object.entries(PERIMETER_SPECIAL).forEach(([key, data]) => {
    const [r, c] = key.split(',').map(Number)
    if (grid[r][c].type === 'empty') {
      grid[r][c] = { row: r, col: c, ...data }
    }
  })

  return grid
}

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

const MALEFICS: GrahaId[] = ['Sa', 'Ma', 'Ra', 'Ke', 'Su']

export function isMalefic(id: GrahaId): boolean {
  return MALEFICS.includes(id)
}

export function nakFromLon(lon: number): number {
  return Math.floor(((lon % 360) + 360) % 360 / (360 / 27))
}

import { GRAHA_DISPLAY_COLOR } from './grahaDisplayColors'

export const PLANET_COLOR: Record<GrahaId, string> = GRAHA_DISPLAY_COLOR

export const PLANET_SYMBOL: Record<GrahaId, string> = {
  Su: '☀', Mo: '☽', Ma: '♂', Me: '☿',
  Ju: '♃', Ve: '♀', Sa: '♄', Ra: '☊',
  Ke: '☋', Ur: '⛢', Ne: '♆', Pl: '♇',
}

// ─────────────────────────────────────────────────────────────
//  Vedha (obstruction / aspect) calculation
// ─────────────────────────────────────────────────────────────

/**
 * A planet at [row, col] casts vedha on every cell in its row AND column.
 * Returns the nakshatras, rashis, and vara-lords affected.
 */
export function getVedhaCells(
  row: number,
  col: number,
  grid: SBCCell[][],
): {
  affectedNakshatras: number[]
  affectedRashis:     number[]
  affectedVaras:      GrahaId[]
} {
  const affected: SBCCell[] = [
    ...grid[row].filter(c => c.col !== col),      // same row
    ...grid.map(r => r[col]).filter(c => c.row !== row), // same col
  ]

  const affectedNakshatras = affected
    .filter(c => c.type === 'nakshatra' && c.nakshatraIndex !== undefined)
    .map(c => c.nakshatraIndex!)

  const affectedRashis = affected
    .filter(c => c.type === 'rashi' && c.rashiIndex !== undefined)
    .map(c => c.rashiIndex!)

  const affectedVaras = affected
    .filter(c => c.type === 'vara' && c.varaLord)
    .map(c => c.varaLord!)

  return { affectedNakshatras, affectedRashis, affectedVaras }
}

/**
 * Get body parts from cells in the same row/col as [row, col]
 */
export function getBodyPartsInVedha(
  row: number,
  col: number,
  grid: SBCCell[][],
): string[] {
  const affected: SBCCell[] = [
    ...grid[row].filter(c => c.col !== col),
    ...grid.map(r => r[col]).filter(c => c.row !== row),
  ]
  return affected
    .filter(c => c.bodyPart)
    .map(c => c.bodyPart!)
    .filter(Boolean)
}

// ─────────────────────────────────────────────────────────────
//  Planet placement helpers
// ─────────────────────────────────────────────────────────────

export function getPlanetsOnSBC(
  grahas: SBCGrahaInput[],
  isNatal: boolean,
): PlanetOnSBC[] {
  return grahas
    .filter(g => !['Ur', 'Ne', 'Pl'].includes(g.id))
    .map(g => {
      const nak       = nakFromLon(g.lonSidereal)
      const [row, col] = SBC_NAK_POS[nak]
      return {
        planet:         g.id,
        nakshatraIndex: nak,
        row,
        col,
        isNatal,
        isMalefic:      isMalefic(g.id),
        color:          PLANET_COLOR[g.id] ?? '#888',
        label:          PLANET_SYMBOL[g.id] ?? g.id,
      }
    })
}

// ─────────────────────────────────────────────────────────────
//  Interpretation helpers
// ─────────────────────────────────────────────────────────────

const PLANET_NAME: Record<GrahaId, string> = {
  Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury',
  Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu',
  Ur: 'Uranus',  Ne: 'Neptune', Pl: 'Pluto',
}

function vedhaInterpretation(
  transit: GrahaId,
  natal: GrahaId,
  nakName: string,
  isPapa: boolean,
): string {
  const tn = PLANET_NAME[transit]
  const nn = PLANET_NAME[natal]
  if (!isPapa) {
    if (transit === 'Ju') return `Jupiter's grace touches natal ${nn} in ${nakName} — wisdom, growth & prosperity`
    if (transit === 'Ve') return `Venus blesses natal ${nn} in ${nakName} — harmony, beauty & pleasures`
    if (transit === 'Mo') return `Moon's receptive energy flows to natal ${nn} in ${nakName} — heightened intuition`
    return `${tn} casts auspicious vedha on natal ${nn} in ${nakName}`
  } else {
    if (transit === 'Sa') return `Saturn's stern gaze falls on natal ${nn} in ${nakName} — discipline & karmic correction`
    if (transit === 'Ra') return `Rahu's shadow eclipses natal ${nn} in ${nakName} — unexpected disruption`
    if (transit === 'Ke') return `Ketu detaches natal ${nn} in ${nakName} — surrender and release indicated`
    if (transit === 'Ma') return `Mars agitates natal ${nn} in ${nakName} — energy surge, avoid conflicts`
    return `${tn} obstructs natal ${nn} in ${nakName} — caution advised`
  }
}

// ─────────────────────────────────────────────────────────────
//  Full SBC Analysis
// ─────────────────────────────────────────────────────────────

/** Wealth-related nakshatras (Dhana nakshatras) */
const WEALTH_NAKS  = new Set([1, 3, 4, 7, 11, 14, 21, 22, 24, 25]) // Bharani,Rohini,Mrigashira,Pushya,UttaraPhalguni,Chitra,Shravana,Dhanishtha,PurvaBhadra,UttaraBhadra
const WEALTH_RASHIS = new Set([2, 5, 9, 11]) // Taurus, Leo, Sagittarius, Aquarius

export function analyzeSBC(
  natalGrahas:   SBCGrahaInput[],
  transitGrahas: SBCGrahaInput[],
  grid:          SBCCell[][],
): SBCAnalysis {
  const vedhas:          VedhaResult[]    = []
  const activations:     SBCActivation[]  = []
  const bodyPartsAlerted: Array<{ part: string; by: GrahaId }> = []

  // Build natal nakshatra → planets map
  const natalNakMap = new Map<number, GrahaId[]>()
  natalGrahas
    .filter(g => !['Ur', 'Ne', 'Pl'].includes(g.id))
    .forEach(g => {
      const nak = nakFromLon(g.lonSidereal)
      if (!natalNakMap.has(nak)) natalNakMap.set(nak, [])
      natalNakMap.get(nak)!.push(g.id)
    })

  // Financial pulse accumulators
  let finScore = 0
  const bullish: string[] = []
  const bearish: string[] = []

  // Process each transit planet
  transitGrahas
    .filter(g => !['Ur', 'Ne', 'Pl'].includes(g.id))
    .forEach(tp => {
      const nak      = nakFromLon(tp.lonSidereal)
      const [row, col] = SBC_NAK_POS[nak]
      const papa    = isMalefic(tp.id)

      const { affectedNakshatras, affectedRashis, affectedVaras } =
        getVedhaCells(row, col, grid)

      vedhas.push({
        planet:             tp.id,
        sourceNak:          nak,
        sourceCell:         [row, col],
        isMalefic:          papa,
        affectedNakshatras,
        affectedRashis,
        affectedVaras,
      })

      // Activation: does any natal planet fall in the vedha range?
      affectedNakshatras.forEach(affNak => {
        const natalHere = natalNakMap.get(affNak)
        if (!natalHere) return
        natalHere.forEach(np => {
          activations.push({
            natalPlanet:   np,
            transitPlanet: tp.id,
            nakshatra:     affNak,
            nakshatraName: NAKSHATRA_NAMES[affNak],
            type:          papa ? 'papa' : 'shubha',
            strength:      papa ? 65 : 80,
            meaning:       vedhaInterpretation(tp.id, np, NAKSHATRA_NAMES[affNak], papa),
          })
        })
      })

      // Body parts alert from malefic vedha
      if (papa) {
        getBodyPartsInVedha(row, col, grid)
          .slice(0, 3) // Limit to 3 per planet
          .forEach(part => {
            if (!bodyPartsAlerted.find(b => b.part === part && b.by === tp.id)) {
              bodyPartsAlerted.push({ part, by: tp.id })
            }
          })
      }

      // Financial pulse
      const hitsWealthNak   = affectedNakshatras.some(n => WEALTH_NAKS.has(n))
      const hitsWealthRashi = affectedRashis.some(r => WEALTH_RASHIS.has(r))
      if (hitsWealthNak || hitsWealthRashi) {
        if (!papa) {
          const pts = tp.id === 'Ju' ? 20 : tp.id === 'Ve' ? 15 : tp.id === 'Mo' ? 8 : 5
          finScore += pts
          bullish.push(`${PLANET_NAME[tp.id]} activates wealth sector from ${NAKSHATRA_NAMES[nak]}`)
        } else {
          const pts = tp.id === 'Ra' ? 25 : tp.id === 'Sa' ? 20 : tp.id === 'Ke' ? 18 : 12
          finScore -= pts
          bearish.push(`${PLANET_NAME[tp.id]} obstructs wealth flow from ${NAKSHATRA_NAMES[nak]}`)
        }
      }
    })

  const clampedScore = Math.max(-50, Math.min(50, finScore))
  const trend =
    clampedScore > 8  ? 'expansion' :
    clampedScore < -8 ? 'contraction' : 'neutral'

  return {
    vedhas,
    activations,
    bodyPartsAlerted: bodyPartsAlerted.slice(0, 12),
    financialPulse: {
      score:   clampedScore,
      trend,
      bullish: bullish.slice(0, 5),
      bearish: bearish.slice(0, 5),
    },
  }
}

// ─────────────────────────────────────────────────────────────
//  Singleton grid cache
// ─────────────────────────────────────────────────────────────

let _cachedGrid: SBCCell[][] | null = null

export function getSBCGrid(): SBCCell[][] {
  if (!_cachedGrid) _cachedGrid = buildSBCGrid()
  return _cachedGrid
}

// ─────────────────────────────────────────────────────────────
//  Diagonal Vedha (Mars, Jupiter, Saturn, Rahu, Ketu)
// ─────────────────────────────────────────────────────────────

/** Planets that cast diagonal vedha in addition to row + column */
export const DIAGONAL_PLANETS = new Set<GrahaId>(['Ma', 'Ju', 'Sa', 'Ra', 'Ke'])

/**
 * Full vedha for a planet at [row, col]:
 *   - All planets: row + column
 *   - Ma, Ju, Sa, Ra, Ke additionally: all four diagonals
 * Returns affected nakshatras, rashis, varas, plus a Set of diagonal cell keys.
 */
export function getFullVedhaCells(
  planet: GrahaId,
  row: number,
  col: number,
  grid: SBCCell[][],
): {
  affectedNakshatras: number[]
  affectedRashis:     number[]
  affectedVaras:      GrahaId[]
  diagonalKeys:       Set<string>
} {
  const seen        = new Set<string>()
  const cells:      SBCCell[] = []
  const diagonalKeys = new Set<string>()

  // Row + column (all planets)
  for (let i = 0; i < 9; i++) {
    if (i !== col) {
      const k = `${row},${i}`
      if (!seen.has(k)) { seen.add(k); cells.push(grid[row][i]) }
    }
    if (i !== row) {
      const k = `${i},${col}`
      if (!seen.has(k)) { seen.add(k); cells.push(grid[i][col]) }
    }
  }

  // Diagonals — only for special planets
  if (DIAGONAL_PLANETS.has(planet)) {
    for (let i = 1; i < 9; i++) {
      const deltas: [number, number][] = [[i, i], [i, -i], [-i, i], [-i, -i]]
      deltas.forEach(([dr, dc]) => {
        const r = row + dr, c = col + dc
        if (r >= 0 && r < 9 && c >= 0 && c < 9) {
          const k = `${r},${c}`
          if (!seen.has(k)) { seen.add(k); cells.push(grid[r][c]); diagonalKeys.add(k) }
        }
      })
    }
  }

  return {
    affectedNakshatras: cells
      .filter(c => c.type === 'nakshatra' && c.nakshatraIndex !== undefined)
      .map(c => c.nakshatraIndex!),
    affectedRashis: cells
      .filter(c => c.type === 'rashi' && c.rashiIndex !== undefined)
      .map(c => c.rashiIndex!),
    affectedVaras: cells
      .filter(c => c.type === 'vara' && c.varaLord)
      .map(c => c.varaLord!),
    diagonalKeys,
  }
}

// ─────────────────────────────────────────────────────────────
//  Name Syllable → Nakshatra mapping
// ─────────────────────────────────────────────────────────────

/**
 * Traditional Sanskrit syllable → nakshatra index (0-26).
 * Each nakshatra has 4 padas, each starting with a Sanskrit sound.
 * The name's first syllable determines the birth/name nakshatra.
 */
export const NAME_SYLLABLE_NAK: Record<string, number> = {
  // 0 Ashwini
  'chu': 0, 'che': 0, 'cho': 0, 'la': 0,
  // 1 Bharani
  'li': 1, 'lu': 1, 'le': 1, 'lo': 1,
  // 2 Krittika
  'a': 2, 'i': 2, 'u': 2, 'e': 2,
  // 3 Rohini
  'o': 3, 'va': 3, 'vi': 3, 'vu': 3,
  // 4 Mrigashira
  've': 4, 'vo': 4, 'ka': 4, 'ki': 4,
  // 5 Ardra
  'ku': 5, 'gha': 5, 'jha': 5, 'ng': 5,
  // 6 Punarvasu
  'ke': 6, 'ko': 6, 'ha': 6, 'hi': 6,
  // 7 Pushya
  'hu': 7, 'he': 7, 'ho': 7, 'da': 7,
  // 8 Ashlesha
  'di': 8, 'du': 8, 'de': 8, 'do': 8,
  // 9 Magha
  'ma': 9, 'mi': 9, 'mu': 9, 'me': 9,
  // 10 Purva Phalguni
  'mo': 10, 'ta': 10, 'ti': 10, 'tu': 10,
  // 11 Uttara Phalguni
  'te': 11, 'to': 11, 'pa': 11, 'pi': 11,
  // 12 Hasta
  'pu': 12, 'sha': 12, 'na': 12, 'tha': 12,
  // 13 Chitra
  'pe': 13, 'po': 13, 'ra': 13, 'ri': 13,
  // 14 Swati
  'ru': 14, 're': 14, 'ro': 14,
  // 15 Vishakha
  'ti2': 15, 'tu2': 15, 'te2': 15, 'to2': 15, // aliased; prefer 2-char lookup
  // 16 Anuradha
  'ni': 16, 'nu': 16, 'ne': 16, 'no': 16,
  // 17 Jyeshtha
  'ya': 17, 'yi': 17, 'yu': 17, 'ye': 17,
  // 18 Moola
  'yo': 18, 'ba': 18, 'bi': 18, 'bu': 18,
  // 19 Purva Ashadha
  'bha': 19, 'dha': 19, 'pha': 19, 'bhu': 19,
  // 20 Uttara Ashadha
  'be': 20, 'bo': 20, 'ja': 20, 'ji': 20,
  // 21 Shravana
  'khi': 21, 'khu': 21, 'khe': 21, 'kho': 21, 'ju': 21,
  // 22 Dhanishtha
  'ga': 22, 'gi': 22, 'gu': 22, 'ge': 22,
  // 23 Shatabhisha
  'go': 23, 'sa': 23, 'si': 23, 'su': 23,
  // 24 Purva Bhadrapada
  'se': 24, 'so': 24, 'daa': 24, 'dee': 24,
  // 25 Uttara Bhadrapada
  'du2': 25, 'tha2': 25, 'jha2': 25, 'jna': 25,
  // 26 Revati
  'cha': 26, 'chi': 26,
}

/**
 * Convert name's first letters to a nakshatra index (0-26).
 * Tries 3-char, then 2-char, then 1-char prefix (lowercased).
 * Returns null if no match found.
 */
export function nameToNakshatra(name: string): number | null {
  const n = name.trim().toLowerCase().replace(/[^a-z]/g, '')
  if (!n) return null
  const try3 = NAME_SYLLABLE_NAK[n.slice(0, 3)]
  if (try3 !== undefined) return try3
  const try2 = NAME_SYLLABLE_NAK[n.slice(0, 2)]
  if (try2 !== undefined) return try2
  const try1 = NAME_SYLLABLE_NAK[n.slice(0, 1)]
  if (try1 !== undefined) return try1
  return null
}

// ─────────────────────────────────────────────────────────────
//  Life Area Significations
// ─────────────────────────────────────────────────────────────

export type LifeAreaKey = 'health' | 'wealth' | 'relationships' | 'travel' | 'enemies' | 'career'

export interface LifeAreaPrediction {
  area:       LifeAreaKey
  icon:       string
  label:      string
  positive:   string[]
  negative:   string[]
  score:      number   // -100 to +100
}

const LIFE_AREA_PLANET_POSITIVE: Record<GrahaId, LifeAreaKey[]> = {
  Su: ['career', 'health'],
  Mo: ['health', 'wealth', 'relationships'],
  Ma: ['health', 'career', 'enemies'],
  Me: ['wealth', 'career', 'travel'],
  Ju: ['wealth', 'relationships', 'career'],
  Ve: ['relationships', 'wealth'],
  Sa: ['career', 'travel'],
  Ra: ['wealth', 'travel'],
  Ke: ['health', 'enemies'],
  Ur: [], Ne: [], Pl: [],
}

const LIFE_AREA_PLANET_NEGATIVE: Record<GrahaId, LifeAreaKey[]> = {
  Su: ['health', 'enemies'],
  Mo: ['health', 'relationships'],
  Ma: ['health', 'enemies', 'travel'],
  Me: ['wealth'],
  Ju: [],
  Ve: ['relationships'],
  Sa: ['health', 'career', 'travel'],
  Ra: ['health', 'enemies', 'wealth'],
  Ke: ['health', 'relationships'],
  Ur: [], Ne: [], Pl: [],
}

const LIFE_AREA_META: Record<LifeAreaKey, { icon: string; label: string }> = {
  health:        { icon: '🏥', label: 'Health & Vitality' },
  wealth:        { icon: '💰', label: 'Wealth & Finance' },
  relationships: { icon: '💑', label: 'Relationships & Love' },
  travel:        { icon: '✈️', label: 'Travel & Movement' },
  enemies:       { icon: '⚔️', label: 'Enemies & Conflict' },
  career:        { icon: '🏆', label: 'Career & Fame' },
}

export function getLifeAreaPredictions(
  activations: SBCActivation[],
): LifeAreaPrediction[] {
  const scoreMap: Record<LifeAreaKey, number>   = { health: 0, wealth: 0, relationships: 0, travel: 0, enemies: 0, career: 0 }
  const positiveMap: Record<LifeAreaKey, string[]> = { health: [], wealth: [], relationships: [], travel: [], enemies: [], career: [] }
  const negativeMap: Record<LifeAreaKey, string[]> = { health: [], wealth: [], relationships: [], travel: [], enemies: [], career: [] }

  activations.forEach(act => {
    const tp  = act.transitPlanet
    const nak = act.nakshatraName.split(' ')[0]
    if (act.type === 'shubha') {
      LIFE_AREA_PLANET_POSITIVE[tp]?.forEach(area => {
        scoreMap[area] = Math.min(100, scoreMap[area] + 30)
        positiveMap[area].push(`${PLANET_NAME_SBC[tp]} blesses ${area} zone via ${nak}`)
      })
    } else {
      LIFE_AREA_PLANET_NEGATIVE[tp]?.forEach(area => {
        scoreMap[area] = Math.max(-100, scoreMap[area] - 25)
        negativeMap[area].push(`${PLANET_NAME_SBC[tp]} afflicts ${area} zone via ${nak}`)
      })
    }
  })

  return (Object.keys(LIFE_AREA_META) as LifeAreaKey[]).map(area => ({
    area,
    ...LIFE_AREA_META[area],
    positive: positiveMap[area].slice(0, 3),
    negative: negativeMap[area].slice(0, 3),
    score:    scoreMap[area],
  }))
}

const PLANET_NAME_SBC: Record<GrahaId, string> = {
  Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury',
  Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu',
  Ur: 'Uranus', Ne: 'Neptune', Pl: 'Pluto',
}

// ─────────────────────────────────────────────────────────────
//  Muhurta Assessment
// ─────────────────────────────────────────────────────────────

export interface MuhurtaEvent {
  id:          string
  label:       string
  icon:        string
  goodPlanets: GrahaId[]   // These should NOT be malefic-afflicted
  needStrong:  GrahaId[]   // These should be benefic-aspected
  score?:      number
  verdict?:    'excellent' | 'good' | 'neutral' | 'avoid'
  note?:       string
}

export const MUHURTA_EVENTS: MuhurtaEvent[] = [
  { id: 'marriage',    label: 'Marriage',          icon: '💍', goodPlanets: ['Ve', 'Mo'],      needStrong: ['Ve', 'Ju'] },
  { id: 'business',   label: 'Business Start',     icon: '🏢', goodPlanets: ['Me', 'Ju'],      needStrong: ['Me', 'Ju'] },
  { id: 'travel',     label: 'Travel / Journey',   icon: '✈️', goodPlanets: ['Mo'],             needStrong: ['Mo', 'Me'] },
  { id: 'investment', label: 'Investment',          icon: '📈', goodPlanets: ['Ju', 'Ve'],      needStrong: ['Ju'] },
  { id: 'surgery',    label: 'Surgery / Medical',  icon: '🏥', goodPlanets: ['Ma'],             needStrong: ['Mo'] },
  { id: 'education',  label: 'Education Start',    icon: '📚', goodPlanets: ['Me', 'Ju'],      needStrong: ['Ju', 'Me'] },
  { id: 'career',     label: 'Job / Career',       icon: '💼', goodPlanets: ['Su'],             needStrong: ['Su', 'Ju'] },
  { id: 'legal',      label: 'Legal Matters',      icon: '⚖️', goodPlanets: ['Ju'],             needStrong: ['Ju'] },
  { id: 'property',   label: 'Property Purchase',  icon: '🏠', goodPlanets: ['Ma', 'Sa'],       needStrong: ['Ju', 'Ma'] },
  { id: 'religious',  label: 'Religious Ceremony', icon: '🪔', goodPlanets: ['Ju', 'Su'],       needStrong: ['Ju'] },
]

export function assessMuhurta(
  events: MuhurtaEvent[],
  vedhas: VedhaResult[],
): MuhurtaEvent[] {
  const maleficSet  = new Set(vedhas.filter(v => v.isMalefic).map(v => v.planet))
  const beneficSet  = new Set(vedhas.filter(v => !v.isMalefic).map(v => v.planet))

  return events.map(ev => {
    let score = 50
    const issues: string[] = []

    ev.goodPlanets.forEach(p => {
      if (maleficSet.has(p)) { score -= 25; issues.push(`${PLANET_NAME_SBC[p]} is afflicted`) }
    })
    ev.needStrong.forEach(p => {
      if (beneficSet.has(p)) score += 20
    })

    const verdict: MuhurtaEvent['verdict'] =
      score >= 80 ? 'excellent' :
      score >= 60 ? 'good' :
      score >= 40 ? 'neutral' : 'avoid'

    return {
      ...ev,
      score,
      verdict,
      note: issues.length ? issues.join('; ') : undefined,
    }
  })
}

// ─────────────────────────────────────────────────────────────
//  Remedies
// ─────────────────────────────────────────────────────────────

export interface PlanetRemedy {
  planet:  GrahaId
  name:    string
  color:   string
  remedy:  string
  mantra:  string
  stone:   string
  day:     string
  deity:   string
}

export const PLANET_REMEDIES: PlanetRemedy[] = [
  { planet: 'Su', name: 'Sun',     color: '#FF8C00', remedy: 'Offer water to the Sun at sunrise daily. Donate wheat & jaggery on Sundays.',                        mantra: 'Om Hraam Hreem Hraum Sah Suryaya Namah',      stone: 'Ruby',           day: 'Sunday',    deity: 'Surya Dev' },
  { planet: 'Mo', name: 'Moon',    color: '#A8C8E8', remedy: 'Offer milk to Lord Shiva on Mondays. Feed rice to crows. Donate white items.',                       mantra: 'Om Shraam Shreem Shraum Sah Chandraya Namah', stone: 'Pearl',          day: 'Monday',    deity: 'Lord Shiva' },
  { planet: 'Ma', name: 'Mars',    color: '#E84040', remedy: 'Offer red flowers to Hanuman on Tuesdays. Donate red lentils and copper.',                           mantra: 'Om Kraam Kreem Kraum Sah Bhaumaya Namah',    stone: 'Red Coral',      day: 'Tuesday',   deity: 'Lord Hanuman' },
  { planet: 'Me', name: 'Mercury', color: '#48C774', remedy: 'Feed green grass to cows on Wednesdays. Donate green clothing and moong dal.',                       mantra: 'Om Braam Breem Braum Sah Budhaya Namah',     stone: 'Emerald',        day: 'Wednesday', deity: 'Lord Vishnu' },
  { planet: 'Ju', name: 'Jupiter', color: '#FFD700', remedy: 'Feed banana to cows on Thursdays. Donate yellow items and chana dal. Respect teachers.',             mantra: 'Om Graam Greem Graum Sah Gurave Namah',      stone: 'Yellow Sapphire',day: 'Thursday',  deity: 'Lord Brihaspati' },
  { planet: 'Ve', name: 'Venus',   color: '#FF69B4', remedy: 'Donate white items, perfumes, and sweets on Fridays. Worship Goddess Lakshmi.',                      mantra: 'Om Draam Dreem Draum Sah Shukraya Namah',    stone: 'Diamond',        day: 'Friday',    deity: 'Goddess Lakshmi' },
  { planet: 'Sa', name: 'Saturn',  color: '#8B9DC3', remedy: 'Feed black sesame to the poor on Saturdays. Light mustard oil lamp under Peepal tree.',              mantra: 'Om Praam Preem Praum Sah Shanaye Namah',     stone: 'Blue Sapphire',  day: 'Saturday',  deity: 'Lord Shani' },
  { planet: 'Ra', name: 'Rahu',    color: '#8B4513', remedy: 'Donate coconut in flowing water. Feed stray dogs. Recite Durga Kavach on Saturdays.',                mantra: 'Om Bhraam Bhreem Bhraum Sah Rahave Namah',   stone: 'Hessonite',      day: 'Saturday',  deity: 'Goddess Durga' },
  { planet: 'Ke', name: 'Ketu',    color: '#9B59B6', remedy: 'Feed multi-coloured dogs and stray animals. Donate blankets. Worship Lord Ganesha on Tuesdays.',     mantra: 'Om Sraam Sreem Sraum Sah Ketave Namah',      stone: "Cat's Eye",      day: 'Tuesday',   deity: 'Lord Ganesha' },
]

// ─────────────────────────────────────────────────────────────
//  Tithi Quality
// ─────────────────────────────────────────────────────────────

export type TithiQuality = 'best' | 'good' | 'mixed' | 'bad' | 'special'

export interface TithiInfo {
  num:     number    // 1-30
  name:    string
  type:    string    // Nanda, Bhadra, Jaya, Rikta, Poorna
  paksha:  'shukla' | 'krishna'
  quality: TithiQuality
}

const TITHI_DATA: Array<[string, string, TithiQuality]> = [
  // [name, type, quality] — 1-15 Shukla Paksha
  ['Pratipada',   'Nanda',  'mixed'],
  ['Dwitiya',     'Bhadra', 'good'],
  ['Tritiya',     'Jaya',   'good'],
  ['Chaturthi',   'Rikta',  'bad'],
  ['Panchami',    'Poorna', 'good'],
  ['Shashthi',    'Nanda',  'good'],
  ['Saptami',     'Bhadra', 'good'],
  ['Ashtami',     'Jaya',   'mixed'],
  ['Navami',      'Rikta',  'bad'],
  ['Dashami',     'Poorna', 'good'],
  ['Ekadashi',    'Nanda',  'best'],
  ['Dwadashi',    'Bhadra', 'good'],
  ['Trayodashi',  'Jaya',   'good'],
  ['Chaturdashi', 'Rikta',  'bad'],
  ['Purnima',     'Poorna', 'best'],
]

/**
 * Calculate tithi (1-30) from Sun & Moon sidereal longitudes.
 * Tithi = floor((Moon - Sun) / 12) + 1
 */
export function getTithiIndex(sunLon: number, moonLon: number): number {
  const diff = ((moonLon - sunLon) + 360) % 360
  return Math.floor(diff / 12) + 1  // 1 to 30
}

export function getTithiInfo(sunLon: number, moonLon: number): TithiInfo {
  const tNum = getTithiIndex(sunLon, moonLon)  // 1-30
  const idx  = ((tNum - 1) % 15)              // 0-14 (same names in both paksha)
  const [name, type, quality] = TITHI_DATA[idx]
  const paksha: 'shukla' | 'krishna' = tNum <= 15 ? 'shukla' : 'krishna'

  // Special cases
  const finalQuality: TithiQuality =
    tNum === 30 ? 'special' :        // Amavasya
    tNum === 15 ? 'best' :           // Purnima
    quality

  return { num: tNum, name, type, paksha, quality: finalQuality }
}

// ─────────────────────────────────────────────────────────────
//  Extended SBCAnalysis type (augmented with new fields)
// ─────────────────────────────────────────────────────────────

export interface SBCAnalysisExtended extends SBCAnalysis {
  lifeAreas:      LifeAreaPrediction[]
  muhurta:        MuhurtaEvent[]
  birthNakAffected: boolean   // Is birth nakshatra in any malefic vedha?
  nameNakAffected:  boolean
  birthVedhas:    VedhaResult[]   // Vedhas directly affecting birth nakshatra
}

export function analyzeSBCExtended(
  natalGrahas:      SBCGrahaInput[],
  transitGrahas:    SBCGrahaInput[],
  grid:             SBCCell[][],
  birthNakIdx?:     number,
  nameNakIdx?:      number,
): SBCAnalysisExtended {
  const base = analyzeSBC(natalGrahas, transitGrahas, grid)

  const lifeAreas = getLifeAreaPredictions(base.activations)
  const muhurta   = assessMuhurta(MUHURTA_EVENTS, base.vedhas)

  const birthVedhas = birthNakIdx !== undefined
    ? base.vedhas.filter(v => v.affectedNakshatras.includes(birthNakIdx))
    : []

  const birthNakAffected = birthVedhas.some(v => v.isMalefic)
  const nameNakAffected  = nameNakIdx !== undefined
    ? base.vedhas.some(v => v.isMalefic && v.affectedNakshatras.includes(nameNakIdx))
    : false

  return { ...base, lifeAreas, muhurta, birthNakAffected, nameNakAffected, birthVedhas }
}

