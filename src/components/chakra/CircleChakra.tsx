'use client'
// src/components/chakra/CircleChakra.tsx
// Circle/Wheel chakra — 12 equal pie slices, ascendant at 9 o'clock (180°)
// Houses go ANTI-clockwise. H1 at left (9 o'clock), H2 above-left, etc.

import React from 'react'
import type { GrahaData, Rashi, ArudhaData } from '@/types/astrology'
import { RASHI_SHORT } from '@/types/astrology'

const SIGN_ELEMENT: Record<number, string> = {
  1:'fire',2:'earth',3:'air',4:'water',5:'fire',6:'earth',
  7:'air',8:'water',9:'fire',10:'earth',11:'air',12:'water',
}
const ELEM_FILL: Record<string,string> = {
  fire:  'rgba(220, 80, 50, 0.13)',
  earth: 'rgba(70, 170, 90, 0.12)',
  air:   'rgba(80, 150, 220, 0.12)',
  water: 'rgba(130, 90, 210, 0.12)',
}
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

/** Convert polar coords — standard math angle (0 = right, CCW positive) */
function polar(cx:number, cy:number, r:number, deg:number): [number,number] {
  const rad = deg * Math.PI / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

/** 
 * Arc slice from startDeg → endDeg (going CCW = decreasing angle in SVG coords).
 * SVG uses CW convention, so we use sweep-flag=0 for CCW arcs.
 */
function slicePath(cx:number, cy:number, r:number, startDeg:number, endDeg:number): string {
  const [x1, y1] = polar(cx, cy, r, startDeg)
  const [x2, y2] = polar(cx, cy, r, endDeg)
  // Going CCW (decreasing), span is always 30° — never > 180, so large-arc = 0
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 0 ${x2} ${y2} Z`
}

interface Props {
  ascRashi:    Rashi
  grahas:      GrahaData[]
  size?:       number
  showDegrees?:   boolean
  showNakshatra?: boolean
  showKaraka?:    boolean
  showArudha?:    boolean
  arudhas?:    ArudhaData
  transitGrahas?: GrahaData[]
  fontScale?:  number
  planetScale?: number
}

export function CircleChakra({
  ascRashi, grahas, size = 480,
  showDegrees = true, showNakshatra = false,
  showKaraka = false, showArudha = false,
  arudhas, transitGrahas = [],
  fontScale = 1.0, planetScale = 1.0,
}: Props) {
  const cx = size / 2, cy = size / 2
  const outerR  = size / 2 - 6
  const signR   = outerR - 28   // sign label ring
  const planetR = signR  - 16   // planet zone outer edge
  const innerR  = planetR - 56  // inner circle radius
  const bf = 11 * fontScale
  const pf = 11 * planetScale

  // H1 starts at 180° (9 o'clock), each house is 30° CCW
  function houseStartDeg(h: number): number { return 180 - (h - 1) * 30 }
  function houseMidDeg(h: number): number   { return houseStartDeg(h) - 15 }
  function houseSign(h: number): Rashi      { return (((ascRashi - 1 + h - 1) % 12) + 1) as Rashi }
  function grahaHouse(rashi: Rashi): number { return ((rashi - ascRashi + 12) % 12) + 1 }

  // Group planets by house
  const byHouse: Record<number, GrahaData[]>  = {}
  const tByHouse: Record<number, GrahaData[]> = {}
  for (let h = 1; h <= 12; h++) { byHouse[h] = []; tByHouse[h] = [] }
  grahas.forEach(g => byHouse[grahaHouse(g.rashi)].push(g))
  transitGrahas.forEach(g => tByHouse[grahaHouse(g.rashi)].push(g))

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', maxWidth: '100%', height: 'auto', fontFamily: 'inherit' }}
    >
      {/* ── House slices ─────────────────────────────────────── */}
      {Array.from({ length: 12 }, (_, i) => {
        const h    = i + 1
        const sign = houseSign(h)
        const sD   = houseStartDeg(h)       // start (higher angle)
        const eD   = sD - 30               // end (lower angle, CCW)
        const mid  = houseMidDeg(h)
        const fill = ELEM_FILL[SIGN_ELEMENT[sign]] ?? 'transparent'
        const [lx, ly] = polar(cx, cy, (signR + outerR) / 2, mid)
        const [nx, ny] = polar(cx, cy, innerR + 22, mid)
        return (
          <g key={h}>
            <path
              d={slicePath(cx, cy, outerR, sD, eD)}
              fill={h === 1 ? 'rgba(46,109,164,0.18)' : fill}
              stroke="var(--border, #555)"
              strokeWidth={h === 1 ? 1.5 : 0.6}
            />
            {/* Sign label */}
            <text
              x={lx} y={ly}
              textAnchor="middle" dominantBaseline="central"
              fontSize={bf} fontWeight={h === 1 ? 700 : 400}
              fill={h === 1 ? '#5b9bd5' : 'var(--text-muted, #888)'}
            >
              {RASHI_SHORT[sign]}
            </text>
            {/* House number */}
            <text
              x={nx} y={ny}
              textAnchor="middle" dominantBaseline="central"
              fontSize={bf - 1}
              fill={h === 1 ? '#5b9bd5' : 'var(--text-muted, #666)'}
              opacity={0.55}
            >
              {h}
            </text>
          </g>
        )
      })}

      {/* ── Spoke lines ──────────────────────────────────────── */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = houseStartDeg(i + 1)
        const [x1, y1] = polar(cx, cy, innerR, angle)
        const [x2, y2] = polar(cx, cy, outerR, angle)
        return (
          <line key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={i === 0 ? 'rgba(91,155,213,0.8)' : 'var(--border, #555)'}
            strokeWidth={i === 0 ? 1.5 : 0.5}
          />
        )
      })}

      {/* ── Inner circle ─────────────────────────────────────── */}
      <circle cx={cx} cy={cy} r={innerR}
        fill="var(--surface-1, #1a1a2a)"
        stroke="var(--border, #555)" strokeWidth={0.8}
      />
      <text x={cx} y={cy - innerR + 18}
        textAnchor="middle" dominantBaseline="central"
        fontSize={bf - 1} fill="#5b9bd5" fontWeight={700}
      >
        As
      </text>

      {/* ── Planets ──────────────────────────────────────────── */}
      {Array.from({ length: 12 }, (_, i) => {
        const h = i + 1
        const planets  = byHouse[h]
        const transits = tByHouse[h]
        if (!planets.length && !transits.length) return null
        const mid = houseMidDeg(h)
        const pZone = planetR - 10  // centre of planet zone

        return (
          <g key={h}>
            {planets.map((g, pi) => {
              const n   = planets.length
              // Spread planets radially — stack along spoke, not tangentially
              const radSpread = Math.min(22, 44 / Math.max(n, 1))
              const rOff = (pi - (n - 1) / 2) * radSpread
              const [px, py] = polar(cx, cy, pZone + rOff, mid)
              const col   = DIGNITY_COLORS[g.dignity] ?? '#aaa'
              const label = (GRAHA_SHORT[g.id] ?? g.id) + (g.isRetro ? '\u1D3F' : '')
              return (
                <g key={g.id}>
                  <text
                    x={px} y={py}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={pf} fontWeight={600} fill={col}
                  >
                    {label}{showDegrees ? ` ${Math.floor(g.degree)}°` : ''}
                  </text>
                  {showNakshatra && (
                    <text x={px} y={py + pf + 1}
                      textAnchor="middle" dominantBaseline="central"
                      fontSize={pf - 2} fill="var(--text-muted, #888)"
                    >
                      {g.nakshatraName?.slice(0, 3)}
                    </text>
                  )}
                  {showKaraka && g.charaKaraka && (
                    <text x={px} y={py - pf}
                      textAnchor="middle" dominantBaseline="central"
                      fontSize={pf - 2} fill="#8b5cf6"
                    >
                      {g.charaKaraka}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Transits — outer ring */}
            {transits.map((g, pi) => {
              const n = transits.length
              const radSpread = Math.min(18, 36 / Math.max(n, 1))
              const rOff = (pi - (n - 1) / 2) * radSpread
              const [px, py] = polar(cx, cy, planetR + 10 + rOff, mid)
              return (
                <text key={`t-${g.id}`}
                  x={px} y={py}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={pf - 2} fontWeight={600}
                  fill="rgba(139,124,246,0.9)"
                >
                  {GRAHA_SHORT[g.id] ?? g.id}{showDegrees ? ` ${Math.floor(g.degree)}°` : ''}
                </text>
              )
            })}
          </g>
        )
      })}

      {/* ── Āruḍha overlay ───────────────────────────────────── */}
      {showArudha && arudhas && (
        (['AL','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12'] as const).map(key => {
          const rashi = arudhas[key] as Rashi
          if (!rashi) return null
          const h = grahaHouse(rashi)
          const [ax, ay] = polar(cx, cy, signR - 32, houseMidDeg(h))
          return (
            <text key={key} x={ax} y={ay}
              textAnchor="middle" dominantBaseline="central"
              fontSize={bf - 1} fill="#8b5cf6" opacity={0.85}
            >
              {key === 'A12' ? 'UL' : key}
            </text>
          )
        })
      )}
    </svg>
  )
}
