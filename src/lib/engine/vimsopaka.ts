// ─────────────────────────────────────────────────────────────
//  src/lib/engine/vimsopaka.ts
//  Viṁśopaka Bala — Twenty-point Strength (BPHS Standard)
//  Ref: Brihat Parashara Hora Shastra, Chapter 27
// ─────────────────────────────────────────────────────────────

import type { GrahaData, GrahaId, Rashi, Dignity } from '@/types/astrology'

export type { GrahaId }

// ── Classical Dignity Engine (Inline) ──────────────────────────

// ── Exaltation signs & exact degree ──────────────────────────
const EXALTATION: Record<string, { rashi: Rashi; degree: number }> = {
  Su: { rashi: 1,  degree: 10 }, // Aries 10°
  Mo: { rashi: 2,  degree: 3  }, // Taurus 3°
  Ma: { rashi: 10, degree: 28 }, // Capricorn 28°
  Me: { rashi: 6,  degree: 15 }, // Virgo 15°
  Ju: { rashi: 4,  degree: 5  }, // Cancer 5°
  Ve: { rashi: 12, degree: 27 }, // Pisces 27°
  Sa: { rashi: 7,  degree: 20 }, // Libra 20°
  Ra: { rashi: 3,  degree: 20 }, // Gemini 20° (traditional)
  Ke: { rashi: 9,  degree: 20 }, // Sagittarius 20° (traditional)
  Ur: { rashi: 11, degree: 0  },
  Ne: { rashi: 4,  degree: 0  },
  Pl: { rashi: 1,  degree: 0  },
}

// ── Debilitation signs (opposite of exaltation) ───────────────
const DEBILITATION: Record<string, Rashi> = {
  Su: 7,  Mo: 8,  Ma: 4,  Me: 12, Ju: 10,
  Ve: 6,  Sa: 1,  Ra: 9,  Ke: 3,
  Ur: 5,  Ne: 10, Pl: 7,
}

// ── Own signs ─────────────────────────────────────────────────
const OWN_SIGNS: Record<string, Rashi[]> = {
  Su: [5],
  Mo: [4],
  Ma: [1, 8],
  Me: [3, 6],
  Ju: [9, 12],
  Ve: [2, 7],
  Sa: [10, 11],
  Ra: [],
  Ke: [],
  Ur: [11],
  Ne: [12],
  Pl: [8],
}

// ── Moolatrikona signs & degree range ────────────────────────
const MOOLATRIKONA: Record<string, { rashi: Rashi; from: number; to: number } | null> = {
  Su: { rashi: 5,  from: 0,  to: 20 }, // Leo 0–20°
  Mo: { rashi: 2,  from: 4,  to: 20 }, // Taurus 4–20°
  Ma: { rashi: 1,  from: 0,  to: 12 }, // Aries 0–12°
  Me: { rashi: 6,  from: 16, to: 20 }, // Virgo 16–20°
  Ju: { rashi: 9,  from: 0,  to: 10 }, // Sagittarius 0–10°
  Ve: { rashi: 7,  from: 0,  to: 15 }, // Libra 0–15°
  Sa: { rashi: 11, from: 0,  to: 20 }, // Aquarius 0–20°
  Ra: null,
  Ke: null,
  Ur: null,
  Ne: null,
  Pl: null,
}

// ── Natural friendship table ──────────────────────────────────
const FRIENDS: Record<string, GrahaId[]> = {
  Su: ['Mo', 'Ma', 'Ju'],
  Mo: ['Su', 'Me'],
  Ma: ['Su', 'Mo', 'Ju'],
  Me: ['Su', 'Ve'],
  Ju: ['Su', 'Mo', 'Ma'],
  Ve: ['Me', 'Sa'],
  Sa: ['Me', 'Ve'],
  Ra: ['Ve', 'Sa', 'Me'],
  Ke: ['Ve', 'Sa', 'Me'],
  Ur: ['Ve', 'Sa'],
  Ne: ['Ju', 'Mo'],
  Pl: ['Ma', 'Sa'],
}

const ENEMIES: Record<string, GrahaId[]> = {
  Su: ['Ve', 'Sa'],
  Mo: [],
  Ma: ['Me'],
  Me: ['Mo'],
  Ju: ['Me', 'Ve'],
  Ve: ['Su', 'Mo'],
  Sa: ['Su', 'Mo', 'Ma'],
  Ra: ['Su', 'Mo', 'Ma'],
  Ke: ['Su', 'Mo', 'Ma'],
  Ur: ['Su', 'Mo', 'Ma'],
  Ne: ['Su', 'Me', 'Ve'],
  Pl: ['Su', 'Mo', 'Ju'],
}

