// ─────────────────────────────────────────────────────────────
//  src/components/chakra/EastIndianChakra.tsx
//  East Indian (Bengali / Odisha) chart
//
//  Layout: 4×4 grid, 12 border cells, 4 inner cells empty
//  Aries (1) always in top-left corner, signs go clockwise:
//
//   Ar  Ta  Ge  Cn
//   Pi   ·   ·  Le
//   Aq   ·   ·  Vi
//   Cp  Sg  Sc  Li
//
//  Key difference from South Indian:
//   - Signs rotate so that Aries is ALWAYS top-left
//   - Lagna cell is highlighted, but signs are fixed like South Indian
//   - Traditional to show sign number inside each cell prominently
// ─────────────────────────────────────────────────────────────
'use client'

import type { GrahaData, Rashi } from '@/types/astrology'

// ── Layout ────────────────────────────────────────────────────
// [row, col] for each sign 1–12
// Aries=1 at top-left, clockwise around the border
const SIGN_CELLS: Record<number, [number, number]> = {
  1:  [0, 0], 2:  [0, 1], 3:  [0, 2],  4: [0, 3],
  12: [1, 0],                            5: [1, 3],
  11: [2, 0],                            6: [2, 3],
  10: [3, 0], 9:  [3, 1], 8:  [3, 2],  7: [3, 3],
}

const SIGN_ABBR: Record<number, string> = {
  1:'Ar', 2:'Ta', 3:'Ge', 4:'Cn', 5:'Le', 6:'Vi',
  7:'Li', 8:'Sc', 9:'Sg', 10:'Cp', 11:'Aq', 12:'Pi',
}

// Sanskrit sign abbreviations (traditional East Indian preference)
const SIGN_SANSKRIT: Record<number, string> = {
  1:'Meṣ', 2:'Vṛṣ', 3:'Mith', 4:'Kark',
  5:'Siṃ', 6:'Kany', 7:'Tul', 8:'Vṛśc',
  9:'Dhan', 10:'Mak', 11:'Kum', 12:'Mīn',
}

function dignityColor(dignity: string, isRetro: boolean): string {
  if (isRetro) return 'var(--dig-retro)'
  switch (dignity) {
    case 'exalted':      return 'var(--dig-exalted)'
    case 'moolatrikona': return 'var(--dig-moola)'
    case 'own':          return 'var(--dig-own)'
    case 'debilitated':  return 'var(--dig-debilitate)'
    default:             return 'var(--dig-neutral)'
  }
}

// ── Props ─────────────────────────────────────────────────────

interface EastIndianProps {
  ascRashi:      Rashi
  grahas:        GrahaData[]
  size?:         number
  showDegrees?:  boolean
  showNakshatra?:boolean
  showKaraka?:   boolean
  useSanskrit?:  boolean   // show Sanskrit sign names instead of English abbr
  interactive?:  boolean
  onCellClick?:  (rashi: Rashi) => void
  highlightRashi?: Rashi | null
}

// ── Component ─────────────────────────────────────────────────

