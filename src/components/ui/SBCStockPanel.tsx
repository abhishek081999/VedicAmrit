'use client'
/**
 * SBCStockPanel.tsx
 * Sarvatobhadra Chakra × Stock Market & Trading
 * Comprehensive Vedic trading intelligence panel
 */

import { useState, useMemo } from 'react'
import type { SBCAnalysisExtended } from '@/lib/engine/sarvatobhadra'

// ── Types ──────────────────────────────────────────────────────
interface TithiInfo {
  paksha: 'shukla' | 'krishna'
  name:   string
  type:   string
  quality: string
  num:    number
}

interface TransitGraha {
  id:          string
  lonSidereal: number
  isRetro?:    boolean
}

interface Props {
  pulse?:       { score: number; trend: string; bullish: string[]; bearish: string[] } | null
  tithi?:       TithiInfo | null
  transitDate:  string
  transitRaw:   TransitGraha[]
  analysis?:    SBCAnalysisExtended | null
}

// ── Constants ─────────────────────────────────────────────────

const PLANET_COLOR: Record<string, string> = {
  Su: '#f59e0b', Mo: '#e2e8f0', Ma: '#ef4444', Me: '#22c55e',
  Ju: '#DAA520', Ve: '#ec4899', Sa: '#94a3b8', Ra: '#7c3aed', Ke: '#a78bfa',
}

type StockTabId = 'signal' | 'sectors' | 'daily' | 'nakshatras' | 'hora' | 'strategies' | 'portfolio'

const STOCK_TABS: { id: StockTabId; icon: string; label: string }[] = [
  { id: 'signal',     icon: '📡', label: 'Live Signal'  },
  { id: 'sectors',    icon: '🏭', label: 'Sectors'      },
  { id: 'daily',      icon: '📅', label: 'Daily Plan'   },
  { id: 'nakshatras', icon: '⭐', label: 'Nakshatra'    },
  { id: 'hora',       icon: '⏰', label: 'Hora'         },
  { id: 'strategies', icon: '📈', label: 'Strategies'   },
  { id: 'portfolio',  icon: '💼', label: 'Portfolio'    },
]

interface PlanetSector {
  id:      string
  symbol:  string
  name:    string
  sectors: string
  stocks:  string
  color:   string
}

const PLANET_SECTORS: PlanetSector[] = [
  { id:'Su', symbol:'☀', name:'Sun',     sectors:'Government · PSU · Power',          stocks:'ONGC, NTPC, Coal India, BHEL, BEL',        color:'#f59e0b' },
  { id:'Mo', symbol:'🌙', name:'Moon',   sectors:'FMCG · Retail · Consumer',           stocks:'HUL, ITC, DMART, Dabur, Britannia',         color:'#e2e8f0' },
  { id:'Ma', symbol:'♂', name:'Mars',   sectors:'Real Estate · Defence · Steel',      stocks:'DLF, HAL, Tata Steel, GAIL, BEL',           color:'#ef4444' },
  { id:'Me', symbol:'☿', name:'Mercury',sectors:'IT · Telecom · Banking',             stocks:'TCS, Infosys, HDFC, Airtel, Wipro',         color:'#22c55e' },
  { id:'Ju', symbol:'♃', name:'Jupiter',sectors:'Finance · Pharma · Education',       stocks:'Bajaj Finance, Sun Pharma, Dr Reddy, Cipla', color:'#DAA520' },
  { id:'Ve', symbol:'♀', name:'Venus',  sectors:'Auto · Luxury · Entertainment',      stocks:'Maruti, Titan, Hero Moto, PVR, Tata Motors', color:'#ec4899' },
  { id:'Sa', symbol:'♄', name:'Saturn', sectors:'Infrastructure · Mining · Metals',   stocks:'L&T, Hindalco, SAIL, JSW Steel, Adani Ports',color:'#94a3b8' },
  { id:'Ra', symbol:'☊', name:'Rahu',   sectors:'New-age Tech · Foreign · Crypto',    stocks:'Zomato, Adani Group, Paytm, Info Edge',     color:'#7c3aed' },
  { id:'Ke', symbol:'☋', name:'Ketu',   sectors:'Spiritual · Old Economy · Pharma',   stocks:'ITC, Coal India, Divis Labs',               color:'#a78bfa' },
]

interface NakGuide {
  nak: string; lord: string; effect: string; action: string; stocks: string; color: string
}

