// ─────────────────────────────────────────────────────────────
//  src/lib/pdf/chartHtml.ts
//  Generates a print-ready HTML document from ChartOutput.
//  Opened in a new tab — user prints to PDF via browser.
//
//  Pages:
//    1. Cover + Birth Details + South Indian Chart SVG
//    2. Planet Table (all 9 grahas + lagnas)
//    3. Vimshottari Dasha (Maha + Antar + current Pratyantar)
//    4. Panchang
//    5. Ashtakavarga (SAV grid)
//    6. Shadbala summary
//    7. Graha Yogas
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaData, Rashi } from '@/types/astrology'
import {
  GRAHA_NAMES, RASHI_NAMES, RASHI_SHORT, NAKSHATRA_NAMES,
  NAKSHATRA_SHORT,
} from '@/types/astrology'

interface Branding {
  brandName?: string | null
  brandLogo?: string | null
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

function fmtDate(iso: string): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const [y,m,d] = iso.split('-').map(Number)
  return `${d} ${months[m-1]} ${y}`
}

function dignityColor(dignity: string): string {
  if (['exalted','moolatrikona','own'].includes(dignity)) return '#1a6b3a'
  if (['debilitated','great_enemy','enemy'].includes(dignity)) return '#a32d2d'
  if (dignity === 'great_friend' || dignity === 'friend') return '#0f6e56'
  return '#555'
}