// Sign lord map
const SIGN_LORD: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo',
  5: 'Su', 6: 'Me', 7: 'Ve', 8: 'Ma',
  9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

function isExalted(id: GrahaId, rashi: Rashi, degree: number): boolean {
  const ex = EXALTATION[id]
  if (!ex || ex.rashi !== rashi) return false
  return Math.abs(degree - ex.degree) <= 2
}

function isDebilitated(id: GrahaId, rashi: Rashi): boolean {
  return DEBILITATION[id] === rashi
}

function isMoolatrikona(id: GrahaId, rashi: Rashi, degree: number): boolean {
  const mt = MOOLATRIKONA[id]
  if (!mt) return false
  return mt.rashi === rashi && degree >= mt.from && degree <= mt.to
}

function isOwn(id: GrahaId, rashi: Rashi): boolean {
  return OWN_SIGNS[id]?.includes(rashi) ?? false
}

function getRelationship(planet: GrahaId, signLord: GrahaId): 'friend' | 'neutral' | 'enemy' {
  if (planet === signLord) return 'neutral' // own — handled separately
  const isFriend = FRIENDS[planet]?.includes(signLord)
  const isEnemy  = ENEMIES[planet]?.includes(signLord)
  if (isFriend && !isEnemy) return 'friend'
  if (isEnemy && !isFriend) return 'enemy'
  return 'neutral'
}

function getDignity(id: GrahaId, rashi: Rashi, degree: number): Dignity {
  if (isExalted(id, rashi, degree))    return 'exalted'
  if (isDebilitated(id, rashi))         return 'debilitated'
  if (isMoolatrikona(id, rashi, degree)) return 'moolatrikona'
  if (isOwn(id, rashi))                 return 'own'
  const lord = SIGN_LORD[rashi]
  if (!lord) return 'neutral'
  const rel = getRelationship(id, lord)
  if (rel === 'friend')  return 'friend'
  if (rel === 'enemy')   return 'enemy'
  return 'neutral'
}

// ── Viṁśopaka Bala Logic ───────────────────────────────────────

export interface VimsopakaPlanet {
  id: string
  shadvarga:   number  // 6-varga  score (max 20)
  saptavarga:  number  // 7-varga  score (max 20)
  dashavarga:  number  // 10-varga score (max 20)
  shodasvarga: number  // 16-varga score (max 20)
  vargaDignities:    Record<string, Dignity | null>
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
  topThree:    VimsopakaLeaderboardEntry[]
  bottomThree: VimsopakaLeaderboardEntry[]
}

export interface VimsopakaBalaResult {
  planets:    Record<string, VimsopakaPlanet>
  strongest:  string
  weakest:    string
  leaderboard: VimsopakaLeaderboardEntry[]
  insights:   VimsopakaBalaInsights
}

const DIGNITY_POINTS: Record<Dignity, number> = {
  exalted:      20,
  moolatrikona: 18,
  own:          15,
  great_friend: 10,
  friend:        7,
  neutral:       4,
  enemy:         2,
  great_enemy:   1,
  debilitated:   0,
}

const SHADVARGA: [string, number][] = [
  ['D1',  6], ['D2',  2], ['D3',  2], ['D9',  4], ['D12', 3], ['D30', 3],
]
const SAPTAVARGA: [string, number][] = [
  ['D1',  6], ['D2',  2], ['D3',  2], ['D7',  1], ['D9',  3], ['D12', 3], ['D30', 3],
]
const DASHAVARGA: [string, number][] = [
  ['D1',  3], ['D2',  1], ['D3',  3], ['D7',  1], ['D9',  3], ['D10', 1], ['D12', 2], ['D16', 1], ['D27', 2], ['D30', 3],
]
const SHODASVARGA: [string, number][] = [
  ['D1', 3.5], ['D2', 1], ['D3', 1], ['D4', 0.5], ['D7', 0.5], ['D9', 3], ['D10', 0.5], ['D12', 1],
  ['D16', 0.5], ['D20', 0.5], ['D24', 0.5], ['D27', 1], ['D30', 1.5], ['D40', 1], ['D45', 1], ['D60', 3.5],
]

