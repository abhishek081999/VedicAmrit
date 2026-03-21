// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dasha/chara.ts
//  Chara Dasha — Jaimini's sign-based dasha system
//  Reference: Jaimini Sutras, BPHS Ch. 41,
//             K.N. Rao's "Jaimini's Chara Dasha"
//
//  Rules:
//  1. Dashas are of 12 rashis (signs), each 1–12 years long
//  2. Duration of each sign = lord's distance from the sign
//     (with adjustments for exaltation/debilitation)
//  3. Sequence direction: odd signs run forward, even signs backward
//  4. Start from Lagna sign (most common variant)
// ─────────────────────────────────────────────────────────────

import type { GrahaData, LagnaData, DashaNode } from '@/types/astrology'

// ── Sign lords (standard) ─────────────────────────────────────
const SIGN_LORD: Record<number, string> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

// Chara sign lords (Jaimini variant — Ra/Ke swap roles for Sc/Aq)
const CHARA_LORD: Record<number, string> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ke', 9: 'Ju', 10: 'Sa', 11: 'Ra', 12: 'Ju',
}

// Exaltation sign for each planet
const EXALT_SIGN: Record<string, number> = {
  Su: 1, Mo: 2, Ma: 10, Me: 6, Ju: 4, Ve: 12, Sa: 7, Ra: 3, Ke: 9,
}

// Debilitation sign
const DEBIL_SIGN: Record<string, number> = {
  Su: 7, Mo: 8, Ma: 4, Me: 12, Ju: 10, Ve: 6, Sa: 1, Ra: 9, Ke: 3,
}

// ── Rashi of a planet ─────────────────────────────────────────
function rashiOf(g: GrahaData): number {
  return Math.floor(((g.totalDegree % 360) + 360) % 360 / 30) + 1
}

function degreeInSign(g: GrahaData): number {
  return ((g.totalDegree % 360) + 360) % 360 % 30
}

// ── Duration of a sign's dasha ────────────────────────────────
//  Rule: lord's distance from the sign (in signs, 1–12)
//  Adjustments:
//   - If lord is in its own sign: use 12
//   - If lord is exalted: add 1
//   - If lord is debilitated: subtract 1
//   - Min = 1, Max = 12

function charaDuration(sign: number, grahas: GrahaData[]): number {
  const lord     = CHARA_LORD[sign] ?? SIGN_LORD[sign] ?? 'Su'
  const lordData = grahas.find(g => g.id === lord)
  if (!lordData) return 6   // fallback

  const lordRashi = rashiOf(lordData)

  // Distance from sign to lord (in sign direction)
  let dist = ((lordRashi - sign + 12) % 12) + 1  // 1–12

  // Jaimini rule: if lord is in the sign itself (dist=12 means same sign)
  if (dist === 12 && lordRashi === sign) dist = 12

  // Adjustment for exaltation
  const exSign = EXALT_SIGN[lord]
  if (exSign && lordRashi === exSign) dist = Math.min(12, dist + 1)

  // Adjustment for debilitation
  const deSign = DEBIL_SIGN[lord]
  if (deSign && lordRashi === deSign) dist = Math.max(1, dist - 1)

  return Math.max(1, Math.min(12, dist))
}

// ── Sub-dasha (Antardasha) ────────────────────────────────────
// Same rules as Maha but within the Maha period
// Sequence starts from the same Maha sign

