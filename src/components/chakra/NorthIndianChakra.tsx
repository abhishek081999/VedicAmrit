// ─────────────────────────────────────────────────────────────
//  src/components/chakra/NorthIndianChakra.tsx
//  North Indian (Parashari) Kundali — houses fixed, signs rotate
//
//  GEOMETRY — verified directly from Python/SVG reference implementation
//  (see Creating North Indian Style Vedic Astrology Charts with Python and SVGWRITE)
//
//  S×S square.  Q = S/4  (quarter).  M = S/2  (half = centre axis).
//
//  9 outer key points:
//    TL(0,0)     T(M,0)    TR(S,0)
//    L(0,M)      C(M,M)    R(S,M)
//    BL(0,S)     B(M,S)    BR(S,S)
//
//  4 inner diamond vertices (quarter-points of the square):
//    TM2 = (Q,   Q)        top-left  inner
//    TR2 = (3Q,  Q)        top-right inner
//    BR2 = (3Q,  3Q)       bottom-right inner
//    BL2 = (Q,   3Q)       bottom-left  inner
//
//  12 house polygons (from Python reference, counter-clockwise):
//    H1  = TM2, C,   TR2, T       kite at top      ← LAGNA
//    H2  = T,   TR2, TR           triangle top-right corner
//    H3  = TR2, R,   TR           triangle right-upper corner
//    H4  = TR2, C,   BR2, R       kite at right
//    H5  = BR2, BR,  R            triangle bottom-right corner
//    H6  = BR2, B,   BR           triangle bottom-right
//    H7  = BL2, B,   BR2, C       kite at bottom
//    H8  = BL2, BL,  B            triangle bottom-left corner
//    H9  = L,   BL,  BL2          triangle left-lower corner
//   H10  = L,   BL2, C,   TM2     kite at left
//   H11  = TL,  L,   TM2          triangle left-upper corner
//   H12  = TL,  TM2, T            triangle top-left corner
// ─────────────────────────────────────────────────────────────
'use client'

import type { GrahaData, Rashi } from '@/types/astrology'

// ── Sign labels ───────────────────────────────────────────────

const SIGN_ABBR: Record<number, string> = {
  1:'Ar', 2:'Ta', 3:'Ge', 4:'Cn',  5:'Le', 6:'Vi',
  7:'Li', 8:'Sc', 9:'Sg', 10:'Cp', 11:'Aq', 12:'Pi',
}

// ── Dignity colour ────────────────────────────────────────────

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

// ── Polygon definitions ───────────────────────────────────────
// Returns SVG polygon points string for house 1-12.
// All points verified against the Python/SVG reference.

function housePolygon(house: number, S: number): string {
  const Q  = S / 4   // quarter
  const M  = S / 2   // half / midpoint

  // 9 outer points
  const TL = `0,0`
  const T  = `${M},0`
  const TR = `${S},0`
  const L  = `0,${M}`
  const R  = `${S},${M}`
  const BL = `0,${S}`
  const B  = `${M},${S}`
  const BR = `${S},${S}`

  // 4 inner diamond vertices (quarter-points of the square)
  const TM2 = `${Q},${Q}`
  const TR2 = `${3*Q},${Q}`
  const BR2 = `${3*Q},${3*Q}`
  const BL2 = `${Q},${3*Q}`
  // Centre
  const C   = `${M},${M}`

  switch (house) {
    // Anti-clockwise: H1(top) → H2(top-left) → H3(left-upper) → H4(left) → ...
    case 1:  return `${TM2} ${C}   ${TR2} ${T}`    // top kite        — LAGNA
    case 2:  return `${TL}  ${TM2} ${T}`            // top-LEFT corner
    case 3:  return `${TL}  ${L}   ${TM2}`          // left-upper corner
    case 4:  return `${L}   ${BL2} ${C}   ${TM2}`  // left kite
    case 5:  return `${L}   ${BL}  ${BL2}`          // lower-left corner
    case 6:  return `${BL2} ${BL}  ${B}`            // bottom-left corner
    case 7:  return `${BL2} ${B}   ${BR2} ${C}`    // bottom kite
    case 8:  return `${BR2} ${B}   ${BR}`           // bottom-right corner
    case 9:  return `${BR2} ${BR}  ${R}`            // right-lower corner
    case 10: return `${TR2} ${C}   ${BR2} ${R}`    // right kite
    case 11: return `${TR2} ${R}   ${TR}`           // right-upper corner
    case 12: return `${T}   ${TR2} ${TR}`           // top-RIGHT corner
    default: return ''
  }
}

