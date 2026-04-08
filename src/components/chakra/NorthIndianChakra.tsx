// ─────────────────────────────────────────────────────────────
//  src/components/chakra/NorthIndianChakra.tsx
//  North Indian (Parashari) Kundali
//
//  • Houses FIXED  — H1 always top kite
//  • Rashis ROTATE — each cell shows rashi NUMBER only (1-12)
//  • Anti-clockwise: H1(top)→H2(top-left)→H3(left-upper)→H4(left)…
//  • Layout: safe Y range split 25% rashi / 75% planets
//  • Crowded house (>3 planets): 2-col grid
// ─────────────────────────────────────────────────────────────
'use client'

import type { GrahaData, Rashi, ArudhaData, LagnaData } from '@/types/astrology'
import { getNakshatra } from '@/lib/engine/nakshatra'
import { NAKSHATRA_SHORT } from '@/types/astrology'

function dignityColor(dignity: string, isRetro: boolean): string {
  if (isRetro) return 'var(--dig-retro)'
  switch (dignity) {
    case 'exalted': return 'var(--dig-exalted)'
    case 'moolatrikona': return 'var(--dig-moola)'
    case 'own': return 'var(--dig-own)'
    case 'debilitated': return 'var(--dig-debilitate)'
    default: return 'var(--dig-neutral)'
  }
}

// ── Polygon vertices ──────────────────────────────────────────

function polyPts(h: number, S: number): [number, number][] {
  const Q = S / 4, M = S / 2
  switch (h) {
    case 1: return [[Q, Q], [M, M], [3 * Q, Q], [M, 0]]
    case 2: return [[0, 0], [Q, Q], [M, 0]]
    case 3: return [[0, 0], [0, M], [Q, Q]]
    case 4: return [[0, M], [Q, 3 * Q], [M, M], [Q, Q]]
    case 5: return [[0, M], [0, S], [Q, 3 * Q]]
    case 6: return [[Q, 3 * Q], [0, S], [M, S]]
    case 7: return [[Q, 3 * Q], [M, S], [3 * Q, 3 * Q], [M, M]]
    case 8: return [[3 * Q, 3 * Q], [M, S], [S, S]]
    case 9: return [[3 * Q, 3 * Q], [S, S], [S, M]]
    case 10: return [[3 * Q, Q], [M, M], [3 * Q, 3 * Q], [S, M]]
    case 11: return [[3 * Q, Q], [S, M], [S, 0]]
    case 12: return [[M, 0], [3 * Q, Q], [S, 0]]
    default: return []
  }
}

function centroid(pts: [number, number][]): [number, number] {
  return [
    pts.reduce((s, p) => s + p[0], 0) / pts.length,
    pts.reduce((s, p) => s + p[1], 0) / pts.length,
  ]
}


// Standard display labels for Arudha Padas
const ARUDHA_LABEL: Record<string, string> = {
  AL: 'AL',   // Arudha Lagna
  A2: 'A2',
  A3: 'A3',
  A4: 'A4',
  A5: 'A5',
  A6: 'A6',
  A7: 'A7',   // also known as Darapada
  A8: 'A8',
  A9: 'A9',
  A10: 'A10',
  A11: 'A11',
  A12: 'UL',   // Upapada Lagna
}

// ── Props ─────────────────────────────────────────────────────

interface NorthIndianProps {
  ascRashi: Rashi
  grahas: GrahaData[]
  size?: number
  showDegrees?: boolean
  showNakshatra?: boolean
  showKaraka?: boolean
  arudhas?: ArudhaData
  lagnas?: LagnaData
  transitGrahas?: GrahaData[]   // optional transit planets overlay
  interactive?: boolean
  onHouseClick?: (house: number) => void
  fontScale?: number
  planetScale?: number
  arudhaScale?: number
  infoScale?: number
}

// ── Component ─────────────────────────────────────────────────

