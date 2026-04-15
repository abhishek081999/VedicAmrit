// ─────────────────────────────────────────────────────────────
//  src/lib/pdf/chartHtml.ts
//  Generates a premium, multi-page Jyotish Master Dossier.
//  Optimized for print-to-PDF via browser.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaData, Rashi, GrahaId } from '@/types/astrology'
import {
  GRAHA_NAMES, RASHI_NAMES, RASHI_SHORT, NAKSHATRA_NAMES,
} from '@/types/astrology'

interface Branding {
  brandName?: string | null
  brandLogo?: string | null
}

// ── Colors & Theme ────────────────────────────────────────────
const THEME = {
  primary: '#1e3a5f', // Deep Indigo
  accent:  '#b8860b', // Deep Gold
  border:  '#e2e8f0',
  text:    '#334155',
  muted:   '#94a3b8',
  bg:      '#ffffff',
  surface: '#f8fafc',
}

// ── Helpers ───────────────────────────────────────────────────

function fmtDMS(totalDeg: number): string {
  const rashiIdx = Math.floor(((totalDeg % 360) + 360) % 360 / 30)
  const degInRashi = ((totalDeg % 360) + 360) % 360 - rashiIdx * 30
  const d = Math.floor(degInRashi)
  const m = Math.floor((degInRashi - d) * 60)
  const s = Math.floor(((degInRashi - d) * 60 - m) * 60)
  const rashi = RASHI_SHORT[((rashiIdx % 12) + 1) as Rashi]
  return `${String(d).padStart(2,'0')} ${rashi} ${String(m).padStart(2,'0')}' ${String(s).padStart(2,'0')}"`
}

function dignityColor(dignity: string): string {
  if (['exalted','moolatrikona','own'].includes(dignity)) return '#059669' // Emerald
  if (['debilitated','great_enemy','enemy'].includes(dignity)) return '#dc2626' // Red
  if (dignity === 'great_friend' || dignity === 'friend') return '#0d9488' // Teal
  return '#475569'
}

function capitalize(s: string): string {
  if (!s) return ''
  return s.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())
}

function escapeHtml(s: string): string {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function toDeg(totalDeg: number): number {
  return ((totalDeg % 360) + 360) % 360
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
  const Q = S/4, M = S/2
  const c: Record<number,[number,number]> = {
    1:[M, M*0.62], 2:[Q*0.75,Q*0.65], 3:[Q*0.65,Q*1.05], 4:[M*0.65,M*0.95],
    5:[Q*0.65,3*Q-Q*0.05], 6:[Q*0.75,3*Q+Q*0.35], 7:[M,M*1.38],
    8:[3*Q+Q*0.25,3*Q+Q*0.35], 9:[3*Q+Q*0.35,3*Q-Q*0.05],
    10:[M*1.35,M*0.95], 11:[3*Q+Q*0.35,Q*1.05], 12:[3*Q+Q*0.25,Q*0.65],
  }
  return c[h] ?? [M,M]
}

function rashiLabelPos(h: number, S: number): [number,number] {
  const Q = S/4, M = S/2, o = S*0.045
  const p: Record<number,[number,number]> = {
    1:[M,M-o], 2:[Q,Q-o], 3:[Q-o,Q], 4:[M-o,M],
    5:[Q-o,3*Q], 6:[Q,3*Q+o], 7:[M,M+o], 8:[3*Q,3*Q+o],
    9:[3*Q+o,3*Q], 10:[M+o,M], 11:[3*Q+o,Q], 12:[3*Q,Q-o],
  }
  return p[h] ?? [M,M]
}

function buildNorthSVG(chart: ChartOutput, vargaKey: string = 'D1', size = 320): string {
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
    const fill   = isLagna ? '#f1f5f9' : 'transparent'
    const stroke = isLagna ? THEME.primary : '#94a3b8'
    const sw     = isLagna ? 1.5 : 0.8

    const [lx,ly] = rashiLabelPos(h, S)
    const signTxt = `<text x="${lx}" y="${ly}" font-family="Arial" font-size="${S*0.035}" font-weight="800" fill="${isLagna?THEME.primary:THEME.accent}" text-anchor="middle" dominant-baseline="middle">${sign}</text>`

    const [cx,cy] = centroidN(h, S)
    const ps = byHouse[h]
    const pf = S * 0.038
    const df = S * 0.024
    const lh = pf + df + 2
    const startY = cy - ((ps.length - 1) * lh) / 2
    
    const planetTxts = ps.map((g, i) => {
      const py = startY + i * lh
      const color = dignityColor(g.dignity)
      const label = g.id + (g.isRetro ? 'R' : '')
      const deg = Math.floor((g.totalDegree || 0) % 30)
      return `<text x="${cx}" y="${py}" font-family="Arial" font-size="${pf}" font-weight="700" fill="${color}" text-anchor="middle" dominant-baseline="middle">${label}</text>
              <text x="${cx}" y="${py+pf*0.8}" font-family="Arial" font-size="${df}" fill="${THEME.muted}" text-anchor="middle" dominant-baseline="middle">${deg}°</text>`
    }).join('\n')

    cells += `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
              ${signTxt}${planetTxts}`
  }

  cells += `<rect x="0.5" y="0.5" width="${S-1}" height="${S-1}" fill="none" stroke="${THEME.primary}" stroke-width="1.5" rx="4"/>`
  cells += `<text x="${S/2}" y="${S/2}" font-family="Arial" font-size="${S*0.05}" font-weight="900" fill="${THEME.primary}" text-anchor="middle" dominant-baseline="middle" opacity="0.1">${vargaKey}</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${cells}</svg>`
}

