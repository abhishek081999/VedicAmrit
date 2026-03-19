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

import type { GrahaData, Rashi, ArudhaData } from '@/types/astrology'

function dignityColor(dignity: string, isRetro: boolean): string {
  if (isRetro) return '#e07090'
  switch (dignity) {
    case 'exalted':      return '#4ecdc4'
    case 'moolatrikona': return '#f0c040'
    case 'own':          return '#e8d070'
    case 'debilitated':  return '#e05555'
    default:             return '#c8bef0'
  }
}

// ── Polygon vertices ──────────────────────────────────────────

function polyPts(h: number, S: number): [number, number][] {
  const Q = S / 4, M = S / 2
  switch (h) {
    case 1:  return [[Q,Q],[M,M],[3*Q,Q],[M,0]]
    case 2:  return [[0,0],[Q,Q],[M,0]]
    case 3:  return [[0,0],[0,M],[Q,Q]]
    case 4:  return [[0,M],[Q,3*Q],[M,M],[Q,Q]]
    case 5:  return [[0,M],[0,S],[Q,3*Q]]
    case 6:  return [[Q,3*Q],[0,S],[M,S]]
    case 7:  return [[Q,3*Q],[M,S],[3*Q,3*Q],[M,M]]
    case 8:  return [[3*Q,3*Q],[M,S],[S,S]]
    case 9:  return [[3*Q,3*Q],[S,S],[S,M]]
    case 10: return [[3*Q,Q],[M,M],[3*Q,3*Q],[S,M]]
    case 11: return [[3*Q,Q],[S,M],[S,0]]
    case 12: return [[M,0],[3*Q,Q],[S,0]]
    default: return []
  }
}

function centroid(pts: [number,number][]): [number,number] {
  return [
    pts.reduce((s,p) => s+p[0], 0) / pts.length,
    pts.reduce((s,p) => s+p[1], 0) / pts.length,
  ]
}


// Standard display labels for Arudha Padas
const ARUDHA_LABEL: Record<string, string> = {
  AL:  'AL',   // Arudha Lagna
  A2:  'A2',
  A3:  'A3',
  A4:  'A4',
  A5:  'A5',
  A6:  'A6',
  A7:  'A7',   // also known as Darapada
  A8:  'A8',
  A9:  'A9',
  A10: 'A10',
  A11: 'A11',
  A12: 'UL',   // Upapada Lagna
}

// ── Props ─────────────────────────────────────────────────────

interface NorthIndianProps {
  ascRashi:       Rashi
  grahas:         GrahaData[]
  size?:          number
  showDegrees?:   boolean
  showNakshatra?: boolean
  showKaraka?:    boolean
  arudhas?:       ArudhaData
  interactive?:   boolean
  onHouseClick?:  (house: number) => void
}

// ── Component ─────────────────────────────────────────────────

