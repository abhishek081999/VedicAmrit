// ─────────────────────────────────────────────────────────────────────────────
//  src/lib/engine/bhavaBala.ts
//  Bhava Bala — House Strength Calculation
//
//  Reference:
//    • Brihat Parashara Hora Shastra (BPHS) Ch.28 slokas 26-31
//    • B.V. Raman "Graha and Bhava Balas" (1996)
//    • V.P. Jain "Text Book for Shadbala and Bhavabala"
//
//  Bhava Bala = Bhava Adhipati Bala + Bhava Digbala + Bhava Drishti Bala
// ─────────────────────────────────────────────────────────────────────────────

import type {
  BhavaBalaResult,
  BhavaBalaHouse,
  ShadbalaResult,
  GrahaData,
  LagnaData,
  Rashi,
  GrahaId,
} from '@/types/astrology'

// ── 1. Sign → Natural Lord mapping (sign number 1-12) ────────────────────────
//    Aries(1)=Ma, Taurus(2)=Ve, Gemini(3)=Me, Cancer(4)=Mo, Leo(5)=Su,
//    Virgo(6)=Me, Libra(7)=Ve, Scorpio(8)=Ma, Sagittarius(9)=Ju,
//    Capricorn(10)=Sa, Aquarius(11)=Sa, Pisces(12)=Ju
const SIGN_LORD: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve',  3: 'Me', 4: 'Mo', 5: 'Su',  6: 'Me',
  7: 'Ve', 8: 'Ma',  9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

// ── 2. Sign category for Bhava Digbala (BPHS 28.26-28) ──────────────────────
//    Nara (Manushya) — Gemini(3), Virgo(6), Libra(7), Aquarius(11),
//                      first half of Sagittarius(9) (0°–15°)
//    Chatushpada    — Aries(1), Taurus(2), Leo(5),
//                      second half of Sagittarius(9) (15°–30°),
//                      first half of Capricorn(10) (0°–15°)
//    Keeta          — Scorpio(8), Cancer(4)
//    Jalachara      — Pisces(12), second half of Capricorn(10) (15°–30°)
//
//  Per BPHS sloka 26-28 (Santhanam / Raman):
//    Nara:        Gemini, Virgo, Libra, Aquarius, 1st half Dhanu  → zero at 7th house
//    Chatushpada: Aries, Taurus, Leo, 2nd half Dhanu, 1st half Makara → zero at 4th house
//    Keeta:       Scorpio, Cancer                                  → zero at Lagna
//    Jalachara:   Pisces, 2nd half Makara                          → zero at 10th house
//
//  The "zero house" is the Kendra from which we subtract; if diff > 180° subtract from 360°.
//  Result / 3 = Digbala in Virupas (max 60).

type SignCat = 'Nara' | 'Chatushpada' | 'Keeta' | 'Jalachara'

// Zero-strength Kendra for each category (offset from Lagna in houses, 0-based)
const CAT_ZERO_HOUSE: Record<SignCat, number> = {
  Nara:        6,   // 7th house  (Lagna + 180°)
  Chatushpada: 3,   // 4th house  (Lagna + 90°)
  Keeta:       0,   // Lagna      (Lagna + 0°)
  Jalachara:   9,   // 10th house (Lagna + 270°)
}

/**
 * Determine the sign category for a given Rashi (1-12).
 * For split signs (Dhanu / Makara), we need the degree within the sign.
 */
function getSignCat(rashi: number, degInSign: number): SignCat {
  switch (rashi) {
    case 1:  return 'Chatushpada'         // Aries
    case 2:  return 'Chatushpada'         // Taurus
    case 3:  return 'Nara'               // Gemini
    case 4:  return 'Keeta'              // Cancer
    case 5:  return 'Chatushpada'         // Leo
    case 6:  return 'Nara'               // Virgo
    case 7:  return 'Nara'               // Libra
    case 8:  return 'Keeta'              // Scorpio
    case 9:  return degInSign < 15 ? 'Nara' : 'Chatushpada'   // Sagittarius (split at 15°)
    case 10: return degInSign < 15 ? 'Chatushpada' : 'Jalachara' // Capricorn (split at 15°)
    case 11: return 'Nara'               // Aquarius
    case 12: return 'Jalachara'          // Pisces
    default: return 'Nara'
  }
}

