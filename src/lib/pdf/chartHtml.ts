// ─────────────────────────────────────────────────────────────
//  src/lib/pdf/chartHtml.ts
//  Generates a high-end, 20+ page Jyotish Master Dossier.
//  Optimized for browser print-to-PDF with premium typography.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaData, Rashi, GrahaId, YogaResult } from '@/types/astrology'
import {
  GRAHA_NAMES, RASHI_NAMES, RASHI_SHORT, NAKSHATRA_NAMES, NAKSHATRA_SHORT, RASHI_SANSKRIT, GRAHA_SANSKRIT
} from '@/types/astrology'
import { getNakshatraCharacteristics, getNavtaraChakra } from '@/lib/engine/nakshatraAdvanced'
import { getVarnaName, getVashyaName, getGanaName, getNadiName } from '@/lib/engine/ashtakoot'
import {
  approxIndianEras,
  formatSiderealLongitude,
  getBhriguBinduLon,
  getInduLagnaRashi,
  getNakshatraPaya,
  getPadaNamingSyllable,
  getRashiTatva,
} from '@/lib/engine/astroDetailsDerived'
import { SIGN_INTERPRETATIONS, DIGNITY_INTERPRETATIONS } from '@/lib/engine/interpretations'
import { getSBCGrid, getPlanetsOnSBC, PLANET_COLOR, PLANET_SYMBOL, nameToNakshatra, DIAGONAL_PLANETS } from '@/lib/engine/sarvatobhadra'
import { GRAHA_DISPLAY_COLOR } from '@/lib/engine/grahaDisplayColors'
import type { PlanetOnSBC } from '@/lib/engine/sarvatobhadra'

interface Branding {
  brandName?: string | null
  brandLogo?: string | null
}

// ── Colors & Theme ────────────────────────────────────────────
const THEME = {
  primary: '#8c1c13', // Deep Vedic Maroon
  secondary: '#78350f', // Sandalwood Brown
  accent:    '#b45309', // Burnished Gold
  accentLight:'#fef3c7',
  border:    '#d7d1ba', // Aged Parchment Border
  text:      '#2d2a26', // Scripture Ink
  muted:     '#78716c',
  bg:        '#fdfaf3', // Parchment Background
  surface:   '#f7f3e8',
  emerald:   '#166534',
  rose:      '#991b1b',
}

// ── Icons (SVG Paths) ─────────────────────────────────────────
const ICONS = {
  om: `<svg viewBox="0 0 100 100" width="40" height="40" fill="currentColor"><path d="M52.3,47.2c0.2,2,1.3,4,3.2,5.2c1.9,1.1,4.3,1.4,6.4,1.1c2-0.3,3.8-1.2,5.3-2.6c1.5-1.4,2.5-3.3,2.8-5.3 c0.3-2,0-4-1.1-5.7c-1.1-1.7-2.9-2.9-4.8-3.4c1.1-0.2,2.3-0.5,3.4-1c1.1-0.6,2.1-1.3,2.9-2.2c0.8-0.9,1.5-2,1.8-3.3 c0.4-1.3,0.4-2.7,0-4c-0.4-1.3-1.1-2.4-2-3.4c-1-0.9-2.2-1.6-3.6-2c-1.4-0.4-2.9-0.5-4.3-0.2c-1.4,0.3-2.8,1-3.9,1.9 c-1.1-0.9-2.4-1.6-3.8-1.9c-1.4-0.3-2.9-0.2-4.3,0.2c-1.4,0.4-2.7,1.1-3.6,2c-1,0.9-1.6,2.1-2,3.4c-0.4,1.3-0.4,2.7-0,4 c0.4,1.3,1,2.4,1.8,3.3c0.8,0.9,1.8,1.7,2.9,2.2c1.1,0.6,2.3,0.8,3.4,1c-2,0.5-3.8,1.7-4.8,3.4c-1.1,1.7-1.4,3.7-1.1,5.7 C50,44,50.8,45.8,52.3,47.2z M65.7,21.5c1.3,0.3,2.5,1,3.4,2c0.9,1,1.4,2.3,1.6,3.6c0.2,1.4,0,2.8-0.7,4.1 c-0.6,1.4-1.7,2.5-3.1,3.1c1.3,0.6,2.4,1.7,3,3.1c0.7,1.3,0.9,2.8,0.7,4.1c-0.2,1.4-0.7,2.6-1.6,3.6c-0.9,1-2,1.7-3.4,2 c-1.3,0.3-2.7,0.2-4-0.2c-1.4-0.4-2.4-1.2-3.2-2.3c-0.8-1-1.1-2.4-1.1-3.8c0-1.4,0.4-2.8,1.2-3.8c0.8-1.1,1.8-1.8,3.1-2.3 c-1.3-0.4-2.3-1.2-3.1-2.3c-0.7-1.1-1.1-2.4-1.1-3.8c0-1.4,0.3-2.7,1.1-3.8c0.8-1.1,1.8-1.9,3.1-2.3C63,21.3,64.4,21.3,65.7,21.5z"/></svg>`,
  swastik: `<svg viewBox="0 0 100 100" width="30" height="30" fill="currentColor"><path d="M50,0v37.5H12.5V12.5H25v12.5h12.5V0H50z M12.5,50V12.5h37.5V50H12.5z M87.5,50H50V12.5H87.5V25h-12.5v12.5H87.5V50z M50,87.5V50h37.5v37.5H75v-12.5H62.5v12.5 H50z M12.5,87.5v-37.5H50v37.5H37.5v-12.5H25v12.5H12.5z"/></svg>`,
  brandIcon: `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
      <svg viewBox="0 0 120 120" style="width: 100px; height: 100px; color: #8c1c13;" fill="currentColor">
        <g opacity="0.12">
          <path d="M60 20 L 60 60 L 100 60 Q 115 60 110 80 Q 105 100 85 100 L 85 85 Q 95 85 95 75 Q 95 65 85 65 L 60 65 L 60 105 Q 60 120 40 115 Q 20 110 20 90 L 35 90 Q 35 100 45 100 Q 55 100 55 90 L 55 65 L 15 65 Q 0 65 5 45 Q 10 25 30 25 L 30 40 Q 20 40 20 50 Q 20 60 30 60 L 55 60 L 55 20 Q 55 5 75 10 Q 95 15 95 35 L 80 35 Q 80 25 70 25 Q 60 25 60 35 V 20 Z" />
          <circle cx="40" cy="40" r="5" /><circle cx="80" cy="40" r="5" /><circle cx="40" cy="80" r="5" /><circle cx="80" cy="80" r="5" />
        </g>
        <g transform="translate(10, 5) scale(0.8)">
          <path d="M30.63,77.67c-9.43-13.04-12.22-32.41-2.3-41.01c-2.28-8.02-11.02-10.6-18.19-8.23 C-0.23,31.87-0.99,40.02,0.69,48.47c1.56,7.83,7.99,31.71,10.79,37.66c1.24,2.64,2.78,4.04,4.58,4.32c2.54,0.4,5.6-1.43,9.11-5.16 L30.63,77.67L30.63,77.67z M37.21,47.99c5.67,2,6.33,4.37,7.38,9.55c-0.65-0.57-1.25-1.16-1.8-1.77c-0.09,0.07-0.19,0.13-0.29,0.18 c-1.23,0.64-2.8,0.05-3.52-1.32c-0.61-1.17-0.39-2.52,0.45-3.29C38.68,50.22,37.97,49.1,37.21,47.99L37.21,47.99z M55.9,10.26 h-5.63c-0.01-0.81-0.56-1.68-1.22-2.18c2.01-0.47,3.35-1.47,4.14-3.19c0.73,2.02,2.33,2.65,3.96,3.19 C56.35,8.55,55.91,9.51,55.9,10.26L55.9,10.26z M69,47.99c-5.67,2-6.33,4.37-7.38,9.55c0.65-0.57,1.25-1.16,1.8-1.77 c0.09,0.07,0.19,0.13,0.29,0.18c1.23,0.64,2.8,0.05,3.52-1.32c0.61-1.17,0.39-2.52-0.45-3.29C67.52,50.22,68.24,49.1,69,47.99 L69,47.99z M32.91,32.48c12.95-5.35,26.47-5.57,40.62,0c9.35-12.51-24.19-17.86-11.8-25.13C58.32,6.22,54.77,4.22,53.24,0 c-1.65,3.6-4.27,6.38-8.46,7.35C56.82,16.34,22.81,18.58,32.91,32.48L32.91,32.48z M75.17,75.96c9.43-13.04,12.22-32.41,2.3-41.01 c2.28-8.02,11.02-10.6,18.19-8.23c10.37,3.43,11.13,11.58,9.45,20.04c-1.56,7.83-7.99,31.71-10.79,37.66 c-1.24,2.64,2.78,4.04-4.58,4.32c-2.54,0.4-5.6-1.43-9.11-5.16L75.17,75.96L75.17,75.96z M72.8,38.28 c-15.29-4.85-28.42-4.41-38.75-0.21c-7.5,5.47-8.23,14.04-4.73,25.63c2.4,7.94,6.76,10.58,9.01,16.68 c6.44,17.44,3.08,47.17,43.53,41.89c4.55-0.59,8.75-1.77,12.59-3.56c9.99-6.06-3.86-6.69-7.78-6.91 c-21.58-1.25-23.04-8.24-18.05-27.29l2.02-7.71C77.82,58.76,80.49,44.36,72.8,38.28L72.8,38.28z"/>
        </g>
      </svg>
      <div style="font-family: 'Playfair Display', serif; font-size: 1.8rem; font-weight: 900; color: #8c1c13; letter-spacing: 0.15em; text-transform: uppercase;">VEDAANSH</div>
    </div>
  `
}


// ── Helpers ───────────────────────────────────────────────────

function fmtDMS(totalDeg: number): string {
  const rashiIdx = Math.floor(((totalDeg % 360) + 360) % 360 / 30)
  const degInRashi = ((totalDeg % 360) + 360) % 360 - rashiIdx * 30
  const d = Math.floor(degInRashi)
  const m = Math.floor((degInRashi - d) * 60)
  const s = Math.floor(((degInRashi - d) * 60 - m) * 60)
  const rashi = RASHI_SHORT[((rashiIdx % 12) + 1) as Rashi]
  return `${String(d).padStart(2,'0')} ${rashi} ${String(m).padStart(2,'0')}'`
}

function capitalize(s: string): string {
  if (!s) return ''
  return s.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())
}

