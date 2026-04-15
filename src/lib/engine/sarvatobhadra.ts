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

export type SBCCellType = 'nakshatra' | 'rashi' | 'vara' | 'vowel' | 'consonant' | 'center' | 'empty'

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
 * [row, col] for each nakshatra 0-26, placed clockwise from top-left:
 *   Top row (→): 0-8   (Ashwini → Ashlesha)
 *   Right col (↓): 9-16 (Magha → Anuradha)  — rows 1-8
 *   Bottom row (←): 17-24 (Jyeshtha → PurvaBhadra) — cols 7-0
 *   Left col (↑): 25-26 (UttaraBhadra, Revati) — rows 7-6
 *   Remaining left cells [1,0]-[5,0] carry Sanskrit vowels
 */
export const SBC_NAK_POS: [number, number][] = [
  [0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8], // 0-8
  [1,8],[2,8],[3,8],[4,8],[5,8],[6,8],[7,8],[8,8],        // 9-16
  [8,7],[8,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],        // 17-24
  [7,0],[6,0],                                             // 25-26
]

/** rashiIndex (1-12) → [row, col] in the interior */
export const SBC_RASHI_POS: Record<number, [number, number]> = {
  1:  [2,4],   // Mesha   (Aries)
  2:  [4,6],   // Vrishabha (Taurus)
  3:  [6,4],   // Mithuna (Gemini)
  4:  [4,2],   // Karka   (Cancer)
  5:  [2,6],   // Simha   (Leo)
  6:  [6,6],   // Kanya   (Virgo)
  7:  [6,2],   // Tula    (Libra)
  8:  [2,2],   // Vrishchika (Scorpio)
  9:  [3,5],   // Dhanu   (Sagittarius)
  10: [5,5],   // Makara  (Capricorn)
  11: [5,3],   // Kumbha  (Aquarius)
  12: [3,3],   // Meena   (Pisces)
}

const RASHI_LABEL: Record<number, string> = {
  1:'Meṣa', 2:'Vṛṣ', 3:'Mit', 4:'Kar',
  5:'Siṃ', 6:'Kan', 7:'Tulā', 8:'Vṛś',
  9:'Dha', 10:'Mak', 11:'Kum', 12:'Mīn',
}

/**
 * Interior cell definitions — varas, vowels, consonants.
 * Key = "row,col"
 */
const INTERIOR: Record<string, Pick<SBCCell, 'type' | 'label' | 'sublabel' | 'varaLord' | 'bodyPart'>> = {
  '1,1': { type: 'vara',      label: 'Ravi',   sublabel: 'Sun·Day',     varaLord: 'Su' },
  '1,2': { type: 'vowel',     label: 'अ',      bodyPart: 'Head' },
  '1,3': { type: 'vowel',     label: 'आ',      bodyPart: 'Face' },
  '1,4': { type: 'vara',      label: 'Guru',   sublabel: 'Thu·Day',     varaLord: 'Ju' },
  '1,5': { type: 'vowel',     label: 'इ',      bodyPart: 'Right Eye' },
  '1,6': { type: 'vowel',     label: 'ई',      bodyPart: 'Left Eye' },
  '1,7': { type: 'vara',      label: 'Śani',   sublabel: 'Sat·Day',     varaLord: 'Sa' },

  '2,1': { type: 'vowel',     label: 'उ',      bodyPart: 'Right Ear' },
  '2,3': { type: 'vowel',     label: 'ऊ',      bodyPart: 'Left Ear' },
  '2,5': { type: 'vowel',     label: 'ए',      bodyPart: 'Nostrils' },
  '2,7': { type: 'vowel',     label: 'ऐ',      bodyPart: 'Cheeks' },

  '3,1': { type: 'vowel',     label: 'ओ',      bodyPart: 'Lips' },
  '3,2': { type: 'consonant', label: 'क',      bodyPart: 'Neck' },
  '3,4': { type: 'consonant', label: 'ख',      bodyPart: 'Throat' },
  '3,6': { type: 'consonant', label: 'ग',      bodyPart: 'Collar Bone' },
  '3,7': { type: 'vowel',     label: 'औ',      bodyPart: 'Chin' },

  '4,1': { type: 'vara',      label: 'Śukra',  sublabel: 'Fri·Day',     varaLord: 'Ve' },
  '4,3': { type: 'consonant', label: 'घ',      bodyPart: 'Right Shoulder' },
  '4,4': { type: 'center',    label: 'SBC',    sublabel: 'Sarvatobhadra' },
  '4,5': { type: 'consonant', label: 'ङ',      bodyPart: 'Left Shoulder' },
  '4,7': { type: 'vara',      label: 'Budha',  sublabel: 'Wed·Day',     varaLord: 'Me' },

  '5,1': { type: 'vowel',     label: 'अं',     bodyPart: 'Right Arm' },
  '5,2': { type: 'consonant', label: 'च',      bodyPart: 'Left Arm' },
  '5,4': { type: 'consonant', label: 'छ',      bodyPart: 'Right Hand' },
  '5,6': { type: 'consonant', label: 'ज',      bodyPart: 'Left Hand' },
  '5,7': { type: 'vowel',     label: 'अः',     bodyPart: 'Fingers' },

  '6,1': { type: 'consonant', label: 'झ',      bodyPart: 'Chest' },
  '6,3': { type: 'consonant', label: 'ञ',      bodyPart: 'Right Breast' },
  '6,5': { type: 'consonant', label: 'ट',      bodyPart: 'Left Breast' },
  '6,7': { type: 'consonant', label: 'ठ',      bodyPart: 'Stomach' },

  '7,1': { type: 'vara',      label: 'Maṅgal', sublabel: 'Tue·Day',     varaLord: 'Ma' },
  '7,2': { type: 'consonant', label: 'ड',      bodyPart: 'Right Thigh' },
  '7,3': { type: 'consonant', label: 'ढ',      bodyPart: 'Left Thigh' },
  '7,4': { type: 'vara',      label: 'Soma',   sublabel: 'Mon·Day',     varaLord: 'Mo' },
  '7,5': { type: 'consonant', label: 'ण',      bodyPart: 'Knees' },
  '7,6': { type: 'consonant', label: 'त',      bodyPart: 'Calves' },
  '7,7': { type: 'consonant', label: 'थ',      bodyPart: 'Feet' },
}

/** Left-column vowel cells that are not nakshatras */
const LEFT_COL: Record<string, Pick<SBCCell, 'type' | 'label' | 'bodyPart'>> = {
  '1,0': { type: 'vowel', label: 'ऋ', bodyPart: 'Forehead' },
  '2,0': { type: 'vowel', label: 'ॠ', bodyPart: 'Eyes (both)' },
  '3,0': { type: 'vowel', label: 'ळ', bodyPart: 'Nose' },
  '4,0': { type: 'vowel', label: 'ए', bodyPart: 'Ears' },
  '5,0': { type: 'vowel', label: 'ऐ', bodyPart: 'Mouth (lips)' },
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
      label:           NAKSHATRA_NAMES[i],
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

  // Place left-column vowels (non-nakshatra perimeter cells)
  Object.entries(LEFT_COL).forEach(([key, data]) => {
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

export const PLANET_COLOR: Record<GrahaId, string> = {
  Su: '#FF8C00', Mo: '#A8C8E8', Ma: '#E84040', Me: '#48C774',
  Ju: '#FFD700', Ve: '#FF69B4', Sa: '#8B9DC3', Ra: '#8B4513',
  Ke: '#9B59B6', Ur: '#00CED1', Ne: '#4169E1', Pl: '#800000',
}

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