export function EastIndianChakra({
  ascRashi,
  grahas,
  size = 480,
  showDegrees   = true,
  showNakshatra = false,
  showKaraka    = false,
  useSanskrit   = false,
  interactive   = false,
  onCellClick,
  highlightRashi = null,
}: EastIndianProps) {
  const cell = size / 4

  // Group grahas by rashi
  const byRashi: Record<number, GrahaData[]> = {}
  for (const g of grahas) {
    if (!byRashi[g.rashi]) byRashi[g.rashi] = []
    byRashi[g.rashi].push(g)
  }

  const fs = {
    sign:   Math.round(cell * 0.09),
    graha:  Math.round(cell * 0.115),
    degree: Math.round(cell * 0.082),
    lagna:  Math.round(cell * 0.085),
  }

  const signLabel = (s: number) =>
    useSanskrit ? SIGN_SANSKRIT[s] : SIGN_ABBR[s]

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      style={{ display: 'block', maxWidth: '100%', height: 'auto', overflow: 'visible' }}
      aria-label="East Indian birth chart"
    >
      {/* Background — transparent for parchment theme */}
      <rect width={size} height={size} fill="transparent" />

      {/* Border cells */}
      {Object.entries(SIGN_CELLS).map(([signStr, [row, col]]) => {
        const sign       = Number(signStr) as Rashi
        const isAsc      = sign === ascRashi
        const isHi       = sign === highlightRashi
        const x          = col * cell
        const y          = row * cell
        const cellGrahas = byRashi[sign] ?? []

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
                isHi  ? 'var(--accent-glow)' :
                isAsc ? 'var(--gold-faint)' :
                        'transparent'
              }
              stroke={
                isAsc ? 'var(--gold)' :
                        'var(--border-bright)'
              }
              strokeWidth={isAsc ? 2.5 : 1.25}
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
              {signLabel(sign)}
            </text>

            {/* Lagna marker */}
            {isAsc && (
              <g stroke="rgba(201,168,76,0.7)" strokeWidth="1" strokeLinecap="round">
                {/* Corner bracket top-left */}
                <line x1={x + 4} y1={y + 4} x2={x + cell * 0.22} y2={y + 4} />
                <line x1={x + 4} y1={y + 4} x2={x + 4} y2={y + cell * 0.22} />
                {/* Corner bracket top-right */}
                <line x1={x + cell - 4} y1={y + 4} x2={x + cell - cell * 0.22} y2={y + 4} />
                <line x1={x + cell - 4} y1={y + 4} x2={x + cell - 4} y2={y + cell * 0.22} />
                {/* "Asc" label at bottom of cell */}
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

            {/* Grahas stacked vertically */}
            {cellGrahas.map((g, i) => {
              const lineH  = cell / (Math.max(cellGrahas.length, 1) + 1.2)
              const yPos   = y + cell * 0.32 + i * lineH * 1.1
              const color  = dignityColor(g.dignity, g.isRetro)
              const retMark = g.isRetro ? 'ᴿ' : ''
              const degStr  = showDegrees
                ? ` ${Math.floor(g.degree)}°${String(Math.floor((g.degree % 1) * 60)).padStart(2, '0')}'`
                : ''
              const karakaStr = showKaraka && g.charaKaraka
                ? ` [${g.charaKaraka}]`
                : ''

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
                    {g.id}{retMark}
                  </text>
                  {(showDegrees || showKaraka) && (
                    <text
                      x={x + cell * 0.12}
                      y={yPos + fs.degree + 1}
                      fontSize={fs.degree}
                      fill="rgba(184,176,212,0.65)"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {degStr}{karakaStr}
                    </text>
                  )}
                  {showNakshatra && (
                    <text
                      x={x + cell * 0.12}
                      y={yPos + fs.degree * 2 + 2}
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
          </g>
        )
      })}

      {/* Inner square border (the empty 2×2 centre) */}
      <rect
        x={cell + 0.5} y={cell + 0.5}
        width={cell * 2 - 1} height={cell * 2 - 1}
        fill="rgba(201,168,76,0.02)"
        stroke="rgba(201,168,76,0.12)"
        strokeWidth="0.5"
      />

      {/* Centre decorative — Om symbol placeholder (diagonal lines) */}
      <g opacity="0.18">
        <line
          x1={cell} y1={cell} x2={cell * 3} y2={cell * 3}
          stroke="rgba(201,168,76,0.4)" strokeWidth="0.5"
        />
        <line
          x1={cell * 3} y1={cell} x2={cell} y2={cell * 3}
          stroke="rgba(201,168,76,0.4)" strokeWidth="0.5"
        />
        {/* Inner diamond */}
        <polygon
          points={`${size / 2},${cell + 8} ${cell * 3 - 8},${size / 2} ${size / 2},${cell * 3 - 8} ${cell + 8},${size / 2}`}
          fill="none"
          stroke="rgba(201,168,76,0.3)"
          strokeWidth="0.5"
        />
      </g>
    </svg>
  )
}