// ── Centroid ──────────────────────────────────────────────────

function centroid(polyStr: string): [number, number] {
  const pts = polyStr.trim().split(/\s+/).map((p) => {
    const [x, y] = p.trim().split(',').map(Number)
    return [x, y] as [number, number]
  })
  return [
    pts.reduce((s, p) => s + p[0], 0) / pts.length,
    pts.reduce((s, p) => s + p[1], 0) / pts.length,
  ]
}

// ── Label nudge — shift from geometric centroid to visual centre ──

function labelNudge(house: number, Q: number): [number, number] {
  const u = Q * 0.08
  switch (house) {
    // Kite houses — nudge toward their geometric centre
    case 1:  return [ 0,       -u * 0.5]   // top kite:    nudge up
    case 4:  return [-u * 0.5,  0      ]   // left kite:   nudge left
    case 7:  return [ 0,        u * 0.5]   // bottom kite: nudge down
    case 10: return [ u * 0.5,  0      ]   // right kite:  nudge right
    // Corner triangles — nudge toward outer corner
    case 2:  return [-u * 0.5, -u]         // top-left
    case 3:  return [-u,        u * 0.3]   // left-upper
    case 5:  return [-u,        u]         // lower-left
    case 6:  return [-u * 0.3,  u]         // bottom-left
    case 8:  return [ u * 0.3,  u]         // bottom-right
    case 9:  return [ u,        u]         // right-lower
    case 11: return [ u,        u * 0.3]   // right-upper
    case 12: return [ u * 0.5, -u]         // top-right
    default: return [0, 0]
  }
}

// ── Props ─────────────────────────────────────────────────────

interface NorthIndianProps {
  ascRashi:      Rashi
  grahas:        GrahaData[]
  size?:         number
  showDegrees?:  boolean
  showNakshatra?:boolean
  showKaraka?:   boolean
  interactive?:  boolean
  onHouseClick?: (house: number) => void
}

// ── Component ─────────────────────────────────────────────────

