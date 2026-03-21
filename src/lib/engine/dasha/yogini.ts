// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dasha/yogini.ts
//  Yogini Dasha — 36-year cycle, 8 Yoginis
//  Reference: BPHS Ch. 47, Saravali
//  Sequence: Mangala(1) → Pingala(2) → Dhanya(3) → Bhramari(4)
//            → Bhadrika(5) → Ulka(6) → Siddha(7) → Sankata(8)
// ─────────────────────────────────────────────────────────────

import type { DashaNode } from '@/types/astrology'

// ── Yogini table ─────────────────────────────────────────────

interface Yogini {
  name:   string        // Sanskrit name
  lord:   string        // Graha lord (planet ID)
  years:  number        // Duration in years
}

const YOGINIS: Yogini[] = [
  { name: 'Maṅgalā',  lord: 'Mo', years: 1 },
  { name: 'Piṅgalā',  lord: 'Su', years: 2 },
  { name: 'Dhanyā',   lord: 'Ju', years: 3 },
  { name: 'Bhrāmarī', lord: 'Ma', years: 4 },
  { name: 'Bhadrikā', lord: 'Me', years: 5 },
  { name: 'Ulkā',     lord: 'Sa', years: 6 },
  { name: 'Siddhā',   lord: 'Ve', years: 7 },
  { name: 'Saṅkaṭā',  lord: 'Ra', years: 8 },
]

const GRAHA_MAP: Record<string, string> = {
  Mo: 'Moon', Su: 'Sun', Ju: 'Jupiter', Ma: 'Mars',
  Me: 'Mercury', Sa: 'Saturn', Ve: 'Venus', Ra: 'Rahu'
}

const TOTAL_YEARS = 36   // Sum of 1+2+3+4+5+6+7+8

// Each nakshatra maps to a Yogini (formula: (Nak# + 3) % 8)
function yoginiForNakshatra(nakIndex: number): number {
  // If nakIndex=15 (Vishakha, 16th), (15 + 3)%8 = 2 (Dhanya)
  // If nakIndex=5 (Ardra, 6th), (5 + 3)%8 = 0 (Mangala)
  return (nakIndex + 3) % 8
}

// ── Main calculator ───────────────────────────────────────────

/**
 * Calculate Yogini Dasha tree
 * @param moonNakIndex  Moon nakshatra index (0–26)
 * @param moonDegInNak  Moon degrees within nakshatra (0–13.333°)
 * @param birthDate     Birth datetime (UTC)
 * @param depth         How many levels to compute (1=Maha, 2=Antar)
 */
export function calcYoginiDasha(
  moonNakIndex: number,
  moonDegInNak: number,
  birthDate:    Date,
  depth:        number = 2,
): DashaNode[] {
  const NAK_SPAN  = 360 / 27             // ~13.333°
  const startYogini = yoginiForNakshatra(moonNakIndex)

  // Balance remaining in birth Yogini based on Moon position within nakshatra
  // moonDegInNak is 0–NAK_SPAN degrees within the nakshatra
  const traversed    = Math.max(0, Math.min(1, moonDegInNak / NAK_SPAN))
  const balanceFrac  = 1 - traversed
  // Ensure minimum 1 day balance to avoid zero-length periods
  const balanceYears = Math.max(1 / 365.25, balanceFrac * YOGINIS[startYogini].years)

  const nodes: DashaNode[] = []
  let cursor = new Date(birthDate)

  for (let i = 0; i < 24; i++) {
    const yIdx    = (startYogini + i) % 8
    const yogini  = YOGINIS[yIdx]
    const years   = i === 0 ? balanceYears : yogini.years
    const ms      = years * 365.25 * 24 * 60 * 60 * 1000
    const start   = new Date(cursor)
    const end     = new Date(cursor.getTime() + ms)
    const now     = Date.now()

    nodes.push({
      lord:      yogini.lord,
      label:     `${yogini.name} (${GRAHA_MAP[yogini.lord]})`,
      start,
      end,
      durationMs: ms,
      level:     1,
      isCurrent: now >= start.getTime() && now < end.getTime(),
      children:  depth > 1
        ? buildYoginiAntar(yogini.lord, start, end, depth - 1)
        : [],
    })

    cursor = end
  }

  return nodes
}

// ── Antardasha (sub-period) ───────────────────────────────────
// Each Yogini sub-period is proportional to the Yogini's years
// Sub-lord sequence starts from the same Yogini's lord

function buildYoginiAntar(
  mahaLord:  string,
  start:     Date,
  end:       Date,
  depth:     number,
): DashaNode[] {
  const totalMs   = end.getTime() - start.getTime()
  const mahaYogini = YOGINIS.find(y => y.lord === mahaLord) ?? YOGINIS[0]
  const startIdx  = YOGINIS.indexOf(mahaYogini)

  const nodes: DashaNode[] = []
  let cursor = new Date(start)
  const now  = Date.now()

  for (let i = 0; i < 8; i++) {
    const yIdx   = (startIdx + i) % 8
    const yogini = YOGINIS[yIdx]
    const frac   = yogini.years / TOTAL_YEARS
    const ms     = totalMs * frac
    const s      = new Date(cursor)
    const e      = new Date(cursor.getTime() + ms)

    nodes.push({
      lord:       yogini.lord,
      label:      `${yogini.name} (${GRAHA_MAP[yogini.lord]})`,
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