function buildCharaAntar(
  mahaSigns:  number[],
  mahaStart:  Date,
  mahaEnd:    Date,
  grahas:     GrahaData[],
  birthDate:  Date,
): DashaNode[] {
  const totalMs   = mahaEnd.getTime() - mahaStart.getTime()
  const durations = mahaSigns.map(s => charaDuration(s, grahas))
  const totalDur  = durations.reduce((a, b) => a + b, 0)

  const nodes: DashaNode[] = []
  let cursor = new Date(mahaStart)
  const now  = Date.now()

  for (let i = 0; i < mahaSigns.length; i++) {
    const sign = mahaSigns[i]
    const frac = durations[i] / totalDur
    const ms   = totalMs * frac
    const s    = new Date(cursor)
    const e    = new Date(cursor.getTime() + ms)

    nodes.push({
      lord:       SIGN_LORD[sign] ?? 'Su',
      label:      `${RASHI_NAMES[sign]} (H${sign})`,
      start:      s,
      end:        e,
      durationMs: ms,
      level:      2,
      isCurrent:  now >= s.getTime() && now < e.getTime(),
      children:   [],
    })
    cursor = e
  }
  return nodes
}

// Rashi names for display
const RASHI_NAMES: Record<number, string> = {
  1:'Aries', 2:'Taurus', 3:'Gemini', 4:'Cancer', 5:'Leo', 6:'Virgo',
  7:'Libra', 8:'Scorpio', 9:'Sagittarius', 10:'Capricorn', 11:'Aquarius', 12:'Pisces',
}

// ── Main Chara Dasha calculator ───────────────────────────────

export function calcCharaDasha(
  grahas:    GrahaData[],
  lagnas:    LagnaData,
  birthDate: Date,
  depth:     number = 2,
): DashaNode[] {
  const ascRashi = lagnas.ascRashi ?? 1

  // Determine starting sign (Lagna sign)
  // Determine sequence direction:
  //  - Odd signs (1,3,5,7,9,11): forward (Ar,Ge,Le,Li,Sg,Aq)
  //  - Even signs (2,4,6,8,10,12): backward (Ta,Ca,Vi,Sc,Cp,Pi)
  const isOdd = (s: number) => s % 2 === 1

  // Build full 12-sign sequence starting from ascendant sign
  function buildSequence(startSign: number): number[] {
    const seq: number[] = []
    if (isOdd(startSign)) {
      // Forward: startSign → 12, then 1 → startSign-1
      for (let s = startSign; s <= 12; s++) seq.push(s)
      for (let s = 1; s < startSign; s++) seq.push(s)
    } else {
      // Backward: startSign → 1, then 12 → startSign+1
      for (let s = startSign; s >= 1; s--) seq.push(s)
      for (let s = 12; s > startSign; s--) seq.push(s)
    }
    return seq
  }

  const sequence = buildSequence(ascRashi)

  // Calculate durations
  const durations = sequence.map(s => charaDuration(s, grahas))

  // Birth balance: calculate remaining portion of first sign dasha
  // Based on degree of Lagna within its sign (0-30°)
  // More traversed = less remaining
  const lagnaDegreInSign = lagnas.ascDegreeInRashi ?? 0  // 0-30
  const birthBalance = Math.max(0.1, 1 - (lagnaDegreInSign / 30))
  const firstDurYears = durations[0] * birthBalance

  const nodes: DashaNode[] = []
  let cursor = new Date(birthDate)
  const now  = Date.now()

  for (let i = 0; i < sequence.length; i++) {
    const sign  = sequence[i]
    const years = i === 0 ? firstDurYears : durations[i]
    const ms    = years * 365.25 * 24 * 60 * 60 * 1000
    const start = new Date(cursor)
    const end   = new Date(cursor.getTime() + ms)

    // Build antardasha sequence for this maha
    // Antardasha starts from the same sign and follows same direction rules
    const antarSeq = buildSequence(sign)

    nodes.push({
      lord:       SIGN_LORD[sign] ?? 'Su',
      label:      `${RASHI_NAMES[sign]} (${years} yr)`,
      start,
      end,
      durationMs: ms,
      level:      1,
      isCurrent:  now >= start.getTime() && now < end.getTime(),
      children:   depth > 1
        ? buildCharaAntar(antarSeq, start, end, grahas, birthDate)
        : [],
    })

    cursor = end
  }

  return nodes
}