function capitalize(s: string): string {
  return s.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function toDeg(totalDeg: number): number {
  return ((totalDeg % 360) + 360) % 360
}

// ── North Indian Chart SVG ────────────────────────────────────

function polyPts(h: number, S: number): string {
  const Q = S/4, M = S/2
  const pts: [number,number][][] = [
    [], // placeholder for index 0
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
    1:[M, M*0.55], 2:[Q*0.7,Q*0.55], 3:[Q*0.55,Q], 4:[M*0.55,M],
    5:[Q*0.55,3*Q], 6:[Q*0.7,3*Q+Q*0.45], 7:[M,M*1.45],
    8:[3*Q+Q*0.3,3*Q+Q*0.45], 9:[3*Q+Q*0.45,3*Q],
    10:[M*1.45,M], 11:[3*Q+Q*0.45,Q], 12:[3*Q+Q*0.3,Q*0.55],
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

function buildNorthSVG(chart: ChartOutput, size = 400): string {
  const S = size
  const ascRashi = chart.lagnas.ascRashi
  const grahas = chart.grahas.filter(g => !['Ur','Ne','Pl'].includes(g.id))

  const signInHouse = (h: number) => (((ascRashi - 1 + h - 1) % 12) + 1) as number
  const byHouse: Record<number, GrahaData[]> = {}
  for (let h = 1; h <= 12; h++) byHouse[h] = []
  grahas.forEach(g => {
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
    const fill   = isLagna ? '#e8f4fd' : 'transparent'
    const stroke = isLagna ? '#2e6da4' : '#888'
    const sw     = isLagna ? 1.5 : 1

    // Sign number label
    const [lx,ly] = rashiLabelPos(h, S)
    const signTxt = `<text x="${lx}" y="${ly}" font-family="Arial" font-size="${S*0.032}" font-weight="600" fill="${isLagna?'#2e6da4':'#5a8a5a'}" text-anchor="middle" dominant-baseline="middle">${sign}</text>`

    // Planets
    const [cx,cy] = centroidN(h, S)
    const ps = byHouse[h]
    const pf = S * 0.034
    const df = S * 0.022
    const lh = pf + df + 2
    const startY = cy - (ps.length * lh) / 2
    const planetTxts = ps.map((g, i) => {
      const py = startY + i * lh + pf * 0.5
      const col2 = dignityColor(g.dignity)
      const lbl = (GRAHA_ABBR[g.id] || g.id) + (g.isRetro ? 'ᴿ' : '')
      const deg = Math.floor(toDeg(g.lonSidereal) % 30)
      return `<text x="${cx}" y="${py}" font-family="Arial" font-size="${pf}" font-weight="600" fill="${col2}" text-anchor="middle" dominant-baseline="middle">${lbl}</text>
<text x="${cx}" y="${py+pf*0.8}" font-family="Arial" font-size="${df}" fill="#666" text-anchor="middle" dominant-baseline="middle">${deg}°</text>`
    }).join('\n')

    cells += `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
${signTxt}${planetTxts}`
  }

  // Outer border
  cells += `<rect x="0.5" y="0.5" width="${S-1}" height="${S-1}" fill="none" stroke="#888" stroke-width="1"/>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${cells}</svg>`
}



const SIGN_CELLS: Record<number, [number,number]> = {
  12:[0,0],  1:[0,1],  2:[0,2],  3:[0,3],
  11:[1,0],                       4:[1,3],
  10:[2,0],                       5:[2,3],
   9:[3,0],  8:[3,1],  7:[3,2],  6:[3,3],
}
const SIGN_ABBR: Record<number,string> = {
  1:'Ar',2:'Ta',3:'Ge',4:'Cn',5:'Le',6:'Vi',
  7:'Li',8:'Sc',9:'Sg',10:'Cp',11:'Aq',12:'Pi',
}
const GRAHA_ABBR: Record<string,string> = {
  Su:'Su',Mo:'Mo',Ma:'Ma',Me:'Me',Ju:'Ju',Ve:'Ve',Sa:'Sa',Ra:'Ra',Ke:'Ke',
}

function buildSouthSVG(chart: ChartOutput, size = 400): string {
  const cell = size / 4
  const ascRashi = chart.lagnas.ascRashi
  const grahas = chart.grahas.filter(g => !['Ur','Ne','Pl'].includes(g.id))

  // Group grahas by rashi
  const byRashi: Record<number, GrahaData[]> = {}
  grahas.forEach(g => {
    if (!byRashi[g.rashi]) byRashi[g.rashi] = []
    byRashi[g.rashi].push(g)
  })

  let cells = ''
  for (let sign = 1; sign <= 12; sign++) {
    const [row, col] = SIGN_CELLS[sign]
    const x = col * cell
    const y = row * cell
    const isAsc = sign === ascRashi
    const bg = isAsc ? '#e8f4fd' : '#fafafa'
    const borderColor = isAsc ? '#2e6da4' : '#ccc'

    // Sign label
    const signLabel = `<text x="${x+4}" y="${y+14}" font-family="Arial" font-size="9" fill="#888">${SIGN_ABBR[sign]}</text>`

    // Planets in this sign
    const gs = byRashi[sign] || []
    const planetTexts = gs.map((g, i) => {
      const py = y + 28 + i * 16
      const label = (GRAHA_ABBR[g.id] || g.id) + (g.isRetro ? 'ᴿ' : '')
      const col2 = dignityColor(g.dignity)
      const deg = Math.floor(toDeg(g.lonSidereal) % 30)
      return `<text x="${x+4}" y="${py}" font-family="Arial" font-size="10" font-weight="600" fill="${col2}">${label} ${deg}°</text>`
    }).join('\n')

    // Arudha AL in lagna
    let arudhaText = ''
    if (chart.arudhas.AL === sign) {
      arudhaText = `<text x="${x + cell - 4}" y="${y + 14}" font-family="Arial" font-size="8" fill="#8b5cf6" text-anchor="end">AL</text>`
    }

    cells += `
      <rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${bg}" stroke="${borderColor}" stroke-width="${isAsc ? 1.5 : 0.5}"/>
      ${signLabel}
      ${arudhaText}
      ${planetTexts}
    `
  }

  // Inner square (center 2×2 cells are empty in South Indian)
  cells += `<rect x="${cell}" y="${cell}" width="${cell*2}" height="${cell*2}" fill="#f0f0f0" stroke="#ccc" stroke-width="0.5"/>`
  cells += `<text x="${cell*2}" y="${cell*2 - 8}" font-family="Arial" font-size="10" fill="#888" text-anchor="middle">D1</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${cells}</svg>`
}

// ── Planet Table HTML ─────────────────────────────────────────

function buildPlanetTable(chart: ChartOutput): string {
  const main9 = ['Su','Mo','Ma','Me','Ju','Ve','Sa','Ra','Ke']
  const grahas = chart.grahas.filter(g => main9.includes(g.id))
    .sort((a,b) => main9.indexOf(a.id) - main9.indexOf(b.id))

  const rows = grahas.map(g => {
    const nak = NAKSHATRA_SHORT[g.nakshatraIndex % 27] || '—'
    const digColor = dignityColor(g.dignity)
    const retro = g.isRetro ? '<sup style="color:#c0392b">R</sup>' : ''
    const combust = g.isCombust ? '<span style="color:#c0392b;font-size:9px"> ☌</span>' : ''
    const karaka = g.charaKaraka ? `<span style="color:#8b5cf6;font-size:9px">${g.charaKaraka}</span>` : ''
    return `
      <tr>
        <td style="font-weight:600">${GRAHA_NAMES[g.id as keyof typeof GRAHA_NAMES] || g.id}${retro}${combust}</td>
        <td>${fmtDMS(g.lonSidereal)}</td>
        <td>${RASHI_NAMES[g.rashi]}</td>
        <td>${nak} / ${g.pada}</td>
        <td style="color:${digColor};font-weight:600">${capitalize(g.dignity)}</td>
        <td>${karaka}</td>
      </tr>`
  }).join('')

  // Add Lagna
  const ascDMS = fmtDMS(chart.lagnas.ascDegree)
  const ascRashi = RASHI_NAMES[chart.lagnas.ascRashi]
  const ascNakIdx = Math.floor(toDeg(chart.lagnas.ascDegree) / (360/27))
  const ascNak = NAKSHATRA_SHORT[ascNakIdx % 27] || '—'
  const ascPada = Math.floor((toDeg(chart.lagnas.ascDegree) % (360/27)) / (360/27/4)) + 1

  const lagnaRow = `
    <tr style="background:#e8f4fd">
      <td style="font-weight:700;color:#1e3a5f">Lagna (As)</td>
      <td>${ascDMS}</td>
      <td>${ascRashi}</td>
      <td>${ascNak} / ${ascPada}</td>
      <td>—</td>
      <td>—</td>
    </tr>`

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Planet</th>
          <th>Longitude</th>
          <th>Sign</th>
          <th>Nakshatra / Pada</th>
          <th>Dignity</th>
          <th>Karaka</th>
        </tr>
      </thead>
      <tbody>
        ${lagnaRow}
        ${rows}
      </tbody>
    </table>`
}

// ── Dasha Tree HTML ───────────────────────────────────────────

const GRAHA_FULL: Record<string,string> = {
  Su:'Sun',Mo:'Moon',Ma:'Mars',Me:'Mercury',Ju:'Jupiter',
  Ve:'Venus',Sa:'Saturn',Ra:'Rahu',Ke:'Ketu',
}
const GRAHA_COL: Record<string,string> = {
  Su:'#F59E0B',Mo:'#3B82F6',Ma:'#EF4444',Me:'#10B981',
  Ju:'#CA8A04',Ve:'#EC4899',Sa:'#6366F1',Ra:'#8B5CF6',Ke:'#F97316',
}

function fmt(d: Date | string): string {
  const dt = new Date(d)
  return dt.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) + 
         ' ' + dt.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
}

function buildDashaHTML(chart: ChartOutput): string {
  const now = Date.now()
  const nodes = chart.dashas.vimshottari || []

  const rows = nodes.map(maha => {
    const mahaActive = now >= new Date(maha.start).getTime() && now <= new Date(maha.end).getTime()
    const col = GRAHA_COL[maha.lord] || '#555'
    const name = GRAHA_FULL[maha.lord] || maha.lord

    let antarRows = ''
    if (mahaActive && maha.children?.length) {
      antarRows = maha.children.map(antar => {
        const antarActive = now >= new Date(antar.start).getTime() && now <= new Date(antar.end).getTime()
        const antarName = GRAHA_FULL[antar.lord] || antar.lord
        const antarCol = GRAHA_COL[antar.lord] || '#555'

        let pratyRows = ''
        if (antarActive && antar.children?.length) {
          pratyRows = antar.children.map(prat => {
            const pratActive = now >= new Date(prat.start).getTime() && now <= new Date(prat.end).getTime()
            const pratName = GRAHA_FULL[prat.lord] || prat.lord
            const pratCol = GRAHA_COL[prat.lord] || '#555'
            return `
              <tr style="${pratActive ? 'background:#fef9e7;' : ''}">
                <td style="padding-left:60px;color:${pratCol};font-size:11px">↳ ${pratName}</td>
                <td style="font-size:11px">${fmt(prat.start)}</td>
                <td style="font-size:11px">${fmt(prat.end)}</td>
                <td style="font-size:11px">${pratActive ? '⟵ NOW' : ''}</td>
              </tr>`
          }).join('')
        }

        return `
          <tr style="${antarActive ? 'background:#eaf4fb;' : ''}">
            <td style="padding-left:32px;color:${antarCol};font-size:12px">• ${antarName}</td>
            <td style="font-size:12px">${fmt(antar.start)}</td>
            <td style="font-size:12px">${fmt(antar.end)}</td>
            <td style="font-size:12px">${antarActive ? '⟵ Active' : ''}</td>
          </tr>
          ${pratyRows}`
      }).join('')
    }

    return `
      <tr style="${mahaActive ? 'background:#e8f4fd;font-weight:700' : ''}">
        <td style="color:${col};font-weight:700">${name} MD</td>
        <td>${fmt(maha.start)}</td>
        <td>${fmt(maha.end)}</td>
        <td>${mahaActive ? '⟵ CURRENT' : ''}</td>
      </tr>
      ${antarRows}`
  }).join('')

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Dasha Period</th>
          <th>Start</th>
          <th>End</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
}

// ── Panchang HTML ─────────────────────────────────────────────

function buildPanchangHTML(chart: ChartOutput): string {
  const p = chart.panchang
  const items = [
    ['Vara (Weekday)', p.vara.name],
    ['Tithi', `${p.tithi.paksha === 'shukla' ? 'S' : 'K'}${p.tithi.number} — ${p.tithi.name}`],
    ['Nakshatra', `${p.nakshatra.name} (${p.nakshatra.pada}th Pada)`],
    ['Yoga', p.yoga.name],
    ['Karana', p.karana.name],
    ['Sunrise', new Date(p.sunrise).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})],
    ['Sunset', new Date(p.sunset).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})],
    ['Rahu Kalam', `${new Date(p.rahuKalam.start).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})} – ${new Date(p.rahuKalam.end).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}`],
    ['Gulika Kalam', `${new Date(p.gulikaKalam.start).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})} – ${new Date(p.gulikaKalam.end).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}`],
    ['Yamaganda', `${new Date(p.yamaganda.start).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})} – ${new Date(p.yamaganda.end).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}`],
  ]
  if (p.abhijitMuhurta) {
    items.push(['Abhijit Muhurta', `${new Date(p.abhijitMuhurta.start).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})} – ${new Date(p.abhijitMuhurta.end).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}`])
  }

  const rows = items.map(([label, val]) => `
    <tr>
      <td style="font-weight:600;color:#1e3a5f;width:200px">${label}</td>
      <td>${val}</td>
    </tr>`).join('')

  return `<table class="data-table"><tbody>${rows}</tbody></table>`
}

// ── Ashtakavarga HTML ─────────────────────────────────────────

function buildAshtakavargaHTML(chart: ChartOutput): string {
  if (!chart.ashtakavarga) return '<p style="color:#888">Ashtakavarga data unavailable.</p>'

  const { sav, bav } = chart.ashtakavarga
  const planets = ['Su','Mo','Ma','Me','Ju','Ve','Sa']
  const rashiOrder = Array.from({length:12},(_,i)=> ((chart.lagnas.ascRashi - 1 + i) % 12 + 1) as Rashi)

  // SAV row
  const savRow = rashiOrder.map(r => {
    const idx = r - 1
    const val = sav[idx] || 0
    const bg = val >= 30 ? '#e8f5ee' : val <= 20 ? '#fbeaea' : '#fff'
    return `<td style="background:${bg};text-align:center;font-weight:${val>=30?'700':'400'};color:${val>=30?'#1a6b3a':val<=20?'#a32d2d':'#333'}">${val}</td>`
  }).join('')

  // Planet BAV rows
  const bavRows = planets.map(p => {
    const bavData = bav[p]
    if (!bavData) return ''
    const cells = rashiOrder.map(r => {
      const idx = r - 1
      const val = bavData.bindus[idx] || 0
      return `<td style="text-align:center;font-size:12px;color:${val>=4?'#1a6b3a':val<=1?'#a32d2d':'#555'}">${val}</td>`
    }).join('')
    return `<tr><td style="font-weight:600;color:#1e3a5f">${GRAHA_NAMES[p as keyof typeof GRAHA_NAMES]}</td>${cells}<td style="text-align:center;font-weight:600">${bavData.total}</td></tr>`
  }).join('')

  const signHeaders = rashiOrder.map(r => `<th style="text-align:center;font-size:11px">${RASHI_SHORT[r]}</th>`).join('')

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Planet</th>
          ${signHeaders}
          <th style="text-align:center">Total</th>
        </tr>
      </thead>
      <tbody>
        ${bavRows}
        <tr style="background:#e8f4fd;font-weight:700">
          <td style="font-weight:700;color:#1e3a5f">SAV Total</td>
          ${savRow}
          <td style="text-align:center;font-weight:700">${chart.ashtakavarga.savTotal}</td>
        </tr>
      </tbody>
    </table>`
}

