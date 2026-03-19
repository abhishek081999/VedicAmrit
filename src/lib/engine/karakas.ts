// ─────────────────────────────────────────────────────────────
//  src/lib/engine/karakas.ts
//  Chara Karakas — variable significators based on degree
//  Supports both 7-karaka and 8-karaka (Parashari) schemes
//
//  Rule: Sort the 7 (or 8) grahas by their sidereal degree
//        within their sign, DESCENDING. Assign karaka roles
//        from AK (highest) down to DK (lowest).
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'

// ── Karaka role names ─────────────────────────────────────────

export const KARAKA_NAMES_7 = {
  AK:  'Atmakaraka',     // Soul indicator — highest degree
  AmK: 'Amatyakaraka',  // Minister — 2nd highest
  BK:  'Bhratrukaraka', // Siblings — 3rd
  MK:  'Matrukaraka',   // Mother — 4th
  PK:  'Pitrukaraka',   // Father — 5th
  GK:  'Gnatikaraka',   // Relatives — 6th
  DK:  'Darakaraka',    // Spouse — 7th / lowest
} as const

export const KARAKA_NAMES_8 = {
  ...KARAKA_NAMES_7,
  PiK: 'Putrikaraka',   // Children — inserted between PK and GK
} as const

export type KarakaRole7 = keyof typeof KARAKA_NAMES_7
export type KarakaRole8 = keyof typeof KARAKA_NAMES_8

// Karaka assignment order (highest degree → AK, lowest → DK)
const ROLES_7: KarakaRole7[] = ['AK', 'AmK', 'BK', 'MK', 'PK', 'GK', 'DK']
const ROLES_8: KarakaRole8[] = ['AK', 'AmK', 'BK', 'MK', 'PK', 'PiK', 'GK', 'DK']

// Planets eligible for Chara Karaka (Ra & Ke excluded from 7; Ra only in 8)
const ELIGIBLE_7: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']
const ELIGIBLE_8: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra']

// ── Types ─────────────────────────────────────────────────────

export interface CharaKarakaResult {
  scheme: 7 | 8
  AK:  GrahaId
  AmK: GrahaId
  BK:  GrahaId
  MK:  GrahaId
  PK:  GrahaId
  GK:  GrahaId
  DK:  GrahaId
  PiK: GrahaId | null   // Only in 8-karaka scheme
  // Reverse map: graha → its karaka role
  roleOf: Record<GrahaId, string | null>
}

// ── Main calculator ───────────────────────────────────────────

/**
 * Calculate Chara Karakas from graha longitudes
 *
 * @param grahas   Array of { id, lonSidereal, degree } — degree = 0–30 in sign
 * @param scheme   7 or 8 karaka scheme
 *
 * Key: sort by degree-within-sign DESCENDING
 * Rahu special rule: use (30 - degree) for Rahu (counted from end of sign)
 */
export function calcCharaKarakas(
  grahas: Array<{ id: GrahaId; lonSidereal: number; degree: number }>,
  scheme: 7 | 8 = 8,
): CharaKarakaResult {
  const eligible = scheme === 8 ? ELIGIBLE_8 : ELIGIBLE_7
  const roles    = scheme === 8 ? ROLES_8    : ROLES_7

  // Filter to eligible planets and get their degree-within-sign
  const candidates = grahas
    .filter((g) => eligible.includes(g.id))
    .map((g) => ({
      id: g.id,
      // Rahu degree counted from end of sign (30 - deg)
      sortDeg: g.id === 'Ra' ? (30 - g.degree) : g.degree,
    }))

  // Sort descending by sortDeg (highest degree = AK)
  candidates.sort((a, b) => b.sortDeg - a.sortDeg)

  // Assign roles
  const roleOf: Record<GrahaId, string | null> = {
    Su: null, Mo: null, Ma: null, Me: null,
    Ju: null, Ve: null, Sa: null, Ra: null, Ke: null,
  }

  const assigned: Partial<Record<KarakaRole8, GrahaId>> = {}
  for (let i = 0; i < Math.min(candidates.length, roles.length); i++) {
    const gid  = candidates[i].id
    const role = roles[i]
    assigned[role] = gid
    roleOf[gid] = role
  }

  return {
    scheme,
    AK:  assigned.AK  ?? 'Su',
    AmK: assigned.AmK ?? 'Mo',
    BK:  assigned.BK  ?? 'Ma',
    MK:  assigned.MK  ?? 'Me',
    PK:  assigned.PK  ?? 'Ju',
    GK:  assigned.GK  ?? 'Ve',
    DK:  assigned.DK  ?? 'Sa',
    PiK: scheme === 8 ? (assigned.PiK ?? null) : null,
    roleOf,
  }
}

// ── Naisargika (natural) Karakas ──────────────────────────────
// Fixed significators — do not change by birth chart

export const NAISARGIKA_KARAKAS: Record<string, GrahaId> = {
  soul:         'Su',
  mind:         'Mo',
  siblings:     'Ma',
  communication:'Me',
  wisdom:       'Ju',
  spouse:       'Ve',
  longevity:    'Sa',
  technology:   'Ra',
  spirituality: 'Ke',
  // House significators (primary)
  father:       'Su',
  mother:       'Mo',
  courage:      'Ma',
  intelligence: 'Me',
  children:     'Ju',
  beauty:       'Ve',
  sorrow:       'Sa',
}

// ── Karaka descriptions for UI ────────────────────────────────

export const KARAKA_DESCRIPTIONS: Record<KarakaRole8, string> = {
  AK:  'Ātmakāraka — Soul, self, the most important indicator',
  AmK: 'Amātyakāraka — Career, counsel, what sustains the soul',
  BK:  'Bhrātṛkāraka — Siblings, courage, effort',
  MK:  'Mātṛkāraka — Mother, emotional nurturing, property',
  PK:  'Pitṛkāraka — Father, teachers, authority',
  PiK: 'Putrikāraka — Children, creativity, speculation',
  GK:  'Gnātikāraka — Relatives, obstacles, disease',
  DK:  'Dārakāraka — Spouse, partnerships, desires',
}