function computeVargaRashi(longitude: number, varga: string): { rashi: number; degree: number } {
  const lon = ((longitude % 360) + 360) % 360
  const rashiSize = 30
  const baseRashi = Math.floor(lon / rashiSize) + 1
  const deg = lon % rashiSize
  switch (varga) {
    case 'D1': return { rashi: baseRashi, degree: deg }
    case 'D2': {
      const isOdd = baseRashi % 2 === 1
      if (isOdd) return deg < 15 ? { rashi: 5, degree: deg * 2 } : { rashi: 4, degree: (deg - 15) * 2 }
      else return deg < 15 ? { rashi: 4, degree: deg * 2 } : { rashi: 5, degree: (deg - 15) * 2 }
    }
    case 'D3': {
      const drekNum = Math.floor(deg / 10)
      const triplicities = [0, 4, 8]
      const rashi = ((baseRashi - 1 + triplicities[drekNum]) % 12) + 1
      return { rashi, degree: (deg % 10) * 3 }
    }
    case 'D4': return { rashi: ((baseRashi - 1 + Math.floor(deg / 7.5) * 3) % 12) + 1, degree: (deg % 7.5) * 4 }
    case 'D7': {
      const num = Math.floor(deg / (30 / 7))
      const rashi = baseRashi % 2 === 1 ? ((baseRashi - 1 + num) % 12) + 1 : ((baseRashi - 1 + 6 + num) % 12) + 1
      return { rashi, degree: (deg % (30 / 7)) * 7 }
    }
    case 'D9': {
      const starts: Record<number, number> = { 1:1, 5:1, 9:1, 2:10, 6:10, 10:10, 3:7, 7:7, 11:7, 4:4, 8:4, 12:4 }
      const rashi = (( (starts[baseRashi] ?? 1) - 1 + Math.floor(deg / (10 / 3)) ) % 12) + 1
      return { rashi, degree: (deg % (10 / 3)) * 9 }
    }
    case 'D10': {
      const num = Math.floor(deg / 3)
      const rashi = baseRashi % 2 === 1 ? ((baseRashi - 1 + num) % 12) + 1 : ((baseRashi - 1 + 8 + num) % 12) + 1
      return { rashi, degree: (deg % 3) * 10 }
    }
    case 'D12': return { rashi: ((baseRashi - 1 + Math.floor(deg / 2.5)) % 12) + 1, degree: (deg % 2.5) * 12 }
    case 'D16': {
      const starts: Record<number, number> = { 1:1, 5:1, 9:1, 2:10, 6:10, 10:10, 3:7, 7:7, 11:7, 4:4, 8:4, 12:4 }
      const rashi = (( (starts[baseRashi] ?? 1) - 1 + Math.floor(deg / 1.875) ) % 12) + 1
      return { rashi, degree: (deg % 1.875) * 16 }
    }
    case 'D20': {
      const starts: Record<number, number> = { 1:1, 5:1, 9:1, 2:10, 6:10, 10:10, 3:7, 7:7, 11:7, 4:4, 8:4, 12:4 }
      const rashi = (( (starts[baseRashi] ?? 1) - 1 + Math.floor(deg / 1.5) ) % 12) + 1
      return { rashi, degree: (deg % 1.5) * 20 }
    }
    case 'D24': return { rashi: (( (baseRashi % 2 === 1 ? 5 : 8) - 1 + Math.floor(deg / 1.25) ) % 12) + 1, degree: (deg % 1.25) * 24 }
    case 'D27': {
      const starts: Record<number, number> = { 1:1, 5:1, 9:1, 2:10, 6:10, 10:10, 3:7, 7:7, 11:7, 4:4, 8:4, 12:4 }
      const rashi = (( (starts[baseRashi] ?? 1) - 1 + Math.floor(deg / (10 / 9)) ) % 12) + 1
      return { rashi, degree: (deg % (10 / 9)) * 27 }
    }
    case 'D30': {
      const odd = [{lord:'Ma',f:0,t:5,s:1},{lord:'Sa',f:5,t:10,s:11},{lord:'Ju',f:10,t:18,s:9},{lord:'Me',f:18,t:25,s:3},{lord:'Ve',f:25,t:30,s:7}]
      const even = [{lord:'Ve',f:0,t:5,s:2},{lord:'Me',f:5,t:12,s:6},{lord:'Ju',f:12,t:20,s:12},{lord:'Sa',f:20,t:25,s:10},{lord:'Ma',f:25,t:30,s:8}]
      const table = baseRashi % 2 === 1 ? odd : even
      const entry = table.find(e => deg >= e.f && deg < e.t) ?? table[table.length - 1]
      return { rashi: entry.s, degree: (deg - entry.f) * (30 / (entry.t - entry.f)) }
    }
    case 'D40': return { rashi: (( (baseRashi % 2 === 1 ? 1 : 7) - 1 + Math.floor(deg / 0.75) ) % 12) + 1, degree: (deg % 0.75) * 40 }
    case 'D45': {
      const mod3 = (baseRashi - 1) % 3
      const start = mod3 === 0 ? 1 : mod3 === 1 ? 5 : 9
      return { rashi: ((start - 1 + Math.floor(deg / (2 / 3))) % 12) + 1, degree: (deg % (2 / 3)) * 45 }
    }
    case 'D60': return { rashi: ((baseRashi - 1 + Math.floor(deg / 0.5)) % 12) + 1, degree: (deg % 0.5) * 60 }
    default: return { rashi: baseRashi, degree: deg }
  }
}