const NAK_TRADING: NakGuide[] = [
  { nak:'Ashwini',           lord:'Ke', effect:'Sudden moves · Fast reversals',    action:'Watch carefully · Scalp only', stocks:'Pharma/Old Economy', color:'#a78bfa' },
  { nak:'Bharani',           lord:'Ve', effect:'Luxury & Auto UP · Stable trend',  action:'BUY Venus stocks',             stocks:'Maruti, Titan, PVR', color:'#ec4899' },
  { nak:'Krittika',          lord:'Su', effect:'PSU/Govt stocks UP',               action:'BUY Sun sectors',              stocks:'ONGC, NTPC, BHEL',   color:'#f59e0b' },
  { nak:'Rohini',            lord:'Mo', effect:'FMCG/Consumer very strong',        action:'STRONG BUY Moon stocks',       stocks:'HUL, ITC, DMART',    color:'#e2e8f0' },
  { nak:'Mrigashira',        lord:'Ma', effect:'Energy/Steel UP · Volatile',       action:'BUY Mars sectors',             stocks:'Tata Steel, GAIL',   color:'#ef4444' },
  { nak:'Ardra',             lord:'Ra', effect:'Volatile · Tech spikes',           action:'CAUTION · Wait for trend',     stocks:'IT/New-age',         color:'#7c3aed' },
  { nak:'Punarvasu',         lord:'Ju', effect:'Finance/Pharma UP · Recovery',     action:'BUY Jupiter stocks',           stocks:'Bajaj Finance, Cipla',color:'#DAA520' },
  { nak:'Pushya',            lord:'Sa', effect:'Best nakshatra · Steady gains',    action:'MAXIMUM BUY',                  stocks:'L&T, all large-caps', color:'#94a3b8' },
  { nak:'Ashlesha',          lord:'Me', effect:'IT UP but deceptive moves',        action:'BUY IT cautiously',            stocks:'TCS, Infosys',       color:'#22c55e' },
  { nak:'Magha',             lord:'Ke', effect:'Sudden fall risk · Destruction',   action:'REDUCE positions',             stocks:'Avoid new entries',  color:'#a78bfa' },
  { nak:'Purva Phalguni',    lord:'Ve', effect:'Entertainment/Auto UP',            action:'BUY Venus stocks',             stocks:'PVR, Titan, Maruti', color:'#ec4899' },
  { nak:'Uttara Phalguni',   lord:'Su', effect:'Govt/Leadership stocks UP',        action:'BUY Sun sectors',              stocks:'ONGC, PSU banks',    color:'#f59e0b' },
  { nak:'Hasta',             lord:'Mo', effect:'Consumer/FMCG UP · Media',         action:'BUY Moon stocks',              stocks:'HUL, Zee, DMART',    color:'#e2e8f0' },
  { nak:'Chitra',            lord:'Ma', effect:'Manufacturing/Engineering UP',     action:'BUY Mars sectors',             stocks:'HAL, L&T, BEL',      color:'#ef4444' },
  { nak:'Swati',             lord:'Ra', effect:'Foreign stocks UP · MNC surge',    action:'BUY Nifty/FII stocks',         stocks:'IT, FMCG MNCs',      color:'#7c3aed' },
  { nak:'Vishakha',          lord:'Ju', effect:'Banking/Finance UP',               action:'BUY Jupiter stocks',           stocks:'HDFC, Bajaj Finance', color:'#DAA520' },
  { nak:'Anuradha',          lord:'Sa', effect:'Mining/Metals steady',             action:'BUY Saturn sectors',           stocks:'Hindalco, SAIL',     color:'#94a3b8' },
  { nak:'Jyeshtha',          lord:'Me', effect:'Telecom/IT UP · Authority',        action:'BUY Mercury stocks',           stocks:'Airtel, TCS, Wipro', color:'#22c55e' },
  { nak:'Moola',             lord:'Ke', effect:'Market destruction energy',        action:'EXIT all positions',           stocks:'No new entries',     color:'#a78bfa' },
  { nak:'Purva Ashadha',     lord:'Ve', effect:'Luxury/Auto strong UP',            action:'BUY Venus stocks',             stocks:'Maruti, Titan, Hero',color:'#ec4899' },
  { nak:'Uttara Ashadha',    lord:'Su', effect:'Leadership/Govt stocks UP',        action:'BUY Sun sectors',              stocks:'ONGC, NTPC, BHEL',   color:'#f59e0b' },
  { nak:'Shravana',          lord:'Mo', effect:'Media/FMCG/Consumer UP',           action:'BUY Moon stocks',              stocks:'Zee, HUL, ITC',      color:'#e2e8f0' },
  { nak:'Dhanishtha',        lord:'Ma', effect:'Steel/Metals strong UP',           action:'BUY Mars sectors',             stocks:'Tata Steel, SAIL',   color:'#ef4444' },
  { nak:'Shatabhisha',       lord:'Ra', effect:'Pharma/Tech selective UP',         action:'Selective buy only',           stocks:'Sun Pharma, TCS',    color:'#7c3aed' },
  { nak:'Purva Bhadrapada',  lord:'Ju', effect:'Finance cautious period',          action:'CAREFUL trading',              stocks:'Reduce Finance',     color:'#DAA520' },
  { nak:'Uttara Bhadrapada', lord:'Sa', effect:'Long-term investments favored',    action:'SIP / Long-term BUY',          stocks:'Index funds, MFs',   color:'#94a3b8' },
  { nak:'Revati',            lord:'Me', effect:'IT/Small-caps UP · Cycle end',     action:'BUY Mercury stocks',           stocks:'Infosys, Wipro',     color:'#22c55e' },
]

interface HoraGuide {
  planet: string; symbol: string; effect: string; action: string; color: string
}

const HORA_GUIDE: HoraGuide[] = [
  { planet:'Sun',     symbol:'☀', effect:'Strong opening · PSU surge',      action:'BUY PSU/Govt stocks',    color:'#f59e0b' },
  { planet:'Moon',    symbol:'🌙', effect:'Consumer goods UP · Sentiment',   action:'BUY FMCG stocks',        color:'#e2e8f0' },
  { planet:'Mars',    symbol:'♂', effect:'Volatile sharp move · Energy',    action:'Reduce size · Careful',  color:'#ef4444' },
  { planet:'Mercury', symbol:'☿', effect:'IT/Banking move · Quick gains',   action:'BUY IT/Banking',         color:'#22c55e' },
  { planet:'Jupiter', symbol:'♃', effect:'Overall positive · Finance UP',   action:'BUY Finance/Pharma',     color:'#DAA520' },
  { planet:'Venus',   symbol:'♀', effect:'Auto/Luxury UP · Smooth trend',   action:'BUY Auto/Luxury',        color:'#ec4899' },
  { planet:'Saturn',  symbol:'♄', effect:'Slow/Bearish · Heavy selling',    action:'AVOID / Short only',     color:'#94a3b8' },
  { planet:'Rahu',    symbol:'☊', effect:'Sudden spike or fall · Trap',     action:'Very careful · No FOMO', color:'#7c3aed' },
  { planet:'Ketu',    symbol:'☋', effect:'Unexpected reversal · Confusion', action:'EXIT positions · Cash',  color:'#a78bfa' },
]

const WEEKDAY_PLAN = [
  { day:'Monday',    planet:'Moon',    color:'#e2e8f0', tendency:'FMCG/Retail UP',        stocks:'HUL, ITC, DMART, Dabur',        icon:'🌙' },
  { day:'Tuesday',   planet:'Mars',    color:'#ef4444', tendency:'Real Estate/Defence UP', stocks:'DLF, HAL, Tata Power, BEL',     icon:'♂' },
  { day:'Wednesday', planet:'Mercury', color:'#22c55e', tendency:'IT/Banking UP',          stocks:'TCS, HDFC, Infosys, Wipro',     icon:'☿' },
  { day:'Thursday',  planet:'Jupiter', color:'#DAA520', tendency:'Finance/Pharma UP',      stocks:'Bajaj Finance, Cipla, Dr Reddy', icon:'♃' },
  { day:'Friday',    planet:'Venus',   color:'#ec4899', tendency:'Auto/Luxury UP',         stocks:'Maruti, Titan, Hero Moto',      icon:'♀' },
  { day:'Saturday',  planet:'Saturn',  color:'#94a3b8', tendency:'Infrastructure steady',  stocks:'L&T, SAIL, Hindalco',           icon:'♄' },
  { day:'Sunday',    planet:'Sun',     color:'#f59e0b', tendency:'Market Closed',          stocks:'Watch PSU stocks for Monday',   icon:'☀' },
]

