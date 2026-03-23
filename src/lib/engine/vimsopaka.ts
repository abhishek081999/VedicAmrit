// ─────────────────────────────────────────────────────────────
//  src/lib/engine/vimsopaka.ts
//  Viṁśopaka Bala — Twenty-point Strength (Advanced Implementation)
// ─────────────────────────────────────────────────────────────

import type { GrahaData, GrahaId, Dignity } from '@/types/astrology'
export type { GrahaId }
import { getDignity } from './dignity'

// ── Types ─────────────────────────────────────────────────────

export interface VimsopakaPlanet {
  id:           string
  shadvarga:    number   // 6-varga score  (max 20)
  saptavarga:   number   // 7-varga score  (max 20)
  dashavarga:   number   // 10-varga score (max 20)
  shodasvarga:  number   // 16-varga score (max 20)
  /** Dignity in each varga: key = varga name, value = dignity string */
  vargaDignities: Record<string, Dignity | null>
  /** Weighted contribution score by varga for all 16 divisions */
  vargaContributions: Record<string, number>
  strength: 'very_strong' | 'strong' | 'moderate' | 'weak' | 'very_weak'
  shodasPercent: number  // 0–100
}

export interface VimsopakaLeaderboardEntry {
  id: string
  score: number
  percent: number
  rank: number
}

export interface VimsopakaBalaInsights {
  averageShodasvarga: number
  spread: number
  dignityCounts: Record<Dignity, number>
  topThree: VimsopakaLeaderboardEntry[]
  bottomThree: VimsopakaLeaderboardEntry[]
}

export interface VimsopakaBalaResult {
  planets:  Record<string, VimsopakaPlanet>
  strongest: string   // planet id with highest shodasvarga
  weakest:   string   // planet id with lowest shodasvarga
  leaderboard: VimsopakaLeaderboardEntry[]
  insights: VimsopakaBalaInsights
}

// ── Dignity → point mappings ───────────────────────────────────
// BPHS canonical values as per user request
const DIGNITY_POINTS: Record<Dignity, number> = {
  exalted:      3,
  moolatrikona: 2,
  own:          1.5,
  great_friend: 1,
  friend:       0.5,
  neutral:      0,
  enemy:       -0.5,
  great_enemy: -1,
  debilitated: -1,
}

// ── Varga weights for each system ────────────────────────────

// Shadvarga (6 vargas) — sum = 20
const SHADVARGA_WEIGHTS: [string, number][] = [
  ['D1',  6],
  ['D2',  2],
  ['D3',  4],
  ['D9',  5],
  ['D12', 2],
  ['D30', 1],
]

// Saptavarga (7 vargas) — sum = 20
const SAPTAVARGA_WEIGHTS: [string, number][] = [
  ['D1',  5],
  ['D2',  2],
  ['D3',  3],
  ['D7',  2.5],
  ['D9',  4.5],
  ['D12', 2],
  ['D30', 1],
]

// Dashavarga (10 vargas) — sum = 20
const DASHAVARGA_WEIGHTS: [string, number][] = [
  ['D1',  3],
  ['D2',  1.5],
  ['D3',  3],
  ['D7',  1.5],
  ['D9',  3],
  ['D10', 1.5],
  ['D12', 2],
  ['D16', 2],
  ['D27', 1],
  ['D30', 1],
]

// Shodasvarga (16 vargas) — normalized to 20
const RAW_SHODA: [string, number][] = [
  ['D1',   6],
  ['D2',   2],
  ['D3',   4],
  ['D4',   2],
  ['D7',   2],
  ['D9',   6],
  ['D10',  2],
  ['D12',  4],
  ['D16',  4],
  ['D20',  4],
  ['D24',  2],
  ['D27',  6],
  ['D30',  2],
  ['D40',  2],
  ['D45',  2],
  ['D60', 10],
]
const SHODA_SCALE = 20 / RAW_SHODA.reduce((s, [, w]) => s + w, 0)

const SHODASVARGA_WEIGHTS: [string, number][] = RAW_SHODA.map(
  ([name, w]) => [name, w * SHODA_SCALE]
)

// ── Helpers ───────────────────────────────────────────────────

function vargaScore(
  planetId:  GrahaId,
  vargaName: string,
  vargas:    Record<string, GrahaData[]>,
  weight:    number,
): { score: number; dignity: Dignity | null } {
  const vargaGrahas = vargas[vargaName]
  if (!vargaGrahas) return { score: 0, dignity: null }

  const g = vargaGrahas.find(g => g.id === planetId)
  if (!g) return { score: 0, dignity: null }

  // Use the existing getDignity tool logic
  // Note: getDignity usually needs rashi and degree. We assume g has them.
  const dignity = getDignity(planetId as GrahaId, g.rashi, g.degree ?? 0)
  const pts     = DIGNITY_POINTS[dignity] ?? 0

  // score = (pts / 3) * weight (normalized such that pts=3 gives full weight)
  const score = (pts / 3) * weight

  return { score, dignity }
}

