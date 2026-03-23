'use client'
// src/components/chakra/BhavaChakra.tsx
// Bhava / Bhava-Chalita wheel — unequal houses from actual sidereal cusps
// Ascendant always at 9 o'clock (180°). Cusps go anti-clockwise.

import React from 'react'
import type { GrahaData, Rashi, ArudhaData } from '@/types/astrology'
import { RASHI_SHORT } from '@/types/astrology'

const DIGNITY_COLORS: Record<string,string> = {
  exalted:      'var(--dig-exalted,  #4ecdc4)',
  moolatrikona: 'var(--dig-moola,    #f7dc6f)',
  own:          'var(--dig-own,      #82e0aa)',
  great_friend: '#abebc6',
  friend:       '#a9cce3',
  neutral:      'var(--dig-neutral,  #aaaaaa)',
  enemy:        '#f0b27a',
  great_enemy:  '#ec7063',
  debilitated:  'var(--dig-debilitate, #e74c3c)',
}
const GRAHA_SHORT: Record<string,string> = {
  Su:'Su', Mo:'Mo', Ma:'Ma', Me:'Me', Ju:'Ju',
  Ve:'Ve', Sa:'Sa', Ra:'Ra', Ke:'Ke',
}

/** Standard math polar: 0°=right, CCW positive. SVG flips Y, so we negate Y. */
function polar(cx:number, cy:number, r:number, deg:number): [number,number] {
  const rad = deg * Math.PI / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

/**
 * Convert a sidereal longitude to a canvas angle.
 * Ascendant longitude → 180° (9 o'clock).
 * Planets eastward of Asc appear CCW (decreasing angle on canvas).
 */
function lonToCanvasAngle(lon: number, ascLon: number): number {
  let d = lon - ascLon
  while (d < 0)   d += 360
  while (d >= 360) d -= 360
  // d=0 → asc at 180, d=90 → 90° (noon), going CCW means subtracting
  return (180 - d + 360) % 360
}

/**
 * Arc slice going from startAngle → endAngle CCW (endAngle < startAngle in SVG coords).
 * sweep-flag = 0 for CCW arcs.
 * large-arc = 1 only if the CCW span > 180°.
 */
function slicePath(cx:number, cy:number, r:number, startAngle:number, endAngle:number): string {
  const [x1, y1] = polar(cx, cy, r, startAngle)
  const [x2, y2] = polar(cx, cy, r, endAngle)
  // CCW span: how far we go from start → end going CCW (decreasing angle)
  let span = startAngle - endAngle
  while (span <= 0)  span += 360
  while (span > 360) span -= 360
  const large = span > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 0 ${x2} ${y2} Z`
}

interface Props {
  ascRashi:     Rashi
  ascDegree:    number    // sidereal longitude 0–360
  cusps:        number[]  // 12 sidereal cusp longitudes
  grahas:       GrahaData[]
  size?:        number
  showDegrees?:    boolean
  showNakshatra?:  boolean
  showKaraka?:     boolean
  showArudha?:     boolean
  arudhas?:     ArudhaData
  transitGrahas?: GrahaData[]
  fontScale?:   number
  planetScale?: number
  showCuspDegrees?: boolean
  label?:       string
}

export function BhavaChakra({
  ascRashi, ascDegree, cusps, grahas, size = 480,
  showDegrees = true, showNakshatra = false,
  showKaraka = false, showArudha = false,
  arudhas, transitGrahas = [],
  fontScale = 1.0, planetScale = 1.0,
  showCuspDegrees = false, label = 'Bhava',
}: Props) {
  const cx = size / 2, cy = size / 2
  const outerR  = size / 2 - 6
  const labelR  = outerR - 20    // sign label ring
  const planetR = labelR - 20    // planet zone outer
  const innerR  = planetR - 52   // inner circle
  const bf = 10 * fontScale
  const pf = 11 * planetScale

  // Fallback: if cusps missing, use whole-sign 30° each
  const safe: number[] = cusps.length === 12
    ? cusps
    : Array.from({ length: 12 }, (_, i) => ((ascDegree + i * 30) % 360))

  // Convert cusp longitudes → canvas angles
  const cuspAngles = safe.map(c => lonToCanvasAngle(c, ascDegree))

  // Canvas angle of a given sidereal longitude
  function lonAngle(lon: number): number {
    return lonToCanvasAngle(lon, ascDegree)
  }

  // Mid-canvas-angle of house h (between cusp h and cusp h+1, going CCW)
  function houseMidAngle(h: number): number {
    const s = cuspAngles[h - 1]
    const e = cuspAngles[h % 12]
    // CCW span from s to e
    let span = s - e
    while (span <= 0)  span += 360
    while (span > 360) span -= 360
    return (s - span / 2 + 360) % 360
  }

  // Sign at mid-point of house h
  function houseMidSign(h: number): Rashi {
    const midAngle = houseMidAngle(h)
    // Convert canvas angle back to sidereal longitude
    let midLon = ascDegree + (180 - midAngle)
    while (midLon < 0)   midLon += 360
    while (midLon >= 360) midLon -= 360
    return ((Math.floor(midLon / 30) % 12) + 1) as Rashi
  }

  // Which house does a planet's sidereal longitude fall in?
  function grahaHouseByLon(lon: number): number {
    let rel = lon - ascDegree
    while (rel < 0)   rel += 360
    while (rel >= 360) rel -= 360
    // Houses go CCW from ascDegree; house h starts at safe[h-1] - ascDegree
    for (let h = 12; h >= 1; h--) {
      let c = safe[h - 1] - ascDegree
      while (c < 0)   c += 360
      while (c >= 360) c -= 360
      if (rel >= c) return h
    }
    return 1
  }

  const byHouse:  Record<number, GrahaData[]> = {}
  const tByHouse: Record<number, GrahaData[]> = {}
  for (let h = 1; h <= 12; h++) { byHouse[h] = []; tByHouse[h] = [] }
  grahas.forEach(g        => byHouse[grahaHouseByLon(g.lonSidereal)].push(g))
  transitGrahas.forEach(g => tByHouse[grahaHouseByLon(g.lonSidereal)].push(g))

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', maxWidth: '100%', height: 'auto', fontFamily: 'inherit' }}
    >
      {/* Chart label */}
      <text x={cx} y={12} textAnchor="middle"
        fontSize={9} fill="var(--text-muted, #888)" fontStyle="italic"
      >{label}</text>

      {/* ── House slices ───────────────────────────────────── */}
      {Array.from({ length: 12 }, (_, i) => {
        const h   = i + 1
        const s   = cuspAngles[i]
        const e   = cuspAngles[(i + 1) % 12]
        const mid = houseMidAngle(h)
        const sign = houseMidSign(h)
        const [sx, sy] = polar(cx, cy, (labelR + outerR) / 2, mid)
        const [nx, ny] = polar(cx, cy, innerR + 22, mid)
        return (
          <g key={h}>
            <path
              d={slicePath(cx, cy, outerR, s, e)}
              fill={h === 1
                ? 'rgba(46,109,164,0.18)'
                : 'var(--surface-2, rgba(255,255,255,0.03))'}
              stroke="var(--border, #555)"
              strokeWidth={h === 1 ? 1.5 : 0.6}
            />
            <text x={sx} y={sy}
              textAnchor="middle" dominantBaseline="central"
              fontSize={bf} fill="var(--text-muted, #777)"
            >{RASHI_SHORT[sign]}</text>
            <text x={nx} y={ny}
              textAnchor="middle" dominantBaseline="central"
              fontSize={bf - 1}
              fill={h === 1 ? '#5b9bd5' : 'var(--text-muted, #666)'}
              fontWeight={h === 1 ? 700 : 400}
            >{h}</text>
          </g>
        )
      })}

      {/* ── Cusp spokes ────────────────────────────────────── */}
      {cuspAngles.map((angle, i) => {
        const [x1, y1] = polar(cx, cy, innerR, angle)
        const [x2, y2] = polar(cx, cy, outerR, angle)
        const [lx, ly] = polar(cx, cy, labelR,  angle)
        const degInSign  = safe[i] % 30
        const deg = Math.floor(degInSign)
        const mn  = Math.floor((degInSign - deg) * 60)
        return (
          <g key={i}>
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={i === 0 ? 'rgba(91,155,213,0.9)' : 'var(--border, #555)'}
              strokeWidth={i === 0 ? 1.5 : 0.5}
              strokeDasharray={i === 0 ? undefined : '4,3'}
            />
            {showCuspDegrees && (
              <text x={lx} y={ly}
                textAnchor="middle" dominantBaseline="central"
                fontSize={bf - 2}
                fill="var(--text-muted, #777)" opacity={0.65}
              >{deg}°{String(mn).padStart(2, '0')}'</text>
            )}
          </g>
        )
      })}

      {/* ── Inner circle ───────────────────────────────────── */}
      <circle cx={cx} cy={cy} r={innerR}
        fill="var(--surface-1, #1a1a2a)"
        stroke="var(--border, #555)" strokeWidth={0.8}
      />
      <text x={cx} y={cy - innerR + 18}
        textAnchor="middle" dominantBaseline="central"
        fontSize={bf} fill="#5b9bd5" fontWeight={700}
      >As {Math.floor(ascDegree % 30)}°</text>

      {/* ── Planets ────────────────────────────────────────── */}
      {Array.from({ length: 12 }, (_, i) => {
        const h = i + 1
        const planets  = byHouse[h]
        const transits = tByHouse[h]
        if (!planets.length && !transits.length) return null
        const mid  = houseMidAngle(h)
        const pZone = (innerR + planetR) / 2 + 4

        return (
          <g key={h}>
            {planets.map((g, pi) => {
              const n = planets.length
              // Place each planet at its actual longitude angle, spread radially
              const actualAngle = lonAngle(g.lonSidereal)
              // Clamp within house slice if many planets stack
              const radSpread = Math.min(20, 40 / Math.max(n, 1))
              const rOff = (pi - (n - 1) / 2) * radSpread
              // Use actual angle for single planets, mid+offset for multiples
              const useAngle = n === 1 ? actualAngle : mid
              const [px, py] = polar(cx, cy, pZone + rOff, useAngle)
              const col   = DIGNITY_COLORS[g.dignity] ?? '#aaa'
              const lbl   = (GRAHA_SHORT[g.id] ?? g.id) + (g.isRetro ? '\u1D3F' : '')
              return (
                <g key={g.id}>
                  <text x={px} y={py}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={pf} fontWeight={600} fill={col}
                  >{lbl}{showDegrees ? ` ${Math.floor(g.degree)}°` : ''}</text>
                  {showNakshatra && (
                    <text x={px} y={py + pf + 1}
                      textAnchor="middle" dominantBaseline="central"
                      fontSize={pf - 2} fill="var(--text-muted, #888)"
                    >{g.nakshatraName?.slice(0, 3)}</text>
                  )}
                  {showKaraka && g.charaKaraka && (
                    <text x={px} y={py - pf}
                      textAnchor="middle" dominantBaseline="central"
                      fontSize={pf - 2} fill="#8b5cf6"
                    >{g.charaKaraka}</text>
                  )}
                </g>
              )
            })}

            {transits.map((g, pi) => {
              const n = transits.length
              const radSpread = Math.min(18, 36 / Math.max(n, 1))
              const rOff = (pi - (n - 1) / 2) * radSpread
              const [px, py] = polar(cx, cy, planetR + 6 + rOff, mid)
              return (
                <text key={`t-${g.id}`} x={px} y={py}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={pf - 1} fontWeight={600}
                  fill="rgba(139,124,246,0.9)"
                >{GRAHA_SHORT[g.id] ?? g.id}</text>
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}