const STRATEGIES = [
  {
    id: 'rotation',
    icon: '🔄',
    name: 'Nakshatra Rotation',
    color: '#22c55e',
    tagline: 'Trade with Moon\'s daily nakshatra lord',
    steps: [
      'Track Moon\'s current nakshatra each day',
      'Identify which planet rules that nakshatra',
      'BUY stocks of that planet\'s sector',
      'Hold 2–3 days until Moon changes nakshatra',
      'EXIT when Moon enters malefic nakshatra (Ardra/Moola/Ashlesha)',
    ],
    example: 'Moon in Rohini (Moon) → BUY HUL, ITC, DMART → Exit at Ardra (Rahu)',
    risk: 'Low',
  },
  {
    id: 'vedha',
    icon: '⚡',
    name: 'Vedha Breakout',
    color: '#DAA520',
    tagline: 'Trade planetary vedha for big directional moves',
    steps: [
      'Jupiter Vedha on market nakshatra → STRONG RALLY → BUY breakout',
      'Saturn Vedha → STRONG FALL → SELL/SHORT breakdown',
      'Rahu Vedha → VOLATILE SPIKE → Wait for direction then trade',
      'Mars Vedha → Sharp volatile move → Reduce position, strict SL',
      'Venus Vedha → Auto/Luxury surge → BUY sector',
    ],
    example: 'Jupiter creates Vedha on Rohini → BUY Nifty for 2–3% gain',
    risk: 'Medium',
  },
  {
    id: 'benefic',
    icon: '⚖️',
    name: 'Benefic vs Malefic',
    color: '#4db66a',
    tagline: 'Simple buy/sell based on planet quality today',
    steps: [
      'Jupiter + Venus + Mercury positive → BUY index, full position',
      'Saturn + Mars + Rahu negative → SELL/SHORT, maximum cash',
      'Mixed vedha → Range-bound trading, small size, quick exits',
      'No overnight positions on mixed/malefic days',
    ],
    example: 'Jupiter & Venus both positive → BUY Nifty at open, target 1.5–2%',
    risk: 'Low',
  },
  {
    id: 'sector',
    icon: '🏭',
    name: 'Sector Rotation',
    color: '#ec4899',
    tagline: 'Rotate portfolio based on planetary strength weekly',
    steps: [
      'Identify strongest planet from SBC vedha analysis',
      'Overweight that planet\'s market sector',
      'Underweight sectors of afflicted planets',
      'Hold rotation for 1–2 weeks (or until planet changes sign)',
      'Re-evaluate every Sunday night using new transit data',
    ],
    example: 'Jupiter strongest this week → Overweight Banking + Pharma (40%)',
    risk: 'Low',
  },
  {
    id: 'eclipse',
    icon: '🌑',
    name: 'Eclipse Trading',
    color: '#7c3aed',
    tagline: 'Rahu/Ketu vedha = big market events around eclipses',
    steps: [
      'Before eclipse (15 days): Reduce positions 50%, keep cash',
      'During eclipse: DO NOT trade — extreme uncertainty',
      'After eclipse (15 days): New trend starts — BUY in new direction',
      'Rahu nakshatra sector volatile during eclipse period',
      'Ketu nakshatra sector likely to see losses — avoid',
    ],
    example: 'Post-eclipse day: Nifty breaks out → Strong BUY signal for new trend',
    risk: 'High (eclipse) / Low (post-eclipse)',
  },
]

const PORTFOLIO_PLANS = [
  {
    planet: 'Jupiter',
    symbol: '♃',
    color: '#DAA520',
    condition: 'Strong/Positive Vedha',
    type: 'bull',
    allocation: [
      { label: 'Finance/Banking', pct: 40, color: '#DAA520' },
      { label: 'Pharma',         pct: 20, color: '#22c55e' },
      { label: 'Quality Large-caps', pct: 20, color: '#4db66a' },
      { label: 'Mid-caps',       pct: 10, color: '#f59e0b' },
      { label: 'Cash Reserve',   pct: 10, color: '#94a3b8' },
    ],
  },
  {
    planet: 'Saturn',
    symbol: '♄',
    color: '#94a3b8',
    condition: 'Malefic/Weak Vedha',
    type: 'bear',
    allocation: [
      { label: 'Strong Stocks (best only)', pct: 10, color: '#4db66a' },
      { label: 'Gold/Silver',  pct: 20, color: '#DAA520' },
      { label: 'Fixed Deposits', pct: 30, color: '#22c55e' },
      { label: 'Cash Reserve', pct: 40, color: '#94a3b8' },
    ],
  },
  {
    planet: 'Rahu',
    symbol: '☊',
    color: '#7c3aed',
    condition: 'Volatile/Mixed Vedha',
    type: 'volatile',
    allocation: [
      { label: 'Defensive Stocks', pct: 30, color: '#22c55e' },
      { label: 'IT/Tech',          pct: 20, color: '#22c55e' },
      { label: 'Gold',             pct: 20, color: '#DAA520' },
      { label: 'Cash Reserve',     pct: 30, color: '#94a3b8' },
    ],
  },
  {
    planet: 'Venus',
    symbol: '♀',
    color: '#ec4899',
    condition: 'Benefic Bull Market',
    type: 'bull',
    allocation: [
      { label: 'Auto/Luxury',      pct: 30, color: '#ec4899' },
      { label: 'Consumer Goods',   pct: 20, color: '#e2e8f0' },
      { label: 'Finance',          pct: 20, color: '#DAA520' },
      { label: 'Mid/Small-caps',   pct: 20, color: '#f59e0b' },
      { label: 'Cash Reserve',     pct: 10, color: '#94a3b8' },
    ],
  },
]

// ── Helpers ───────────────────────────────────────────────────

function getDayOfWeek(dateStr: string): number {
  // 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
  return new Date(dateStr + 'T12:00:00').getDay()
}

function getNakLord(lonSidereal: number): string {
  const nak = Math.floor((lonSidereal % 360) / (360 / 27))
  const lords = ['Ke','Ve','Su','Mo','Ma','Ra','Ju','Sa','Me','Ke','Ve','Su','Mo','Ma','Ra','Ju','Sa','Me','Ke','Ve','Su','Mo','Ma','Ra','Ju','Sa','Me']
  return lords[nak] ?? 'Ju'
}

// ── Signal Computation ────────────────────────────────────────