// ── 3. Utility ────────────────────────────────────────────────────────────────
/** Normalise angle to [0, 360) */
function norm(d: number): number {
  return ((d % 360) + 360) % 360
}

// ── 4. Drishti (Aspect) Value on a Bhava Madhya ──────────────────────────────
//
//  Per BPHS Chapter 26 + V.P. Jain:
//
//    Drishti Kendra (DK) = planet longitude − bhava madhya longitude  (mod 360°)
//
//    DK range      Drishti value (Virupas)
//    ─────────────────────────────────────
//    0° – 30°      0
//    30° – 60°     (DK − 30) / 2
//    60° – 90°     (DK − 60) + 15
//    90° – 120°    (120 − DK) / 2 + 30
//    120° – 150°   150 − DK
//    150° – 180°   (DK − 150) × 2
//    180° – 300°   (300 − DK) / 2
//    300° – 360°   0
//
//  Special additions (on top of standard curve, not replacing):
//    Mars:    DK 90°–120° (+15) and DK 210°–240° (+15)  [4th & 8th]
//    Jupiter: DK 120°–150° (+30) and DK 240°–270° (+30) [5th & 9th]
//    Saturn:  DK 60°–90°  (+45) and DK 270°–300° (+45) [3rd & 10th]
//    (capped at 60 max per aspect)
//
//  Application to Bhava Drishti Bala:
//    Ju and Bu: full drishti value (positive)
//    Other benefics (Ve, waxing Mo): +1/4 of value
//    Malefics (Su, Ma, Sa, waning Mo): −1/4 of value
//    Nodes (Ra, Ke): excluded

function getDrishtiValue(planetLon: number, bhavaMadhya: number, pid: GrahaId): number {
  // DK = aspector − aspected (planet − bhava cusp)
  const dk = norm(planetLon - bhavaMadhya)
  let base = 0
  
  if (dk >= 30 && dk < 60)   base = (dk - 30) / 2
  else if (dk >= 60 && dk < 90)   base = (dk - 60) + 15
  else if (dk >= 90 && dk < 120)  base = (120 - dk) / 2 + 30
  else if (dk >= 120 && dk < 150) base = 150 - dk
  else if (dk >= 150 && dk < 180) base = (dk - 150) * 2
  else if (dk >= 180 && dk < 300) base = (300 - dk) / 2
  // 0–30 and 300–360 → 0

  // Special aspect additions
  let special = 0
  if (pid === 'Ma') {
    if ((dk >= 90  && dk < 120) || (dk >= 210 && dk < 240)) special = 15
  } else if (pid === 'Ju') {
    if ((dk >= 120 && dk < 150) || (dk >= 240 && dk < 270)) special = 30
  } else if (pid === 'Sa') {
    if ((dk >= 60  && dk < 90)  || (dk >= 270 && dk < 300)) special = 45
  }

  return Math.min(60, base + special)
}

// ── 5. Main calculation ───────────────────────────────────────────────────────