// ── Shadbala HTML ─────────────────────────────────────────────

function buildShadbalaHTML(chart: ChartOutput): string {
  if (!chart.shadbala) return '<p style="color:#888">Shadbala data unavailable.</p>'

  const planets = ['Su','Mo','Ma','Me','Ju','Ve','Sa']
  const rows = planets.map(p => {
    const pl = chart.shadbala.planets[p]
    if (!pl) return ''
    const isStrong = pl.isStrong
    return `
      <tr>
        <td style="font-weight:600">${GRAHA_NAMES[p as keyof typeof GRAHA_NAMES]}</td>
        <td style="text-align:right">${pl.sthanaBala.toFixed(2)}</td>
        <td style="text-align:right">${pl.digBala.toFixed(2)}</td>
        <td style="text-align:right">${pl.kalaBala.toFixed(2)}</td>
        <td style="text-align:right">${pl.chestaBala.toFixed(2)}</td>
        <td style="text-align:right">${pl.naisargikaBala.toFixed(2)}</td>
        <td style="text-align:right">${pl.drikBala.toFixed(2)}</td>
        <td style="text-align:right;font-weight:700">${pl.total.toFixed(2)}</td>
        <td style="text-align:center">
          <span style="color:${isStrong?'#1a6b3a':'#a32d2d'};font-weight:700;font-size:11px">${isStrong?'Strong':'Weak'}</span>
        </td>
      </tr>`
  }).join('')

  return `
    <table class="data-table" style="font-size:12px">
      <thead>
        <tr>
          <th>Planet</th>
          <th style="text-align:right">Sthana</th>
          <th style="text-align:right">Dig</th>
          <th style="text-align:right">Kala</th>
          <th style="text-align:right">Chesta</th>
          <th style="text-align:right">Naisargika</th>
          <th style="text-align:right">Drik</th>
          <th style="text-align:right">Total</th>
          <th style="text-align:center">Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
}

// ── Interpretation HTML ─────────────────────────────────────────────
function buildInterpretationHTML(chart: ChartOutput): string {
  if (!chart.interpretation?.topInsights?.length) {
    return '<p style="color:#888">Interpretation Layer data unavailable.</p>'
  }

  const tone = (t: string) => {
    if (t === 'supportive') return { bg: '#e6fffa', border: '#0f6e56', text: '#0f6e56' }
    if (t === 'caution') return { bg: '#ffe4ea', border: '#b91c1c', text: '#b91c1c' }
    return { bg: '#f3e8ff', border: '#7c3aed', text: '#5b21b6' }
  }

  const cards = chart.interpretation.topInsights.map((ins) => {
    const c = tone(ins.tone)
    const actionsHtml = ins.actions?.length
      ? `<div style="margin-top:10px;font-size:11px;color:#666;line-height:1.55">
          <strong style="color:#111">Practical Actions:</strong> ${escapeHtml(ins.actions.join(' · '))}
        </div>`
      : ''

    return `
      <div style="border:1px solid ${c.border};background:${c.bg};border-radius:6px;padding:12px 12px;margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:6px">
          <div style="font-weight:800;color:#111;font-size:12px">${escapeHtml(ins.title)}</div>
          <div style="font-size:10px;color:${c.text};text-transform:uppercase;font-weight:800;letter-spacing:.06em;white-space:nowrap">
            ${escapeHtml(ins.category)}
          </div>
        </div>
        <div style="font-size:11px;color:#444;line-height:1.6">
          ${escapeHtml(ins.message)}
        </div>
        ${actionsHtml}
      </div>
    `
  }).join('')

  return `
    <div style="margin-top:18px">
      <h2 style="margin-top:0;font-size:14px;color:#1e3a5f">Interpretation Layer</h2>
      <div style="font-size:11px;color:#666;margin-bottom:12px">
        <strong>Headline:</strong> ${escapeHtml(chart.interpretation.headline)}
      </div>
      ${cards}
    </div>
  `
}

// ── Yogas HTML ────────────────────────────────────────────────

function buildYogasHTML(chart: ChartOutput): string {
  if (!chart.yogas?.length) return '<p style="color:#888">No significant yogas detected.</p>'

  const rows = chart.yogas.map(y => {
    const catColor: Record<string,string> = {
      mahapurusha:'#8b5cf6', raja:'#2e6da4', dhana:'#1a6b3a',
      viparita:'#b85c00', special:'#0f6e56', lunar:'#3b82f6',
    }
    const col = catColor[y.category] || '#555'
    const strengthColor = y.strength === 'strong' ? '#1a6b3a' : y.strength === 'moderate' ? '#b85c00' : '#888'
    return `
      <tr>
        <td style="font-weight:700">${y.name}</td>
        <td style="color:#888;font-size:11px">${y.sanskrit}</td>
        <td style="color:${col};font-size:11px;font-weight:600">${capitalize(y.category)}</td>
        <td style="color:${strengthColor};font-weight:600;font-size:11px">${capitalize(y.strength)}</td>
        <td style="font-size:11px;color:#555">${y.effect.slice(0,80)}${y.effect.length>80?'…':''}</td>
      </tr>`
  }).join('')

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Yoga</th>
          <th>Sanskrit</th>
          <th>Category</th>
          <th>Strength</th>
          <th>Effect</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
}

// ── Special Lagnas HTML ───────────────────────────────────────

function buildLagnasHTML(chart: ChartOutput): string {
  const l = chart.lagnas
  const items: [string, number][] = [
    ['Ascendant (Lagna)', l.ascDegree],
    ['Hora Lagna (HL)', l.horaLagna],
    ['Ghatika Lagna (GL)', l.ghatiLagna],
    ['Bhava Lagna (BL)', l.bhavaLagna],
    ['Pranapada (PP)', l.pranapada],
    ['Sri Lagna (ŚL)', l.sriLagna],
    ['Varnada Lagna (VL)', l.varnadaLagna],
  ]
  const rows = items.map(([name, deg]) => `
    <tr>
      <td style="font-weight:600;color:#1e3a5f">${name}</td>
      <td>${fmtDMS(deg)}</td>
      <td>${RASHI_NAMES[(Math.floor(((deg%360)+360)%360/30)%12+1) as Rashi]}</td>
    </tr>`).join('')

  return `
    <table class="data-table">
      <thead><tr><th>Lagna</th><th>Longitude</th><th>Sign</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`
}

// ── Arudhas HTML ─────────────────────────────────────────────

function buildArudhasHTML(chart: ChartOutput): string {
  const keys = ['AL','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12'] as const
  const meanings: Record<string,string> = {
    AL:'Arudha Lagna — status, image',A2:'Dhana Pada — wealth',
    A3:'Vikrama Pada — courage',A4:'Matru Pada — home/mother',
    A5:'Putra Pada — children',A6:'Shatru Pada — enemies/debt',
    A7:'Dara Pada (Darapada) — spouse',A8:'Mrityu Pada — longevity',
    A9:'Pitru Pada — father/dharma',A10:'Karma Pada — career',
    A11:'Labha Pada — gains',A12:'UL (Upapada) — marriage',
  }
  const rows = keys.map(k => {
    const rashi = chart.arudhas[k as keyof typeof chart.arudhas] as Rashi
    return `
      <tr>
        <td style="font-weight:700;color:#8b5cf6">${k}</td>
        <td>${RASHI_NAMES[rashi] || '—'}</td>
        <td style="color:#555;font-size:11px">${meanings[k] || ''}</td>
      </tr>`
  }).join('')

  return `
    <table class="data-table">
      <thead><tr><th>Pada</th><th>Sign</th><th>Meaning</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`
}

// ── Full HTML Document ────────────────────────────────────────

export function generateChartHTML(chart: ChartOutput, branding?: Branding): string {
  const { meta } = chart
  const generatedAt = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })

  const brandName = branding?.brandName || 'VEDAANSH JYOTISH'
  const brandLogo = branding?.brandLogo ? `<img src="${branding.brandLogo}" style="height:24px;width:auto">` : '🪐'
  const siteUrl  = branding?.brandName ? '' : 'vedaansh.com'
  
  const d9grahas = chart.vargas?.D9 || []
  const d9ascRashi = chart.vargaLagnas?.D9 || chart.lagnas.ascRashi
  const d1SVG = buildNorthSVG(chart, 320)
  // Create a pseudo-chart for D9 to use the same SVG builder
  const d9SVG = buildNorthSVG({ ...chart, grahas: d9grahas.length ? d9grahas.map(g => ({...g, totalDegree: g.totalDegree ?? 0})) : [], lagnas: { ...chart.lagnas, ascRashi: d9ascRashi } } as any, 320)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${meta.name} — Vedaansh Jyotish Chart</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 13px;
      color: #333;
      background: #fff;
      line-height: 1.5;
    }

    /* ── Print layout ── */
    @media print {
      body { font-size: 11px; }
      .no-print { display: none !important; }
      .page { page-break-after: always; padding: 24px 32px; min-height: 100vh; }
      .page:last-child { page-break-after: avoid; }
      h2 { font-size: 15px; }
      h3 { font-size: 13px; }
    }

    @media screen {
      body { max-width: 860px; margin: 0 auto; padding: 0; background: #f5f5f5; }
      .page {
        background: #fff;
        margin: 24px auto;
        padding: 40px 48px;
        box-shadow: 0 2px 16px rgba(0,0,0,.1);
        border-radius: 4px;
        min-height: 900px;
      }
    }

    /* ── Print button ── */
    .print-bar {
      position: sticky; top: 0; z-index: 100;
      background: #1e3a5f; color: #fff;
      padding: 12px 24px;
      display: flex; align-items: center; justify-content: space-between;
      font-size: 13px;
    }
    .print-bar button {
      background: #b8860b; color: #fff; border: none;
      padding: 8px 24px; border-radius: 4px; cursor: pointer;
      font-size: 13px; font-weight: 700; letter-spacing: 0.03em;
    }
    .print-bar button:hover { background: #a07808; }

    /* ── Page header / footer ── */
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      border-bottom: 2px solid #1e3a5f; padding-bottom: 12px; margin-bottom: 24px;
    }
    .page-header h1 {
      font-size: 22px; font-weight: 700; color: #1e3a5f; margin-bottom: 2px;
    }
    .page-header .subtitle { font-size: 12px; color: #888; }
    .page-footer {
      margin-top: 32px; padding-top: 10px;
      border-top: 1px solid #ddd;
      display: flex; justify-content: space-between;
      font-size: 10px; color: #aaa;
    }
    .logo-text { font-weight: 700; color: #b8860b; font-size: 13px; letter-spacing: 0.05em; }

    /* ── Section headings ── */
    h2 {
      font-size: 16px; font-weight: 700; color: #1e3a5f;
      margin: 28px 0 12px;
      padding-bottom: 6px;
      border-bottom: 1.5px solid #2e6da4;
    }
    h2:first-of-type { margin-top: 0; }
    h3 {
      font-size: 13px; font-weight: 700; color: #2e6da4;
      margin: 16px 0 8px;
    }

    /* ── Info grid ── */
    .info-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 8px 24px; margin-bottom: 24px;
    }
    .info-item { display: flex; gap: 8px; align-items: baseline; }
    .info-label { font-size: 11px; color: #888; font-weight: 600; min-width: 90px; }
    .info-value { font-size: 13px; color: #1e3a5f; font-weight: 600; }

    /* ── Chart + birth info layout ── */
    .cover-grid {
      display: grid; grid-template-columns: 380px 1fr;
      gap: 32px; align-items: start;
    }

    /* ── Tables ── */
    .data-table {
      width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px;
    }
    .data-table th {
      background: #1e3a5f; color: #fff; font-weight: 700;
      padding: 7px 10px; text-align: left; font-size: 11px;
      letter-spacing: 0.03em;
    }
    .data-table td {
      padding: 6px 10px; border-bottom: 1px solid #eee;
    }
    .data-table tr:nth-child(even) td { background: #f9f9f9; }
    .data-table tr:hover td { background: #f0f4ff; }

    /* ── Ayanamsha badge ── */
    .badge {
      display: inline-block; padding: 2px 8px; border-radius: 12px;
      font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
      background: #e8f4fd; color: #1e3a5f; border: 1px solid #2e6da4;
    }

    /* ── Dasha timeline bar ── */
    .current-badge {
      display: inline-block; padding: 1px 6px; border-radius: 3px;
      background: #1e3a5f; color: #fff; font-size: 10px; font-weight: 700;
    }
  </style>
</head>
<body>

<!-- Print bar (screen only) -->
<div class="print-bar no-print" style="display:flex">
  <div>
    <span class="logo-text">${branding?.brandLogo ? brandLogo : `🪐 ${brandName}`}</span>
    <span style="margin-left:16px;color:#9bb3cc">Jyotish Chart — ${meta.name}</span>
  </div>
  <button onclick="window.print()">⬇ Download PDF</button>
</div>

<!-- ══════════════════════════════════════════════════════════ -->
<!-- PAGE 0: Cover Page                                        -->
<!-- ══════════════════════════════════════════════════════════ -->
<div class="page" style="display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:2rem">
  <div style="font-size:4rem;margin-bottom:1rem">${brandLogo}</div>
  <h1 style="font-size:3.5rem;font-family:'Cormorant Garamond',serif;color:#1e3a5f;letter-spacing:0.05em">${brandName}</h1>
  <div style="width:60px;height:4px;background:#c9a84c;margin:1rem 0"></div>
  <h2 style="border:none;font-size:1.8rem;margin-bottom:0">Personalized Jyotish Portfolio</h2>
  <div style="font-size:1.4rem;color:#555;margin-top:2rem">FOR</div>
  <div style="font-size:2.2rem;font-weight:700;color:#1e3a5f;margin-top:0.5rem">${meta.name}</div>
  <div style="margin-top:4rem;color:#888;font-size:0.9rem">GENERATED ON: ${generatedAt}</div>
  <div style="margin-top:auto;padding-bottom:2rem;color:#c9a84c;font-weight:700;letter-spacing:0.1em;border-top:1px solid #eee;width:100%;padding-top:2rem">
    CONFIDENTIAL ASTROLOGICAL ANALYSIS
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════ -->
<!-- PAGE 1: Natal Insights (D1 & D9)                          -->
<!-- ══════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="page-header">
    <div>
      <div class="logo-text">${branding?.brandLogo ? brandLogo : `🪐 ${brandName}`}</div>
      <h1>Natal Insights</h1>
      <div class="subtitle">${meta.name} — ${meta.birthDate} · ${meta.birthPlace}</div>
    </div>
    <div style="text-align:right">
       <span class="badge">${capitalize(meta.settings.ayanamsha)} Ayanamsha</span>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:2.5rem;margin-bottom:2.5rem;margin-top:1rem">
     <div style="text-align:center">
        <h3 style="margin-bottom:0.75rem;font-family:'Cormorant Garamond',serif;font-size:1.2rem;color:#1e3a5f">D1: Rashi (Standard)</h3>
        <div style="border:1.5px solid #e0e0e0;padding:12px;background:#fff;box-shadow:0 4px 10px rgba(0,0,0,0.05);border-radius:4px">${d1SVG}</div>
        <div style="font-size:11px;color:#888;margin-top:8px">Primary Life Chart & Body</div>
     </div>
     <div style="text-align:center">
        <h3 style="margin-bottom:0.75rem;font-family:'Cormorant Garamond',serif;font-size:1.2rem;color:#1e3a5f">D9: Navamsha (Fruits)</h3>
        <div style="border:1.5px solid #e0e0e0;padding:12px;background:#fff;box-shadow:0 4px 10px rgba(0,0,0,0.05);border-radius:4px">${d9SVG}</div>
        <div style="font-size:11px;color:#888;margin-top:8px">Strength of Planets & Relationships</div>
     </div>
  </div>

  <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:2rem">
    <div>
      <h2 style="margin-bottom:0.75rem">Birth Details</h2>
      <div class="info-grid" style="grid-template-columns: 1fr 1.5fr;">
         <div class="info-item"><span class="info-label">Gender</span><span class="info-value">${capitalize((meta as any).gender || 'other')}</span></div>
         <div class="info-item"><span class="info-label">Birth Time</span><span class="info-value">${meta.birthTime}</span></div>
         <div class="info-item"><span class="info-label">Place</span><span class="info-value">${meta.birthPlace}</span></div>
         <div class="info-item"><span class="info-label">Lat/Long</span><span class="info-value">${meta.latitude.toFixed(4)}, ${meta.longitude.toFixed(4)}</span></div>
         <div class="info-item"><span class="info-label">Timezone</span><span class="info-value">${meta.timezone}</span></div>
         <div class="info-item"><span class="info-label">Nodes</span><span class="info-value">${capitalize(meta.settings.nodeMode)}</span></div>
      </div>
    </div>
    <div>
       <h2 style="margin-bottom:0.75rem">Special Lagnas</h2>
       ${buildLagnasHTML(chart)}
    </div>
  </div>

  <div class="page-footer">
    <span>Portfolio for ${meta.name}</span>
    <span>Page 1</span>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════ -->
<!-- PAGE 2: Planet Table + Arudhas                            -->
<!-- ══════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="page-header">
    <div>
      <div class="logo-text">${branding?.brandLogo ? brandLogo : `🪐 ${brandName}`}</div>
      <h1>${meta.name} — Planetary Positions</h1>
    </div>
  </div>

  <h2>Planetary Positions</h2>
  ${buildPlanetTable(chart)}

  <h2 style="margin-top:32px">Āruḍha Padas</h2>
  ${buildArudhasHTML(chart)}

  <h2 style="margin-top:32px">Natal Pañcāṅga</h2>
  ${buildPanchangHTML(chart)}

  <div class="page-footer">
    <span>${brandName}</span>
    <span>Page 2</span>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════ -->
<!-- PAGE 3: Vimshottari Dasha                                 -->
<!-- ══════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="page-header">
    <div>
      <div class="logo-text">${branding?.brandLogo ? brandLogo : `🪐 ${brandName}`}</div>
      <h1>${meta.name} — Vimśottarī Daśā</h1>
      <div class="subtitle">120-year Maha Dasha cycle from Moon Nakshatra</div>
    </div>
  </div>

  <h2>Vimśottarī Daśā Timeline</h2>
  <p style="font-size:11px;color:#888;margin-bottom:12px">
    Moon Nakshatra: <strong>${chart.panchang.nakshatra.name}</strong> — 
    Current period highlighted in blue.
  </p>
  ${buildDashaHTML(chart)}

  <div class="page-footer">
    <span>${brandName}</span>
    <span>Page 3</span>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════ -->
<!-- PAGE 4: Ashtakavarga + Shadbala                           -->
<!-- ══════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="page-header">
    <div>
      <div class="logo-text">🪐 VEDAANSH JYOTISH</div>
      <h1>${meta.name} — Strength Analysis</h1>
    </div>
  </div>

  <h2>Aṣṭakavarga (Bindu Grid)</h2>
  <p style="font-size:11px;color:#888;margin-bottom:12px">
    Houses ordered from Lagna. Green = strong (≥30 SAV). Red = weak (≤20 SAV).
  </p>
  ${buildAshtakavargaHTML(chart)}

  <h2 style="margin-top:32px">Ṣaḍbala (Planetary Strength)</h2>
  <p style="font-size:11px;color:#888;margin-bottom:12px">
    All values in Rupas. Strongest: <strong>${chart.shadbala?.strongest || '—'}</strong> · 
    Weakest: <strong>${chart.shadbala?.weakest || '—'}</strong>
  </p>
  ${buildShadbalaHTML(chart)}

  ${buildInterpretationHTML(chart)}

  <div class="page-footer">
    <span>${brandName}</span>
    <span>Page 4</span>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════ -->
<!-- PAGE 5: Graha Yogas                                       -->
<!-- ══════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="page-header">
    <div>
      <div class="logo-text">${branding?.brandLogo ? brandLogo : `🪐 ${brandName}`}</div>
      <h1>${meta.name} — Graha Yogas</h1>
      <div class="subtitle">Planetary combinations in the birth chart</div>
    </div>
  </div>

  <h2>Graha Yogas (${chart.yogas?.length || 0} found)</h2>
  ${buildYogasHTML(chart)}

  <div style="margin-top:32px;padding:16px;background:#f9f9f9;border-left:3px solid #2e6da4;border-radius:2px">
    <p style="font-size:11px;color:#555;line-height:1.7">
      <strong>Disclaimer:</strong> This report is generated by ${brandName} using Swiss Ephemeris (swisseph) 
      calculations with ${capitalize(meta.settings.ayanamsha)} ayanamsha and ${capitalize(meta.settings.houseSystem)} house system. 
      Vedic astrology is a complex tradition — please consult a qualified Jyotishi for a full reading. 
      ${siteUrl ? `Generated on ${generatedAt} at ${siteUrl}.` : `Generated on ${generatedAt}.`}
    </p>
  </div>

  <div class="page-footer">
    <span>${brandName} ${siteUrl ? `— ${siteUrl}` : ''}</span>
    <span>Page 5 · © ${new Date().getFullYear()} ${brandName}</span>
  </div>
</div>

</body>
</html>`
}