function computeSignal(
  pulse:      Props['pulse'],
  tithi:      TithiInfo | null | undefined,
  transitDate: string,
  transitRaw: TransitGraha[],
) {
  let score = 0
  const reasons: { text: string; bull: boolean }[] = []

  // 1. Paksha
  if (tithi?.paksha === 'shukla') {
    score += 2; reasons.push({ text: `${tithi.name} (Shukla Paksha) — waxing moon, bullish sentiment`, bull: true })
  } else if (tithi?.paksha === 'krishna') {
    score -= 1; reasons.push({ text: `${tithi.name} (Krishna Paksha) — waning moon, cautious`, bull: false })
  }

  // 2. Weekday planet
  const dow = getDayOfWeek(transitDate)
  const dayMeta = WEEKDAY_PLAN[dow]
  if (['Jupiter','Venus','Mercury'].includes(dayMeta.planet)) {
    score += 2; reasons.push({ text: `${dayMeta.day} ruled by ${dayMeta.planet} — bullish weekday`, bull: true })
  } else if (['Saturn','Mars'].includes(dayMeta.planet)) {
    score -= 1; reasons.push({ text: `${dayMeta.day} ruled by ${dayMeta.planet} — cautious weekday`, bull: false })
  } else {
    reasons.push({ text: `${dayMeta.day} ruled by ${dayMeta.planet} — neutral`, bull: true })
  }

  // 3. Moon nakshatra lord
  const mo = transitRaw.find(g => g.id === 'Mo')
  if (mo) {
    const lord = getNakLord(mo.lonSidereal)
    const nakRow = NAK_TRADING[Math.floor((mo.lonSidereal % 360) / (360/27))]
    if (['Ju','Ve','Me'].includes(lord)) {
      score += 2; reasons.push({ text: `Moon in ${nakRow?.nak ?? '—'} (${lord} lord) — benefic nakshatra`, bull: true })
    } else if (['Sa','Ra','Ke'].includes(lord)) {
      score -= 2; reasons.push({ text: `Moon in ${nakRow?.nak ?? '—'} (${lord} lord) — malefic nakshatra`, bull: false })
    } else {
      score += 1; reasons.push({ text: `Moon in ${nakRow?.nak ?? '—'} (${lord} lord) — neutral nakshatra`, bull: true })
    }
  }

  // 4. Financial pulse
  if (pulse) {
    if (pulse.score > 15) { score += 2; reasons.push({ text: `SBC Vedha pulse strongly bullish (+${pulse.score})`, bull: true }) }
    else if (pulse.score > 5)  { score += 1; reasons.push({ text: `SBC Vedha pulse moderately bullish (+${pulse.score})`, bull: true }) }
    else if (pulse.score < -15) { score -= 2; reasons.push({ text: `SBC Vedha pulse strongly bearish (${pulse.score})`, bull: false }) }
    else if (pulse.score < -5)  { score -= 1; reasons.push({ text: `SBC Vedha pulse moderately bearish (${pulse.score})`, bull: false }) }
    else { reasons.push({ text: `SBC Vedha pulse neutral (${pulse.score})`, bull: true }) }
  }

  // 5. Retrograde planets
  const retros = transitRaw.filter(g => g.isRetro && ['Ju','Ve'].includes(g.id))
  if (retros.length) {
    score -= 1
    reasons.push({ text: `${retros.map(g => ({ Ju:'Jupiter', Ve:'Venus' }[g.id])).join(', ')} retrograde — bullish planets weakened`, bull: false })
  }

  const level = score >= 6 ? 'STRONG BUY' : score >= 3 ? 'BUY' : score >= 0 ? 'NEUTRAL' : score >= -2 ? 'SELL' : 'STRONG SELL'
  const color  = score >= 6 ? '#4db66a' : score >= 3 ? '#a3c65a' : score >= 0 ? '#c9a84c' : score >= -2 ? '#FF8C00' : '#e84040'
  const dots   = score >= 6 ? 3 : score >= 3 ? 2 : score >= 0 ? 0 : score >= -2 ? -2 : -3

  return { score, level, color, dots, reasons }
}

// ── Sub-components ────────────────────────────────────────────

function SignalDots({ level, color }: { level: string; color: string }) {
  const isBull = level.includes('BUY')
  const isBear = level.includes('SELL')
  const count  = level.startsWith('STRONG') ? 3 : level === 'BUY' || level === 'SELL' ? 2 : 1
  const dots   = isBull || isBear ? count : 1
  const sym    = isBull ? '🟢' : isBear ? '🔴' : '⚪'
  return <span style={{ fontSize: '1rem', letterSpacing: 2 }}>{Array(dots).fill(sym).join('')}</span>
}