// ── Page Content Generators ───────────────────────────────────

function buildPlanetTable(chart: ChartOutput): string {
  const main9 = ['Su','Mo','Ma','Me','Ju','Ve','Sa','Ra','Ke']
  const grahas = chart.grahas.filter(g => main9.includes(g.id))
    .sort((a,b) => main9.indexOf(a.id) - main9.indexOf(b.id))

  const rows = grahas.map(g => {
    const nak = NAKSHATRA_NAMES[g.nakshatraIndex % 27] || '—'
    const digColor = dignityColor(g.dignity)
    const retro = g.isRetro ? '<span style="color:#ef4444;margin-left:2px">℞</span>' : ''
    const combust = g.isCombust ? '<span style="color:#f59e0b;font-size:10px"> 🔥</span>' : ''
    const karaka = g.charaKaraka ? `<span style="color:${THEME.accent};font-weight:700">${g.charaKaraka}</span>` : '—'
    return `
      <tr>
        <td style="font-weight:700">${GRAHA_NAMES[g.id as keyof typeof GRAHA_NAMES] || g.id}${retro}${combust}</td>
        <td style="font-family:monospace">${fmtDMS(g.lonSidereal)}</td>
        <td>${RASHI_NAMES[g.rashi]}</td>
        <td>${nak} (${g.pada})</td>
        <td style="color:${digColor};font-weight:700">${capitalize(g.dignity)}</td>
        <td>${karaka}</td>
      </tr>`
  }).join('')

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Planet</th>
          <th>Longitude</th>
          <th>Sign</th>
          <th>Nakshatra</th>
          <th>Dignity</th>
          <th>C. Karaka</th>
        </tr>
      </thead>
      <tbody>
        <tr style="background:#f1f5f9;font-weight:700">
          <td>Ascendant (As)</td>
          <td style="font-family:monospace">${fmtDMS(chart.lagnas.ascDegree)}</td>
          <td>${RASHI_NAMES[chart.lagnas.ascRashi]}</td>
          <td>${NAKSHATRA_NAMES[Math.floor(toDeg(chart.lagnas.ascDegree) / (360/27))]}</td>
          <td>House 1</td>
          <td>Lagna</td>
        </tr>
        ${rows}
      </tbody>
    </table>`
}

function buildDashaHTML(chart: ChartOutput): string {
  const now = Date.now()
  const nodes = chart.dashas.vimshottari || []

  const rows = nodes.slice(0, 15).map(maha => {
    const mahaActive = now >= new Date(maha.start).getTime() && now <= new Date(maha.end).getTime()
    const name = GRAHA_NAMES[maha.lord as keyof typeof GRAHA_NAMES] || maha.lord

    let antarRows = ''
    if (mahaActive && maha.children?.length) {
      antarRows = maha.children.map(antar => {
        const antarActive = now >= new Date(antar.start).getTime() && now <= new Date(antar.end).getTime()
        const antarName = GRAHA_NAMES[antar.lord as keyof typeof GRAHA_NAMES] || antar.lord
        
        let pratyRows = ''
        if (antarActive && antar.children?.length) {
          pratyRows = antar.children.map(prat => {
            const pratActive = now >= new Date(prat.start).getTime() && now <= new Date(prat.end).getTime()
            const pratName = GRAHA_NAMES[prat.lord as keyof typeof GRAHA_NAMES] || prat.lord
            return `
              <tr style="${pratActive ? 'background:#fffbeb;' : ''}">
                <td style="padding-left:60px;font-size:10px;opacity:0.7">↳ ${pratName}</td>
                <td style="font-size:10px">${new Date(prat.start).toDateString()}</td>
                <td style="font-size:10px">${new Date(prat.end).toDateString()}</td>
                <td style="font-size:10px;font-weight:800;color:${THEME.accent}">${pratActive ? 'CURRENT' : ''}</td>
              </tr>`
          }).join('')
        }

        return `
          <tr style="${antarActive ? 'background:#f0f9ff;' : ''}">
            <td style="padding-left:30px;font-size:11px;font-weight:600">• ${antarName} AD</td>
            <td style="font-size:11px">${new Date(antar.start).toDateString()}</td>
            <td style="font-size:11px">${new Date(antar.end).toDateString()}</td>
            <td style="font-size:11px;font-weight:800;color:${THEME.primary}">${antarActive ? 'ACTIVE' : ''}</td>
          </tr>
          ${pratyRows}`
      }).join('')
    }

    return `
      <tr style="${mahaActive ? 'background:#f1f5f9;font-weight:800' : ''}">
        <td style="color:${THEME.primary};text-transform:uppercase;letter-spacing:0.05em">${name} MD</td>
        <td>${new Date(maha.start).toDateString()}</td>
        <td>${new Date(maha.end).toDateString()}</td>
        <td>${mahaActive ? '<span class="current-badge">NOW</span>' : ''}</td>
      </tr>
      ${antarRows}`
  }).join('')

  return `<table class="data-table"><thead><tr><th>Dasha Period</th><th>Start</th><th>End</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`
}

function buildAstroVastuSummary(chart: ChartOutput): string {
  const { grahas } = chart
  const ZONES = [
    { id: 'N', name: 'North', lord: 'Me', qual: 'Career & Opportunities' },
    { id: 'NE', name: 'North-East', lord: 'Ju', qual: 'Wisdom & Health' },
    { id: 'E', name: 'East', lord: 'Su', qual: 'Social Connections' },
    { id: 'SE', name: 'South-East', lord: 'Ve', qual: 'Cash Flow & Fire' },
    { id: 'S', name: 'South', lord: 'Ma', qual: 'Relaxation & Fame' },
    { id: 'SW', name: 'South-West', lord: 'Ra', qual: 'Stability & Skills' },
    { id: 'W', name: 'West', lord: 'Sa', qual: 'Gains & Profits' },
    { id: 'NW', name: 'North-West', lord: 'Mo', qual: 'Support & Banking' }
  ]

  const rows = ZONES.map(z => {
    const lordData = grahas.find(g => g.id === z.lord)
    const occupants = grahas.filter(g => {
        const signAngle = ((g.rashi - 1) * 30 + 15)
        const zoneAngles: Record<string, number> = { 'N':0, 'NE':45, 'E':90, 'SE':135, 'S':180, 'SW':225, 'W':270, 'NW':315 }
        const diff = Math.abs(signAngle - zoneAngles[z.id])
        return diff < 45 || Math.abs(signAngle - zoneAngles[z.id] - 360) < 45
    })
    
    const strength = lordData?.dignity === 'exalted' ? 'Propitious' : lordData?.dignity === 'debilitated' ? 'Afflicted' : 'Neutral'
    const color = strength === 'Propitious' ? '#059669' : strength === 'Afflicted' ? '#dc2626' : '#475569'

    return `
      <tr>
        <td style="font-weight:800;color:${THEME.primary}">${z.id} — ${z.name}</td>
        <td>${z.qual}</td>
        <td style="font-weight:700;color:${color}">${strength}</td>
        <td style="font-size:10px">${occupants.map(o => o.id).join(', ') || 'Void'}</td>
      </tr>`
  }).join('')

  return `
    <table class="data-table">
      <thead><tr><th>Direction</th><th>Attributes</th><th>Status</th><th>Occupants</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`
}

// ── Main HTML Document ────────────────────────────────────────

export function generateChartHTML(chart: ChartOutput, branding?: Branding): string {
  const { meta } = chart
  const brandName = branding?.brandName || 'VEDAANSH JYOTISH'
  const brandLogo = branding?.brandLogo ? `<img src="${branding.brandLogo}" style="height:48px;width:auto">` : `<span style="font-size:40px">🪐</span>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${meta.name} — Jyotish Master Dossier</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Georgia', serif; font-size: 13px; color: ${THEME.text}; background: #f1f5f9; line-height: 1.6; }
    
    @media print {
      body { background: #fff; }
      .no-print { display: none !important; }
      .page { page-break-after: always; padding: 1.5cm; min-height: 29.7cm; background: #fff !important; box-shadow: none !important; margin: 0 !important; border:none !important; }
      .page:last-child { page-break-after: avoid; }
    }

    @media screen {
      .page { width: 21cm; margin: 40px auto; padding: 2cm; background: #fff; box-shadow: 0 10px 40px rgba(0,0,0,0.1); border-radius: 8px; }
    }

    .print-bar { position: sticky; top:0; z-index: 999; background: ${THEME.primary}; color: #fff; padding: 12px 2rem; display: flex; justify-content: space-between; align-items: center; }
    .print-bar button { background: ${THEME.accent}; color:#fff; border:none; padding: 10px 24px; border-radius: 6px; font-weight:700; cursor:pointer; }

    /* UI Components */
    .title-page { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; }
    .header-logo { margin-bottom: 2rem; }
    .main-title { font-size: 4rem; font-weight: 300; color: ${THEME.primary}; margin-bottom: 0.5rem; letter-spacing: -1px; }
    .sub-title { font-size: 1.25rem; font-weight: 700; color: ${THEME.accent}; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 3rem; }
    
    .section-title { font-size: 1.5rem; color: ${THEME.primary}; border-bottom: 2px solid ${THEME.accent}; padding-bottom: 0.5rem; margin: 2rem 0 1.5rem; font-weight: 300; display:flex; align-items:center; gap:10px; }
    .section-title span { color: ${THEME.accent}; font-weight: 900; }

    .data-table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-family: sans-serif; }
    .data-table th { background: ${THEME.surface}; color: ${THEME.primary}; font-size: 11px; text-transform: uppercase; padding: 10px; text-align: left; border-bottom: 2px solid ${THEME.primary}; }
    .data-table td { padding: 10px; border-bottom: 1px solid ${THEME.border}; font-size: 12px; }
    
    .chart-container { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin: 2rem 0; }
    .chart-box { border: 1px solid ${THEME.border}; padding: 1rem; border-radius: 8px; text-align: center; background: ${THEME.surface}; }
    .chart-label { font-size: 0.9rem; font-weight: 800; color: ${THEME.primary}; margin-bottom: 1rem; text-transform: uppercase; }

    .birth-info { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; padding: 1.5rem; background: ${THEME.surface}; border-radius: 12px; border: 1px solid ${THEME.border}; }
    .info-cell { display: flex; flex-direction: column; }
    .info-label { font-size: 10px; text-transform: uppercase; color: ${THEME.muted}; font-weight: 800; }
    .info-value { font-size: 13px; font-weight: 700; color: ${THEME.primary}; }

    .footer { border-top: 1px solid ${THEME.border}; padding-top: 1rem; margin-top: 4rem; display: flex; justify-content: space-between; font-size: 10px; color: ${THEME.muted}; text-transform: uppercase; letter-spacing: 0.05em; }
    .current-badge { background: ${THEME.primary}; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; }
  </style>
</head>
<body>

<div class="print-bar no-print">
  <div style="font-weight: 800">${brandName} Dashboard</div>
  <button onclick="window.print()">Generate Master Dossier (PDF)</button>
</div>

<!-- PAGE 1: COVER -->
<div class="page title-page">
  <div class="header-logo">${brandLogo}</div>
  <div style="font-size: 1.1rem; color: ${THEME.muted}; text-transform: uppercase; letter-spacing: 0.5em; margin-bottom: 1rem;">The Sacred Science of Light</div>
  <h1 class="main-title">${meta.name}</h1>
  <div class="sub-title">Jyotish Master Dossier</div>
  
  <div style="margin-top: 5rem; width: 60px; height: 1px; background: ${THEME.accent};"></div>
  
  <div style="margin-top: 3rem; font-style: italic; color: ${THEME.muted}; max-width: 400px;">
    "As is the cosmic body, so is the human body. As is the cosmic mind, so is the human mind. As is the macrocosm, so is the microcosm." — Rig Veda
  </div>

  <div class="footer" style="width: 100%; border:none; margin-top:auto">
    <div>Prepared on ${new Date().toLocaleDateString()}</div>
    <div>${brandName} Premium Intelligence</div>
  </div>
</div>

<!-- PAGE 2: BIRTH NARRATIVE & CORE CHARTS -->
<div class="page">
  <h2 class="section-title"><span>01</span> Birth Incarnation Data</h2>
  <div class="birth-info">
    <div class="info-cell"><span class="info-label">Full Name</span><span class="info-value">${meta.name}</span></div>
    <div class="info-cell"><span class="info-label">Date of Birth</span><span class="info-value">${new Intl.DateTimeFormat('en-IN', { dateStyle:'full' }).format(new Date(meta.birthDate))}</span></div>
    <div class="info-cell"><span class="info-label">Time of Birth</span><span class="info-value">${meta.birthTime}</span></div>
    <div class="info-cell"><span class="info-label">Birth Place</span><span class="info-value">${meta.birthPlace}</span></div>
    <div class="info-cell"><span class="info-label">Geographic Pos</span><span class="info-value">${meta.latitude.toFixed(2)}°N, ${meta.longitude.toFixed(2)}°E</span></div>
    <div class="info-cell"><span class="info-label">Ayanamsha</span><span class="info-value">${meta.settings.ayanamsha.toUpperCase()} (${chart.meta.ayanamshaValue.toFixed(4)}°)</span></div>
  </div>

  <div class="chart-container">
    <div class="chart-box">
      <div class="chart-label">Rashi Kundali (D1)</div>
      ${buildNorthSVG(chart, 'D1', 300)}
      <div style="font-size: 10px; color: ${THEME.muted}; margin-top: 10px;">The physical incarnation and overall destiny.</div>
    </div>
    <div class="chart-box">
      <div class="chart-label">Navamsha (D9)</div>
      ${buildNorthSVG(chart, 'D9', 300)}
      <div style="font-size: 10px; color: ${THEME.muted}; margin-top: 10px;">The internal strength and fruit of the tree.</div>
    </div>
  </div>

  <h2 class="section-title"><span>02</span> Planetary Cabinet</h2>
  ${buildPlanetTable(chart)}
  
  <div class="footer">
    <div>${meta.name} — Confidential</div>
    <div>Page 2</div>
  </div>
</div>

<!-- PAGE 3: DASHA TIMELINE -->
<div class="page">
  <h2 class="section-title"><span>03</span> The Cosmic Timeline (Vimshottari)</h2>
  <p style="margin-bottom: 1.5rem; font-style: italic; font-size: 11px; color: ${THEME.muted}">
    Vimshottari Dasha reveals when different planetary archetypes take control of your psychological and physical experience.
  </p>
  ${buildDashaHTML(chart)}

  <div class="footer">
    <div>${meta.name} — Confidential</div>
    <div>Page 3</div>
  </div>
</div>

${chart.varshaphal ? `
<!-- PAGE: VARSHAPHAL ANALYSIS -->
<div class="page">
  <h2 class="section-title"><span>04</span> Annual Solar Forecast (${chart.varshaphal.returnYear})</h2>
  <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 2rem; margin-bottom: 2rem;">
    <div style="padding: 1.5rem; background: ${THEME.surface}; border-radius: 12px; border: 1px solid ${THEME.accent}33;">
       <div style="font-size: 10px; font-weight: 800; color: ${THEME.accent}; text-transform: uppercase; margin-bottom: 0.5rem;">Yearly Muntha</div>
       <div style="font-size: 1.5rem; font-weight: 300; color: ${THEME.primary}; margin-bottom: 0.5rem;">${RASHI_NAMES[chart.varshaphal.munthaRashi as Rashi]}</div>
       <div style="font-size: 12px; line-height: 1.5;">
          The Muntha progresses one sign per year. This year it resides in your <strong>House ${((chart.varshaphal.munthaRashi - chart.lagnas.ascRashi + 12) % 12) + 1}</strong>, 
          indicating that the focus of your energy will be centered on ${((chart.varshaphal.munthaRashi - chart.lagnas.ascRashi + 12) % 12) + 1 === 1 ? 'personality and beginnings' : 'securing your foundations'}.
       </div>
    </div>
    <div style="padding: 1.5rem; background: ${THEME.primary}; color: #fff; border-radius: 12px; text-align: center;">
       <div style="font-size: 10px; font-weight: 800; opacity: 0.7; text-transform: uppercase;">Completed Age</div>
       <div style="font-size: 3rem; font-weight: 700;">${chart.varshaphal.completedAge}</div>
       <div style="font-size: 11px; opacity: 0.8;">Beginning cycle ${chart.varshaphal.completedAge + 1}</div>
    </div>
  </div>

  <h3 style="font-size: 1.1rem; color: ${THEME.primary}; margin-bottom: 1rem; font-weight: 400; border-left: 3px solid ${THEME.accent}; padding-left: 10px;">Tajika Annual Yogas</h3>
  <div style="display: flex; flex-direction: column; gap: 0.75rem;">
    ${chart.varshaphal.tajikaYogas.length ? chart.varshaphal.tajikaYogas.map(yoga => `
      <div style="padding: 1rem; border: 1px solid ${THEME.border}; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 700; font-size: 0.9rem; color: ${THEME.primary}">${yoga.name}</div>
          <div style="font-size: 11px; color: ${THEME.muted}">${yoga.graha1} & ${yoga.graha2} — ${yoga.description}</div>
        </div>
        <div style="font-size: 10px; font-weight: 800; color: ${yoga.type==='auspicious'?'#059669':'#dc2626'}; text-transform: uppercase;">${yoga.type}</div>
      </div>
    `).join('') : '<p style="color: grey; font-style: italic;">No specific Tajika yogas active this year.</p>'}
  </div>

  <div class="footer">
    <div>${meta.name} — Confidential</div>
    <div>Annual Forecast</div>
  </div>
</div>
` : ''}

<!-- PAGE 4: STRENGTHS & PANCHANGA -->
<div class="page">
  <h2 class="section-title"><span>04</span> Life Force & Strength (Shadbala)</h2>
  <p style="margin-bottom: 1rem; font-size: 12px;">Planetary strength determines your ability to manifest results from each archetype.</p>
  <table class="data-table">
    <thead><tr><th>Graha</th><th>Total Points</th><th>Status</th><th>Relative Str</th></tr></thead>
    <tbody>
      ${['Su','Mo','Ma','Me','Ju','Ve','Sa'].map(id => {
        const pb = chart.shadbala.planets[id]
        return `<tr><td style="font-weight:700">${GRAHA_NAMES[id as GrahaId]}</td><td>${pb.total.toFixed(2)}</td><td style="color:${pb.isStrong?'#059669':'#475569'}">${pb.isStrong?'STRONG':'MODERATE'}</td><td><div style="height:6px;width:100px;background:#e2e8f0;border-radius:3px"><div style="height:100%;width:${(pb.total/1000)*100}%;background:${THEME.primary};border-radius:3px"></div></div></td></tr>`
      }).join('')}
    </tbody>
  </table>

  <h2 class="section-title"><span>05</span> Sacred Time (Panchanga)</h2>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
     <table class="data-table">
        <tbody>
          <tr><td style="font-weight:700">Vara</td><td>${chart.panchang.vara.name}</td></tr>
          <tr><td style="font-weight:700">Tithi</td><td>${chart.panchang.tithi.name} (${chart.panchang.tithi.paksha})</td></tr>
          <tr><td style="font-weight:700">Nakshatra</td><td>${chart.panchang.nakshatra.name}</td></tr>
        </tbody>
     </table>
     <table class="data-table">
        <tbody>
          <tr><td style="font-weight:700">Yoga</td><td>${chart.panchang.yoga.name}</td></tr>
          <tr><td style="font-weight:700">Karana</td><td>${chart.panchang.karana.name}</td></tr>
          <tr><td style="font-weight:700">Sunrise</td><td>${new Date(chart.panchang.sunrise).toLocaleTimeString()}</td></tr>
        </tbody>
     </table>
  </div>

  <div class="footer">
    <div>${meta.name} — Confidential</div>
    <div>Page 4</div>
  </div>
</div>

<!-- PAGE 5: ASTRO-VASTU ARCHITECTURAL GUIDE -->
<div class="page">
  <h2 class="section-title"><span>06</span> Astro-Vāstu Architectural Guide</h2>
  <div style="margin-bottom: 2rem; padding: 1.5rem; background: ${THEME.surface}; border-radius: 12px; border-left: 5px solid ${THEME.accent};">
    <div style="font-weight: 800; color: ${THEME.primary}; margin-bottom: 0.5rem; text-transform: uppercase; font-size: 11px;">Spatial Synchronization</div>
    <div style="font-size: 0.95rem; line-height: 1.5;">Your individual horoscope imprints directly onto your physical space. By aligning your environment with your planetary strengths, you remove subconscious friction.</div>
  </div>

  ${buildAstroVastuSummary(chart)}

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem;">
    <div style="padding: 1rem; border: 1px solid ${THEME.border}; border-radius: 8px;">
       <div style="font-weight: 800; font-size: 10px; color: ${THEME.muted}; margin-bottom: 8px; text-transform: uppercase;">Auspicious Living</div>
       <ul style="font-size: 11px; padding-left: 15px; color: ${THEME.text}; list-style-type: square;">
          <li>Entrance: <strong>${chart.lagnas.ascRashi % 4 === 1 ? 'East' : chart.lagnas.ascRashi % 4 === 2 ? 'South' : 'North'}</strong> facing preferred.</li>
          <li>Workspace: Focus items in the <strong>NORTH</strong> (Mercury).</li>
          <li>Meditation: Align with <strong>NORTH-EAST</strong> (Jupiter).</li>
       </ul>
    </div>
    <div style="padding: 1rem; border: 1px solid ${THEME.border}; border-radius: 8px;">
       <div style="font-weight: 800; font-size: 10px; color: ${THEME.muted}; margin-bottom: 8px; text-transform: uppercase;">Energy Preservation</div>
       <ul style="font-size: 11px; padding-left: 15px; color: ${THEME.text}; list-style-type: square;">
          <li>Avoid mirrors in the <strong>SOUTH</strong> (Mars) zone.</li>
          <li>Keep the <strong>CENTER</strong> (Brahmasthan) free of heavy objects.</li>
          <li>Balance the <strong>SOUTH-WEST</strong> (Rahu) with earth colors.</li>
       </ul>
    </div>
  </div>

  <div class="footer">
    <div>${meta.name} — Confidential</div>
    <div>Page 5</div>
  </div>
</div>

<!-- PAGE 6: INTERPRETATION & YOGAS -->
<div class="page">
  <h2 class="section-title"><span>07</span> Karmic Synthesis & Global Insights</h2>
  <div style="margin-bottom: 2rem; padding: 1.5rem; background: ${THEME.primary}; color: #fff; border-radius: 12px; box-shadow: 0 10px 20px ${THEME.primary}33">
    <div style="font-weight: 800; font-size: 10px; opacity: 0.7; margin-bottom: 0.5rem; text-transform: uppercase;">Executive Summary</div>
    <div style="font-size: 1.15rem; font-weight: 300; line-height: 1.6;">${escapeHtml(chart.interpretation.headline)}</div>
  </div>

  <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
    ${chart.interpretation.topInsights.slice(0, 4).map(ins => {
      const color = ins.tone === 'supportive' ? '#059669' : ins.tone === 'caution' ? '#dc2626' : THEME.accent
      return `
        <div style="padding: 1.25rem; border: 1px solid ${THEME.border}; border-radius: 10px; border-left: 4px solid ${color};">
           <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <div style="font-weight: 800; font-size: 0.95rem; color: ${THEME.primary}">${escapeHtml(ins.title)}</div>
              <div style="font-size: 10px; font-weight: 800; color: ${color}; text-transform: uppercase; background: ${color}11; padding: 2px 8px; border-radius: 4px;">${ins.category}</div>
           </div>
           <div style="font-size: 11px; color: ${THEME.text}; margin-bottom: 8px;">${escapeHtml(ins.message)}</div>
           ${ins.actions?.length ? `<div style="font-size: 10px; color: ${THEME.muted}"><strong>Action:</strong> ${ins.actions.join(' · ')}</div>` : ''}
        </div>`
    }).join('')}
  </div>

  <h2 class="section-title"><span>08</span> Major Planetary Yogas</h2>
  <p style="margin-bottom: 1rem; font-size: 11px; color: ${THEME.muted}">Yogas are mathematical combinations that indicate specific types of wealth, power, or spiritual attainment.</p>
  <table class="data-table">
    <thead><tr><th>Combination</th><th>Sanskrit</th><th>Category</th><th>Strength</th></tr></thead>
    <tbody>
      ${chart.yogas?.slice(0, 10).map(y => `
        <tr>
          <td style="font-weight: 700">${y.name}</td>
          <td style="font-style: italic; font-size: 11px">${y.sanskrit}</td>
          <td>${capitalize(y.category)}</td>
          <td style="font-weight: 700; color:${y.strength==='strong'?'#059669':THEME.accent}">${y.strength.toUpperCase()}</td>
        </tr>`).join('') || '<tr><td colspan="4">No major yogas detected in current configuration.</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    <div>${meta.name} — Confidential</div>
    <div>Page 6</div>
  </div>
</div>

</body>
</html>`
}