function strengthLabel(score: number): VimsopakaPlanet['strength'] {
  if (score >= 15) return 'very_strong'
  if (score >= 10) return 'strong'
  if (score >=  6) return 'moderate'
  if (score >=  3) return 'weak'
  return 'very_weak'
}

// ── Main Calculator ───────────────────────────────────────────

const PLANETS: GrahaId[] = ['Su','Mo','Ma','Me','Ju','Ve','Sa','Ra','Ke']

export function calculateVimsopaka(
  grahas: GrahaData[],
  vargas: Record<string, GrahaData[]>,
): VimsopakaBalaResult {
  void grahas
  const planetsResult: Record<string, VimsopakaPlanet> = {}

  for (const id of PLANETS) {
    const vargaDignities: Record<string, Dignity | null> = {}
    const vargaContributions: Record<string, number> = {}

    // 1. Shadvarga
    let shadvarga = 0
    for (const [vname, w] of SHADVARGA_WEIGHTS) {
      const { score, dignity } = vargaScore(id, vname, vargas, w)
      shadvarga += score
      if (!vargaDignities[vname]) vargaDignities[vname] = dignity
    }

    // 2. Saptavarga
    let saptavarga = 0
    for (const [vname, w] of SAPTAVARGA_WEIGHTS) {
      const { score, dignity } = vargaScore(id, vname, vargas, w)
      saptavarga += score
      if (!vargaDignities[vname]) vargaDignities[vname] = dignity
    }

    // 3. Dashavarga
    let dashavarga = 0
    for (const [vname, w] of DASHAVARGA_WEIGHTS) {
      const { score, dignity } = vargaScore(id, vname, vargas, w)
      dashavarga += score
      if (!vargaDignities[vname]) vargaDignities[vname] = dignity
    }

    // 4. Shodasvarga
    let shodasvarga = 0
    for (const [vname, w] of SHODASVARGA_WEIGHTS) {
      const { score, dignity } = vargaScore(id, vname, vargas, w)
      shodasvarga += score
      vargaDignities[vname] = dignity
      vargaContributions[vname] = score
    }

    const clamp = (v: number) => Math.max(0, Math.min(20, v))
    const shoda = clamp(shodasvarga)

    planetsResult[id] = {
      id,
      shadvarga:   clamp(shadvarga),
      saptavarga:  clamp(saptavarga),
      dashavarga:  clamp(dashavarga),
      shodasvarga: shoda,
      vargaDignities,
      vargaContributions,
      strength:    strengthLabel(shoda),
      shodasPercent: (shoda / 20) * 100,
    }
  }

  const sorted = PLANETS.slice().sort(
    (a, b) => (planetsResult[b]?.shodasvarga ?? 0) - (planetsResult[a]?.shodasvarga ?? 0)
  )

  const leaderboard: VimsopakaLeaderboardEntry[] = sorted.map((id, idx) => {
    const score = planetsResult[id]?.shodasvarga ?? 0
    return {
      id,
      rank: idx + 1,
      score,
      percent: (score / 20) * 100,
    }
  })

  const totalScore = leaderboard.reduce((sum, row) => sum + row.score, 0)
  const averageShodasvarga = leaderboard.length ? totalScore / leaderboard.length : 0
  const topScore = leaderboard[0]?.score ?? 0
  const bottomScore = leaderboard[leaderboard.length - 1]?.score ?? 0

  const dignityCounts: Record<Dignity, number> = {
    exalted: 0,
    moolatrikona: 0,
    own: 0,
    great_friend: 0,
    friend: 0,
    neutral: 0,
    enemy: 0,
    great_enemy: 0,
    debilitated: 0,
  }

  for (const id of PLANETS) {
    const dignities = planetsResult[id]?.vargaDignities ?? {}
    for (const d of Object.values(dignities)) {
      if (d && d in dignityCounts) dignityCounts[d] += 1
    }
  }

  return {
    planets:  planetsResult,
    strongest: sorted[0] ?? 'Su',
    weakest:   sorted[sorted.length - 1] ?? 'Sa',
    leaderboard,
    insights: {
      averageShodasvarga,
      spread: topScore - bottomScore,
      dignityCounts,
      topThree: leaderboard.slice(0, 3),
      bottomThree: leaderboard.slice(-3),
    },
  }
}