function AllocationBar({ items }: { items: { label: string; pct: number; color: string }[] }) {
  return (
    <div>
      <div style={{ display: 'flex', height: 12, borderRadius: 8, overflow: 'hidden', marginBottom: '0.5rem' }}>
        {items.map(item => (
          <div key={item.label} style={{ width: `${item.pct}%`, background: item.color, transition: 'width 0.6s ease' }} title={`${item.label}: ${item.pct}%`} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {items.map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.label}</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: item.color }}>{item.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────

export function SBCStockPanel({ pulse, tithi, transitDate, transitRaw, analysis }: Props) {
  const [activeTab, setActiveTab] = useState<StockTabId>('signal')
  const [isMobile,  setIsMobile]  = useState(false)

  // responsive
  typeof window !== 'undefined' && !isMobile && window.innerWidth < 768 && setIsMobile(true)

  const signal = useMemo(
    () => computeSignal(pulse, tithi, transitDate, transitRaw),
    [pulse, tithi, transitDate, transitRaw],
  )

  const dow        = getDayOfWeek(transitDate)
  const todayPlan  = WEEKDAY_PLAN[dow]
  const moonGraha  = transitRaw.find(g => g.id === 'Mo')
  const moonNakIdx = moonGraha ? Math.floor((moonGraha.lonSidereal % 360) / (360/27)) : -1
  const moonNak    = moonNakIdx >= 0 ? NAK_TRADING[moonNakIdx] : null

  // Determine dominant portfolio based on pulse
  const dominantPortfolio = useMemo(() => {
    if (!pulse) return PORTFOLIO_PLANS[0]
    if (pulse.score > 10)  return PORTFOLIO_PLANS[0] // Jupiter
    if (pulse.score < -10) return PORTFOLIO_PLANS[1] // Saturn
    if (pulse.trend === 'expansion') return PORTFOLIO_PLANS[3] // Venus
    return PORTFOLIO_PLANS[2] // Rahu/volatile
  }, [pulse])

  return (
    <section style={{ marginTop: '1.5rem' }}>
      {/* ── Section Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(218,165,32,0.06) 50%, rgba(239,68,68,0.06) 100%)',
        border: '1px solid rgba(34,197,94,0.2)',
        borderRadius: '20px 20px 0 0',
        padding: '1.25rem 1.5rem',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: `${signal.color}18`, border: `2px solid ${signal.color}50`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0,
          }}>📈</div>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem,2.5vw,1.25rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
              Sarvatobhadra × Stock Market Intelligence
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Vedic planetary timing for trading · Sector rotation · Daily signals
            </p>
          </div>
        </div>
        {/* Live signal badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 1rem', borderRadius: '20px',
          background: `${signal.color}15`, border: `2px solid ${signal.color}45`,
        }}>
          <SignalDots level={signal.level} color={signal.color} />
          <div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today's Signal</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 900, color: signal.color }}>{signal.level}</div>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={{
        display: 'flex', overflowX: 'auto', gap: 2,
        background: 'var(--surface-2)', padding: '4px 6px',
        borderLeft: '1px solid var(--border-soft)', borderRight: '1px solid var(--border-soft)',
        scrollbarWidth: 'none',
      }}>
        {STOCK_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flexShrink: 0, padding: '0.45rem 0.9rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: activeTab === tab.id ? 'var(--surface-0)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-gold)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '0.72rem', whiteSpace: 'nowrap',
              boxShadow: activeTab === tab.id ? '0 2px 10px rgba(0,0,0,0.2)' : 'none',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div style={{
        background: 'var(--surface-1)', border: '1px solid var(--border-soft)',
        borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '1.5rem',
      }}>

        {/* ════ LIVE SIGNAL ════ */}
        {activeTab === 'signal' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>

            {/* Main signal card */}
            <div style={{ background: `${signal.color}0a`, border: `2px solid ${signal.color}35`, borderRadius: 16, padding: '1.5rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                  {signal.level.includes('BUY') ? '📈' : signal.level === 'NEUTRAL' ? '↔️' : '📉'}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: signal.color, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                  {signal.level}
                </div>
                <SignalDots level={signal.level} color={signal.color} />
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Score: <strong style={{ color: signal.color }}>{signal.score > 0 ? '+' : ''}{signal.score}</strong> / 10
                </div>
              </div>

              {/* Score bar */}
              <div style={{ position: 'relative', height: 10, background: 'var(--surface-3)', borderRadius: 10, overflow: 'hidden', marginBottom: '0.4rem' }}>
                <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.3)' }} />
                <div style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left:  signal.score >= 0 ? '50%' : `${50 + (signal.score / 10) * 50}%`,
                  width: `${Math.abs(signal.score) / 10 * 50}%`,
                  background: `linear-gradient(90deg, ${signal.color}, ${signal.color}88)`,
                  borderRadius: signal.score >= 0 ? '0 10px 10px 0' : '10px 0 0 10px',
                  transition: 'all 0.6s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                <span>Bear −10</span><span>Neutral 0</span><span>Bull +10</span>
              </div>

              {/* Action guide */}
              <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '0.875rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-gold)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Recommended Action
                </div>
                {signal.level === 'STRONG BUY' && (
                  <div style={{ fontSize: '0.8rem', color: '#4db66a', lineHeight: 1.6 }}>
                    ✓ BUY with full position size<br/>
                    ✓ Focus: {todayPlan.tendency}<br/>
                    ✓ Stocks: {todayPlan.stocks}<br/>
                    ✓ Can hold overnight positions
                  </div>
                )}
                {signal.level === 'BUY' && (
                  <div style={{ fontSize: '0.8rem', color: '#a3c65a', lineHeight: 1.6 }}>
                    ✓ BUY with 50–75% position size<br/>
                    ✓ Focus: {todayPlan.tendency}<br/>
                    ✓ Stocks: {todayPlan.stocks}<br/>
                    ⚠ Use stop-loss for safety
                  </div>
                )}
                {signal.level === 'NEUTRAL' && (
                  <div style={{ fontSize: '0.8rem', color: '#c9a84c', lineHeight: 1.6 }}>
                    ↔ Range-bound day expected<br/>
                    ↔ Small positions, quick exits<br/>
                    ↔ Buy low, sell high in range<br/>
                    ↔ No overnight positions
                  </div>
                )}
                {signal.level === 'SELL' && (
                  <div style={{ fontSize: '0.8rem', color: '#FF8C00', lineHeight: 1.6 }}>
                    ✗ SELL 50–75% of positions<br/>
                    ✗ Avoid weak stocks<br/>
                    ✗ Keep stop-loss tight<br/>
                    ✗ Increase cash to 40–50%
                  </div>
                )}
                {signal.level === 'STRONG SELL' && (
                  <div style={{ fontSize: '0.8rem', color: '#e84040', lineHeight: 1.6 }}>
                    ✗ EXIT all positions<br/>
                    ✗ Go fully to cash or SHORT<br/>
                    ✗ Do not buy any stocks<br/>
                    ✗ Very high risk period
                  </div>
                )}
              </div>
            </div>

            {/* Signal breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Signal Breakdown (5 Factors)</div>
              {signal.reasons.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                  padding: '0.65rem 0.875rem', borderRadius: 10,
                  background: r.bull ? 'rgba(77,182,106,0.07)' : 'rgba(232,64,64,0.07)',
                  border: `1px solid ${r.bull ? 'rgba(77,182,106,0.2)' : 'rgba(232,64,64,0.2)'}`,
                }}>
                  <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{r.bull ? '↑' : '↓'}</span>
                  <span style={{ fontSize: '0.73rem', color: r.bull ? 'var(--teal)' : 'var(--rose)', lineHeight: 1.45 }}>{r.text}</span>
                </div>
              ))}

              {/* Today snapshot */}
              <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '0.875rem', marginTop: '0.25rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today's Snapshot</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <div style={{ padding: '3px 10px', borderRadius: 20, background: `${todayPlan.color}15`, border: `1px solid ${todayPlan.color}35`, fontSize: '0.68rem', fontWeight: 700, color: todayPlan.color }}>
                    {todayPlan.icon} {todayPlan.day} · {todayPlan.planet} Day
                  </div>
                  {tithi && (
                    <div style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', fontSize: '0.68rem', color: 'var(--text-gold)' }}>
                      {tithi.paksha === 'shukla' ? '☽' : '🌑'} {tithi.name}
                    </div>
                  )}
                  {moonNak && (
                    <div style={{ padding: '3px 10px', borderRadius: 20, background: `${moonNak.color}12`, border: `1px solid ${moonNak.color}30`, fontSize: '0.68rem', color: moonNak.color }}>
                      🌙 {moonNak.nak}
                    </div>
                  )}
                </div>
                {moonNak && (
                  <div style={{ marginTop: '0.6rem', fontSize: '0.7rem', color: moonNak.color, fontWeight: 600 }}>
                    → {moonNak.action} · <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{moonNak.stocks}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════ SECTORS ════ */}
        {activeTab === 'sectors' && (
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Planet → Market Sector → Stocks</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>When a planet is positive in SBC vedha, buy its sector. When afflicted, avoid it.</div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {PLANET_SECTORS.map(ps => {
                const isPos = pulse?.bullish?.some(b => b.toLowerCase().includes(ps.name.toLowerCase()))
                const isNeg = pulse?.bearish?.some(b => b.toLowerCase().includes(ps.name.toLowerCase()))
                return (
                  <div key={ps.id} style={{
                    background: 'var(--surface-2)', borderRadius: 14,
                    border: `1.5px solid ${isPos ? '#4db66a' : isNeg ? '#e84040' : ps.color}30`,
                    overflow: 'hidden',
                  }}>
                    <div style={{ background: `${ps.color}12`, padding: '0.7rem 0.875rem', borderBottom: `2px solid ${ps.color}35`, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1.3rem' }}>{ps.symbol}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: ps.color }}>{ps.name}</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{ps.sectors}</div>
                      </div>
                      {isPos && <span style={{ fontSize: '0.6rem', padding: '2px 7px', borderRadius: 10, background: 'rgba(77,182,106,0.15)', color: '#4db66a', fontWeight: 800 }}>POSITIVE</span>}
                      {isNeg && <span style={{ fontSize: '0.6rem', padding: '2px 7px', borderRadius: 10, background: 'rgba(232,64,64,0.15)', color: '#e84040', fontWeight: 800 }}>AFFLICTED</span>}
                    </div>
                    <div style={{ padding: '0.65rem 0.875rem' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Key Stocks</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {ps.stocks.split(', ').map(s => (
                          <span key={s} style={{ fontSize: '0.6rem', padding: '1px 7px', borderRadius: 10, background: `${ps.color}10`, color: ps.color, border: `1px solid ${ps.color}28`, fontWeight: 600 }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Connection explained */}
            <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12 }}>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-gold)', marginBottom: '0.5rem' }}>📊 How to Use This Table</div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '0.75rem', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                <div><strong style={{ color: 'var(--teal)' }}>Positive Vedha</strong><br/>Check the "Financial Pulse" tab. Planets with bullish vedha → BUY their sectors with full confidence.</div>
                <div><strong style={{ color: 'var(--rose)' }}>Malefic Vedha</strong><br/>Planets listed as bearish → AVOID or SHORT their sectors. Exit any existing positions in those stocks.</div>
                <div><strong style={{ color: 'var(--text-gold)' }}>Weekly Rotation</strong><br/>Every Sunday: identify top 2 positive planets → overweight their sectors. Underweight afflicted planet sectors.</div>
              </div>
            </div>
          </div>
        )}

        {/* ════ DAILY PLAN ════ */}
        {activeTab === 'daily' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>

            {/* Step-by-step morning ritual */}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.875rem' }}>⏰ Morning Ritual (8–9:15 AM)</div>
              {[
                { time: '8:00 AM', step: 'Check Weekday Planet', detail: `Today (${todayPlan.day}) is ruled by ${todayPlan.planet} → ${todayPlan.tendency}` },
                { time: '8:15 AM', step: 'Check Moon\'s Nakshatra', detail: moonNak ? `Moon in ${moonNak.nak} (${moonNak.lord} lord) — ${moonNak.effect}` : 'Load transit data to see Moon nakshatra' },
                { time: '8:30 AM', step: 'Check Tithi (Paksha)', detail: tithi ? `${tithi.name} · ${tithi.paksha === 'shukla' ? '☽ Shukla Paksha (Bullish)' : '🌑 Krishna Paksha (Bearish)'}` : 'Tithi data loading…' },
                { time: '8:45 AM', step: 'Check SBC Vedha Pulse', detail: pulse ? `Score: ${pulse.score > 0 ? '+' : ''}${pulse.score} · ${pulse.trend} trend` : 'Check Financial Pulse tab' },
                { time: '9:00 AM', step: 'Final Decision', detail: `${signal.level} — ${signal.score >= 3 ? 'Proceed with ' + (signal.score >= 6 ? 'full' : '50–75%') + ' position' : signal.score < 0 ? 'Reduce / avoid new positions' : 'Small positions only'}` },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 70, flexShrink: 0 }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-gold)', whiteSpace: 'nowrap' }}>STEP {i+1}</div>
                    <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{step.time}</div>
                  </div>
                  <div style={{ flex: 1, padding: '0.55rem 0.75rem', background: 'var(--surface-2)', borderRadius: 10, borderLeft: '3px solid var(--gold)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{step.step}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{step.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Weekday trading table */}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.875rem' }}>📅 Weekly Trading Calendar</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {WEEKDAY_PLAN.map((day, i) => {
                  const isToday = i === dow
                  return (
                    <div key={day.day} style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      padding: '0.55rem 0.75rem', borderRadius: 10,
                      background: isToday ? `${day.color}12` : 'var(--surface-2)',
                      border: `${isToday ? '2px' : '1px'} solid ${isToday ? day.color + '50' : 'var(--border-soft)'}`,
                    }}>
                      <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{day.icon}</span>
                      <div style={{ width: 70, flexShrink: 0 }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: isToday ? 800 : 600, color: isToday ? day.color : 'var(--text-primary)' }}>{day.day}</div>
                        <div style={{ fontSize: '0.58rem', color: day.color }}>{day.planet}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{day.tendency}</div>
                        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{day.stocks}</div>
                      </div>
                      {isToday && <span style={{ fontSize: '0.58rem', background: day.color, color: '#000', borderRadius: 4, padding: '1px 6px', fontWeight: 800, flexShrink: 0 }}>TODAY</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ════ NAKSHATRA GUIDE ════ */}
        {activeTab === 'nakshatras' && (
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>27 Nakshatra Trading Guide</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Track Moon's daily nakshatra — buy that lord's sector stocks</div>

            {/* Current moon highlight */}
            {moonNak && (
              <div style={{ padding: '0.875rem 1rem', background: `${moonNak.color}10`, border: `2px solid ${moonNak.color}40`, borderRadius: 12, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '1.5rem' }}>🌙</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: moonNak.color }}>{moonNak.nak} · {moonNak.lord} Lord</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{moonNak.effect}</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: moonNak.color }}>{moonNak.action}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{moonNak.stocks}</div>
                </div>
              </div>
            )}

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(201,168,76,0.08)' }}>
                    {['#', 'Nakshatra', 'Lord', 'Market Effect', 'Trading Action', 'Focus Stocks'].map(h => (
                      <th key={h} style={{ padding: '0.5rem 0.6rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {NAK_TRADING.map((n, i) => {
                    const isActive = i === moonNakIdx
                    return (
                      <tr key={n.nak} style={{ borderBottom: '1px solid var(--surface-3)', background: isActive ? `${n.color}0d` : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td style={{ padding: '0.4rem 0.6rem' }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${n.color}20`, border: `1.5px solid ${n.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 800, color: n.color }}>{i+1}</div>
                        </td>
                        <td style={{ padding: '0.4rem 0.6rem', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: isActive ? 800 : 600, color: n.color, fontSize: '0.73rem' }}>{n.nak}</div>
                          {isActive && <div style={{ fontSize: '0.54rem', color: 'var(--text-gold)', fontWeight: 700 }}>← MOON NOW</div>}
                        </td>
                        <td style={{ padding: '0.4rem 0.6rem' }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${PLANET_COLOR[n.lord]}25`, border: `1.5px solid ${PLANET_COLOR[n.lord]}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, color: PLANET_COLOR[n.lord] }}>{n.lord}</div>
                        </td>
                        <td style={{ padding: '0.4rem 0.6rem', color: 'var(--text-secondary)', fontSize: '0.68rem', maxWidth: 150 }}>{n.effect}</td>
                        <td style={{ padding: '0.4rem 0.6rem' }}>
                          <span style={{
                            fontSize: '0.64rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                            background: n.action.includes('BUY') ? 'rgba(77,182,106,0.12)' : n.action.includes('EXIT') || n.action.includes('REDUCE') ? 'rgba(232,64,64,0.12)' : 'rgba(201,168,76,0.1)',
                            color: n.action.includes('BUY') ? '#4db66a' : n.action.includes('EXIT') || n.action.includes('REDUCE') ? '#e84040' : '#c9a84c',
                          }}>{n.action}</span>
                        </td>
                        <td style={{ padding: '0.4rem 0.6rem', color: 'var(--text-muted)', fontSize: '0.64rem', maxWidth: 140 }}>{n.stocks}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════ HORA SYSTEM ════ */}
        {activeTab === 'hora' && (
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>⏰ Intraday Hora Trading System</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Each market hour is ruled by a different planet. Trade its sector during that hora.</div>

            {/* Market hours mapping */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-gold)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Market Hours</div>
                {[
                  { time: '9:15 – 10:15 AM', hora: '1st Hora' },
                  { time: '10:15 – 11:15 AM', hora: '2nd Hora' },
                  { time: '11:15 – 12:15 PM', hora: '3rd Hora' },
                  { time: '12:15 – 1:15 PM',  hora: '4th Hora' },
                  { time: '1:15 – 2:15 PM',   hora: '5th Hora' },
                  { time: '2:15 – 3:15 PM',   hora: '6th Hora' },
                  { time: '3:15 – 3:30 PM',   hora: 'Closing Hora' },
                ].map(h => (
                  <div key={h.time} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid var(--surface-3)', fontSize: '0.7rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{h.time}</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{h.hora}</span>
                  </div>
                ))}
                <div style={{ marginTop: '0.75rem', fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.5, fontStyle: 'italic' }}>
                  First hora planet = weekday planet ({todayPlan.planet} today). Each subsequent hora cycles through the 7 classical planets.
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-gold)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hora Signal Guide</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {HORA_GUIDE.map(h => (
                    <div key={h.planet} style={{
                      display: 'flex', alignItems: 'center', gap: '0.65rem',
                      padding: '0.5rem 0.7rem', borderRadius: 10,
                      background: `${h.color}0a`, border: `1px solid ${h.color}25`,
                    }}>
                      <span style={{ fontSize: '1rem', flexShrink: 0 }}>{h.symbol}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.72rem', color: h.color }}>{h.planet} Hora</div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{h.effect}</div>
                      </div>
                      <span style={{
                        fontSize: '0.58rem', fontWeight: 700, padding: '2px 7px', borderRadius: 8, flexShrink: 0,
                        background: h.action.includes('BUY') ? 'rgba(77,182,106,0.15)' : h.action.includes('EXIT') || h.action.includes('AVOID') ? 'rgba(232,64,64,0.15)' : 'rgba(201,168,76,0.12)',
                        color: h.action.includes('BUY') ? '#4db66a' : h.action.includes('EXIT') || h.action.includes('AVOID') ? '#e84040' : '#c9a84c',
                        maxWidth: 110, textAlign: 'center', lineHeight: 1.3,
                      }}>{h.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Combination tip */}
            <div style={{ padding: '0.875rem', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 12, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong style={{ color: '#a78bfa' }}>Pro Tip:</strong> Combine Hora + Daily Signal. If daily signal is BUY and Jupiter Hora arrives → Maximum position. If daily signal is SELL and Rahu Hora arrives → Extra cautious, do not trade at all.
            </div>
          </div>
        )}

        {/* ════ STRATEGIES ════ */}
        {activeTab === 'strategies' && (
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>5 Core Astro-Trading Strategies</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Each strategy based on a different SBC principle — use the one that fits your style</div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '1rem' }}>
              {STRATEGIES.map(s => (
                <div key={s.id} style={{
                  background: 'var(--surface-2)', borderRadius: 14,
                  border: `1.5px solid ${s.color}30`, overflow: 'hidden',
                }}>
                  <div style={{ background: `${s.color}10`, padding: '0.875rem 1rem', borderBottom: `2px solid ${s.color}35` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: s.color }}>{s.name}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{s.tagline}</div>
                      </div>
                      <span style={{
                        fontSize: '0.58rem', fontWeight: 800, padding: '2px 8px', borderRadius: 10,
                        background: s.risk === 'Low' ? 'rgba(77,182,106,0.15)' : s.risk === 'Medium' ? 'rgba(201,168,76,0.15)' : 'rgba(232,64,64,0.15)',
                        color: s.risk === 'Low' ? '#4db66a' : s.risk === 'Medium' ? '#c9a84c' : '#e84040',
                        border: `1px solid ${s.risk === 'Low' ? '#4db66a' : s.risk === 'Medium' ? '#c9a84c' : '#e84040'}30`,
                      }}>Risk: {s.risk}</span>
                    </div>
                  </div>
                  <div style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ marginBottom: '0.65rem' }}>
                      {s.steps.map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem', fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          <span style={{ color: s.color, fontWeight: 700, flexShrink: 0, minWidth: '1rem' }}>{i+1}.</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: '0.5rem 0.7rem', background: `${s.color}08`, borderRadius: 8, fontSize: '0.65rem', color: s.color, lineHeight: 1.45 }}>
                      <strong>Example:</strong> {s.example}
                    </div>
                  </div>
                </div>
              ))}

              {/* Combine with technical box */}
              <div style={{ background: 'var(--surface-2)', borderRadius: 14, border: '1.5px solid rgba(139,92,246,0.3)', overflow: 'hidden' }}>
                <div style={{ background: 'rgba(139,92,246,0.08)', padding: '0.875rem 1rem', borderBottom: '2px solid rgba(139,92,246,0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🔗</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#a78bfa' }}>Combine with Technical</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Astro + Technical = Maximum confidence</div>
                    </div>
                  </div>
                </div>
                <div style={{ padding: '0.875rem 1rem' }}>
                  {[
                    { scenario: 'Both Agree: BUY', detail: 'SBC bullish + Technical breakout → MAXIMUM position', color: '#4db66a' },
                    { scenario: 'Chakra BUY, Tech SELL', detail: 'Wait for clarity. Small size only. Let one confirm other.', color: '#c9a84c' },
                    { scenario: 'Chakra SELL, Tech BUY', detail: 'Trust Chakra for timing. Tight stop loss if you enter.', color: '#FF8C00' },
                    { scenario: 'Both Agree: SELL', detail: 'Maximum SHORT or full cash. Aggressive exit of longs.', color: '#e84040' },
                  ].map(sc => (
                    <div key={sc.scenario} style={{ padding: '0.4rem 0.6rem', borderRadius: 8, marginBottom: '0.4rem', background: `${sc.color}08`, border: `1px solid ${sc.color}20` }}>
                      <div style={{ fontWeight: 700, fontSize: '0.7rem', color: sc.color, marginBottom: '0.15rem' }}>{sc.scenario}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>{sc.detail}</div>
                    </div>
                  ))}
                  <div style={{ marginTop: '0.5rem', fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                    Technical tools: Support/Resistance · 50/200 DMA · RSI · Volume · Candlestick patterns · Trend lines
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ PORTFOLIO ════ */}
        {activeTab === 'portfolio' && (
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Portfolio Allocation by Planetary Period</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Adjust allocation based on current SBC planetary strength</div>

            {/* Recommended (based on pulse) */}
            <div style={{ padding: '0.875rem 1rem', background: `${dominantPortfolio.color}0a`, border: `2px solid ${dominantPortfolio.color}35`, borderRadius: 14, marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${dominantPortfolio.color}20`, border: `2px solid ${dominantPortfolio.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800, color: dominantPortfolio.color }}>
                  {dominantPortfolio.symbol}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: dominantPortfolio.color }}>{dominantPortfolio.planet} Period — Recommended Now</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Based on SBC pulse: {dominantPortfolio.condition}</div>
                </div>
                <span style={{
                  marginLeft: 'auto', fontSize: '0.62rem', fontWeight: 800, padding: '2px 10px', borderRadius: 10,
                  background: dominantPortfolio.type === 'bull' ? 'rgba(77,182,106,0.15)' : dominantPortfolio.type === 'bear' ? 'rgba(232,64,64,0.15)' : 'rgba(201,168,76,0.12)',
                  color: dominantPortfolio.type === 'bull' ? '#4db66a' : dominantPortfolio.type === 'bear' ? '#e84040' : '#c9a84c',
                }}>{dominantPortfolio.type === 'bull' ? '📈 Bull' : dominantPortfolio.type === 'bear' ? '📉 Bear' : '↔️ Volatile'}</span>
              </div>
              <AllocationBar items={dominantPortfolio.allocation} />
            </div>

            {/* All 4 portfolio plans */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '0.875rem' }}>
              {PORTFOLIO_PLANS.map(plan => (
                <div key={plan.planet} style={{ background: 'var(--surface-2)', borderRadius: 12, border: `1px solid ${plan.color}25`, padding: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>{plan.symbol}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.78rem', color: plan.color }}>{plan.planet} Period</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{plan.condition}</div>
                    </div>
                  </div>
                  <AllocationBar items={plan.allocation} />
                </div>
              ))}
            </div>

            {/* Jupiter sign guide */}
            <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(218,165,32,0.06)', border: '1px solid rgba(218,165,32,0.2)', borderRadius: 12 }}>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-gold)', marginBottom: '0.65rem' }}>♃ Jupiter Sign = Bull Sector (Annual Guide)</div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '0.4rem' }}>
                {[
                  ['Aries','Defense/Sports'],['Taurus','Banking/Finance'],['Gemini','IT/Telecom'],['Cancer','FMCG/Real Estate'],
                  ['Leo','Govt/PSU'],['Virgo','Healthcare'],['Libra','Luxury/Auto'],['Scorpio','Research/Mining'],
                  ['Sagittarius','Education/Travel'],['Capricorn','Infrastructure'],['Aquarius','Technology/AI'],['Pisces','Pharma/Spiritual'],
                ].map(([sign, sector]) => (
                  <div key={sign} style={{ padding: '0.35rem 0.55rem', background: 'rgba(218,165,32,0.08)', borderRadius: 8, fontSize: '0.62rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-gold)' }}>{sign}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{sector}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(232,64,64,0.05)', border: '1px solid rgba(232,64,64,0.15)', borderRadius: 10, fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              ⚠ <strong style={{ color: 'var(--text-secondary)' }}>Important:</strong> Sarvatobhadra is a timing tool — always combine with fundamental & technical analysis. Use strict stop-losses. Never invest more than you can afford to lose. This is a probability guide, not a guarantee.
            </div>
          </div>
        )}

      </div>
    </section>
  )
}