function planetVargaScore(id: GrahaId, varga: string, longitude: number, vargas: Record<string, GrahaData[]>, weight: number): { score: number; dignity: Dignity | null } {
  let rashi: number, degree: number
  const pre = vargas[varga]?.find(g => g.id === id)
  if (pre) { rashi = pre.rashi; degree = pre.degree }
  else { const c = computeVargaRashi(longitude, varga); rashi = c.rashi; degree = c.degree }
  const dignity = getDignity(id, rashi as any, degree)
  const score = ((DIGNITY_POINTS[dignity] ?? 4) / 20) * weight
  return { score, dignity }
}

function strengthLabel(score: number): VimsopakaPlanet['strength'] {
  if (score >= 15) return 'very_strong'
  if (score >= 10) return 'strong'
  if (score >= 6)  return 'moderate'
  if (score >= 3)  return 'weak'
  return 'very_weak'
}

const PLANETS: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

export function calculateVimsopaka(grahas: GrahaData[], vargas: Record<string, GrahaData[]>): VimsopakaBalaResult {
  const planetsResult: Record<string, VimsopakaPlanet> = {}
  for (const id of PLANETS) {
    const d1 = (vargas['D1'] ?? grahas).find(g => g.id === id)
    const lon = d1?.lonSidereal ?? 0
    const vDignities: Record<string, Dignity | null> = {}
    const vContribs: Record<string, number> = {}
    let shadvarga = 0, saptavarga = 0, dashavarga = 0, shodasvarga = 0
    
    SHADVARGA.forEach(([v, w]) => shadvarga += planetVargaScore(id, v, lon, vargas, w).score)
    SAPTAVARGA.forEach(([v, w]) => saptavarga += planetVargaScore(id, v, lon, vargas, w).score)
    DASHAVARGA.forEach(([v, w]) => dashavarga += planetVargaScore(id, v, lon, vargas, w).score)
    SHODASVARGA.forEach(([v, w]) => {
      const { score, dignity } = planetVargaScore(id, v, lon, vargas, w)
      shodasvarga += score
      vDignities[v] = dignity
      vContribs[v] = score
    })

    const clamp = (v: number) => Math.max(0, Math.min(20, +v.toFixed(4)))
    const shoda = clamp(shodasvarga)
    planetsResult[id] = {
      id, shadvarga: clamp(shadvarga), saptavarga: clamp(saptavarga), dashavarga: clamp(dashavarga),
      shodasvarga: shoda, vargaDignities: vDignities, vargaContributions: vContribs,
      strength: strengthLabel(shoda), shodasPercent: (shoda / 20) * 100
    }
  }

  const sorted = PLANETS.slice().sort((a, b) => (planetsResult[b]?.shodasvarga ?? 0) - (planetsResult[a]?.shodasvarga ?? 0))
  const leaderboard: VimsopakaLeaderboardEntry[] = sorted.map((id, idx) => {
    const score = planetsResult[id]?.shodasvarga ?? 0
    return { id, rank: idx + 1, score, percent: (score / 20) * 100 }
  })

  const top = leaderboard[0]?.score ?? 0, bot = leaderboard[leaderboard.length - 1]?.score ?? 0
  const dCounts: Record<Dignity, number> = { exalted:0, moolatrikona:0, own:0, great_friend:0, friend:0, neutral:0, enemy:0, great_enemy:0, debilitated:0 }
  PLANETS.forEach(id => Object.values(planetsResult[id]?.vargaDignities ?? {}).forEach(d => { if (d) dCounts[d]++ }))

  return {
    planets: planetsResult, strongest: sorted[0] ?? 'Su', weakest: sorted[sorted.length - 1] ?? 'Sa',
    leaderboard, insights: { averageShodasvarga: leaderboard.length ? leaderboard.reduce((s, r) => s + r.score, 0) / leaderboard.length : 0, spread: top - bot, dignityCounts: dCounts, topThree: leaderboard.slice(0, 3), bottomThree: leaderboard.slice(-3) }
  }
}
