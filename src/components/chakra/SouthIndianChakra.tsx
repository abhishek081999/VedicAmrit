// ─────────────────────────────────────────────────────────────
//  src/components/chakra/SouthIndianChakra.tsx
//  South Indian chart — 4×4 fixed sign grid (12 border cells)
//  Signs are FIXED; Lagna cell is highlighted by ascRashi
//
//  Pi  Ar  Ta  Ge
//  Aq   ·   ·  Cn
//  Cp   ·   ·  Le
//  Sg  Sc  Li  Vi
// ─────────────────────────────────────────────────────────────
'use client'

import type { GrahaData, Rashi, ArudhaData } from '@/types/astrology'

// ── Fixed sign → [row, col] in 4×4 grid ──────────────────────

const SIGN_CELLS: Record<number, [number, number]> = {
  12: [0, 0], 1: [0, 1], 2: [0, 2],  3: [0, 3],
  11: [1, 0],                          4: [1, 3],
  10: [2, 0],                          5: [2, 3],
   9: [3, 0], 8: [3, 1], 7: [3, 2],  6: [3, 3],
}

const SIGN_ABBR: Record<number, string> = {
  1:'Ar', 2:'Ta', 3:'Ge', 4:'Cn', 5:'Le', 6:'Vi',
  7:'Li', 8:'Sc', 9:'Sg', 10:'Cp', 11:'Aq', 12:'Pi',
}

const ARUDHA_KEYS = [
  'AL','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12',
] as const

