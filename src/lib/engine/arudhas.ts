// ─────────────────────────────────────────────────────────────
//  src/lib/engine/arudhas.ts
//  Arudha Padas — Bhava Arudhas (AL, A2–A12) + Graha Arudhas
//  Algorithm: BPHS Chapter on Arudha Padas
//
//  Rule: Arudha of bhava N = lord of N counted from N,
//        then count same number from lord → result sign
//  Edge cases (BPHS):
//    - If result = same sign as bhava N → go 10 signs from lord
//    - If result = 7th from bhava N → go 10 signs from lord
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'

// ── Sign lord table (for Whole Sign house system) ─────────────

const SIGN_LORD: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve',  3: 'Me',  4: 'Mo',
  5: 'Su', 6: 'Me',  7: 'Ve',  8: 'Ma',
  9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

// ── Core helpers ──────────────────────────────────────────────

/** Cycle a rashi value: always 1–12 */
function mod12(n: number): Rashi {
  return (((n - 1) % 12) + 12) % 12 + 1 as Rashi
}

/** Count `n` signs from `start` (1-indexed, forward) */
function countFrom(start: Rashi, n: number): Rashi {
  return mod12(start + n - 1)
}

/**
 * Find which sign a graha occupies in D1
 * @param grahas  Array of { id, rashi } from chart
 * @param id      GrahaId to find
 */
function grahaSign(
  grahas: Array<{ id: GrahaId; rashi: Rashi }>,
  id: GrahaId,
): Rashi {
  return grahas.find((g) => g.id === id)?.rashi ?? (1 as Rashi)
}

// ── Arudha calculation ────────────────────────────────────────

/**
 * Calculate the Arudha Pada of a given bhava
 *
 * @param bhavaSign    The sign of the bhava (house) — 1–12
 * @param grahas       All graha placements { id, rashi }
 * @returns            Arudha sign (Rashi 1–12)
 *
 * Algorithm (BPHS):
 *   1. Find lord of bhavaSign
 *   2. Count distance from bhavaSign to lord's sign (forward)
 *   3. Count same distance from lord's sign → result
 *   4. Apply edge-case corrections
 */
export function calcArudha(
  bhavaSign: Rashi,
  grahas: Array<{ id: GrahaId; rashi: Rashi }>,
): Rashi {
  const lord = SIGN_LORD[bhavaSign]
  const lordSign = grahaSign(grahas, lord)

  // Distance from bhava to lord (1-indexed, forward)
  let dist = ((lordSign - bhavaSign + 12) % 12) + 1

  // Preliminary result
  let result = mod12(lordSign + dist - 1)

  // ── Edge case 1: Result = bhavaSign itself ────────────────
  if (result === bhavaSign) {
    result = mod12(lordSign + 9)  // 10 signs from lord
  }

  // ── Edge case 2: Result = 7th from bhavaSign ─────────────
  const seventh = mod12(bhavaSign + 6)
  if (result === seventh) {
    result = mod12(lordSign + 9)  // 10 signs from lord
  }

  return result
}

// ── All 12 Bhava Arudhas ──────────────────────────────────────

export interface BhavaArudhas {
  AL:  Rashi   // Arudha Lagna (A1)
  A2:  Rashi
  A3:  Rashi
  A4:  Rashi
  A5:  Rashi
  A6:  Rashi
  A7:  Rashi
  A8:  Rashi
  A9:  Rashi
  A10: Rashi
  A11: Rashi
  A12: Rashi
}

/**
 * Calculate all 12 Bhava Arudhas
 *
 * @param ascRashi   Ascendant sign (Bhava 1 sign in Whole Sign)
 * @param grahas     All graha placements
 */