export function calculateBhavaBala(
  shadbala: ShadbalaResult,
  grahas:   GrahaData[],
  lagnas:   LagnaData,
): BhavaBalaResult {
  const ascDeg   = lagnas.ascDegree          // absolute longitude of Ascendant
  const ascRashi = lagnas.ascRashi           // 1–12
  const houses: Record<number, BhavaBalaHouse> = {}

  for (let h = 1; h <= 12; h++) {
    // ── Bhava Madhya (house cusp / mid-cusp in equal house system) ──────────
    // House cusp longitude in equal-house system:
    //   H1 cusp = ascDeg, H2 cusp = ascDeg + 30°, …
    const cuspLon    = norm(ascDeg + (h - 1) * 30)
    const houseRashi = (((ascRashi - 1 + (h - 1)) % 12) + 1) as Rashi
    const degInSign  = cuspLon % 30   // degree within the sign (0–30)

    // ── (a) Adhipati Bala — lord's total Shadbala ──────────────────────────
    const lord       = SIGN_LORD[houseRashi]
    const lordShash  = shadbala.planets[lord]?.totalShash ?? 0
    const adhipatiBala = lordShash  // in Virupas

    // ── (b) Bhava Digbala ──────────────────────────────────────────────────
    //  Step 1: find the sign category of this house's Rashi
    const cat = getSignCat(houseRashi, degInSign)
    
    //  Step 2: longitude of the "zero Kendra" for this category
    //          (the Kendra where the house has ZERO Digbala)
    const zeroKendraOffset = CAT_ZERO_HOUSE[cat]  // 0, 3, 6, or 9 (house-offset from Lagna)
    const zeroKendraLon    = norm(ascDeg + zeroKendraOffset * 30)

    //  Step 3: angular distance between this house cusp and its zero-Kendra
    let digArc = norm(cuspLon - zeroKendraLon)
    if (digArc > 180) digArc = 360 - digArc  // rectify if > 6 rashis

    //  Step 4: divide by 3 to get Virupas (max 60)
    const digBala = digArc / 3   // 0–60

    // ── (c) Bhava Drishti Bala ─────────────────────────────────────────────
    //  For each planet (except nodes) compute its drishti on the bhava cusp.
    //  Per BPHS and B.V. Raman:
    //    • Jupiter & Mercury: full drishti value added (positive)
    //    • Other benefics (Ve, waxing Moon): +1/4 of drishti value
    //    • Malefics (Su, Ma, Sa, waning Moon): −1/4 of drishti value
    let drishtiBala = 0
    for (const g of grahas) {
      if (g.id === 'Ra' || g.id === 'Ke') continue   // nodes excluded
      
      const dval = getDrishtiValue(g.totalDegree, cuspLon, g.id)
      if (dval <= 0) continue

      // Classify benefic / malefic for Bhava Drishti
      // Natural benefics: Ju, Ve, Me (when not combust), waxing Moon
      // Natural malefics: Su, Ma, Sa, waning Moon
      if (g.id === 'Ju') {
        // Jupiter: full positive
        drishtiBala += dval
      } else if (g.id === 'Me') {
        // Mercury: full positive
        drishtiBala += dval
      } else if (g.id === 'Ve') {
        // Venus: 1/4 of drishti value (benefic)
        drishtiBala += dval / 4
      } else if (g.id === 'Mo') {
        // Moon: benefic if waxing, malefic if waning
        if (g.isWaxingMoon) {
          drishtiBala += dval / 4
        } else {
          drishtiBala -= dval / 4
        }
      } else {
        // Sun, Mars, Saturn — malefic: subtract 1/4
        drishtiBala -= dval / 4
      }
    }

    // ── Total ──────────────────────────────────────────────────────────────
    const totalShash = adhipatiBala + digBala + drishtiBala
    const totalRupa  = totalShash / 60

    houses[h] = {
      house:       h,
      rashi:       houseRashi,
      adhipatiBala: +adhipatiBala.toFixed(2),
      digBala:      +digBala.toFixed(2),
      drishtiBala:  +drishtiBala.toFixed(2),
      totalShash:   +totalShash.toFixed(2),
      totalRupa:    +totalRupa.toFixed(3),
      // Standard minimum: 7.5 Rupas (450 Virupas) – B.V. Raman
      isStrong:     totalRupa >= 7.5,
    }
  }

  const sorted     = Object.values(houses).sort((a, b) => b.totalRupa - a.totalRupa)

  return {
    houses,
    strongestHouse: sorted[0].house,
    weakestHouse:   sorted[sorted.length - 1].house,
  }
}
