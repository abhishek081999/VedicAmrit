// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dasha/vimshottari.ts
//  Complete Vimshottari Dasha — all 6 subcycle levels
//  Maha → Antar → Pratyantar → Sukshma → Prana → Deha
// ─────────────────────────────────────────────────────────────

import type { GrahaId, DashaNode } from '@/types/astrology'
import { NAKSHATRA_LORDS } from '@/types/astrology'

// ── Vimshottari Constants ─────────────────────────────────────

export const VIMSHOTTARI_YEARS: Record<string, number> = {
  Ke: 7,  Ve: 20, Su: 6,  Mo: 10,
  Ma: 7,  Ra: 18, Ju: 16, Sa: 19, Me: 17,
}

export const VIMSHOTTARI_TOTAL = 120  // total years

// Sequence of Dasha lords (fixed order)
export const DASHA_SEQUENCE: GrahaId[] = [
  'Ke','Ve','Su','Mo','Ma','Ra','Ju','Sa','Me'
]

// ── Helper ────────────────────────────────────────────────────

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000

function yearsToMs(years: number): number {
  return years * MS_PER_YEAR
}

/**
 * Find the index of a Graha in DASHA_SEQUENCE
 */
function dashaIndex(lord: GrahaId): number {
  return DASHA_SEQUENCE.indexOf(lord)
}

// ── Main Calculator ───────────────────────────────────────────

/**
 * Calculate complete Vimshottari Dasha tree
 *
 * @param moonLonSidereal  Moon's sidereal longitude at birth
 * @param birthDate        Date of birth
 * @param depth            How many levels deep (1=Maha only, 6=all levels)
 * @param startTaraGraha   Override start Tara — default is Moon (for Vela+ users)
 */
export function calcVimshottari(
  moonLonSidereal: number,
  birthDate: Date,
  depth: number = 4,
  startTaraGraha?: GrahaId,
): DashaNode[] {
  // ── Step 1: Find birth Nakshatra and lord ────────────────
  const NAKSHATRA_SPAN = 360 / 27

  // Which planet's nakshatra to use (default Moon)
  const refLon = moonLonSidereal
  const normalized = ((refLon % 360) + 360) % 360
  const nakshatraIndex = Math.floor(normalized / NAKSHATRA_SPAN)

  // Birth Dasha lord from nakshatra
  const birthLord = startTaraGraha || NAKSHATRA_LORDS[nakshatraIndex]

  // ── Step 2: Calculate Dasha balance at birth ─────────────
  const withinNakshatra = normalized % NAKSHATRA_SPAN
  const traversedFraction = withinNakshatra / NAKSHATRA_SPAN
  const remainingFraction = 1 - traversedFraction

  const balanceYears = remainingFraction * VIMSHOTTARI_YEARS[birthLord]

  // ── Step 3: Build Maha Dasha sequence ────────────────────
  const birthLordIdx = dashaIndex(birthLord)
  const nodes: DashaNode[] = []
  let cursor = birthDate.getTime()
  const now  = Date.now()

  for (let i = 0; i < 9; i++) {
    const lord = DASHA_SEQUENCE[(birthLordIdx + i) % 9]
    const years = i === 0 ? balanceYears : VIMSHOTTARI_YEARS[lord]
    const durationMs = yearsToMs(years)

    const start = new Date(cursor)
    const end   = new Date(cursor + durationMs)

    nodes.push({
      lord,
      start,
      end,
      durationMs,
      level: 1,
      isCurrent: now >= start.getTime() && now < end.getTime(),
      children: depth > 1
        ? buildSubDashas(lord, start, end, durationMs, 2, depth, now)
        : [],
    })

    cursor += durationMs
  }

  return nodes
}

/**
 * Recursively build sub-Dasha levels
 * Each sub-period is proportional: (subLordYears / 120) × parentDuration
 */
function buildSubDashas(
  mahaLord:   GrahaId,
  parentStart:Date,
  parentEnd:  Date,
  parentMs:   number,
  currentLevel: number,
  maxDepth:   number,
  now:        number,
): DashaNode[] {
  const mahaIdx = dashaIndex(mahaLord)
  const nodes: DashaNode[] = []
  let cursor = parentStart.getTime()

  for (let i = 0; i < 9; i++) {
    const lord      = DASHA_SEQUENCE[(mahaIdx + i) % 9]
    const fraction  = VIMSHOTTARI_YEARS[lord] / VIMSHOTTARI_TOTAL
    const durationMs = parentMs * fraction

    const start = new Date(cursor)
    const end   = new Date(cursor + durationMs)

    nodes.push({
      lord,
      start,
      end,
      durationMs,
      level: currentLevel,
      isCurrent: now >= cursor && now < cursor + durationMs,
      children: currentLevel < maxDepth
        ? buildSubDashas(lord, start, end, durationMs, currentLevel + 1, maxDepth, now)
        : [],
    })

    cursor += durationMs
  }

  return nodes
}

// ── Utility Functions ─────────────────────────────────────────

/**
 * Find the currently running Dasha at each level
 * Returns path from Maha → Antar → ... → deepest current
 */
export function getCurrentDasha(
  nodes: DashaNode[],
  now: Date = new Date(),
): DashaNode[] {
  const nowMs = now.getTime()
  const path: DashaNode[] = []

  function traverse(dashas: DashaNode[]): boolean {
    for (const node of dashas) {
      if (nowMs >= new Date(node.start).getTime() && nowMs < new Date(node.end).getTime()) {
        path.push(node)
        if (node.children.length > 0) {
          traverse(node.children)
        }
        return true
      }
    }
    return false
  }

  traverse(nodes)
  return path
}

/**
 * Get time remaining in current Dasha as formatted string
 */
export function getDashaTimeRemaining(node: DashaNode): string {
  const now = Date.now()
  const remaining = new Date(node.end).getTime() - now

  if (remaining <= 0) return 'Completed'

  const years  = Math.floor(remaining / MS_PER_YEAR)
  const months = Math.floor((remaining % MS_PER_YEAR) / (30.44 * 24 * 60 * 60 * 1000))
  const days   = Math.floor((remaining % (30.44 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000))

  const parts: string[] = []
  if (years  > 0) parts.push(`${years}y`)
  if (months > 0) parts.push(`${months}m`)
  if (days   > 0) parts.push(`${days}d`)

  return parts.join(' ') || '< 1 day'
}

/**
 * Format a Dasha node label (e.g., "Jupiter/Venus/Mercury")
 */
export function formatDashaLabel(path: DashaNode[]): string {
  return path.map(n => n.lord).join('/')
}

/**
 * Get all Dasha periods between two dates (flat list)
 * Useful for timeline visualization
 */
export function getDashasBetween(
  nodes: DashaNode[],
  from: Date,
  to: Date,
  level: number = 1,
): DashaNode[] {
  const result: DashaNode[] = []

  function traverse(dashas: DashaNode[], currentLevel: number): void {
    for (const node of dashas) {
      if (node.end <= from || node.start >= to) continue

      if (currentLevel === level) {
        result.push(node)
      } else if (currentLevel < level && node.children.length > 0) {
        traverse(node.children, currentLevel + 1)
      }
    }
  }

  traverse(nodes, 1)
  return result
}

// Dasha level names
export const DASHA_LEVEL_NAMES = [
  '', 'Maha Dasha', 'Antar Dasha', 'Pratyantar Dasha',
  'Sukshma Dasha', 'Prana Dasha', 'Deha Dasha',
]

export const DASHA_LEVEL_SHORT = [
  '', 'MD', 'AD', 'PD', 'SD', 'PrD', 'DD',
]