function dignityColor(dignity: string, isRetro: boolean): string {
  if (isRetro) return '#d4788a'
  switch (dignity) {
    case 'exalted':      return '#4ecdc4'
    case 'moolatrikona': return '#c9a84c'
    case 'own':          return '#e2c97e'
    case 'debilitated':  return '#e07070'
    default:             return '#c8c0e0'
  }
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

interface SouthIndianProps {
  ascRashi:       Rashi
  grahas:         GrahaData[]
  size?:          number
  showDegrees?:   boolean
  showNakshatra?: boolean
  showKaraka?:    boolean
  showArudha?:    boolean
  arudhas?:       ArudhaData
  interactive?:   boolean
  onCellClick?:   (rashi: Rashi) => void
  highlightRashi?:Rashi | null
}

// ── Component ─────────────────────────────────────────────────

export function SouthIndianChakra({
  ascRashi,
  grahas,
  size          = 480,
  showDegrees   = true,
  showNakshatra = false,
  showKaraka    = false,
  showArudha    = false,
  arudhas,
  interactive   = false,
  onCellClick,
  highlightRashi = null,
}: SouthIndianProps) {
  const cell = size / 4

  // Planets grouped by rashi (signs are fixed in South Indian)
  const byRashi: Record<number, GrahaData[]> = {}
  for (const g of grahas) {
    if (!byRashi[g.rashi]) byRashi[g.rashi] = []
    byRashi[g.rashi].push(g)
  }

  // Arudhas grouped by rashi
  const arudhaByRashi: Record<number, string[]> = {}
  if (showArudha && arudhas) {
    for (const key of ARUDHA_KEYS) {
      const rashi = arudhas[key] as Rashi | undefined
      if (!rashi) continue
      if (!arudhaByRashi[rashi]) arudhaByRashi[rashi] = []
      arudhaByRashi[rashi].push(key)
    }
  }

  const fs = {
    sign:   Math.round(cell * 0.09),
    graha:  Math.round(cell * 0.115),
    degree: Math.round(cell * 0.082),
    arudha: Math.round(cell * 0.080),
    lagna:  Math.round(cell * 0.085),
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
      aria-label="South Indian birth chart"
    >
      {/* Background */}
      <rect width={size} height={size} fill="var(--surface-1, #1a1a2e)" rx="8" />

      {/* Grid cells */}
      {Object.entries(SIGN_CELLS).map(([signStr, [row, col]]) => {
        const sign       = Number(signStr) as Rashi
        const isAsc      = sign === ascRashi
        const isHi       = sign === highlightRashi
        const x          = col * cell
        const y          = row * cell
        const cellGrahas = byRashi[sign] ?? []
        const cellArudhas = arudhaByRashi[sign] ?? []

        // Dynamic line height — fit planets + arudhas in cell
        const totalItems = cellGrahas.length
          + (showDegrees || showKaraka ? cellGrahas.length : 0)
          + (showNakshatra ? cellGrahas.length : 0)
        const linesPerGraha = 1
          + (showDegrees || showKaraka ? 1 : 0)
          + (showNakshatra ? 1 : 0)
        const lineH = cellGrahas.length
          ? Math.min(
              cell * 0.16,
              (cell * 0.65) / Math.max(cellGrahas.length * linesPerGraha + cellArudhas.length * 0.8, 1)
            )
          : cell * 0.16

        return (
          <g
            key={sign}
            onClick={() => interactive && onCellClick?.(sign)}
            style={{ cursor: interactive ? 'pointer' : 'default' }}
          >
            {/* Cell background */}
            <rect
              x={x + 0.5} y={y + 0.5}
              width={cell - 1} height={cell - 1}
              fill={
                isHi  ? 'rgba(123,104,238,0.15)' :
                isAsc ? 'rgba(201,168,76,0.08)'  :
                        'rgba(255,255,255,0.015)'
              }
              stroke={isAsc ? 'rgba(201,168,76,0.5)' : 'rgba(201,168,76,0.12)'}
              strokeWidth={isAsc ? 1.5 : 0.75}
            />

            {/* Sign number — top-left */}
            <text
              x={x + cell * 0.07}
              y={y + cell * 0.18}
              fontSize={fs.sign}
              fill="rgba(201,168,76,0.35)"
              fontFamily="Cormorant Garamond, serif"
            >
              {sign}
            </text>

            {/* Sign abbreviation — top-right */}
            <text
              x={x + cell * 0.93}
              y={y + cell * 0.18}
              fontSize={fs.sign}
              fill="rgba(201,168,76,0.25)"
              fontFamily="Cormorant Garamond, serif"
              textAnchor="end"
            >
              {SIGN_ABBR[sign]}
            </text>

            {/* Lagna marker */}
            {isAsc && (
              <g stroke="rgba(201,168,76,0.7)" strokeWidth="1" strokeLinecap="round">
                <line x1={x + 4} y1={y + 4} x2={x + cell * 0.22} y2={y + 4} />
                <line x1={x + 4} y1={y + 4} x2={x + 4} y2={y + cell * 0.22} />
                <text
                  x={x + cell * 0.5}
                  y={y + cell * 0.96}
                  fontSize={fs.lagna}
                  fill="rgba(201,168,76,0.55)"
                  fontFamily="Cormorant Garamond, serif"
                  textAnchor="middle"
                  fontStyle="italic"
                >
                  Asc
                </text>
              </g>
            )}

            {/* ── Planets ── */}
            {cellGrahas.map((g, i) => {
              const yPos  = y + cell * 0.28 + i * lineH * linesPerGraha
              const color = dignityColor(g.dignity, g.isRetro)
              const ret   = g.isRetro ? 'ᴿ' : ''
              const deg   = showDegrees
                ? ` ${Math.floor(g.degree)}°${String(Math.floor((g.degree % 1) * 60)).padStart(2,'0')}'`
                : ''
              const kar   = showKaraka && g.charaKaraka ? ` [${g.charaKaraka}]` : ''

              return (
                <g key={g.id}>
                  <text
                    x={x + cell * 0.12}
                    y={yPos}
                    fontSize={fs.graha}
                    fill={color}
                    fontFamily="Cormorant Garamond, serif"
                    fontWeight="500"
                  >
                    {g.id}{ret}
                  </text>
                  {(showDegrees || showKaraka) && (
                    <text
                      x={x + cell * 0.12}
                      y={yPos + lineH * 0.9}
                      fontSize={fs.degree}
                      fill="rgba(184,176,212,0.65)"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {deg}{kar}
                    </text>
                  )}
                  {showNakshatra && (
                    <text
                      x={x + cell * 0.12}
                      y={yPos + lineH * (showDegrees || showKaraka ? 1.8 : 0.9)}
                      fontSize={fs.degree * 0.88}
                      fill="rgba(184,176,212,0.45)"
                      fontFamily="Cormorant Garamond, serif"
                      fontStyle="italic"
                    >
                      {g.nakshatraName.slice(0, 3)}{g.pada}
                    </text>
                  )}
                </g>
              )
            })}

            {/* ── Āruḍhas — italic amber, below planets ── */}
            {cellArudhas.map((key, ai) => {
              const planetBlockH = cellGrahas.length * lineH * linesPerGraha
              const yPos = y + cell * 0.28 + planetBlockH + ai * fs.arudha * 1.35
              return (
                <text
                  key={key}
                  x={x + cell * 0.12}
                  y={yPos}
                  fontSize={fs.arudha}
                  fill="rgba(240,180,60,0.75)"
                  fontFamily="Cormorant Garamond, serif"
                  fontStyle="italic"
                >
                  {ARUDHA_LABEL[key] ?? key}
                </text>
              )
            })}
          </g>
        )
      })}

      {/* Centre decorative lines */}
      <g opacity="0.25">
        <line x1={cell} y1={cell} x2={cell*3} y2={cell}   stroke="rgba(201,168,76,0.4)" strokeWidth="0.5" />
        <line x1={cell} y1={cell*3} x2={cell*3} y2={cell*3} stroke="rgba(201,168,76,0.4)" strokeWidth="0.5" />
        <line x1={cell} y1={cell} x2={cell} y2={cell*3}   stroke="rgba(201,168,76,0.4)" strokeWidth="0.5" />
        <line x1={cell*3} y1={cell} x2={cell*3} y2={cell*3} stroke="rgba(201,168,76,0.4)" strokeWidth="0.5" />
        <line x1={cell} y1={cell} x2={cell*3} y2={cell*3} stroke="rgba(201,168,76,0.15)" strokeWidth="0.5" />
        <line x1={cell*3} y1={cell} x2={cell} y2={cell*3} stroke="rgba(201,168,76,0.15)" strokeWidth="0.5" />
      </g>
    </svg>
  )
}