export function calcAllBhavaArudhas(
  ascRashi: Rashi,
  grahas: Array<{ id: GrahaId; rashi: Rashi }>,
): BhavaArudhas {
  const bhavaSign = (n: number): Rashi => mod12(ascRashi + n - 1)

  return {
    AL:  calcArudha(bhavaSign(1),  grahas),
    A2:  calcArudha(bhavaSign(2),  grahas),
    A3:  calcArudha(bhavaSign(3),  grahas),
    A4:  calcArudha(bhavaSign(4),  grahas),
    A5:  calcArudha(bhavaSign(5),  grahas),
    A6:  calcArudha(bhavaSign(6),  grahas),
    A7:  calcArudha(bhavaSign(7),  grahas),
    A8:  calcArudha(bhavaSign(8),  grahas),
    A9:  calcArudha(bhavaSign(9),  grahas),
    A10: calcArudha(bhavaSign(10), grahas),
    A11: calcArudha(bhavaSign(11), grahas),
    A12: calcArudha(bhavaSign(12), grahas),
  }
}

// ── Graha Arudhas ─────────────────────────────────────────────

/**
 * Arudha of a graha = arudha of the bhava it lords
 * For each planet, find which bhava (house) it rules,
 * then compute that bhava's Arudha
 *
 * Returns primary Graha Arudha for each of the 9 grahas
 */
export function calcGrahaArudhas(
  ascRashi: Rashi,
  grahas: Array<{ id: GrahaId; rashi: Rashi }>,
): Record<GrahaId, Rashi> {
  const result = {} as Record<GrahaId, Rashi>
  const grahaIds: GrahaId[] = ['Su','Mo','Ma','Me','Ju','Ve','Sa','Ra','Ke']

  for (const gid of grahaIds) {
    // Find which bhava(s) this graha lords
    const lordedBhavas: number[] = []
    for (let h = 1; h <= 12; h++) {
      const sign = mod12(ascRashi + h - 1)
      if (SIGN_LORD[sign] === gid) {
        lordedBhavas.push(h)
      }
    }

    if (lordedBhavas.length === 0) {
      // Ra and Ke have no lordship — use their sign position
      const grahaSign_ = grahaSign(grahas, gid)
      result[gid] = calcArudha(grahaSign_, grahas)
    } else {
      // Use the primary (stronger) bhava — typically the first owned bhava
      const primaryBhava = lordedBhavas[0]
      const bhavaSign = mod12(ascRashi + primaryBhava - 1)
      result[gid] = calcArudha(bhavaSign, grahas)
    }
  }

  return result
}

// ── Upapada (A12) alias ───────────────────────────────────────

/**
 * Upapada Lagna (UL) = Arudha of 12th house
 * Used for spouse, partnership quality
 */
export function calcUpapada(
  ascRashi: Rashi,
  grahas: Array<{ id: GrahaId; rashi: Rashi }>,
): Rashi {
  const twelfthSign = mod12(ascRashi + 11)
  return calcArudha(twelfthSign, grahas)
}

/**
 * Darapada (A7) = Arudha of 7th house
 * Used for marriage partner's public image
 */
export function calcDarapada(
  ascRashi: Rashi,
  grahas: Array<{ id: GrahaId; rashi: Rashi }>,
): Rashi {
  const seventhSign = mod12(ascRashi + 6)
  return calcArudha(seventhSign, grahas)
}

// ── Full ArudhaData for ChartOutput ──────────────────────────

export interface ArudhaOutput {
  AL:  Rashi; A2: Rashi; A3: Rashi; A4: Rashi;
  A5:  Rashi; A6: Rashi; A7: Rashi; A8: Rashi;
  A9:  Rashi; A10:Rashi; A11:Rashi; A12:Rashi;
  grahaArudhas: Record<GrahaId, Rashi>
  upapada: Rashi
  darapada: Rashi
}

export function calcArudhaOutput(
  ascRashi: Rashi,
  grahas: Array<{ id: GrahaId; rashi: Rashi }>,
): ArudhaOutput {
  const bhava = calcAllBhavaArudhas(ascRashi, grahas)
  return {
    ...bhava,
    grahaArudhas: calcGrahaArudhas(ascRashi, grahas),
    upapada: bhava.A12,
    darapada: bhava.A7,
  }
}