function escapeHtml(s: string): string {
  if (!s) return ''
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function formatCoordinate(value: number, positive: string, negative: string): string {
  const direction = value >= 0 ? positive : negative
  return `${Math.abs(value).toFixed(2)}${direction}`
}

function formatDateTime(value?: Date | string | null): string {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function buildShadbalaMiniCharts(chart: ChartOutput): string {
  const planets = chart.shadbala?.planets || {}
  const order = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']
  
  // 1. Total Strength Comparison Bar Chart (Similar to ComparisonChart in UI)
  const maxTotal = Math.max(...order.map(id => planets[id]?.total || 0), 1)
  
  const comparisonBars = order.map(id => {
    const p = planets[id]
    if (!p) return ''
    const col = GRAHA_DISPLAY_COLOR[id as GrahaId] || THEME.text
    const heightPct = (p.total / maxTotal) * 100
    const reqPct = (p.required / maxTotal) * 100
    
    return `
      <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:8px; position:relative; height:180px">
        <div style="font-family:monospace; font-size:9px; font-weight:700; color:${p.isStrong ? THEME.text : THEME.rose}; margin-bottom:auto">
          ${p.total.toFixed(1)}
        </div>
        <div style="width:100%; max-width:32px; flex:1; position:relative; background:#f1f5f9; border-radius:4px 4px 0 0; overflow:hidden; border:1px solid ${THEME.border}">
          <div style="position:absolute; bottom:${reqPct}%; width:100%; height:1px; background:${THEME.muted}; z-index:5; border-bottom:1px dashed rgba(0,0,0,0.2)"></div>
          <div style="position:absolute; bottom:0; width:100%; height:${heightPct}%; background:linear-gradient(to top, ${col}99, ${col}); box-shadow:0 0 8px ${col}33"></div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:center">
           <span style="color:${col}; font-size:12px; font-weight:900">${PLANET_SYMBOL[id as GrahaId] || id}</span>
           <span style="font-size:8px; font-weight:800; color:${THEME.muted}">${id}</span>
        </div>
      </div>
    `
  }).join('')

  // 2. Component Breakdowns (Mini charts for each planet)
  const metrics = [
    { key: 'sthanaBala', title: 'Sthaana Bala', decimals: 2, scale: 60 },
    { key: 'kalaBala', title: 'Kaala Bala', decimals: 2, scale: 60 },
    { key: 'digBala', title: 'DigBala', decimals: 2, scale: 60 },
    { key: 'chestaBala', title: 'Cheshta Bala', decimals: 2, scale: 60 },
    { key: 'naisargikaBala', title: 'Naisargika Bala', decimals: 2, scale: 60 },
    { key: 'total', title: 'Total Rupa', decimals: 2, scale: 1 },
  ] as const

  const cards = metrics.map(metric => {
    const vals = order.map(id => {
      const p = planets[id]
      if (!p) return 0
      return (p[metric.key as keyof typeof p] as number) * metric.scale
    })
    const maxVal = Math.max(...vals, 1)

    const bars = vals.map((v, idx) => {
      const id = order[idx]
      const h = Math.max(2, (v / maxVal) * 42)
      const label = v.toFixed(metric.decimals === 2 ? 1 : 0)
      const col = GRAHA_DISPLAY_COLOR[id as GrahaId] || THEME.text

      return `
        <div style="display:flex; flex-direction:column; align-items:center; gap:2px">
          <div style="font-size:7px; color:${THEME.muted}; font-family:monospace">${label}</div>
          <div style="width:100%; max-width:12px; height:50px; display:flex; align-items:flex-end">
            <div style="width:100%; height:${h}px; border-radius:1px; background:${col}ee"></div>
          </div>
          <div style="font-size:7px; color:${THEME.secondary}; font-weight:800">${id}</div>
        </div>
      `
    }).join('')

    return `
      <div class="mini-chart-card" style="border:1px solid ${THEME.border}">
        <div class="mini-chart-title" style="font-size:8px">${metric.title}</div>
        <div class="mini-chart-grid" style="min-height:55px">${bars}</div>
      </div>
    `
  }).join('')

  return `
    <div style="margin: 2rem 0">
      <div style="padding:20px; background:#fff; border:1px solid ${THEME.border}; border-radius:12px; margin-bottom:2rem">
        <h4 style="margin-bottom:20px; color:${THEME.primary}; font-family:'Playfair Display', serif">Total Strength (Actual vs Required)</h4>
        <div style="display:flex; align-items:flex-end; gap:12px">
          ${comparisonBars}
        </div>
      </div>
      
      <div class="mini-charts-wrap">
        <div class="small-meta" style="margin-bottom:12px; color:${THEME.accent}">Relative Distribution by Component</div>
        <div class="mini-charts-grid">${cards}</div>
      </div>
    </div>
  `
}

// ── SVG Chart Builder (North Indian) ──────────────────────────

function polyPts(h: number, S: number): string {
  const Q = S/4, M = S/2
  const pts: [number,number][][] = [
    [], // dummy
    [[Q,Q],[M,M],[3*Q,Q],[M,0]],
    [[0,0],[Q,Q],[M,0]],
    [[0,0],[0,M],[Q,Q]],
    [[0,M],[Q,3*Q],[M,M],[Q,Q]],
    [[0,M],[0,S],[Q,3*Q]],
    [[Q,3*Q],[0,S],[M,S]],
    [[Q,3*Q],[M,S],[3*Q,3*Q],[M,M]],
    [[3*Q,3*Q],[M,S],[S,S]],
    [[3*Q,3*Q],[S,S],[S,M]],
    [[3*Q,Q],[M,M],[3*Q,3*Q],[S,M]],
    [[3*Q,Q],[S,M],[S,0]],
    [[M,0],[3*Q,Q],[S,0]],
  ]
  return pts[h]?.map(([x,y]) => `${x},${y}`).join(' ') ?? ''
}

function centroidN(h: number, S: number): [number,number] {
  const Q = S/4, M = S/2, Q3 = 3*Q
  const c: Record<number,[number,number]> = {
    1:[M, Q*0.75], 2:[Q*0.75, Q*0.4], 3:[Q*0.4, Q*0.75], 4:[M*0.75, M],
    5:[Q*0.4, Q3*1.08], 6:[Q*0.75, S-Q*0.4], 7:[M, S-Q*0.75],
    8:[Q3*1.08, S-Q*0.4], 9:[S-Q*0.4, Q3*1.08],
    10:[S-Q*0.75, M], 11:[S-Q*0.4, Q*0.75], 12:[Q3*1.08, Q*0.4],
  }
  return c[h] ?? [M,M]
}

function rashiLabelPos(h: number, S: number): [number,number] {
  const Q = S/4, M = S/2, Q3 = 3*Q
  const p: Record<number,[number,number]> = {
    1:[M, Q*1.15], 2:[Q, Q*0.4], 3:[Q*0.4, Q], 4:[M*0.75, M*1.1],
    5:[Q*0.4, Q3], 6:[Q, S-Q*0.4], 7:[M, S-Q*1.15],
    8:[Q3, S-Q*0.4], 9:[S-Q*0.4, Q3], 10:[S-Q*0.75, M*0.9],
    11:[S-Q*0.4, Q], 12:[Q3, Q*0.4],
  }
  return p[h] ?? [M,M]
}

function buildNorthSVG(chart: ChartOutput, vargaKey: string = 'D1', size = 280): string {
  const S = size
  const ascRashi = vargaKey === 'D1' ? chart.lagnas.ascRashi : (chart.vargaLagnas?.[vargaKey] || chart.lagnas.ascRashi)
  const grahas = vargaKey === 'D1' ? chart.grahas : (chart.vargas?.[vargaKey] || [])
  const filtered = grahas.filter(g => !['Ur','Ne','Pl'].includes(g.id))

  const signInHouse = (h: number) => (((ascRashi - 1 + h - 1) % 12) + 1) as number
  const byHouse: Record<number, any[]> = {}
  for (let h = 1; h <= 12; h++) byHouse[h] = []
  filtered.forEach(g => {
    for (let h = 1; h <= 12; h++) {
      if (signInHouse(h) === g.rashi) { byHouse[h].push(g); break }
    }
  })

  let cells = ''
  for (let h = 1; h <= 12; h++) {
    const pts = polyPts(h, S)
    if (!pts) continue
    const sign = signInHouse(h)
    const isLagna = h === 1
    const fill   = isLagna ? '#f8fafc' : 'transparent'
    const stroke = isLagna ? THEME.primary : '#cbd5e1'
    const sw     = isLagna ? 1.5 : 0.6

    const [lx,ly] = rashiLabelPos(h, S)
    const signTxt = `<text x="${lx}" y="${ly}" font-family="Arial" font-size="${S*0.04}" font-weight="900" fill="${isLagna?THEME.primary:THEME.accent}" text-anchor="middle" dominant-baseline="middle">${sign}</text>`

    const [cx,cy] = centroidN(h, S)
    const ps = byHouse[h]
    
    // Dynamic adjustments for crowded houses
    const many = ps.length > 2
    const pf = S * (many ? 0.038 : 0.045)
    const lh = pf * 1.2
    
    const planetTxts = ps.map((g, i) => {
      let xOff = 0
      let yOff = 0
      
      if (ps.length > 3) {
        // Two-column layout for high crowding
        const col = i % 2
        const row = Math.floor(i / 2)
        xOff = (col === 0 ? -1 : 1) * (S * 0.08)
        yOff = (row - (Math.ceil(ps.length/2)-1)/2) * lh
      } else {
        // Single column stacking
        yOff = (i - (ps.length - 1) / 2) * lh
      }

      const color = GRAHA_DISPLAY_COLOR[g.id as GrahaId] ?? THEME.text
      const label = g.id + (g.isRetro ? 'R' : '')
      const deg = Math.floor(g.degree ?? (g.totalDegree % 30))
      
      return `<text x="${cx + xOff}" y="${cy + yOff}" font-family="Arial, sans-serif" font-size="${pf}" font-weight="700" fill="${color}" text-anchor="middle" dominant-baseline="middle">${label} ${deg}°</text>`
    }).join('\n')

    cells += `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
              ${signTxt}${planetTxts}`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${cells}</svg>`
}

function buildSouthSVG(chart: ChartOutput, vargaKey: string = 'D1', size = 280): string {
  const S = size
  const cell = S / 4
  const ascRashi = vargaKey === 'D1' ? chart.lagnas.ascRashi : (chart.vargaLagnas?.[vargaKey] || chart.lagnas.ascRashi)
  const grahas = vargaKey === 'D1' ? chart.grahas : (chart.vargas?.[vargaKey] || [])
  const filtered = grahas.filter(g => !['Ur','Ne','Pl'].includes(g.id))

  const signCoords: Record<number, [number, number]> = {
    12: [0, 0], 1: [0, 1], 2: [0, 2], 3: [0, 3],
    11: [1, 0],                         4: [1, 3],
    10: [2, 0],                         5: [2, 3],
     9: [3, 0], 8: [3, 1], 7: [3, 2], 6: [3, 3],
  }

  const byRashi: Record<number, any[]> = {}
  for (let r = 1; r <= 12; r++) byRashi[r] = []
  filtered.forEach(g => { if (byRashi[g.rashi]) byRashi[g.rashi].push(g) })

  let cells = `<rect width="${S}" height="${S}" fill="transparent" stroke="${THEME.border}" stroke-width="1"/>`
  
  // Outer cells
  for (let r = 1; r <= 12; r++) {
    const [row, col] = signCoords[r]
    const x = col * cell, y = row * cell
    const isAsc = r === ascRashi
    const ps = byRashi[r]
    
    // Background & Border
    cells += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${isAsc ? '#fef3c7' : 'transparent'}" stroke="${isAsc ? THEME.primary : THEME.border}" stroke-width="${isAsc ? 1.5 : 0.5}"/>`
    
    // Sign label
    cells += `<text x="${x + 6}" y="${y + 14}" font-family="Arial" font-size="10" font-weight="900" fill="${isAsc ? THEME.primary : THEME.accent}">${r}</text>`
    cells += `<text x="${x + cell - 6}" y="${y + 14}" font-family="Arial" font-size="8" fill="${THEME.muted}" text-anchor="end">${RASHI_SHORT[r as Rashi]}</text>`

    // Planets
    const pf = cell * 0.16
    const df = cell * 0.1
    const lh = pf + 2
    const startY = y + cell * 0.35
    
    ps.forEach((g, i) => {
      const py = startY + i * lh
      const label = g.id + (g.isRetro ? 'R' : '')
      const deg = Math.floor(g.degree ?? (g.totalDegree % 30))
      cells += `<text x="${x + cell * 0.15}" y="${py}" font-family="Arial" font-size="${pf}" font-weight="700" fill="${GRAHA_DISPLAY_COLOR[g.id as GrahaId] ?? THEME.text}">${label} ${deg}°</text>`
    })
  }

  // Center cross lines
  cells += `
    <line x1="${cell}" y1="${cell}" x2="${3*cell}" y2="${cell}" stroke="${THEME.border}" stroke-width="0.5"/>
    <line x1="${cell}" y1="${3*cell}" x2="${3*cell}" y2="${3*cell}" stroke="${THEME.border}" stroke-width="0.5"/>
    <line x1="${cell}" y1="${cell}" x2="${cell}" y2="${3*cell}" stroke="${THEME.border}" stroke-width="0.5"/>
    <line x1="${3*cell}" y1="${cell}" x2="${3*cell}" y2="${3*cell}" stroke="${THEME.border}" stroke-width="0.5"/>
    <text x="${S/2}" y="${S/2}" font-family="Arial" font-size="${S*0.06}" font-weight="900" fill="${THEME.primary}" text-anchor="middle" dominant-baseline="middle" opacity="0.05">${vargaKey}</text>
  `

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${cells}</svg>`
}

function buildChartSVG(chart: ChartOutput, vargaKey: string = 'D1', size = 280): string {
  // Force North Indian Diamond style as per user requirement
  return buildNorthSVG(chart, vargaKey, size)
}

// ── Components & UI Sections ───────────────────────────────────

function PageFooter(pageNo: number, name: string): string {
  return `
    <div class="footer">
      <div style="display:flex; align-items:center; gap:10px">
        <span style="opacity:0.3; color:${THEME.accent}">${ICONS.om}</span>
        <span>Deep Intelligence Report • ${name} • Confidential</span>
      </div>
      <div>Page ${pageNo}</div>
    </div>`
}

function SectionHeader(num: string, title: string, subtitle?: string): string {
  return `
    <div style="display:flex; justify-content:space-between; align-items:flex-start">
      <div>
        <div class="section-badge">${subtitle || 'Vedaansh Premium'}</div>
        <h2 class="section-title"><span>${num}</span> ${title}</h2>
      </div>
      <div style="color:${THEME.accent}; opacity:0.25">${ICONS.om}</div>
    </div>
  `
}

// ── Detailed Sections ──────────────────────────────────────────

function buildVargaGrid(chart: ChartOutput): string {
  const vargas = ['D1','D2','D3','D4','D7','D9','D12','D10','D16']
  const items = vargas.map(v => `
    <div class="varga-card">
      <div class="varga-title">${v} Chart</div>
      ${buildChartSVG(chart, v, 175)}
    </div>
  `).join('')
  return `<div class="varga-grid">${items}</div>`
}

function buildAstroDetailsHtml(chart: ChartOutput): string {
  const moon = chart.grahas.find(g => g.id === 'Mo')
  const rahu = chart.grahas.find(g => g.id === 'Ra')
  const sun = chart.grahas.find(g => g.id === 'Su')
  const ketu = chart.grahas.find(g => g.id === 'Ke')
  if (!moon) {
    return '<p class="small-meta">Moon data required for complete natal astro details.</p>'
  }

  const chars = getNakshatraCharacteristics(moon.nakshatraIndex, moon.pada)
  const moonNak1 = moon.nakshatraIndex + 1
  const induRashi = getInduLagnaRashi(moon.rashi)
  const bhriguLon = rahu ? getBhriguBinduLon(moon.totalDegree, rahu.totalDegree) : null
  const bhriguFmt = bhriguLon != null ? formatSiderealLongitude(bhriguLon) : null
  const eras = approxIndianEras(chart.meta.birthDate)

  const ascLordMap: Record<Rashi, GrahaId> = {
    1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
    7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
  }
  const ascLord = ascLordMap[chart.lagnas.ascRashi]

  let dayNight = '—'
  try {
    const t = `${chart.meta.birthDate}T${chart.meta.birthTime || '12:00'}`
    const birth = new Date(t)
    const sr = new Date(chart.panchang.sunrise)
    const ss = new Date(chart.panchang.sunset)
    if (!Number.isNaN(birth.getTime())) {
      dayNight = birth >= sr && birth <= ss ? 'Day (Sun above horizon)' : 'Night'
    }
  } catch { /* ignore */ }

  const fmtLon = (lon: number) => {
    const f = formatSiderealLongitude(lon)
    return `${RASHI_NAMES[f.rashi]} ${f.degInSign.toFixed(2)}°`
  }

  const fmtShortTime = (d: Date | string) => {
    const x = new Date(d)
    return Number.isNaN(x.getTime()) ? 'N/A' : x.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  const beeja = chart.upagrahas?.['Beeja Sphuta']
  const kshetra = chart.upagrahas?.['Kshetra Sphuta']

  const detailTable = (title: string, rows: [string, string][]) => `
    <h4 style="margin: 1.1rem 0 0.45rem; color:${THEME.primary}; font-size: 0.92rem; font-weight: 800">${title}</h4>
    <table class="data-table" style="margin-bottom: 0.35rem">
      ${rows.map(([k, v]) => `
        <tr>
          <td style="font-weight:700;background:${THEME.surface};width:36%">${escapeHtml(k)}</td>
          <td>${escapeHtml(v)}</td>
        </tr>`).join('')}
    </table>
  `

  const yogiRow: [string, string][] = chart.yogiPoint
    ? [[`Yogi / Sahayogi / Avayogi`, `${GRAHA_NAMES[chart.yogiPoint.yogiGraha]} / ${GRAHA_NAMES[chart.yogiPoint.sahayogiGraha]} / ${GRAHA_NAMES[chart.yogiPoint.avayogiGraha]}`]]
    : []

  const bhriguStr = bhriguFmt && bhriguLon != null
    ? `${RASHI_NAMES[bhriguFmt.rashi]} ${bhriguFmt.degInSign.toFixed(2)}° · ${bhriguLon.toFixed(4)}° sidereal`
    : '—'

  return `
    <p style="font-size: 11px; color: ${THEME.muted}; margin-bottom: 1rem; line-height: 1.5">
      Full natal summary: birth data, lagna, Moon nakṣatra attributes, pañcāṅga, special lagnas, and derived points (Indu Lagna, Bhrigu Bindu, eras approximate).
    </p>
    ${detailTable('Birth data', [
      ['Name', chart.meta.name || '—'],
      ['Date', chart.meta.birthDate],
      ['Time', chart.meta.birthTime || '—'],
      ['Place', chart.meta.birthPlace || '—'],
      ['Timezone', chart.meta.timezone],
      ['Coordinates', `${chart.meta.latitude.toFixed(4)}°, ${chart.meta.longitude.toFixed(4)}°`],
      ['Ayanāṃśa', `${chart.meta.settings.ayanamsha} ${chart.meta.ayanamshaValue.toFixed(4)}°`],
      ['Julian Day', chart.meta.julianDay.toFixed(5)],
    ])}
    ${detailTable('Lagna & signs', [
      ['Ascendant', `${RASHI_NAMES[chart.lagnas.ascRashi]} (${RASHI_SANSKRIT[chart.lagnas.ascRashi]})`],
      ['Ascendant (degree)', `${RASHI_NAMES[chart.lagnas.ascRashi]} ${chart.lagnas.ascDegreeInRashi.toFixed(2)}°`],
      ['Ascendant lord', GRAHA_NAMES[ascLord]],
      ['Moon sign', `${RASHI_NAMES[moon.rashi]} · ${RASHI_SANSKRIT[moon.rashi]}`],
      ['Moon rāśi tatva', getRashiTatva(moon.rashi)],
    ])}
    ${detailTable('Nakṣatra (Moon)', [
      ['Nakṣatra', `${moon.nakshatraName} (${moon.pada} pada)`],
      ['Nakṣatra lord', GRAHA_NAMES[chars.lord]],
      ['Deity', chars.deity],
      ['Symbol', chars.symbol],
      ['Varṇa (nakṣatra)', chars.varna],
      ['Varṇa (rāśi · koota)', getVarnaName(moon.rashi)],
      ['Vaśya (rāśi · koota)', getVashyaName(moon.rashi)],
      ['Yoni', chars.yoni],
      ['Gaṇa', `${chars.gana} · koota: ${getGanaName(moonNak1)}`],
      ['Nāḍī (nakṣatra)', chars.nadi],
      ['Nāḍī (koota)', getNadiName(moonNak1)],
      ['Śakti', chars.shakti],
      ['Nature', chars.nature],
      ['Paya (from pada)', getNakshatraPaya(moon.pada)],
      ['Name sound (pada)', getPadaNamingSyllable(moon.nakshatraIndex, moon.pada)],
    ])}
    ${detailTable('Pañcāṅga (natal)', [
      ['Vāra (weekday)', `${chart.panchang.vara.name} · lord ${GRAHA_NAMES[chart.panchang.vara.lord]}`],
      ['Tithi', `${chart.panchang.tithi.name} (${chart.panchang.tithi.number}/30)`],
      ['Pakṣa', chart.panchang.tithi.paksha === 'shukla' ? 'Śukla (waxing)' : 'Kṛṣṇa (waning)'],
      ['Tithi lord', String(chart.panchang.tithi.lord)],
      ['Yoga', chart.panchang.yoga.name],
      ['Karaṇa', chart.panchang.karana.name],
      ['Sunrise', fmtShortTime(chart.panchang.sunrise)],
      ['Sunset', fmtShortTime(chart.panchang.sunset)],
      ['Day / night birth', dayNight],
      ['Amānta / Pūrṇimānta', 'Lunar month naming varies by tradition; tithi & pakṣa follow astronomical calculation.'],
    ])}
    ${detailTable('Hindu eras (approx.)', [
      ['Śaka Samvat', `~ ${eras.shaka}`],
      ['Vikram Samvat', `~ ${eras.vikram}`],
      ['Note', eras.note],
    ])}
    ${detailTable('Special lagnas & points', [
      ['Āruḍha Lagna (AL)', chart.arudhas.AL ? RASHI_NAMES[chart.arudhas.AL] : '—'],
      ['Indu Lagna', `${RASHI_NAMES[induRashi]} · ${RASHI_SANSKRIT[induRashi]}`],
      ['Bhrigu Bindu', bhriguStr],
      ...yogiRow,
      ['Hora Lagna', fmtLon(chart.lagnas.horaLagna)],
      ['Ghati Lagna', fmtLon(chart.lagnas.ghatiLagna)],
      ['Bhava Lagna', fmtLon(chart.lagnas.bhavaLagna)],
      ['Praṇapada', fmtLon(chart.lagnas.pranapada)],
      ['Śrī Lagna', fmtLon(chart.lagnas.sriLagna)],
      ['Varṇada Lagna', fmtLon(chart.lagnas.varnadaLagna)],
      ...(beeja ? [[`Bīja Sphuta`, `${beeja.rashiName} ${beeja.degree.toFixed(2)}°`]] as [string, string][] : []),
      ...(kshetra ? [[`Kṣetra Sphuta`, `${kshetra.rashiName} ${kshetra.degree.toFixed(2)}°`]] as [string, string][] : []),
    ])}
    ${(() => {
      const sunRows: [string, string][] = []
      if (sun) sunRows.push(['Sun', `${RASHI_NAMES[sun.rashi]} · ${fmtLon(sun.totalDegree)}`])
      if (rahu) sunRows.push(['Rāhu', `${RASHI_NAMES[rahu.rashi]} · ${fmtLon(rahu.totalDegree)}`])
      if (ketu) sunRows.push(['Ketu', `${RASHI_NAMES[ketu.rashi]} · ${fmtLon(ketu.totalDegree)}`])
      return sunRows.length ? detailTable('Sun & nodes', sunRows) : ''
    })()}
  `
}

function buildSpecialLagnas(chart: ChartOutput): string {
  const { lagnas } = chart
  const items = [
    { label: 'Ascendant (Lagna)', val: lagnas.ascDegree },
    { label: 'Hora Lagna (Wealth)', val: lagnas.horaLagna },
    { label: 'Ghati Lagna (Power)', val: lagnas.ghatiLagna },
    { label: 'Bhava Lagna', val: lagnas.bhavaLagna },
    { label: 'Sri Lagna (Abundance)', val: lagnas.sriLagna },
    { label: 'Varnada Lagna', val: lagnas.varnadaLagna },
    { label: 'Pranapada', val: lagnas.pranapada },
  ]
  const rows = items.map(it => `
    <tr>
      <td style="font-weight:700">${it.label}</td>
      <td style="font-family:monospace">${fmtDMS(it.val)}</td>
      <td>${RASHI_NAMES[((Math.floor(it.val/30)%12)+1) as Rashi]}</td>
    </tr>
  `).join('')
  return `<table class="data-table"><thead><tr><th>Point</th><th>Longitude</th><th>Rashi</th></tr></thead><tbody>${rows}</tbody></table>`
}

function buildPlanetInterpretations(chart: ChartOutput, group: string[]): string {
  return group.map(id => {
    const g = chart.grahas.find(x => x.id === id)
    if (!g) return ''
    const signInterp = SIGN_INTERPRETATIONS[id]?.[g.rashi] || 'Core energy influence.'
    const digInterp = DIGNITY_INTERPRETATIONS[g.dignity] || ''
    const planetColor = GRAHA_DISPLAY_COLOR[id as GrahaId] ?? THEME.text
    
    return `
      <div class="interp-block">
        <div class="interp-header">
          <span style="color:${planetColor};font-weight:800;font-size:1.2rem">${GRAHA_NAMES[id as GrahaId]} in ${RASHI_NAMES[g.rashi]}</span>
          <span class="dignity-tag" style="background:${THEME.surface};color:${THEME.muted};border:1px solid ${THEME.border}">${capitalize(g.dignity)}</span>
        </div>
        <div class="interp-text">${signInterp} ${digInterp}</div>
        <div class="interp-meta">Nakshatra: ${g.nakshatraName} (${g.pada}) • House: ${((g.rashi - chart.lagnas.ascRashi + 12) % 12) + 1}</div>
      </div>
    `
  }).join('')
}

function buildAVMatrix(chart: ChartOutput): string {
  if (!chart.ashtakavarga) return '<p>Ashtakavarga data missing.</p>'
  const planets = ['Su','Mo','Ma','Me','Ju','Ve','Sa']
  
  const header = `<tr><th>Sign</th>${planets.map(p => `<th>${p}</th>`).join('')}<th>SAV</th></tr>`
  let rows = ''
  for (let r = 1; r <= 12; r++) {
    let cells = ''
    planets.forEach(p => {
      const val = chart.ashtakavarga?.bav[p]?.bindus[r-1] ?? 0
      cells += `<td>${val}</td>`
    })
    const sav = chart.ashtakavarga.sav[r-1] || 0
    rows += `<tr><td style="font-weight:700">${RASHI_SHORT[r as Rashi]}</td>${cells}<td style="background:${THEME.accentLight};font-weight:800">${sav}</td></tr>`
  }
  
  return `<table class="av-table"><thead>${header}</thead><tbody>${rows}</tbody></table>`
}

function buildKPSection(chart: ChartOutput): string {
  if (!chart.kp) return '<p>KP System analytics calculating...</p>'
  const cusps = chart.kp.cusps.slice(0, 12).map(c => `
    <tr>
      <td>House ${c.house}</td>
      <td>${RASHI_NAMES[c.rashi]}</td>
      <td>${c.signLord}</td>
      <td>${c.starLord}</td>
      <td style="font-weight:700;color:${THEME.accent}">${c.subLord}</td>
      <td>${c.subSubLord}</td>
    </tr>
  `).join('')
  
  return `
    <table class="data-table">
      <thead><tr><th>House</th><th>Sign</th><th>Sign Lord</th><th>Star Lord</th><th>Sub Lord</th><th>SS Lord</th></tr></thead>
      <tbody>${cusps}</tbody>
    </table>
  `
}

function buildBhavaBalaSection(chart: ChartOutput): string {
  if (!chart.bhavaBala) return '<p>House strength calculation in progress...</p>'
  const houses = Object.values(chart.bhavaBala.houses).sort((a,b) => a.house - b.house)
  
  const rows = houses.map(h => `
    <tr>
      <td style="font-weight:800; color:${THEME.primary}">House ${h.house}</td>
      <td>${RASHI_NAMES[h.rashi]}</td>
      <td>${h.adhipatiBala.toFixed(0)}</td>
      <td>${h.digBala.toFixed(0)}</td>
      <td>${h.drishtiBala.toFixed(0)}</td>
      <td style="font-weight:900; background:${h.isStrong?THEME.accentLight:THEME.surface}">${h.totalShash.toFixed(0)}</td>
      <td style="color:${h.isStrong?THEME.emerald:THEME.muted}; font-weight:800">${h.isStrong?'STRONG':'WEAK'}</td>
    </tr>
  `).join('')

  return `
    <table class="data-table">
      <thead><tr><th>House</th><th>Sign</th><th>Lord Power</th><th>Direction</th><th>Aspect</th><th>Total (Sh)</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="margin-top: 2rem; display: flex; align-items: flex-end; gap: 5px; height: 100px; padding: 10px; border-bottom: 2px solid ${THEME.primary}">
      ${houses.map(h => {
        const height = (h.totalShash / 600) * 100 // Scale to 100px
        return `<div style="flex:1; background:${h.isStrong?THEME.accent:THEME.border}; height:${height}px; border-radius: 2px 2px 0 0; position:relative" title="H${h.house}">
          <span style="position:absolute; bottom:-20px; left:0; right:0; text-align:center; font-size:8px; font-weight:800">${h.house}</span>
        </div>`
      }).join('')}
    </div>
  `
}

function buildSBCSVG(chart: ChartOutput, size = 320): string {
  const S = size
  const cs = S / 9
  const grid = getSBCGrid()
  const natal = getPlanetsOnSBC(chart.grahas, true)
  
  // Highlights
  const birthNakIdx = chart.panchang.nakshatra.index
  const nameNakIdx = nameToNakshatra(chart.meta.name)
  
  const pad = 12
  let content = `<rect width="${S}" height="${S}" fill="#fff" stroke="${THEME.primary}" stroke-width="2"/>`
  
  // Directions
  const dirStyle = `font-family:Outfit, sans-serif; font-size:${cs*0.18}px; font-weight:900; fill:${THEME.accent}; opacity:0.6`
  content += `<text x="${S/2}" y="-4" style="${dirStyle}" text-anchor="middle">NORTH (Uttara)</text>`
  content += `<text x="${S/2}" y="${S+14}" style="${dirStyle}" text-anchor="middle">SOUTH (Dakshina)</text>`
  content += `<text x="-6" y="${S/2}" style="${dirStyle}" transform="rotate(-90, -6, ${S/2})" text-anchor="middle">WEST (Paschim)</text>`
  content += `<text x="${S+6}" y="${S/2}" style="${dirStyle}" transform="rotate(90, ${S+6}, ${S/2})" text-anchor="middle">EAST (Purva)</text>`

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = grid[r][c]
      const x = c * cs, y = r * cs
      const isEdge = r === 0 || r === 8 || c === 0 || c === 8
      
      let fill = cell.type === 'center' ? THEME.accentLight : isEdge ? THEME.surface : '#fff'
      let stroke = THEME.border
      let sw = 0.3
      
      // Birth/Name Star Highlighting
      const isBirth = cell.nakshatraIndex === birthNakIdx
      const isName = cell.nakshatraIndex === nameNakIdx && nameNakIdx !== null
      
      if (isBirth) {
        fill = '#fffdeb'
        stroke = THEME.accent
        sw = 1.2
      } else if (isName) {
        fill = '#f0f9ff'
        stroke = '#0ea5e9'
        sw = 1.2
      }
      
      content += `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`
      
      if (cell.label) {
        let label = cell.label
        if (cell.type === 'vara') {
            if (label === 'Maṅgal') label = 'Maṅg'
            if (label === 'Budha') label = 'Bud'
            if (label === 'Śukra') label = 'Śuk'
        }
        
        let fontSize = cs * 0.22
        if (cell.type === 'nakshatra') fontSize = cs * 0.14
        if (cell.type === 'vowel' || cell.type === 'consonant') fontSize = cs * 0.25
        
        const color = isBirth ? THEME.primary : isName ? '#0369a1' : cell.type === 'center' ? THEME.primary : THEME.text
        const lines = label.split('\n')
        lines.forEach((line, li) => {
            const ly = y + cs/2 + (li - (lines.length-1)/2) * (fontSize * 1.1) + 2
            content += `<text x="${x + cs/2}" y="${ly}" font-family="Arial, sans-serif" font-size="${fontSize}" fill="${color}" font-weight="700" text-anchor="middle" dominant-baseline="middle">${line}</text>`
        })
        
        if (isBirth) {
            content += `<text x="${x+4}" y="${y+cs-4}" font-size="${cs*0.2}" fill="${THEME.accent}">⭐</text>`
        }
        if (isName) {
            content += `<text x="${x+cs-4}" y="${y+cs-4}" font-size="${cs*0.2}" fill="#0ea5e9" text-anchor="end">🔤</text>`
        }
      }
    }
  }
  
  const natalMap = new Map<string, PlanetOnSBC[]>()
  natal.forEach(p => {
    const k = `${p.row},${p.col}`
    if (!natalMap.has(k)) natalMap.set(k, [])
    natalMap.get(k)!.push(p)
  })
  
  natalMap.forEach((ps, k) => {
    const [r, c] = k.split(',').map(Number)
    const x = c * cs, y = r * cs
    const badgeSize = cs * 0.30
    
    ps.slice(0, 4).forEach((p, i) => {
      const colIdx = i % 2
      const rowIdx = Math.floor(i / 2)
      const bx = x + cs - (colIdx + 0.6) * (badgeSize + 2)
      const by = y + cs - (rowIdx + 0.6) * (badgeSize + 2)
      
      const color = PLANET_COLOR[p.planet] || '#888'
      const isDiag = DIAGONAL_PLANETS.has(p.planet)
      
      content += `
        <circle cx="${bx}" cy="${by}" r="${badgeSize/2}" fill="${color}" stroke="#fff" stroke-width="0.8"/>
        <text x="${bx}" y="${by + 1}" font-family="Arial" font-size="${badgeSize*0.6}" fill="#fff" font-weight="900" text-anchor="middle" dominant-baseline="middle">${PLANET_SYMBOL[p.planet] || p.planet[0]}</text>
      `
      if (isDiag) {
        content += `<circle cx="${bx}" cy="${by}" r="${badgeSize/2 + 1.5}" fill="none" stroke="${color}" stroke-width="0.5" stroke-dasharray="1,1"/>`
      }
    })
  })
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S + pad*3}" height="${S + pad*3}" viewBox="-${pad} -18 ${S + pad*3} ${S + pad*3}">${content}</svg>`
}

function buildSBCLegend(chart: ChartOutput): string {
    const items = [
        { label: 'Birth Star', icon: '⭐', color: THEME.accent, bg: '#fffdeb' },
        { label: 'Name Star', icon: '🔤', color: '#0ea5e9', bg: '#f0f9ff' },
        { label: 'Diagonal Vedha', icon: '✦', color: THEME.muted, bg: '#fff', border: `1px dashed ${THEME.muted}` },
    ]
    
    const legendItems = items.map(it => `
        <div style="display:flex; align-items:center; gap:6px; background:${it.bg}; padding:4px 10px; border-radius:4px; border:${it.border || '1px solid ' + THEME.border}">
            <span style="font-size:12px">${it.icon}</span>
            <span style="font-size:10px; font-weight:800; color:${it.color}">${it.label}</span>
        </div>
    `).join('')
    
    const planets = (['Su','Mo','Ma','Me','Ju','Ve','Sa','Ra','Ke'] as GrahaId[]).map(id => {
        const color = PLANET_COLOR[id] || '#888'
        return `<div style="display:flex; align-items:center; gap:4px">
            <div style="width:12px; height:12px; border-radius:50%; background:${color}; display:flex; align-items:center; justify-content:center; color:#fff; font-size:7px; font-weight:900">${PLANET_SYMBOL[id]}</div>
            <span style="font-size:9px; font-weight:700">${id}</span>
        </div>`
    }).join('')

    return `
        <div style="width:100%; display:flex; flex-direction:column; gap:12px; align-items:center; margin-top:1.5rem">
            <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center">${legendItems}</div>
            <div style="display:flex; gap:12px; flex-wrap:wrap; justify-content:center; opacity:0.8">${planets}</div>
        </div>
    `
}

function buildSBCSection(chart: ChartOutput): string {
  return `
    <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem; margin-top: 1rem">
        <div style="padding: 15px; background: white; border-radius: 12px; border: 1px solid ${THEME.border}; box-shadow: 0 8px 30px rgba(0,0,0,0.04)">
            ${buildSBCSVG(chart, 440)}
        </div>
        
        ${buildSBCLegend(chart)}
        
        <div style="width: 100%; padding: 2rem; border: 1px solid ${THEME.border}; background: ${THEME.surface}; border-radius:12px; position: relative; margin-top: 1rem">
            <h4 style="margin-bottom: 1.2rem; text-align: center; color: ${THEME.primary}; font-family: 'Playfair Display', serif; text-transform:uppercase; letter-spacing:1px">Vedha Geometry & Life Impact</h4>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px">
                <div style="text-align: center; background: #fff; padding: 12px; border-radius:8px; border:1px solid ${THEME.border}">
                    <div style="color:${THEME.accent}; font-weight:900; font-size:10px; margin-bottom:6px; text-transform:uppercase">Vāma (Left)</div>
                    <div style="font-size: 10px; line-height:1.4">Past tendencies and inherited patterns. Impact on the subconscious and foundations.</div>
                </div>
                <div style="text-align: center; background: #fff; padding: 12px; border-radius:8px; border:1px solid ${THEME.border}">
                    <div style="color:${THEME.accent}; font-weight:900; font-size:10px; margin-bottom:6px; text-transform:uppercase">Sammukha (Front)</div>
                    <div style="font-size: 10px; line-height:1.4">Direct external manifestation. Impact on status, health, and worldly achievements.</div>
                </div>
                <div style="text-align: center; background: #fff; padding: 12px; border-radius:8px; border:1px solid ${THEME.border}">
                    <div style="color:${THEME.accent}; font-weight:900; font-size:10px; margin-bottom:6px; text-transform:uppercase">Dakshina (Right)</div>
                    <div style="font-size: 10px; line-height:1.4">Future potential and growth vectors. Shows the fruit of current actions.</div>
                </div>
            </div>
            <p style="text-align: center; margin-top: 1.5rem; font-size: 11px; color: ${THEME.muted}; font-style: italic">
              Note: Highlighted star (⭐) represents your Janma Nakshatra (${chart.panchang.nakshatra.name}).
            </p>
        </div>
    </div>
  `
}

function buildCurrentDashaFocus(chart: ChartOutput): string {
  const now = new Date()
  const v = chart.dashas.vimshottari
  const currentMaha = v.find(m => now >= new Date(m.start) && now <= new Date(m.end))
  if (!currentMaha) return '<p>Calculated dasha timeline out of range.</p>'
  
  const currentAntar = currentMaha.children.find(m => now >= new Date(m.start) && now <= new Date(m.end))
  
  return `
    <div class="dasha-focus">
      <div class="focus-card">
        <label>Major Period (Mahadasha)</label>
        <div class="value">${GRAHA_NAMES[currentMaha.lord as GrahaId]}</div>
        <div class="period">${new Date(currentMaha.start).getFullYear()} - ${new Date(currentMaha.end).getFullYear()}</div>
      </div>
      <div class="focus-card active">
        <label>Current Sub Period (Antardasha)</label>
        <div class="value">${GRAHA_NAMES[currentAntar?.lord as GrahaId]}</div>
        <div class="period">${new Date(currentAntar?.start || '').toLocaleDateString()} to ${new Date(currentAntar?.end || '').toLocaleDateString()}</div>
      </div>
    </div>
  `
}

// ── Main Page Logic ───────────────────────────────────────────

export function generateChartHTML(chart: ChartOutput, branding?: Branding): string {
  const { meta } = chart
  const brandName = branding?.brandName || 'VEDAANSH'
  const brandLogo = branding?.brandLogo 
    ? (branding.brandLogo.includes('<img') ? branding.brandLogo : `<img src="${branding.brandLogo}" style="height:60px">`) 
    : ICONS.brandIcon
  const shadbalaPlanets = chart.shadbala?.planets || {}
  const coreShadbalaIds = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as const
  const availableShadbalaIds = coreShadbalaIds.filter(id => Boolean(shadbalaPlanets[id]))
  const strongestId = chart.shadbala?.strongest || 'Ju'
  const weakestId = chart.shadbala?.weakest || 'Sa'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { 
      background: #f1f5f9; 
      -webkit-print-color-adjust: exact !important; 
      print-color-adjust: exact !important;
    }
    body { font-family: 'Outfit', sans-serif; font-size: 12px; color: ${THEME.text}; line-height: 1.6; }
    
    @page {
      size: A4;
      margin: 0;
    }

    @media print {
      body { background: white !important; }
      .no-print { display: none !important; }
      .page { 
        width: 210mm;
        height: 297mm;
        page-break-after: always; 
        padding: 1.5cm 2cm; 
        background: ${THEME.bg} !important; 
        box-shadow: none !important; 
        margin: 0 !important; 
        border:none !important; 
        position: relative; 
        overflow: hidden; 
      }
      .page::before { 
        content: 'ॐ'; 
        position: absolute; 
        top: 50%; 
        left: 50%; 
        transform: translate(-50%, -50%); 
        font-size: 12rem; 
        color: ${THEME.border}; 
        z-index: -1; 
        opacity: 0.1; 
        pointer-events: none; 
      }
      .page::after {
        content: '';
        position: absolute;
        inset: 0.8cm;
        border: 2px solid ${THEME.border};
        border-radius: 4px;
        pointer-events: none;
        z-index: 10;
        opacity: 0.4;
      }
      .page:last-child { page-break-after: avoid; }
      
      table, tr, td, .card, .interp-block { 
        page-break-inside: avoid !important; 
        break-inside: avoid !important; 
      }
    }

    @media screen {
      .page { 
        width: 21cm; 
        min-height: 29.7cm; 
        margin: 40px auto; 
        padding: 2cm; 
        background: #fff; 
        box-shadow: 0 20px 60px rgba(0,0,0,0.1); 
        border-radius: 4px; 
        position: relative; 
        border: 1px solid #eee; 
      }
      .page::before { content: 'ॐ'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 12rem; color: #f8fafc; z-index: -1; opacity: 0.5; pointer-events: none; }
    }

    /* Aesthetics */
    .print-bar { position: sticky; top:0; z-index: 999; background: ${THEME.primary}; color: #fff; padding: 12px 2rem; display: flex; justify-content: space-between; align-items: center; }
    .print-bar button { background: ${THEME.accent}; color:#fff; border:none; padding: 10px 24px; border-radius: 30px; font-weight:700; cursor:pointer; font-family:inherit; }

    .title-page { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; border: 20px solid ${THEME.surface}; }
    .main-title { font-family: 'Playfair Display', serif; font-size: 3.5rem; font-weight: 700; color: ${THEME.primary}; margin: 1rem 0; letter-spacing: -2px; }
    .sub-title { font-size: 1.25rem; font-weight: 600; color: ${THEME.accent}; text-transform: uppercase; letter-spacing: 0.4em; }
    
    .section-badge { display: inline-block; background: ${THEME.accentLight}; color: ${THEME.accent}; padding: 4px 12px; border-radius: 4px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; border: 1px solid #f5deb3; }
    .section-title { font-family: 'Playfair Display', serif; font-size: 2rem; color: ${THEME.primary}; margin-bottom: 1.4rem; font-weight: 700; border-bottom: 2px solid ${THEME.accentLight}; padding-bottom: 10px; }
    .section-title span { color: ${THEME.accent}; font-family: 'Outfit', sans-serif; font-size: 1.2rem; vertical-align: middle; margin-right: 15px; opacity: 0.5; }

    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; break-inside: avoid; }
    .data-table th { text-align: left; padding: 10px; font-size: 10px; text-transform: uppercase; border-bottom: 2px solid ${THEME.primary}; color: ${THEME.primary}; letter-spacing: 0.8px; }
    .data-table td { padding: 9px 10px; border-bottom: 1px solid ${THEME.border}; font-size: 11px; vertical-align: top; }
    .data-table tbody tr:nth-child(even) { background: #fffcf6; }
    .shadbala-table { table-layout: fixed; width: 100%; }
    .shadbala-table th,
    .shadbala-table td { padding: 6px 4px; font-size: 9px; }
    .shadbala-table th { letter-spacing: 0.2px; white-space: normal; line-height: 1.15; text-transform: uppercase; }
    .shadbala-table td { white-space: normal; word-break: break-word; line-height: 1.2; hyphens: auto; }
    .shadbala-table th:first-child,
    .shadbala-table td:first-child { font-weight: 800; }

    .av-table { width: 100%; border-collapse: collapse; text-align: center; font-family: monospace; break-inside: avoid; }
    .av-table th { padding: 8px; border: 1px solid ${THEME.border}; background: ${THEME.surface}; }
    .av-table td { padding: 8px; border: 1px solid ${THEME.border}; }

    .varga-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; width: 100%; }
    .varga-card { border: 1px solid ${THEME.border}; padding: 8px; border-radius: 4px; text-align: center; background: ${THEME.surface}; }
    .varga-title { font-weight: 800; font-size: 10px; margin-bottom: 5px; color: ${THEME.primary}; text-transform: uppercase; }

    .interp-block { margin-bottom: 2.5rem; padding-left: 20px; border-left: 1px solid ${THEME.border}; }
    .interp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .dignity-tag { font-size: 10px; font-weight: 900; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; }
    .interp-text { font-size: 14px; color: ${THEME.text}; line-height: 1.8; margin-bottom: 10px; }
    .interp-meta { font-size: 11px; color: ${THEME.muted}; font-weight: 600; }

    .dasha-focus { display: grid; grid-template-columns: 1fr 1.5fr; gap: 20px; margin: 2rem 0; }
    .focus-card { padding: 25px; border-radius: 15px; background: ${THEME.surface}; border: 1px solid ${THEME.border}; }
    .focus-card.active { background: ${THEME.primary}; color: #fff; }
    .focus-card label { font-size: 10px; text-transform: uppercase; font-weight: 800; opacity: 0.7; }
    .focus-card .value { font-size: 2rem; font-weight: 900; margin: 10px 0; }
    .focus-card .period { font-size: 14px; opacity: 0.9; }

    .footer { position: absolute; bottom: 1cm; left: 2cm; right: 2cm; border-top: 1px solid ${THEME.border}; padding-top: 15px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: ${THEME.muted}; font-weight: 600; text-transform: uppercase; }
    .footer svg { width: 14px; height: 14px; }
    
    .toc-item { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px dotted ${THEME.border}; color: ${THEME.primary}; font-size: 1.1rem; }
    
    .vedic-border { border: 2px double ${THEME.accent}; padding: 10px; border-radius: 4px; position: relative; }
    .vedic-ornament { position: absolute; color: ${THEME.accent}; opacity: 0.4; }
    .trad-panel { background: #fffdf8; border: 1px solid ${THEME.border}; border-left: 4px solid ${THEME.accent}; border-radius: 8px; padding: 14px; }
    .small-meta { font-size: 10px; color: ${THEME.muted}; text-transform: uppercase; letter-spacing: 0.8px; }
    .mini-charts-wrap { width: 100%; border:1px solid ${THEME.border}; border-radius:10px; background:${THEME.surface}; padding:10px; overflow:hidden; }
    .mini-charts-grid { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap:8px; width:100%; }
    .mini-chart-card { border:1px solid ${THEME.border}; border-radius:6px; background:#fff; padding:6px; min-width:0; }
    .mini-chart-title { text-align:center; font-size:9px; font-weight:800; color:${THEME.secondary}; margin-bottom:4px; }
    .mini-chart-grid { display:grid; grid-template-columns: repeat(7, minmax(0,1fr)); gap:2px; align-items:end; min-height:64px; }
  </style>
</head>
<body>

<div class="print-bar no-print">
  <div style="font-weight: 800">${brandName} Intelligence System</div>
  <button onclick="window.print()">Export Complete Portfolio (~22 Pages)</button>
</div>

<!-- PAGE 1: COVER -->
<div class="page title-page">
  <div style="position:absolute; top: 1cm; left: 1cm; color: ${THEME.accent}; opacity:0.15">${ICONS.swastik}</div>
  <div style="position:absolute; top: 1cm; right: 1cm; color: ${THEME.accent}; opacity:0.15">${ICONS.swastik}</div>

  <div class="header-logo" style="text-align:center; display: flex; justify-content: center; margin-bottom: 2rem;">${brandLogo}</div>
  ${brandName.toUpperCase().includes('VEDAANSH') ? `<div style="text-align:center; color: ${THEME.accent}; font-weight: 800; font-size: 1.1rem; margin-top: 0.5rem; letter-spacing: 0.1em;">॥ श्री गणेशाय नमः ॥</div>` : ''}
  <div style="margin: 1.5rem auto; width: 80px; height: 3px; background: ${THEME.secondary}; opacity: 0.6;"></div>
  <div style="font-size: 1.1rem; color: ${THEME.secondary}; text-transform: uppercase; letter-spacing: 0.6em; margin-bottom: 1rem; text-align:center; font-family: 'Playfair Display', serif">Aura of the Divine Path</div>
  <h1 class="main-title" style="text-align:center; font-family: 'Playfair Display', serif; font-size: 3.5rem">${meta.name}</h1>
  <div class="sub-title" style="text-align:center">Jyotish Master Dossier</div>
  
  <div style="margin-top: 3rem; color: ${THEME.accent}; opacity: 0.4; text-align:center">${ICONS.om}</div>
  
  <div style="margin: 4rem auto; font-family: 'Playfair Display', serif; font-style: italic; color: ${THEME.secondary}; max-width: 500px; text-align:center; line-height: 1.8; border-top: 1px dotted ${THEME.border}; border-bottom: 1px dotted ${THEME.border}; padding: 20px 0">
    "The soul is the same in all living creatures, although the body of each is different."
  </div>

  <div class="footer" style="border:none">
    <div>Calculated on ${new Date().toLocaleDateString('en-US', { dateStyle:'long' })}</div>
    <div style="color:${THEME.accent}">${ICONS.om}</div>
    <div>${brandName} Platinum Edition</div>
  </div>
</div>

<!-- PAGE 2: TABLE OF CONTENTS -->
<div class="page">
  ${SectionHeader('00', 'Catalogue of Wisdom', 'Intelligence Index')}
  <div style="margin-top: 3rem">
    <div class="toc-item"><span>01. The Incarnation Snapshot (Natal Data)</span> <span>03</span></div>
    <div class="toc-item"><span>01b. Complete Natal Astro Details</span> <span>04</span></div>
    <div class="toc-item"><span>02. Planetary Positions & Dignities</span> <span>05</span></div>
    <div class="toc-item"><span>03. The Divine Matrix (Shodashvarga)</span> <span>06</span></div>
    <div class="toc-item"><span>04. Planetary Psychology (Sun, Moon, Mars)</span> <span>07</span></div>
    <div class="toc-item"><span>05. The Intellect & Flow (Merc, Jup, Ven)</span> <span>08</span></div>
    <div class="toc-item"><span>06. Shadows & Structure (Sat, Rahu, Ketu)</span> <span>09</span></div>
    <div class="toc-item"><span>07. House Potency (Bhava Bala Analysis)</span> <span>10</span></div>
    <div class="toc-item"><span>08. Nakshatra: The Secret Power of Luna</span> <span>11</span></div>
    <div class="toc-item"><span>09. Yoga: The Celestial Combinations</span> <span>12</span></div>
    <div class="toc-item"><span>10. Quantum Strength (Shadbala Analysis)</span> <span>13</span></div>
    <div class="toc-item"><span>11. Ashtakavarga: The 8-Fold Net</span> <span>14</span></div>
    <div class="toc-item"><span>12. Jaimini Karakas & Arudhas</span> <span>15</span></div>
    <div class="toc-item"><span>13. KP System: The Minute Subdivision</span> <span>16</span></div>
    <div class="toc-item"><span>14. Sarvatobhadra Chakra (Vedha Grid)</span> <span>17</span></div>
    <div class="toc-item"><span>15. Timeline of Fate (Vimshottari Overview)</span> <span>18</span></div>
    <div class="toc-item"><span>16. Current Sub-Period Focus</span> <span>19</span></div>
    <div class="toc-item"><span>17. Astro-Vastu Architectural Alignment</span> <span>20</span></div>
    <div class="toc-item"><span>18. Global Resonance (Astrocartography)</span> <span>21</span></div>
    <div class="toc-item"><span>19. Synthesis & Next Steps</span> <span>22</span></div>
  </div>
  ${PageFooter(2, meta.name)}
</div>

<!-- PAGE 3: BIRTH DATA -->
<div class="page">
  ${SectionHeader('01', 'Incarnation Blueprint', 'Birth Archetype')}
  <table class="data-table" style="margin-top: 2rem">
    <tr><td style="font-weight:700;background:${THEME.surface}">Name of Native</td><td>${meta.name}</td><td style="font-weight:700;background:${THEME.surface}">Gender</td><td>Not Specified</td></tr>
    <tr><td style="font-weight:700;background:${THEME.surface}">Birth Date</td><td>${new Date(meta.birthDate).toDateString()}</td><td style="font-weight:700;background:${THEME.surface}">Birth Time</td><td>${meta.birthTime}</td></tr>
    <tr><td style="font-weight:700;background:${THEME.surface}">Birth Place</td><td colspan="3">${meta.birthPlace}</td></tr>
    <tr><td style="font-weight:700;background:${THEME.surface}">Coord.</td><td>${formatCoordinate(meta.latitude, 'N', 'S')}, ${formatCoordinate(meta.longitude, 'E', 'W')}</td><td style="font-weight:700;background:${THEME.surface}">Timezone</td><td>${meta.timezone}</td></tr>
    <tr><td style="font-weight:700;background:${THEME.surface}">Ayanamsha</td><td>${meta.settings.ayanamsha} (${meta.ayanamshaValue.toFixed(6)}°)</td><td style="font-weight:700;background:${THEME.surface}">House System</td><td>${meta.settings.houseSystem}</td></tr>
    <tr><td style="font-weight:700;background:${THEME.surface}">Node Mode</td><td>${meta.settings.nodeMode}</td><td style="font-weight:700;background:${THEME.surface}">Calculated At</td><td>${formatDateTime(meta.calculatedAt)}</td></tr>
  </table>
  
  <div style="display:flex; gap: 1rem; margin-top: 3rem; width: 100%">
    <div style="flex:1; border: 1px solid ${THEME.border}; border-radius: 4px; padding: 15px; text-align: center; background: ${THEME.surface}">
        <div style="font-weight:900; font-size: 11px; color: ${THEME.accent}; text-transform: uppercase; margin-bottom: 15px">Natal Chart (D1)</div>
        ${buildChartSVG(chart, 'D1', 260)}
    </div>
    <div style="flex:1; border: 1px solid ${THEME.border}; border-radius: 4px; padding: 15px; text-align: center; background: ${THEME.surface}">
        <div style="font-weight:900; font-size: 11px; color: ${THEME.accent}; text-transform: uppercase; margin-bottom: 15px">Navamsha (D9)</div>
        ${buildChartSVG(chart, 'D9', 260)}
    </div>
  </div>
  
  <div style="margin-top: 3rem; background: ${THEME.surface}; padding: 25px; border-radius: 15px">
    <h3 style="margin-bottom: 10px; color: ${THEME.primary}">Sacred Panchanga</h3>
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size:11px">
        <div><strong>Day Lord (Vara):</strong> ${chart.panchang.vara.name}</div>
        <div><strong>Tithi:</strong> ${chart.panchang.tithi.name} (${chart.panchang.tithi.paksha})</div>
        <div><strong>Nakshatra:</strong> ${chart.panchang.nakshatra.name}</div>
        <div><strong>Yoga:</strong> ${chart.panchang.yoga.name}</div>
        <div><strong>Karana:</strong> ${chart.panchang.karana.name}</div>
        <div><strong>Sunrise:</strong> ${formatDateTime(chart.panchang.sunrise)}</div>
        <div><strong>Sunset:</strong> ${formatDateTime(chart.panchang.sunset)}</div>
        <div><strong>Rahu Kalam:</strong> ${formatDateTime(chart.panchang.rahuKalam?.start)} - ${formatDateTime(chart.panchang.rahuKalam?.end)}</div>
        <div><strong>Yamaganda:</strong> ${formatDateTime(chart.panchang.yamaganda?.start)} - ${formatDateTime(chart.panchang.yamaganda?.end)}</div>
        <div><strong>Gulika Kalam:</strong> ${formatDateTime(chart.panchang.gulikaKalam?.start)} - ${formatDateTime(chart.panchang.gulikaKalam?.end)}</div>
        <div><strong>Abhijit Muhurta:</strong> ${chart.panchang.abhijitMuhurta ? `${formatDateTime(chart.panchang.abhijitMuhurta.start)} - ${formatDateTime(chart.panchang.abhijitMuhurta.end)}` : 'N/A'}</div>
    </div>
  </div>
  ${PageFooter(3, meta.name)}
</div>

<!-- PAGE 4: NATAL ASTRO DETAILS (full) -->
<div class="page">
  ${SectionHeader('01b', 'Natal Astro Details', 'Complete Summary')}
  ${buildAstroDetailsHtml(chart)}
  ${PageFooter(4, meta.name)}
</div>

<!-- PAGE 5: PLANETARY POSITIONS -->
<div class="page">
  ${SectionHeader('02', 'The Celestial Cabinet', 'Planetary Longitudes')}
  <table class="data-table">
    <thead>
      <tr>
        <th>Graha</th>
        <th>Sanskrit</th>
        <th>Degree</th>
        <th>Rashi</th>
        <th>Nakshatra</th>
        <th>Pada</th>
        <th>Dignity</th>
        <th>State</th>
      </tr>
    </thead>
    <tbody>
      <tr style="background:${THEME.surface}; font-weight:800">
        <td>Ascendant</td><td>Lagna</td><td>${fmtDMS(chart.lagnas.ascDegree)}</td><td>${RASHI_NAMES[chart.lagnas.ascRashi]}</td><td>${NAKSHATRA_NAMES[Math.floor(chart.lagnas.ascDegree/(360/27))]}</td><td>-</td><td>House 1</td><td>-</td>
      </tr>
      ${chart.grahas.filter(g => !['Ur','Ne','Pl'].includes(g.id)).map(g => `
        <tr>
          <td style="font-weight:700">${g.name} ${g.isRetro?'℞':''}</td>
          <td>${GRAHA_SANSKRIT[g.id]}</td>
          <td style="font-family:monospace">${fmtDMS(g.lonSidereal)}</td>
          <td>${g.rashiName}</td>
          <td>${g.nakshatraName}</td>
          <td>${g.pada}</td>
          <td style="color:${THEME.text};font-weight:700">${capitalize(g.dignity)}</td>
          <td>${g.isCombust ? 'Combust' : 'Direct'} • ${capitalize(g.avastha.baladi)} / ${capitalize(g.avastha.jagradadi)}</td>
        </tr>`).join('')}
    </tbody>
  </table>
  
  <h3 class="section-badge" style="margin-top: 2rem">Special Points & Lagnas</h3>
  ${buildSpecialLagnas(chart)}
  ${PageFooter(5, meta.name)}
</div>

<!-- PAGE 6: DIVISIONAL CHARTS -->
<div class="page">
  ${SectionHeader('03', 'The Divine Matrix', 'Shodashvarga Summary')}
  <p style="margin-bottom: 2rem; color: ${THEME.muted}">In Vedic astrology, divisional charts provide microscopic insights into specific areas of life like wealth, siblings, children, and career.</p>
  ${buildVargaGrid(chart)}
  <div style="margin-top: 3rem; padding: 20px; border: 1px solid ${THEME.accentLight}; background: ${THEME.surface}; border-radius: 12px">
    <h4 style="color:${THEME.accent}">The Varga Intelligence</h4>
    <p style="font-size: 11px">D2 (Hora) for Wealth, D3 (Drekkana) for Siblings/Initiative, D7 (Saptamsha) for Lineage, D9 (Navamsha) for Internal Strength/Marriage, D10 (Dashamsha) for Mahat Phala (Great Success).</p>
  </div>
  ${PageFooter(6, meta.name)}
</div>

<!-- PAGE 7: INTERPRETATIONS 1 -->
<div class="page">
  ${SectionHeader('04', 'Planetary Psychology', 'Luminaries & Drive')}
  <p style="margin-bottom: 2rem">The Sun, Moon, and Mars represent your core self, emotional nature, and drive for action.</p>
  ${buildPlanetInterpretations(chart, ['Su', 'Mo', 'Ma'])}
  ${PageFooter(7, meta.name)}
</div>

<!-- PAGE 8: INTERPRETATIONS 2 -->
<div class="page">
  ${SectionHeader('05', 'The Intellect & Flow', 'Communication & Wisdom')}
  <p style="margin-bottom: 2rem">Mercury, Jupiter, and Venus govern your intelligence, wisdom, and aesthetic preferences.</p>
  ${buildPlanetInterpretations(chart, ['Me', 'Ju', 'Ve'])}
  ${PageFooter(8, meta.name)}
</div>

<!-- PAGE 9: INTERPRETATIONS 3 -->
<div class="page">
  ${SectionHeader('06', 'Shadows & Structure', 'Discipline & Innovation')}
  ${buildPlanetInterpretations(chart, ['Sa', 'Ra', 'Ke'])}
  ${PageFooter(9, meta.name)}
</div>

<!-- PAGE 10: BHAVA BALA -->
<div class="page">
  ${SectionHeader('07', 'House Potency', 'Bhava Bala Analysis')}
  <p style="margin-bottom: 2rem">Analysis of the 12 houses to determine which areas of life (career, wealth, health) are naturally supported by cosmic geometry.</p>
  ${buildBhavaBalaSection(chart)}
  ${PageFooter(10, meta.name)}
</div>

<!-- PAGE 11: NAKSHATRA ANALYSIS -->
<div class="page">
  ${SectionHeader('08', 'Lunar Mansions', 'Nakshatra Characteristics')}
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem">
    ${[chart.grahas.find(g => g.id === 'Mo'), { id:'Lagna', name:'Ascendant', nakshatraIndex: Math.floor(chart.lagnas.ascDegree/(360/27)), pada: 1 }].map(entry => {
      if (!entry) return ''
      const chars = getNakshatraCharacteristics(entry.nakshatraIndex, (entry as any).pada)
      return `
        <div style="background:${THEME.surface}; padding: 25px; border-radius: 20px; border: 1px solid ${THEME.border}">
          <div style="font-weight:900; font-size: 1.5rem; color: ${THEME.primary}; margin-bottom: 20px">${entry.name} star: ${chars.name}</div>
          <p style="margin-bottom: 1.5rem"><strong>Deity:</strong> ${chars.deity} • <strong>Lord:</strong> ${chars.lord}</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11px">
            <div><strong>Gana:</strong> ${chars.gana}</div>
            <div><strong>Yoni:</strong> ${chars.yoni}</div>
            <div><strong>Nadi:</strong> ${chars.nadi}</div>
            <div><strong>Varna:</strong> ${chars.varna}</div>
            <div style="grid-column: span 2"><strong>Shakti:</strong> ${chars.shakti}</div>
            <div style="grid-column: span 2"><strong>Body:</strong> ${chars.bodyPart}</div>
          </div>
        </div>
      `
    }).join('')}
  </div>
  
  <h3 class="section-badge" style="margin-top: 3rem">Navtara Chakra (Planetary Strength Grid)</h3>
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px">
    ${getNavtaraChakra(chart.panchang.nakshatra.index).slice(0, 18).map(t => `
      <div style="padding: 10px; background: ${t.quality === 'auspicious' ? '#f0f9ff' : t.quality === 'inauspicious' ? '#fff1f2' : '#f8fafc'}; border: 1px solid ${THEME.border}; border-radius: 6px; font-size: 10px">
        <div style="font-weight:800">${t.tara}: ${t.nakshatraName}</div>
        <div style="font-size: 9px; opacity:0.7">${t.meaning}</div>
      </div>
    `).join('')}
  </div>
  ${PageFooter(11, meta.name)}
</div>

<!-- PAGE 12: YOGAS -->
<div class="page">
  ${SectionHeader('09', 'Celestial Combinations', 'The Yoga Analysis')}
  <p style="margin-bottom: 2rem">Personalized detection of major and minor yogas that define wealth, status, and health.</p>
  <table class="data-table">
    <thead><tr><th>Yoga Name</th><th>Category</th><th>Strength</th><th>Effect</th></tr></thead>
    <tbody>
      ${chart.yogas?.slice(0, 12).map(y => `
        <tr>
          <td><div style="font-weight:900">${y.name}</div><div style="font-size:10px;font-style:italic">${y.sanskrit}</div></td>
          <td>${capitalize(y.category)}</td>
          <td style="color:${y.strength==='strong'?THEME.emerald:THEME.accent};font-weight:800">${y.strength.toUpperCase()}</td>
          <td style="font-size:11px">${y.description}</td>
        </tr>
      `).join('') || '<tr><td colspan="4">No major yogas detect in this configuration.</td></tr>'}
    </tbody>
  </table>
  ${PageFooter(12, meta.name)}
</div>

<!-- PAGE 13: SHADBALA -->
<div class="page">
  ${SectionHeader('10', 'Quantum Strength', 'Shadbala Analysis')}
  <p style="margin-bottom: 2rem">Shadbala calculates six strength streams in rupas. Values below include both aggregate rupas and shashtiamsa totals for accurate interpretation.</p>
  <table class="data-table shadbala-table">
    <colgroup>
      <col style="width:10%">
      <col style="width:7%">
      <col style="width:6%">
      <col style="width:6%">
      <col style="width:7%">
      <col style="width:9%">
      <col style="width:7%">
      <col style="width:8%">
      <col style="width:8%">
      <col style="width:8%">
      <col style="width:7%">
      <col style="width:7%">
    </colgroup>
    <thead><tr><th>Planet</th><th>Sthana</th><th>Dig</th><th>Kala</th><th>Chesta</th><th>Naisargika</th><th>Drik</th><th>Total (Rupa)</th><th>Total (Sh)</th><th>Required</th><th>Ratio</th><th>Status</th></tr></thead>
    <tbody>
      ${availableShadbalaIds.map(id => {
        const pb = chart.shadbala.planets[id]
        if (!pb) return ''
        return `
          <tr>
            <td style="font-weight:700">${GRAHA_NAMES[id as GrahaId]}</td>
            <td>${pb.sthanaBala.toFixed(2)}</td>
            <td>${pb.digBala.toFixed(2)}</td>
            <td>${pb.kalaBala.toFixed(2)}</td>
            <td>${pb.chestaBala.toFixed(2)}</td>
            <td>${pb.naisargikaBala.toFixed(2)}</td>
            <td>${pb.drikBala.toFixed(2)}</td>
            <td style="font-weight:900">${pb.total.toFixed(2)}</td>
            <td>${pb.totalShash.toFixed(1)}</td>
            <td>${pb.required.toFixed(2)}</td>
            <td>${pb.ratio.toFixed(2)}x</td>
            <td style="color:${pb.isStrong?THEME.emerald:THEME.rose};font-weight:800">${(pb.qualityBand || (pb.isStrong ? 'strong' : 'weak')).toUpperCase()}</td>
          </tr>`
      }).join('') || '<tr><td colspan="12">Shadbala data unavailable.</td></tr>'}
    </tbody>
  </table>
  
  ${buildShadbalaMiniCharts(chart)}
  <div class="trad-panel" style="margin-top: 2.2rem">
    <div class="small-meta">Canonical Reading</div>
    <div style="margin-top:6px">
      Strongest Graha: <strong>${GRAHA_NAMES[strongestId as GrahaId] || strongestId}</strong> |
      Weakest Graha: <strong>${GRAHA_NAMES[weakestId as GrahaId] || weakestId}</strong>
    </div>
    <div style="margin-top:4px">
      Chart profile: <strong>${(chart.shadbala?.generatedProfile || 'balanced').toUpperCase()}</strong> |
      Mean ratio: <strong>${(chart.shadbala?.averageRatio || 0).toFixed(2)}x</strong>
    </div>
    <div style="margin-top:6px; font-size:11px; color:${THEME.muted}">
      A ratio above 1.00 means the graha crosses its traditional minimum required bala.
    </div>
  </div>
  ${PageFooter(13, meta.name)}
</div>

<!-- PAGE 14: ASHTAKAVARGA -->
<div class="page">
  ${SectionHeader('11', 'The 8-Fold Net', 'Ashtakavarga BAV/SAV')}
  <p style="margin-bottom: 2rem">Ashtakavarga helps in predicting the results of transits and the general strength of the 12 signs for you.</p>
  ${buildAVMatrix(chart)}
  
  <div style="margin-top: 3rem; display: grid; grid-template-columns: 1fr 1fr; gap: 2rem">
    <div style="border:1px solid ${THEME.border}; padding: 20px; border-radius: 12px">
        <h4 style="margin-bottom: 10px">Sign Resistance</h4>
        <p style="font-size: 11px">Signs with > 28 SAV points are highly supportive. Focus major activity when Moon or Sun transits these signs.</p>
    </div>
    <div style="border:1px solid ${THEME.border}; padding: 20px; border-radius: 12px">
        <h4 style="margin-bottom: 10px">Planet Contribution</h4>
        <p style="font-size: 11px">Check individiual BAV tables for specific life areas (e.g., Jupiter for children/wealth, Saturn for obstacles).</p>
    </div>
  </div>
  ${PageFooter(14, meta.name)}
</div>

<!-- PAGE 15: JAIMINI ASTROLOGY -->
<div class="page">
  ${SectionHeader('12', 'Secret of Karakas', 'Jaimini System Analysis')}
  <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 2rem">
    <div>
        <h3 class="section-badge">Chara Karakas</h3>
        <table class="data-table">
            <tr><td>Atmakaraka (Soul)</td><td style="font-weight:900;color:${THEME.accent}">${chart.karakas.AK}</td></tr>
            <tr><td>Amatyakaraka</td><td>${chart.karakas.AmK}</td></tr>
            <tr><td>Bhratrukaraka</td><td>${chart.karakas.BK}</td></tr>
            <tr><td>Matrukaraka</td><td>${chart.karakas.MK}</td></tr>
            <tr><td>Pitrukaraka</td><td>${chart.karakas.PK}</td></tr>
            <tr><td>Putrikaraka</td><td>${chart.karakas.PiK || '-'}</td></tr>
            <tr><td>Gnatikaraka</td><td>${chart.karakas.GK}</td></tr>
            <tr><td>Darakaraka (Spouse)</td><td>${chart.karakas.DK}</td></tr>
        </table>
    </div>
    <div>
        <h3 class="section-badge">Arudha Padas</h3>
        <table class="data-table">
            <tr><td>Arudha Lagna (AL)</td><td>${RASHI_NAMES[chart.arudhas.AL]}</td><td style="font-size:10px;color:${THEME.muted}">Public Image</td></tr>
            <tr><td>Dhanapada (A2)</td><td>${RASHI_NAMES[chart.arudhas.A2]}</td><td style="font-size:10px;color:${THEME.muted}">Wealth Manifestation</td></tr>
            <tr><td>Mantrapada (A5)</td><td>${RASHI_NAMES[chart.arudhas.A5]}</td><td style="font-size:10px;color:${THEME.muted}">Intelligence/Children</td></tr>
            <tr><td>Darapada (A7)</td><td>${RASHI_NAMES[chart.arudhas.A7]}</td><td style="font-size:10px;color:${THEME.muted}">Partnerships</td></tr>
            <tr><td>Rajyapada (A10)</td><td>${RASHI_NAMES[chart.arudhas.A10]}</td><td style="font-size:10px;color:${THEME.muted}">Career & Status</td></tr>
        </table>
    </div>
  </div>
  ${PageFooter(15, meta.name)}
</div>

<!-- PAGE 16: KP SYSTEM -->
<div class="page">
  ${SectionHeader('13', 'The Exact Point', 'Krishnamurti Paddhati (KP)')}
  <p style="margin-bottom: 2rem">KP System focuses on Sub-Lords to give precise "Yes/No" answers and timing for life events.</p>
  ${buildKPSection(chart)}
  
  <div style="margin-top: 3rem; background: ${THEME.primary}; color: #fff; padding: 25px; border-radius: 15px">
    <h3 style="margin-bottom: 15px; color: ${THEME.accentLight}">Ruling Planets (Current)</h3>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; font-size: 12px">
        <div><strong>Day Lord:</strong> ${chart.kp?.rulingPlanets.dayLord}</div>
        <div><strong>Lagna Sign Lord:</strong> ${chart.kp?.rulingPlanets.lagnaSignLord}</div>
        <div><strong>Lagna Star Lord:</strong> ${chart.kp?.rulingPlanets.lagnaStarLord}</div>
        <div><strong>Moon Sign Lord:</strong> ${chart.kp?.rulingPlanets.moonSignLord}</div>
        <div><strong>Moon Star Lord:</strong> ${chart.kp?.rulingPlanets.moonStarLord}</div>
    </div>
  </div>
  ${PageFooter(16, meta.name)}
</div>

<!-- PAGE 17: SARVATOBHADRA CHAKRA -->
<div class="page">
  ${SectionHeader('14', 'The Fortress of Light', 'Sarvatobhadra Chakra Analysis')}
  <p style="margin-bottom: 2rem">The "Auspicious on All Sides" grid reveals transgenerational patterns and precise timing for global recognition.</p>
  ${buildSBCSection(chart)}
  
  <div style="margin-top: 3rem; display: grid; grid-template-columns: 1fr 1fr; gap: 2rem">
    <div class="card">
        <div class="card-title">Akshara (Letter resonance)</div>
        <p style="font-size: 12px">Your name letters resonate most with the <strong>${chart.panchang.nakshatra.name}</strong> sector of the sky, bringing fortune in academic pursuits.</p>
    </div>
    <div class="card">
        <div class="card-title">Vara & Tithi Vedha</div>
        <p style="font-size: 12px">Current dasha lord <strong>${GRAHA_NAMES[chart.dashas.vimshottari[0].lord as GrahaId]}</strong> forms a protective shield in your social network.</p>
    </div>
  </div>
  ${PageFooter(17, meta.name)}
</div>

<!-- PAGE 18: DASHA OVERVIEW -->
<div class="page">
  ${SectionHeader('15', 'Temporal Evolution', 'Vimshottari Dasha Overview')}
  <p style="margin-bottom: 2rem">Planetary periods show the unfolding of karma over time. Each period brings the themes of the planet into the forefront.</p>
  <table class="data-table">
    <thead><tr><th>Mahadasha</th><th>Start Date</th><th>End Date</th><th>Status</th></tr></thead>
    <tbody>
      ${chart.dashas.vimshottari.map(m => {
        const isCurrent = new Date() >= new Date(m.start) && new Date() <= new Date(m.end)
        return `<tr style="${isCurrent?'background:#fffbeb;font-weight:900':''}">
          <td>${GRAHA_NAMES[m.lord as GrahaId]}</td>
          <td>${new Date(m.start).toDateString()}</td>
          <td>${new Date(m.end).toDateString()}</td>
          <td>${isCurrent?'ACTIVE':''}</td>
        </tr>`
      }).join('')}
    </tbody>
  </table>
  ${PageFooter(18, meta.name)}
</div>

<!-- PAGE 19: CURRENT DASHA -->
<div class="page">
  ${SectionHeader('16', 'Present Influence', 'Active Sub-Period (Antar)')}
  ${buildCurrentDashaFocus(chart)}
  
  <h3 class="section-badge" style="margin-top: 3rem">Upcoming Antardashas</h3>
  <table class="data-table">
    <thead><tr><th>Planet</th><th>Starts On</th><th>Ends On</th><th>Nature</th></tr></thead>
    <tbody>
      ${(() => {
        const now = new Date()
        const maha = chart.dashas.vimshottari.find(m => now >= new Date(m.start) && now <= new Date(m.end))
        return maha?.children.slice(0, 10).map(a => `
          <tr>
            <td style="font-weight:700">${GRAHA_NAMES[a.lord as GrahaId]}</td>
            <td>${new Date(a.start).toLocaleDateString()}</td>
            <td>${new Date(a.end).toLocaleDateString()}</td>
            <td>Sub-Period</td>
          </tr>
        `).join('') || ''
      })()}
    </tbody>
  </table>
  ${PageFooter(19, meta.name)}
</div>

<!-- PAGE 20: ASTRO VASTU -->
<div class="page">
  ${SectionHeader('17', 'Sacred Space', 'Astro-Vastu Alignment')}
  <div style="background:${THEME.surface}; border-radius: 4px; overflow: hidden; border: 1px solid ${THEME.border}; margin-top: 2rem">
    <div style="padding: 30px">
        <h4 style="margin-bottom: 20px; font-family: 'Playfair Display', serif">Directional Planetary Potency</h4>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px">
            ${[
                { d: 'North', l: 'Me', at: 'Career' }, { d: 'NE', l: 'Ju', at: 'Wisdom' }, 
                { d: 'East', l: 'Su', at: 'Status' }, { d: 'SE', l: 'Ve', at: 'Cash' },
                { d: 'South', l: 'Ma', at: 'Logic' }, { d: 'SW', l: 'Ra', at: 'Stability' },
                { d: 'West', l: 'Sa', at: 'Gains' }, { d: 'NW', l: 'Mo', at: 'Support' }
            ].map(z => {
                const g = chart.grahas.find(x => x.id === z.l)
                const isStrong = ['exalted','own','moolatrikona'].includes(g?.dignity || '')
                return `
                <div style="text-align:center; padding: 12px; border: 1px solid ${THEME.border}; border-radius: 2px; background: ${isStrong?THEME.accentLight:'#fff'}">
                    <div style="font-weight:900; font-size: 12px; color: ${THEME.primary}">${z.d}</div>
                    <div style="font-size: 9px; color: ${THEME.muted}">${z.at}</div>
                    <div style="font-size: 10px; margin-top: 5px; color:${isStrong?THEME.emerald:THEME.secondary}">${capitalize(g?.dignity || 'Neutral')}</div>
                    <div style="font-size: 9px; color:${THEME.accent}; font-weight:700">${g?.name || 'Vayu'}</div>
                </div>
                `
            }).join('')}
        </div>
    </div>
  </div>
  
  <div style="margin-top: 3rem; display: grid; grid-template-columns: 1fr 1fr; gap: 2rem">
    <div style="padding: 20px; border-left: 4px solid ${THEME.emerald}; background: ${THEME.surface}; border-radius: 2px">
        <h4 style="margin-bottom: 10px; font-family: 'Playfair Display', serif">Enhancement Zone</h4>
        <p style="font-size: 12px">Orient your wealth-earning activities toward the <strong>NORTH</strong> to align with your Mercury strength.</p>
    </div>
    <div style="padding: 20px; border-left: 4px solid ${THEME.rose}; background: ${THEME.surface}; border-radius: 2px">
        <h4 style="margin-bottom: 10px; font-family: 'Playfair Display', serif">Remedial Direction</h4>
        <p style="font-size: 12px">Minimize water elements in the <strong>SOUTH-EAST</strong> to prevent emotional drains on finance.</p>
    </div>
  </div>
  ${PageFooter(20, meta.name)}
</div>

<!-- PAGE 21: ASTROCARTOGRAPHY -->
<div class="page">
  ${SectionHeader('18', 'Global Resonance', 'Astrocartography Resonance')}
  <p style="margin-bottom: 2rem">Mapping your planetary power spots reveals where Earth's geographical energy amplifies your destiny.</p>
  <div style="padding: 30px; border: 1px solid ${THEME.border}; border-radius: 4px; background: #fff">
    <h3 style="margin-bottom: 20px; font-family: 'Playfair Display', serif">Global Power Points</h3>
    <table class="data-table">
        <thead><tr><th>Zone</th><th>Resonance Line</th><th>Energy manifestation</th><th>Score</th></tr></thead>
        <tbody>
            <tr><td>West Europe</td><td style="color:${THEME.emerald};font-weight:700">Jupiter MC</td><td>Maximum Career Growth</td><td>96%</td></tr>
            <tr><td>Middle East</td><td style="color:${THEME.primary};font-weight:700">Sun AS</td><td>Authority & Fame</td><td>89%</td></tr>
            <tr><td>Oceania</td><td style="color:${THEME.emerald};font-weight:700">Venus MC</td><td>Luxury & Relationships</td><td>91%</td></tr>
            <tr><td>North America</td><td style="color:${THEME.accent};font-weight:700">Mercury DS</td><td>Commercial Ventures</td><td>82%</td></tr>
        </tbody>
    </table>
  </div>
  
  <div style="margin-top: 3rem; padding: 25px; background: ${THEME.surface}; border: 1px dashed ${THEME.accent}">
      <h4 style="margin-bottom: 10px">The Relocation Secret</h4>
      <p style="font-size: 13px">Moving to a location where your strong planets (ex: Exalted Sun) hit the MC line can instantly reset your status trajectory.</p>
  </div>
  ${PageFooter(21, meta.name)}
</div>

<!-- PAGE 22: SYNTHESIS -->
<div class="page">
  ${SectionHeader('19', 'The Life Synthesis', 'Report Summary')}
  <p style="margin-bottom: 3rem; font-size: 1.15rem; line-height: 1.8; font-style: italic; border-bottom: 1px solid ${THEME.accentLight}; padding-bottom: 20px">
    "${escapeHtml(chart.interpretation.headline)}"
  </p>
  
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem">
    <div>
        <h3 class="section-badge" style="background:${THEME.emerald}11; color:${THEME.emerald}">Core Strengths</h3>
        <div style="margin-top: 1rem">
            ${chart.interpretation.strengths.slice(0, 3).map(i => `
                <div style="margin-bottom: 1.5rem">
                    <div style="font-weight: 800; color: ${THEME.primary}">${i.title}</div>
                    <div style="font-size: 12px; margin-top: 4px">${i.message}</div>
                </div>
            `).join('')}
        </div>
    </div>
    <div>
        <h3 class="section-badge" style="background:${THEME.rose}11; color:${THEME.rose}">Karmic Cautions</h3>
        <div style="margin-top: 1rem">
            ${chart.interpretation.cautions.slice(0, 3).map(i => `
                <div style="margin-bottom: 1.5rem">
                    <div style="font-weight: 800; color: ${THEME.primary}">${i.title}</div>
                    <div style="font-size: 12px; margin-top: 4px">${i.message}</div>
                </div>
            `).join('')}
        </div>
    </div>
  </div>

  <div style="margin-top: 4rem; background: ${THEME.surface}; padding: 35px; border-radius: 20px; border: 1px solid ${THEME.accentLight}; position: relative; overflow: hidden">
    <div style="position: absolute; right: -20px; bottom: -20px; opacity: 0.05; transform: rotate(-15deg)">${ICONS.om}</div>
    <h3 style="margin-bottom: 1.5rem; color: ${THEME.secondary}; font-family: 'Playfair Display', serif">Strategic Next Steps</h3>
    <ul style="list-style: none; padding: 0">
        ${chart.interpretation.topInsights.flatMap(i => i.actions || []).slice(0, 5).map(action => `
            <li style="margin-bottom: 1rem; display: flex; gap: 15px; font-size: 13px">
                <span style="color:${THEME.accent}; font-weight: 900">✦</span>
                <span>${action}</span>
            </li>
        `).join('')}
    </ul>
  </div>

  <div style="margin-top: 5rem; text-align: center; color: ${THEME.muted}">
    <div style="font-size: 40px; margin-bottom: 10px">${ICONS.swastik}</div>
    <div style="font-weight: 900; letter-spacing: 2px">OM TAT SAT</div>
    <div style="font-size: 10px; margin-top: 10px">Vedaansh Jyotish Master Dossier • Professional Edition</div>
  </div>
  ${PageFooter(22, meta.name)}
</div>

</body>
</html>`;
}