export function NorthIndianChakra({
  ascRashi,
  grahas,
  size = 480,
  showDegrees   = true,
  showNakshatra = false,
  showKaraka    = false,
  interactive   = false,
  onHouseClick,
}: NorthIndianProps) {
  const Q = size / 4

  // Font sizes — scale with chart size
  const fs = {
    sign:   Math.round(size * 0.050),   // sign abbreviation
    graha:  Math.round(size * 0.037),   // planet label
    degree: Math.round(size * 0.026),   // degree string
    hnum:   Math.round(size * 0.021),   // house number (subtle)
  }

  // ── Sign in house h ──────────────────────────────────────
  // Houses go counter-clockwise; sign increments with house number.
  function houseSign(h: number): number {
    return ((ascRashi - 1 + h - 1) % 12) + 1
  }

  // ── Place planets in their house ─────────────────────────
  const byHouse: Record<number, GrahaData[]> = {}
  for (const g of grahas) {
    for (let h = 1; h <= 12; h++) {
      if (houseSign(h) === g.rashi) {
        if (!byHouse[h]) byHouse[h] = []
        byHouse[h].push(g)
        break
      }
    }
  }

  // Kite houses are larger — outer corners are smaller
  const isKite   = (h: number) => h === 1 || h === 4 || h === 7 || h === 10
  const isCorner = (h: number) => !isKite(h)

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
      aria-label="North Indian birth chart"
    >
      {/* Background */}
      <rect width={size} height={size} fill="var(--surface-1, #1a1a2e)" rx="8" />

      {/* ── 12 house polygons ──────────────────────────────── */}
      {Array.from({ length: 12 }, (_, i) => {
        const house   = i + 1
        const poly    = housePolygon(house, size)
        if (!poly) return null

        const [cx0, cy0] = centroid(poly)
        const [nx,  ny]  = labelNudge(house, Q)
        const cx = cx0 + nx
        const cy = cy0 + ny

        const sign    = houseSign(house)
        const hGrahas = byHouse[house] ?? []
        const isLagna = house === 1
        const corner  = isCorner(house)

        // Slightly smaller fonts for corner triangles
        const fSign  = corner ? Math.round(fs.sign  * 0.72) : fs.sign
        const fGraha = corner ? Math.round(fs.graha * 0.72) : fs.graha
        const fDeg   = corner ? Math.round(fs.degree * 0.72) : fs.degree

        return (
          <g
            key={house}
            onClick={() => interactive && onHouseClick?.(house)}
            style={{ cursor: interactive ? 'pointer' : 'default' }}
          >
            {/* Fill */}
            <polygon
              points={poly}
              fill={
                isLagna  ? 'rgba(201,168,76,0.10)' :
                isKite(house) ? 'rgba(100,90,160,0.07)' :
                                'rgba(255,255,255,0.018)'
              }
              stroke="rgba(201,168,76,0.30)"
              strokeWidth="0.75"
              strokeLinejoin="miter"
            />

            {/* House number — very faint */}
            <text
              x={cx}
              y={cy - fSign * 0.70}
              fontSize={fs.hnum}
              fill="rgba(201,168,76,0.22)"
              fontFamily="Cormorant Garamond, serif"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {house}
            </text>

            {/* Sign abbreviation */}
            <text
              x={cx}
              y={cy + (hGrahas.length > 0 ? -fSign * 0.18 : fSign * 0.12)}
              fontSize={fSign}
              fill={isLagna ? 'rgba(201,168,76,0.95)' : 'rgba(201,168,76,0.55)'}
              fontFamily="Cormorant Garamond, serif"
              fontStyle="italic"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {SIGN_ABBR[sign]}
            </text>

            {/* Planets */}
            {hGrahas.map((g, gi) => {
              const lineH = fGraha * 1.25
                + (showDegrees   ? fDeg * 1.1 : 0)
                + (showNakshatra ? fDeg * 0.9 : 0)
              const baseY = cy
                + fSign  * 0.55
                + fGraha * 0.55
                + gi * lineH

              const col = dignityColor(g.dignity, g.isRetro)
              const ret = g.isRetro ? 'ᴿ' : ''
              const deg = showDegrees
                ? `${Math.floor(g.degree)}°${String(Math.floor((g.degree % 1) * 60)).padStart(2, '0')}'`
                : ''
              const kar = showKaraka && g.charaKaraka ? ` [${g.charaKaraka}]` : ''

              return (
                <g key={g.id}>
                  <text
                    x={cx} y={baseY}
                    fontSize={fGraha}
                    fill={col}
                    fontFamily="Cormorant Garamond, serif"
                    fontWeight="500"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {g.id}{ret}{kar}
                  </text>
                  {showDegrees && (
                    <text
                      x={cx}
                      y={baseY + fGraha * 0.70 + fDeg * 0.55}
                      fontSize={fDeg}
                      fill="rgba(184,176,212,0.55)"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {deg}
                    </text>
                  )}
                  {showNakshatra && (
                    <text
                      x={cx}
                      y={baseY + fGraha * 0.70 + fDeg * (showDegrees ? 1.65 : 0.55)}
                      fontSize={Math.round(fDeg * 0.88)}
                      fill="rgba(184,176,212,0.42)"
                      fontFamily="Cormorant Garamond, serif"
                      fontStyle="italic"
                      textAnchor="middle"
                      dominantBaseline="middle"
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

      {/* Outer border */}
      <rect
        x="0.5" y="0.5"
        width={size - 1} height={size - 1}
        fill="none"
        stroke="rgba(201,168,76,0.22)"
        strokeWidth="1"
        rx="8"
      />
    </svg>
  )
}