export function NorthIndianChakra({
  ascRashi,
  grahas,
  size = 480,
  showDegrees   = true,
  showNakshatra = false,
  showKaraka    = false,
  arudhas,
  interactive   = false,
  onHouseClick,
}: NorthIndianProps) {
  const S = size

  const signInHouse = (h: number): number =>
    ((ascRashi - 1 + h - 1) % 12) + 1

  const byHouse: Record<number, GrahaData[]> = {}
  for (const g of grahas) {
    for (let h = 1; h <= 12; h++) {
      if (signInHouse(h) === g.rashi) {
        if (!byHouse[h]) byHouse[h] = []
        byHouse[h].push(g)
        break
      }
    }
  }

  const isKite = (h: number) => h === 1 || h === 4 || h === 7 || h === 10

  // ── Group arudha labels by house ─────────────────────────────
  // Each arudha has a rashi; draw it in the house whose sign = that rashi
  const ARUDHA_KEYS = ['AL','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12'] as const
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

  // Planet font — SAME size for all cells (corners are large enough)
  const BASE_PL_FONT  = S * 0.038
  const BASE_DEG_FONT = S * 0.026

  return (
    <svg
      viewBox={`0 0 ${S} ${S}`}
      width={S}
      height={S}
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
      aria-label="North Indian birth chart"
    >
      <rect width={S} height={S} fill="var(--surface-1,#1a1a2e)" rx="8" />

      {Array.from({ length: 12 }, (_, i) => {
        const h    = i + 1
        const pts  = polyPts(h, S)
        if (!pts.length) return null

        const sign    = signInHouse(h)
        const planets = byHouse[h] ?? []
        const lagna   = h === 1
        const kite    = isKite(h)

        // ── Cell bounds ───────────────────────────────────────
        const topY   = Math.min(...pts.map(p => p[1]))
        const botY   = Math.max(...pts.map(p => p[1]))
        const leftX  = Math.min(...pts.map(p => p[0]))
        const rightX = Math.max(...pts.map(p => p[0]))
        const cellH  = botY - topY
        const cellW  = rightX - leftX

        // Safe inner region (inset from polygon edges)
        const PAD    = S * 0.016
        const safeTop = topY + PAD
        const safeBot = botY - PAD
        const safeH   = safeBot - safeTop

        // Centre X from centroid
        const [gcx]  = centroid(pts)

        // ── Rashi number — top 28% of safe height ─────────────
        const rashiFont = Math.round(
          Math.min(
            kite ? S * 0.054 : S * 0.042,
            safeH * 0.28
          )
        )
        // Place at 20% from safeTop — always inside cell
        const rashiY = safeTop + safeH * 0.20

        // ── Planet block — bottom 72% of safe height ──────────
        const plAreaTop = safeTop + safeH * 0.38
        const plAreaBot = safeBot
        const plAreaH   = plAreaBot - plAreaTop

        const n           = planets.length
        const useTwoCol   = n > 3
        const rows        = useTwoCol ? Math.ceil(n / 2) : n

        const linesPerPl  = 1
          + (showDegrees   ? 1 : 0)
          + (showNakshatra ? 1 : 0)

        // Scale down font if many planets — but never below a readable minimum
        const maxLineH  = plAreaH / Math.max(rows * linesPerPl, 1)
        const plFont    = Math.max(
          S * 0.022,                            // hard minimum — always readable
          Math.min(BASE_PL_FONT, maxLineH * 0.68)
        )
        const degFont   = Math.min(BASE_DEG_FONT, plFont * 0.70)
        const lineH     = plFont * 1.2
          + (showDegrees   ? degFont * 1.15 : 0)
          + (showNakshatra ? degFont * 1.00 : 0)

        // Total height of planet block — centre it in plArea
        const totalPlH    = rows * lineH
        const plBlockTopY = plAreaTop + Math.max(0, (plAreaH - totalPlH) / 2)

        // Two-col horizontal offset
        const colOff = useTwoCol ? Math.min(cellW * 0.22, S * 0.044) : 0

        return (
          <g
            key={h}
            onClick={() => interactive && onHouseClick?.(h)}
            style={{ cursor: interactive ? 'pointer' : 'default' }}
          >
            {/* Cell fill */}
            <polygon
              points={pts.map(([x,y]) => `${x},${y}`).join(' ')}
              fill={
                lagna ? 'rgba(201,168,76,0.12)' :
                kite  ? 'rgba(90,80,150,0.08)'  :
                        'rgba(255,255,255,0.02)'
              }
              stroke={lagna ? 'rgba(201,168,76,0.50)' : 'rgba(201,168,76,0.25)'}
              strokeWidth={lagna ? 1.0 : 0.6}
              strokeLinejoin="miter"
            />

            {/* ── Rashi NUMBER ── */}
            <text
              x={gcx}
              y={rashiY}
              fontSize={rashiFont}
              fontFamily="Cormorant Garamond, serif"
              fontWeight={lagna ? '600' : '400'}
              fill={lagna ? 'rgba(230,195,90,1.0)' : 'rgba(210,175,80,0.65)'}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {sign}
            </text>

            {/* ── Planets ── */}
            {planets.map((g, gi) => {
              const col   = useTwoCol ? gi % 2 : 0
              const row   = useTwoCol ? Math.floor(gi / 2) : gi
              const px    = gcx + (useTwoCol ? (col === 0 ? -colOff : colOff) : 0)
              const py    = plBlockTopY + row * lineH + plFont * 0.55

              const fillCol = dignityColor(g.dignity, g.isRetro)
              const ret   = g.isRetro ? 'ᴿ' : ''
              const deg   = showDegrees
                ? `${Math.floor(g.degree)}°${String(Math.floor((g.degree%1)*60)).padStart(2,'0')}'`
                : ''
              const kar   = showKaraka && g.charaKaraka ? ` ${g.charaKaraka}` : ''

              return (
                <g key={g.id}>
                  <text
                    x={px} y={py}
                    fontSize={Math.round(plFont)}
                    fontFamily="Cormorant Garamond, serif"
                    fontWeight="500"
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
                      fill="rgba(180,170,210,0.55)"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {deg}
                    </text>
                  )}
                  {showNakshatra && (
                    <text
                      x={px}
                      y={py + plFont * 0.72 + degFont * (showDegrees ? 1.65 : 0.5)}
                      fontSize={Math.round(degFont * 0.85)}
                      fontFamily="Cormorant Garamond, serif"
                      fontStyle="italic"
                      fill="rgba(180,170,210,0.40)"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {g.nakshatraName.slice(0,3)} {g.pada}
                    </text>
                  )}
                </g>
              )
            })}

            {/* ── Āruḍha labels ── */}
            {(arudhaByHouse[h] ?? []).map((key, ai) => {
              // Stack below all planets
              const aFont = Math.round(Math.min(plFont * 0.82, S * 0.028))
              const totalPlanetsH = rows * lineH
              const aStartY = plBlockTopY + totalPlanetsH + aFont * 0.6 + ai * aFont * 1.4
              return (
                <text
                  key={key}
                  x={gcx}
                  y={aStartY}
                  fontSize={aFont}
                  fontFamily="Cormorant Garamond, serif"
                  fontStyle="italic"
                  fill="rgba(240,180,60,0.75)"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {ARUDHA_LABEL[key] ?? key}
                </text>
              )
            })}
          </g>
        )
      })}

      <rect x=".5" y=".5" width={S-1} height={S-1}
        fill="none" stroke="rgba(201,168,76,0.22)" strokeWidth="1" rx="8" />
    </svg>
  )
}