export function NorthIndianChakra({
  ascRashi,
  grahas,
  size = 480,
  showDegrees = true,
  showNakshatra = false,
  showKaraka = false,
  arudhas,
  lagnas,
  transitGrahas,
  interactive = false,
  onHouseClick,
  fontScale = 1.0,
  planetScale = 1.0,
  arudhaScale = 1.0,
  infoScale = 1.0,
}: NorthIndianProps) {
  const S = size

  const BASE_PL_FONT = S * 0.038 * fontScale * planetScale
  const BASE_DEG_FONT = S * 0.024 * fontScale * infoScale

  const signInHouse = (h: number): number =>
    ((ascRashi - 1 + h - 1) % 12) + 1

  const byHouse: Record<number, any[]> = {}
  for (const g of grahas) {
    for (let h = 1; h <= 12; h++) {
      if (signInHouse(h) === g.rashi) {
        if (!byHouse[h]) byHouse[h] = []
        byHouse[h].push(g)
        break
      }
    }
  }

  // Inject AS (Ascendant) into 1st house
  if (lagnas) {
    if (!byHouse[1]) byHouse[1] = []
    const ascNak = getNakshatra(lagnas.ascDegree)
    byHouse[1].unshift({
      id: 'AS',
      degree: lagnas.ascDegreeInRashi,
      rashi: ascRashi,
      dignity: 'neutral',
      isRetro: false,
      nakshatraIndex: ascNak.index,
      nakshatraName: ascNak.name,
      pada: ascNak.pada,
      charaKaraka: null
    })
  }

  const isKite = (h: number) => h === 1 || h === 4 || h === 7 || h === 10

  // ── Group arudha labels by house ─────────────────────────────
  const ARUDHA_KEYS = ['AL', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12'] as const
  const arudhaByHouse: Record<number, string[]> = {}
  if (arudhas) {
    for (const key of ARUDHA_KEYS) {
      const rashi = arudhas[key] as Rashi | undefined
      if (!rashi) continue
      for (let h = 1; h <= 12; h++) {
        if (signInHouse(h) === rashi) {
          if (!arudhaByHouse[h]) arudhaByHouse[h] = []
          arudhaByHouse[h].push(key)
          break
        }
      }
    }
  }

  // ── Transit planets by house ────────────────────────────────
  const tByHouse: Record<number, GrahaData[]> = {}
  if (transitGrahas) {
    for (const tg of transitGrahas) {
      const tHouse = ((tg.rashi - ascRashi + 12) % 12) + 1
      if (!tByHouse[tHouse]) tByHouse[tHouse] = []
      tByHouse[tHouse].push(tg)
    }
  }

  // Planet font — SAME size for all cells (corners are large enough)

  return (
    <svg
      viewBox={`0 0 ${S} ${S}`}
      width={S}
      height={S}
      style={{ display: 'block', maxWidth: '100%', height: 'auto', overflow: 'visible' }}
      aria-label="North Indian birth chart"
    >
      {/* Background — transparent to let theme parchment show through */}
      <rect width={S} height={S} fill="transparent" />

      {Array.from({ length: 12 }, (_, i) => {
        const h = i + 1
        const pts = polyPts(h, S)
        if (!pts.length) return null

        const sign = signInHouse(h)
        const planets = byHouse[h] ?? []
        const lagna = h === 1
        const kite = isKite(h)

        // ── Cell bounds ───────────────────────────────────────
        const topY = Math.min(...pts.map(p => p[1]))
        const botY = Math.max(...pts.map(p => p[1]))
        const leftX = Math.min(...pts.map(p => p[0]))
        const rightX = Math.max(...pts.map(p => p[0]))
        const cellH = botY - topY
        const cellW = rightX - leftX

        // Safe inner region (inset from polygon edges)
        const PAD = S * 0.016
        const safeTop = topY + PAD
        const safeBot = botY - PAD
        const safeH = safeBot - safeTop

        // Centre X from centroid
        const [gcx] = centroid(pts)

        // ── Rashi number positioning ──────────────────────────
        const getRashiPos = (h: number, S: number) => {
          const Q = S / 4, M = S/2
          const o = S * 0.045 // Safe offset
          switch(h) {
            case 1:  return { x: M,     y: M - o }
            case 2:  return { x: Q,     y: Q - o }
            case 3:  return { x: Q - o, y: Q }
            case 4:  return { x: M - o, y: M }
            case 5:  return { x: Q - o, y: 3*Q }
            case 6:  return { x: Q,     y: 3*Q + o }
            case 7:  return { x: M,     y: M + o }
            case 8:  return { x: 3*Q,   y: 3*Q + o }
            case 9:  return { x: 3*Q + o, y: 3*Q }
            case 10: return { x: M + o, y: M }
            case 11: return { x: 3*Q + o, y: Q }
            case 12: return { x: 3*Q,   y: Q - o }
            default: return { x: gcx,   y: topY + cellH*0.2 }
          }
        }
        const rp = getRashiPos(h, S)

        const rashiFont = Math.round(
          Math.min(
            kite ? S * 0.040 * fontScale : S * 0.030 * fontScale,
            safeH * 0.22
          )
        )

        // ── Planet block — more central in cell ──────────
        const plAreaTop = safeTop + safeH * 0.15
        const plAreaBot = safeBot - safeH * 0.15
        const plAreaH = plAreaBot - plAreaTop

        const aList = arudhaByHouse[h] ?? []
        const numARows = aList.length > 0 ? Math.ceil(aList.length / 3) : 0

        const n = planets.length
        const useTwoCol = n > 3
        const rows = useTwoCol ? Math.ceil(n / 2) : n

        const linesPerPl = 1
          + (showDegrees ? 1 : 0)
          + (showNakshatra ? 1 : 0)

        // Count Arudha rows as roughly 0.8 line height equivalent
        const estTotalLines = Math.max(rows * linesPerPl + numARows * 0.8, 1)

        // Scale down font if many items — but never below a readable minimum
        const maxLineH = plAreaH / estTotalLines
        const plFont = Math.max(
          S * 0.032 * fontScale * planetScale,                            // Stronger minimum
          Math.min(BASE_PL_FONT, maxLineH * 0.8)
        )
        const degFont = Math.min(BASE_DEG_FONT, plFont * 0.7)
        const lineH = plFont * 1.15
          + (showDegrees ? degFont * 1.10 : 0)
          + (showNakshatra ? degFont * 0.95 : 0)

        const aFont = Math.round(Math.min(plFont * 0.82, S * 0.028) * arudhaScale)

        const tPlanetsInSelf = tByHouse[h] ?? []
        const hasTransits = tPlanetsInSelf.length > 0

        // Total height of planet block + arudha block — centre it in plArea
        const totalPlH = rows * lineH
        const totalAH = numARows > 0 ? (aFont * 0.7 + (numARows - 1) * aFont * 1.3) : 0
        const totalContentH = totalPlH + totalAH

        // ── Vertical alignment logic ──
        // Keep natal planets in the top half if transits exist
        const plBlockTopY = hasTransits
          ? plAreaTop + (plAreaH * 0.05)
          : plAreaTop + Math.max(0, (plAreaH - totalContentH) / 2)

        // Two-col horizontal offset — wider spacing
        const colOff = useTwoCol ? Math.min(cellW * 0.28, S * 0.06) : 0

        return (
          <g
            key={h}
            onClick={() => interactive && onHouseClick?.(h)}
            style={{ cursor: interactive ? 'pointer' : 'default' }}
          >
            {/* Cell fill for Lagna and Main Houses */}
            <polygon
              points={pts.map(([x, y]) => `${x},${y}`).join(' ')}
              fill={
                lagna ? 'var(--gold-faint)' :
                  kite ? 'rgba(132, 27, 27, 0.03)' : /* Subtle tint for Kendras */
                    'transparent'
              }
              stroke="var(--gold)"
              strokeWidth={lagna ? 2.0 : 1.25}
              strokeLinejoin="round"
            />

            {/* ── Rashi NUMBER ── */}
            <text
              x={rp.x}
              y={rp.y}
              fontSize={rashiFont}
              fontFamily="var(--font-mono)"
              fontWeight="var(--fw-medium)"
              fill={lagna ? 'var(--gold)' : 'var(--chart-sign-green)'} // Theme-aware green for signs
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ opacity: 0.9 }}
            >
              {sign}
            </text>

            {/* ── Planets ── */}
            {planets.map((g, gi) => {
              const col = useTwoCol ? gi % 2 : 0
              const row = useTwoCol ? Math.floor(gi / 2) : gi
              const px = gcx + (useTwoCol ? (col === 0 ? -colOff : colOff) : 0)
              const py = plBlockTopY + row * lineH + plFont * 0.55

              const fillCol = dignityColor(g.dignity, g.isRetro)
              const ret = g.isRetro ? 'ᴿ' : ''
              const deg = showDegrees
                ? `${Math.floor(g.degree)}°${String(Math.floor((g.degree % 1) * 60)).padStart(2, '0')}'`
                : ''
              const kar = showKaraka && g.charaKaraka ? ` ${g.charaKaraka}` : ''

              return (
                <g key={g.id}>
                  <text
                    x={px} y={py}
                    fontSize={Math.round(plFont)}
                    fontFamily="var(--font-chart-planets)"
                    fontWeight="var(--fw-medium)"
                    fill={fillCol}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {g.id}{ret}{kar ? ` [${kar}]` : ''}
                  </text>
                  {showDegrees && (
                    <text
                      x={px} y={py + plFont * 0.72 + degFont * 0.5}
                      fontSize={Math.round(degFont)}
                      fontFamily="JetBrains Mono, monospace"
                      fill="var(--text-muted)"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {deg}
                    </text>
                  )}
                   {showNakshatra && g.nakshatraIndex !== undefined && (
                    <text
                      x={px}
                      y={py + plFont * 0.72 + degFont * (showDegrees ? 1.65 : 0.5)}
                      fontSize={Math.round(degFont * 0.85)}
                      fontFamily="var(--font-chart-planets)"
                      fontStyle="italic"
                      fill="var(--text-muted)"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {NAKSHATRA_SHORT[g.nakshatraIndex]} {g.pada}
                    </text>
                  )}
                </g>
              )
            })}

            {/* ── Āruḍha labels ── */}
            {(() => {
              if (!aList.length) return null

              const baseY = plBlockTopY + totalPlH + aFont * 0.7

              const chunks = []
              for (let i = 0; i < aList.length; i += 3) {
                chunks.push(aList.slice(i, i + 3).map(k => ARUDHA_LABEL[k] ?? k).join(' · '))
              }

              return chunks.map((textStr, ci) => (
                <text
                  key={`arudha-row-${ci}`}
                  x={gcx}
                  y={baseY + ci * aFont * 1.3}
                  fontSize={aFont}
                  fontFamily="var(--font-chart-planets)"
                  fontStyle="italic"
                  fontWeight="var(--fw-bold)"
                  fill="var(--text-gold)"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {textStr}
                </text>
              ))
            })()}
            {/* ── Transit planet overlay ── */}
            {hasTransits && tPlanetsInSelf.map((tg, ti) => {
               const tFont = S * 0.024 * fontScale * planetScale
               const col = ti % 2
               const row = Math.floor(ti / 2)
               const offX = (tPlanetsInSelf.length > 1) ? (col === 0 ? -S * 0.05 : S * 0.05) : 0
               
               // Offset from bottom of the SAFE house area
               const ty = plAreaTop + plAreaH * 0.90 + (row * tFont * 1.1)

               return (
                <g key={`transit-${tg.id}-${ti}`}>
                  <text
                    x={gcx + offX}
                    y={ty}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={Math.round(tFont)}
                    fontWeight={800}
                    fontFamily="var(--font-mono)"
                    fill={tg.isRetro ? 'rgba(120,80,220,0.95)' : 'rgba(100,80,180,0.95)'}
                  >
                    {tg.id}{tg.isRetro ? '℞' : ''}{showDegrees ? Math.floor(tg.degree) : ''}
                  </text>
                  {showNakshatra && tg.nakshatraIndex !== undefined && (
                    <text
                      x={gcx + offX}
                      y={ty + tFont * 0.8}
                      fontSize={Math.round(tFont * 0.75)}
                      fontFamily="var(--font-chart-planets)"
                      fill="var(--chart-transit)"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{ opacity: 0.8 }}
                    >
                      {NAKSHATRA_SHORT[tg.nakshatraIndex]}
                    </text>
                  )}
                </g>
               )
            })}
          </g>
        )
      })}

      {/* Outer framing box */}
      <rect x=".5" y=".5" width={S - 1} height={S - 1}
        fill="none" stroke="var(--gold)" strokeWidth="1.5" />
    </svg>
  )
}