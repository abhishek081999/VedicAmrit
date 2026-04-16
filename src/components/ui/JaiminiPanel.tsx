'use client'
import React, { useState } from 'react'
import { ChartOutput, GrahaId, Rashi, RASHI_NAMES, RASHI_SHORT, GRAHA_NAMES, DashaNode, RASHI_SANSKRIT } from '@/types/astrology'
import { KARAKA_NAMES_8, KARAKA_DESCRIPTIONS } from '@/lib/engine/karakas'
import { DashaTree } from '@/components/dasha/DashaTree'
import { motion, AnimatePresence } from 'framer-motion'

interface JaiminiPanelProps {
  chart: ChartOutput
}

const ARUDHA_LABELS: Record<string, { label: string; desc: string; icon: string }> = {
  AL:  { label: 'Arudha Lagna',   desc: 'Worldly persona & status', icon: '👤' },
  A2:  { label: 'Dhana Pada',      desc: 'Wealth & family sustainability', icon: '💰' },
  A3:  { label: 'Bhratru Pada',    desc: 'Talents & courage', icon: '⚔️' },
  A4:  { label: 'Matru Pada',      desc: 'Comforts & inner self', icon: '🏠' },
  A5:  { label: 'Mantra Pada',     desc: 'Fame & creative power', icon: '🎨' },
  A6:  { label: 'Shatru Pada',     desc: 'Service & competition', icon: '🛡️' },
  A7:  { label: 'Dara Pada',       desc: 'Partnerships & business', icon: '💍' },
  A8:  { label: 'Mrityu Pada',     desc: 'Crisis & longevity', icon: '⏳' },
  A9:  { label: 'Bhagya Pada',     desc: 'Fortune & spiritual path', icon: '🕉️' },
  A10: { label: 'Rajya Pada',      desc: 'Professional impact', icon: '🏢' },
  A11: { label: 'Labha Pada',      desc: 'Gains & social network', icon: '📈' },
  A12: { label: 'Upapada Lagna',   desc: 'Marriage & devotion', icon: '❤️' },
}

export function JaiminiAspectChart({ 
  ascRashi, 
  grahas,
  onSelectSign,
  selectedSign,
  aspectingSigns,
  arudhas
}: { 
  ascRashi: Rashi; 
  grahas: any[];
  onSelectSign: (r: Rashi) => void;
  selectedSign: Rashi | null;
  aspectingSigns: Rashi[];
  arudhas: any;
}) {
  const cell = 100
  const size = 400
  
  const SIGN_CELLS: Record<number, [number, number]> = {
    12: [0, 0], 1: [0, 1], 2: [0, 2],  3: [0, 3],
    11: [1, 0],                          4: [1, 3],
    10: [2, 0],                          5: [2, 3],
     9: [3, 0], 8: [3, 1], 7: [3, 2],  6: [3, 3],
  }

  const arudhaMap: Record<number, string[]> = {}
  Object.entries(arudhas).forEach(([k, r]) => {
    if (typeof r === 'number' && k !== 'grahaArudhas') {
      if (!arudhaMap[r]) arudhaMap[r] = []
      arudhaMap[r].push(k === 'A12' ? 'UL' : k)
    }
  })

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ maxWidth: '100%', height: 'auto', overflow: 'visible' }}>
        <defs>
          <radialGradient id="cosmic-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(201,168,76,0.1)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <rect width={size} height={size} fill="url(#cosmic-glow)" />

        {Object.entries(SIGN_CELLS).map(([signStr, [row, col]]) => {
          const sign = Number(signStr) as Rashi
          const x = col * cell
          const y = row * cell
          const isSelected = selectedSign === sign
          const isAspected = aspectingSigns.includes(sign)
          const isAsc = sign === ascRashi
          const occupants = grahas.filter(g => g.rashi === sign)
          const arList = arudhaMap[sign] || []
          
          return (
            <g key={sign} onClick={() => onSelectSign(sign)} style={{ cursor: 'pointer' }}>
               <motion.rect 
                x={x + 3} y={y + 3} width={cell - 6} height={cell - 6} 
                fill={isSelected ? 'rgba(201,168,76,0.15)' : isAspected ? 'rgba(78,205,196,0.1)' : 'rgba(255,255,255,0.02)'}
                stroke={isSelected ? 'var(--gold)' : isAspected ? 'var(--teal)' : 'rgba(201,168,76,0.15)'}
                strokeWidth={isSelected ? 3 : isAspected ? 2 : 1}
                rx={12}
                animate={isSelected ? { strokeOpacity: [1, 0.4, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <text x={x + 12} y={y + 22} fontSize="11" fill="var(--text-muted)" fontWeight="800">{RASHI_SHORT[sign]}</text>
              {isAsc && <text x={x + cell - 30} y={y + 22} fontSize="10" fill="var(--gold)" fontWeight="900">ASC</text>}
              
              <g transform={`translate(${x + cell/2}, ${y + cell/2 + 5})`}>
                {occupants.map((g, i) => (
                  <text 
                    key={g.id} 
                    x={(occupants.length > 1 ? (i % 2 === 0 ? -14 : 14) : 0)} 
                    y={Math.floor(i / 2) * 15 - 5}
                    textAnchor="middle" 
                    fontSize="13" 
                    fontWeight="900"
                    fill={isAspected ? 'var(--teal)' : 'var(--text-primary)'}
                    style={{ filter: isSelected ? 'drop-shadow(0 0 8px var(--gold))' : isAspected ? 'drop-shadow(0 0 4px var(--teal))' : 'none' }}
                  >
                    {g.id}
                  </text>
                ))}
              </g>

              {/* Arudhas at the bottom */}
              <text 
                x={x + cell/2} 
                y={y + cell - 12} 
                textAnchor="middle" 
                fontSize="9" 
                fontWeight="800" 
                fill="var(--gold-soft)"
                fontStyle="italic"
              >
                {arList.join(' · ')}
              </text>
            </g>
          )
        })}
        {/* Central Hub */}
        <text x="200" y="196" textAnchor="middle" fontSize="10" fontWeight="900" fill="var(--gold)" style={{ letterSpacing: '0.2em' }}>JAIMINI</text>
        <text x="200" y="214" textAnchor="middle" fontSize="15" fontWeight="900" fill="var(--gold)" style={{ letterSpacing: '0.1em' }}>DRISTI</text>
      </svg>
    </div>
  )
}

export function JaiminiAspectChartNorth({ 
  ascRashi, 
  grahas,
  onSelectSign,
  selectedSign,
  aspectingSigns,
  arudhas
}: { 
  ascRashi: Rashi; 
  grahas: any[];
  onSelectSign: (r: Rashi) => void;
  selectedSign: Rashi | null;
  aspectingSigns: Rashi[];
  arudhas: any;
}) {
  const S = 400
  const Q = S / 4, M = S / 2

  const arudhaMap: Record<number, string[]> = {}
  Object.entries(arudhas).forEach(([k, r]) => {
    if (typeof r === 'number' && k !== 'grahaArudhas') {
      if (!arudhaMap[r]) arudhaMap[r] = []
      arudhaMap[r].push(k === 'A12' ? 'UL' : k)
    }
  })

  const polyPts = (h: number): string => {
    let pts: [number, number][] = []
    switch (h) {
      case 1:  pts = [[Q, Q], [M, M], [3 * Q, Q], [M, 0]]; break
      case 2:  pts = [[0, 0], [Q, Q], [M, 0]]; break
      case 3:  pts = [[0, 0], [0, M], [Q, Q]]; break
      case 4:  pts = [[0, M], [Q, 3 * Q], [M, M], [Q, Q]]; break
      case 5:  pts = [[0, M], [0, S], [Q, 3 * Q]]; break
      case 6:  pts = [[Q, 3 * Q], [0, S], [M, S]]; break
      case 7:  pts = [[Q, 3 * Q], [M, S], [3 * Q, 3 * Q], [M, M]]; break
      case 8:  pts = [[3 * Q, 3 * Q], [M, S], [S, S]]; break
      case 9:  pts = [[3 * Q, 3 * Q], [S, S], [S, M]]; break
      case 10: pts = [[3 * Q, Q], [M, M], [3 * Q, 3 * Q], [S, M]]; break
      case 11: pts = [[3 * Q, Q], [S, M], [S, 0]]; break
      case 12: pts = [[M, 0], [3 * Q, Q], [S, 0]]; break
    }
    return pts.map(p => p.join(',')).join(' ')
  }

  const getCentroid = (h: number): [number, number] => {
    let pts: [number, number][] = []
    switch (h) {
      case 1:  pts = [[Q, Q], [M, M], [3 * Q, Q], [M, 0]]; break
      case 2:  pts = [[0, 0], [Q, Q], [M, 0]]; break
      case 3:  pts = [[0, 0], [0, M], [Q, Q]]; break
      case 4:  pts = [[0, M], [Q, 3 * Q], [M, M], [Q, Q]]; break
      case 5:  pts = [[0, M], [0, S], [Q, 3 * Q]]; break
      case 6:  pts = [[Q, 3 * Q], [0, S], [M, S]]; break
      case 7:  pts = [[Q, 3 * Q], [M, S], [3 * Q, 3 * Q], [M, M]]; break
      case 8:  pts = [[3 * Q, 3 * Q], [M, S], [S, S]]; break
      case 9:  pts = [[3 * Q, 3 * Q], [S, S], [S, M]]; break
      case 10: pts = [[3 * Q, Q], [M, M], [3 * Q, 3 * Q], [S, M]]; break
      case 11: pts = [[3 * Q, Q], [S, M], [S, 0]]; break
      case 12: pts = [[M, 0], [3 * Q, Q], [S, 0]]; break
    }
    const x = pts.reduce((s, p) => s + p[0], 0) / pts.length
    const y = pts.reduce((s, p) => s + p[1], 0) / pts.length
    return [x, y]
  }

  const getRashiInHouse = (h: number) => ((ascRashi + h - 2) % 12) + 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem' }}>
      <svg viewBox={`0 0 ${S} ${S}`} width={S} height={S} style={{ maxWidth: '100%', height: 'auto', overflow: 'visible' }}>
        {Array.from({ length: 12 }, (_, i) => {
          const h = i + 1
          const rashi = getRashiInHouse(h) as Rashi
          const isSelected = selectedSign === rashi
          const isAspected = aspectingSigns.includes(rashi)
          const pts = polyPts(h)
          
          return (
            <g key={h} onClick={() => onSelectSign(rashi)} style={{ cursor: 'pointer' }}>
              <defs>
                <linearGradient id={`grad-${h}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={isSelected ? "rgba(201,168,76,0.2)" : isAspected ? "rgba(78,205,196,0.15)" : "rgba(255,255,255,0.03)"} />
                  <stop offset="100%" stopColor={isSelected ? "rgba(201,168,76,0.05)" : isAspected ? "rgba(78,205,196,0.05)" : "transparent"} />
                </linearGradient>
              </defs>
              <motion.polygon 
                points={pts}
                fill={`url(#grad-${h})`}
                stroke={isSelected ? 'var(--gold)' : isAspected ? 'var(--teal)' : 'rgba(201,168,76,0.15)'}
                strokeWidth={isSelected ? 3 : isAspected ? 2 : 1}
                animate={isSelected ? { strokeOpacity: [1, 0.4, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </g>
          )
        })}

        {/* Labels & Planets Overlay */}
        {Array.from({ length: 12 }, (_, i) => {
          const h = i + 1
          const rashi = getRashiInHouse(h) as Rashi
          const occupants = grahas.filter(g => g.rashi === rashi)
          const isAspected = aspectingSigns.includes(rashi)
          const isSelected = selectedSign === rashi
          const arList = arudhaMap[rashi] || []
          
          const [cx, cy] = getCentroid(h)
          const isKite = [1, 4, 7, 10].includes(h)
          
          // Refined Offsets for "Elite" Look
          const rashiOffY = isKite ? (h === 1 ? -38 : h === 7 ? 38 : 0) : (h < 4 || h > 10 ? -30 : 30)
          const rashiOffX = isKite ? (h === 4 ? -38 : h === 10 ? 38 : 0) : (h === 2 || h === 3 || h === 5 || h === 6 ? -22 : 22)
          const plOffY = isKite ? (h === 1 ? 8 : h === 7 ? -8 : 0) : (h < 4 || h > 10 ? 5 : -5)
          const arOffY = isKite ? (h === 1 ? 42 : h === 7 ? -42 : (h===4 || h===10 ? 30 : 25)) : (h < 4 || h > 10 ? 32 : -32)

          return (
            <g key={`l-${h}`} style={{ pointerEvents: 'none' }}>
              <text 
                x={cx + (isKite ? rashiOffX : 0)} 
                y={cy + (isKite ? rashiOffY : rashiOffY)} 
                fontSize="12" fontWeight="800" fill={isSelected ? 'var(--gold)' : 'var(--text-muted)'} 
                textAnchor="middle" style={{ letterSpacing: '0.05em' }}
              >
                {rashi}
              </text>
              
              <g transform={`translate(${cx}, ${cy + plOffY})`}>
                {occupants.map((g, idx) => {
                  const n = occupants.length
                  const col = n > 2 ? idx % 2 : 0
                  const row = n > 2 ? Math.floor(idx / 2) : idx
                  const xSh = n > 2 ? (col === 0 ? -18 : 18) : 0
                  return (
                    <text 
                      key={g.id} x={xSh} y={row * 15 - (n>2 ? 10 : 0)}
                      textAnchor="middle" fontSize="13" fontWeight="900"
                      fill={isAspected ? 'var(--teal)' : 'var(--text-primary)'}
                      style={{ filter: isSelected ? 'drop-shadow(0 0 8px var(--gold))' : isAspected ? 'drop-shadow(0 0 4px var(--teal))' : 'none' }}
                    >
                      {g.id}
                    </text>
                  )
                })}
              </g>

              {/* Arudhas with pill background optionally? No, let's keep it elegant text */}
              <text 
                 x={cx} y={cy + arOffY} 
                 fontSize="9" fontWeight="800" fill="var(--gold-soft)" 
                 textAnchor="middle" fontStyle="italic" style={{ letterSpacing: '0.05em' }}
              >
                {arList.join(' · ')}
              </text>
            </g>
          )
        })}
        
        {/* Central Hub with Glow */}
        <circle cx="200" cy="200" r="45" fill="rgba(0,0,0,0.85)" stroke="var(--gold-soft)" strokeWidth="0.5" />
        <text x="200" y="196" textAnchor="middle" fontSize="10" fontWeight="900" fill="var(--gold)" style={{ letterSpacing: '0.2em', textTransform: 'uppercase' }}>Jaimini</text>
        <text x="200" y="214" textAnchor="middle" fontSize="15" fontWeight="900" fill="var(--gold)" style={{ letterSpacing: '0.1em' }}>DRISTI</text>
        
        {/* Frame corner accents */}
        <path d="M 0 25 L 0 0 L 25 0" fill="none" stroke="var(--gold)" strokeWidth="1.5" />
        <path d="M 375 0 L 400 0 L 400 25" fill="none" stroke="var(--gold)" strokeWidth="1.5" />
        <path d="M 400 375 L 400 400 L 375 400" fill="none" stroke="var(--gold)" strokeWidth="1.5" />
        <path d="M 25 400 L 0 400 L 0 375" fill="none" stroke="var(--gold)" strokeWidth="1.5" />
      </svg>
    </div>
  )
}

export function JaiminiPanel({ chart }: JaiminiPanelProps) {
  const { karakas, arudhas, grahas, vargas, lagnas } = chart
  const [activeKaraka, setActiveKaraka] = useState<string | null>(null)
  const [selectedAspectSign, setSelectedAspectSign] = useState<Rashi | null>(null)
  const [chartStyle, setChartStyle] = useState<'south' | 'north'>('south')

  // ── Helpers ────────────────────────────────────────────────
  
  const getSignType = (r: Rashi) => {
    if ([1, 4, 7, 10].includes(r)) return 'Movable'
    if ([2, 5, 8, 11].includes(r)) return 'Fixed'
    return 'Dual'
  }

  const getRashiDrishti = (r: Rashi): Rashi[] => {
    const type = getSignType(r)
    if (type === 'Movable') {
      const fixed = [2, 5, 8, 11] as Rashi[]
      const adjacent = r === 1 ? 2 : r === 4 ? 5 : r === 7 ? 8 : 11
      return fixed.filter(f => f !== adjacent)
    }
    if (type === 'Fixed') {
      const movable = [1, 4, 7, 10] as Rashi[]
      const adjacent = r === 2 ? 1 : r === 5 ? 4 : r === 8 ? 7 : 10
      return movable.filter(m => m !== adjacent)
    }
    const dual = [3, 6, 9, 12] as Rashi[]
    return dual.filter(d => d !== r)
  }

  // Find Navamsha sign for a planet
  const getNavamshaRashi = (gid: GrahaId): Rashi => {
    const d9 = vargas['D9']
    const p = d9?.find(g => g.id === gid)
    return p ? p.rashi : 1 as Rashi
  }

  // Karakamsha (Sign of AK in D9)
  const akGid = karakas.AK
  const karakamshaRashi = getNavamshaRashi(akGid)

  const karakaEntries = Object.entries(karakas).filter(([k]) => k !== 'scheme') as [keyof typeof KARAKA_NAMES_8, GrahaId | null][]

  // ── Argala Intervention ─────────────────────────────────────
  
  const getArgalaData = (sign: Rashi) => {
    // Argala: 2, 4, 11 from sign
    // Virodhargala (Obstruction): 12, 10, 3
    const getSignAt = (s: Rashi, offset: number): Rashi => (((s + offset - 2) % 12) + 1) as Rashi
    const data = [
      { id: '2nd', label: 'Wealth/Speech', pos: getSignAt(sign, 2), blocker: getSignAt(sign, 12), blockerId: '12th' },
      { id: '4th', label: 'Happiness/Home', pos: getSignAt(sign, 4), blocker: getSignAt(sign, 10), blockerId: '10th' },
      { id: '11th', label: 'Gains/Network', pos: getSignAt(sign, 11), blocker: getSignAt(sign, 3), blockerId: '3rd' },
    ]
    return data.map(d => {
      const occupants = grahas.filter(g => g.rashi === d.pos).map(g => g.id)
      const blockers = grahas.filter(g => g.rashi === d.blocker).map(g => g.id)
      return { ...d, occupants, blockers }
    })
  }

  // Detect Jaimini Raja Yogas
  const detectJaiminiYogas = () => {
    const yogas = []
    const akPlanet = grahas.find(g => g.id === karakas.AK)
    const amkPlanet = grahas.find(g => g.id === karakas.AmK)
    
    if (akPlanet && amkPlanet) {
      // 1. AK + AmK Connection
      const areConnected = akPlanet.rashi === amkPlanet.rashi || getRashiDrishti(akPlanet.rashi).includes(amkPlanet.rashi)
      if (areConnected) {
        yogas.push({
          name: 'Principal Raja Yoga',
          desc: 'Atmakaraka (Self) and Amatyakaraka (Career) are connected by placement or aspect. Indicates high status and professional success.',
          strength: akPlanet.rashi === amkPlanet.rashi ? 'Exceptional' : 'Strong'
        })
      }
    }

    // 2. AL + Beneficial influence
    const alRashi = arudhas.AL
    const benefics = ['Ju', 'Ve', 'Me']
    const alBenefics = grahas.filter(g => benefics.includes(g.id) && (g.rashi === alRashi || getRashiDrishti(alRashi).includes(g.rashi)))
    if (alBenefics.length >= 2) {
      yogas.push({
        name: 'Arudha Subha Yoga',
        desc: 'Multiple benefics influence the Arudha Lagna, creating a magnetic and highly successful public image.',
        strength: 'High'
      })
    }

    return yogas
  }

  const jaiminiYogas = detectJaiminiYogas()

  return (
    <div className="fade-up" style={{ 
      display: 'flex', flexDirection: 'column', gap: '2.5rem', 
      padding: '2rem', 
      background: 'var(--surface-deep)',
      borderRadius: 'var(--r-xl)',
      color: 'var(--text-primary)'
    }}>
      
      {/* ── Futuristic Header ── */}
      <section style={{ position: 'relative' }}>
        <div style={{ 
          position: 'absolute', top: -40, left: -40, width: 200, height: 200, 
          background: 'var(--gold-faint)', filter: 'blur(80px)', zIndex: 0, opacity: 0.3 
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
          <div style={{ 
             width: 64, height: 64, borderRadius: '20px', 
             background: 'linear-gradient(135deg, var(--gold) 0%, #B45309 100%)',
             display: 'flex', alignItems: 'center', justifyContent: 'center',
             boxShadow: '0 0 25px rgba(201,168,76,0.4)',
             fontSize: '2rem'
          }}>💠</div>
          <div>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-gold)' }}>
              Jaimini Intelligence
            </h1>
            <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              The most advanced sutra-based predictive engine for the modern Jyotishi.
            </p>
          </div>
        </div>
      </section>

      {/* ── Karakamsha & Lagnamsha Insights ── */}
      <section className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
         <div className="card-glass" style={{ 
           padding: '1.5rem', border: '1px solid var(--gold-soft)', 
           background: 'rgba(255,255,255,0.03)', 
           backdropFilter: 'blur(10px)',
           borderRadius: 'var(--r-lg)'
         }}>
            <div className="label-caps" style={{ color: 'var(--gold)', marginBottom: '1rem' }}>Principal Significator</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>{akGid}</div>
               <div style={{ width: 4, height: 24, background: 'var(--gold)' }} />
               <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>Ātmakāraka</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>The King of the Horoscope</div>
               </div>
            </div>
            <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(201,168,76,0.1)', borderRadius: 'var(--r-md)', border: '1px solid rgba(201,168,76,0.2)' }}>
               <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gold)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Karakamsha (D9 Position)</div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{RASHI_NAMES[karakamshaRashi]} ({RASHI_SANSKRIT[karakamshaRashi]})</span>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Sign of the Soul</span>
               </div>
            </div>
         </div>

         <div className="card-glass" style={{ 
           padding: '1.5rem', border: '1px solid var(--teal-soft)', 
           background: 'rgba(255,255,255,0.03)', 
           backdropFilter: 'blur(10px)',
           borderRadius: 'var(--r-lg)'
         }}>
            <div className="label-caps" style={{ color: 'var(--teal)', marginBottom: '1rem' }}>Lagnamsha Visibility</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>AL</div>
               <div style={{ width: 4, height: 24, background: 'var(--teal)' }} />
               <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>Arudha Lagna</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manifested Public Persona</div>
               </div>
            </div>
            <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(45,212,191,0.1)', borderRadius: 'var(--r-md)', border: '1px solid rgba(45,212,191,0.2)' }}>
               <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--teal)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Current Aura</div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{RASHI_NAMES[arudhas.AL]} ({RASHI_SANSKRIT[arudhas.AL]})</span>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Perceived Self</span>
               </div>
            </div>
         </div>
      </section>

      {/* ── Jaimini Raja Yogas ── */}
      {jaiminiYogas.length > 0 && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="label-caps" style={{ marginBottom: '1.25rem', color: 'var(--gold)', borderLeft: '4px solid var(--gold)', paddingLeft: '0.75rem' }}>Active Jaimini Rājayogas</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {jaiminiYogas.map((yoga, k) => (
              <motion.div 
                key={k} 
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(201,168,76,0.15)' }}
                style={{ 
                  padding: '1.5rem', 
                  background: 'linear-gradient(135deg, rgba(201,168,76,0.1) 0%, rgba(201,168,76,0.02) 100%)',
                  border: '1px solid var(--gold-soft)',
                  borderRadius: 'var(--r-lg)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ position: 'absolute', top: -10, right: -10, fontSize: '4rem', opacity: 0.05 }}>✨</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-gold)', marginBottom: '0.5rem' }}>{yoga.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>{yoga.desc}</div>
                <div style={{ display: 'inline-block', padding: '2px 8px', background: 'var(--gold)', color: '#000', fontSize: '0.65rem', fontWeight: 900, borderRadius: '4px', textTransform: 'uppercase' }}>
                  Strength: {yoga.strength}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Chara Karakas ── */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 className="label-caps" style={{ borderLeft: '4px solid var(--gold)', paddingLeft: '0.75rem' }}>Chara Karakas (Variable Navigators)</h3>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Precision: {karakas.scheme}-Planetary Hierarchy</div>
        </div>
        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}
        >
          {karakaEntries.map(([key, gid]) => {
            if (!gid) return null
            const isAK = key === 'AK'
            const info = KARAKA_DESCRIPTIONS[key as keyof typeof KARAKA_NAMES_8]
            const name = KARAKA_NAMES_8[key as keyof typeof KARAKA_NAMES_8]
            const grahaData = grahas.find(g => g.id === gid)
            const d9Rashi = getNavamshaRashi(gid)
            
            return (
              <motion.div 
                key={key} 
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  show: { opacity: 1, y: 0 }
                }}
                onMouseEnter={() => setActiveKaraka(key)}
                onMouseLeave={() => setActiveKaraka(null)}
                style={{ 
                  padding: '1.25rem', 
                  background: isAK ? 'rgba(201,168,76,0.08)' : 'var(--surface-1)',
                  border: `1px solid ${isAK ? 'var(--gold)' : 'var(--border-soft)'}`,
                  borderRadius: 'var(--r-lg)',
                  transition: 'background 0.3s, border 0.3s',
                  cursor: 'default',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0,0,0,0.3), 0 0 20px rgba(201,168,76,0.1)' }}
              >
                {isAK && <div className="glow-edge" style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'var(--gold)' }} />}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 900, color: isAK ? 'var(--gold)' : 'var(--text-muted)' }}>{key}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{GRAHA_NAMES[gid]}</span>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', height: '2.5rem', overflow: 'hidden' }}>{info}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-soft)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>D9: {RASHI_SHORT[d9Rashi]}</div>
                  <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-gold)' }}>{grahaData?.degree.toFixed(1)}°</div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

      {/* ── Advanced Argala Analysis ── */}
      <section>
        <h3 className="label-caps" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--rose)', paddingLeft: '0.75rem' }}>Argala (Planetary Interventions)</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Intervention by signs at 2, 4, and 11 positions. Obstruction (Virodhargala) occurs from 12, 10, and 3 respectively.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
           {[lagnas.ascRashi, arudhas.AL, karakaEntries.find(([k])=>k==='AK')?.[1] ? grahas.find(g=>g.id===karakas.AK)?.rashi : null].map((sign, i) => {
              if (!sign) return null
              const signName = i === 0 ? 'Lagna' : i === 1 ? 'Arudha Lagna' : 'Atmakaraka'
              const argalaData = getArgalaData(sign as Rashi)
              return (
                <div key={i} className="card-glass" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border-soft)' }}>
                   <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-gold)', marginBottom: '1.25rem', textAlign: 'center' }}>
                      Ref: {signName} ({RASHI_SHORT[sign as Rashi]})
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {argalaData.map((d, j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--surface-1)', borderRadius: 'var(--r-md)' }}>
                           <div style={{ width: 40, textAlign: 'center', fontWeight: 800, fontSize: '0.7rem', opacity: 0.6 }}>{d.id}</div>
                           <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{d.label}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{RASHI_NAMES[d.pos]}</div>
                           </div>
                           <div style={{ display: 'flex', gap: '4px' }}>
                              {d.occupants.map(gid => (
                                <span key={gid} style={{ padding: '2px 4px', background: 'var(--teal-faint)', color: 'var(--teal)', fontSize: '0.65rem', fontWeight: 900, borderRadius: 3 }}>{gid}</span>
                              ))}
                              {d.occupants.length === 0 && <span style={{ opacity: 0.2 }}>—</span>}
                           </div>
                           <div style={{ width: 1, height: 16, background: 'var(--border-soft)' }} />
                           <div style={{ display: 'flex', gap: '4px' }}>
                              {d.blockers.map(gid => (
                                <span key={gid} style={{ padding: '2px 4px', background: 'var(--rose-faint)', color: 'var(--rose)', fontSize: '0.65rem', fontWeight: 900, borderRadius: 3 }}>{gid}</span>
                              ))}
                              {d.blockers.length === 0 && <span style={{ opacity: 0.2 }}>—</span>}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )
           })}
        </div>
      </section>

      {/* ── Bhava Arudha Grid ── */}
      <section>
        <h3 className="label-caps" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--teal)', paddingLeft: '0.75rem' }}>Bhāva Āruḍha Landscape</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
          gap: '0.85rem' 
        }}>
          {Object.entries(ARUDHA_LABELS).map(([key, info]) => {
            const rashi = arudhas[key as keyof typeof arudhas] as Rashi
            if (!rashi) return null
            const isAL = key === 'AL' || key === 'A12'
            return (
              <div key={key} style={{ 
                padding: '1.25rem', 
                background: 'var(--surface-1)',
                border: `1px solid ${isAL ? 'var(--teal-soft)' : 'var(--border-soft)'}`,
                borderRadius: 'var(--r-lg)',
                display: 'flex', flexDirection: 'column', gap: '0.5rem',
                transition: 'all 0.2s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ fontSize: '1.2rem' }}>{info.icon}</span>
                   <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--teal)' }}>{key}</span>
                </div>
                <div>
                   <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{info.label}</div>
                   <div style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                      {RASHI_NAMES[rashi]}
                   </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Sign Aspects Matrix (Dual View) ── */}
      <section>
        <h3 className="label-caps" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--gold)', paddingLeft: '0.75rem' }}>Rāśi Dṛṣṭi Matrix (Sign Aspects)</h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '2rem',
          alignItems: 'start'
        }}>
          {/* Left: Interactive Chart */}
          <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border-soft)', background: 'var(--surface-1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-gold)' }}>Interactive Aspect Exploration</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click a sign to visualize its Jaimini Rashi Drishti</div>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-3)', padding: '2px', borderRadius: '8px' }}>
                <button 
                   onClick={() => setChartStyle('south')}
                   style={{ 
                     padding: '4px 12px', fontSize: '0.65rem', fontWeight: 800, borderRadius: '6px',
                     background: chartStyle === 'south' ? 'var(--gold)' : 'transparent',
                     color: chartStyle === 'south' ? '#000' : 'var(--text-muted)',
                     border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                   }}>SOUTH</button>
                <button 
                   onClick={() => setChartStyle('north')}
                   style={{ 
                     padding: '4px 12px', fontSize: '0.65rem', fontWeight: 800, borderRadius: '6px',
                     background: chartStyle === 'north' ? 'var(--gold)' : 'transparent',
                     color: chartStyle === 'north' ? '#000' : 'var(--text-muted)',
                     border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                   }}>NORTH</button>
              </div>
            </div>
            
            {chartStyle === 'south' ? (
              <JaiminiAspectChart 
                ascRashi={lagnas.ascRashi} 
                grahas={grahas}
                selectedSign={selectedAspectSign}
                onSelectSign={setSelectedAspectSign}
                aspectingSigns={selectedAspectSign ? getRashiDrishti(selectedAspectSign) : []}
                arudhas={arudhas}
              />
            ) : (
              <JaiminiAspectChartNorth 
                ascRashi={lagnas.ascRashi} 
                grahas={grahas}
                selectedSign={selectedAspectSign}
                onSelectSign={setSelectedAspectSign}
                aspectingSigns={selectedAspectSign ? getRashiDrishti(selectedAspectSign) : []}
                arudhas={arudhas}
              />
            )}

            {selectedAspectSign && (
              <div className="fade-up" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(78,205,196,0.05)', borderRadius: 'var(--r-md)', border: '1px solid rgba(78,205,196,0.1)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--teal)', marginBottom: '0.25rem' }}>
                  {RASHI_NAMES[selectedAspectSign]} aspects:
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {getRashiDrishti(selectedAspectSign).map(a => (
                    <span key={a} style={{ fontSize: '0.9rem', fontWeight: 600 }}>{RASHI_NAMES[a]} ({RASHI_SHORT[a]})</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Data Table */}
          <div style={{ overflowX: 'auto', background: 'var(--surface-1)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border-soft)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-soft)' }}>
                  <th style={{ padding: '1rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sign</th>
                  <th style={{ padding: '1rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nature</th>
                  <th style={{ padding: '1rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Impact</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(r => {
                  const sign = r as Rashi
                  const type = getSignType(sign)
                  const aspects = getRashiDrishti(sign)
                  const occupants = grahas.filter(g => g.rashi === sign).map(g => g.id)
                  const isHighlighted = selectedAspectSign === sign
                  
                  return (
                    <tr 
                      key={r} 
                      onClick={() => setSelectedAspectSign(sign)}
                      style={{ 
                        borderBottom: '1px solid var(--border-soft)',
                        background: isHighlighted ? 'rgba(201,168,76,0.05)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td style={{ padding: '1rem' }}>
                         <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isHighlighted ? 'var(--gold)' : 'var(--text-primary)' }}>{RASHI_NAMES[sign]}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                         <span style={{ 
                           fontSize: '0.6rem', padding: '2px 6px', 
                           background: type === 'Movable' ? 'var(--teal-faint)' : type === 'Fixed' ? 'var(--rose-faint)' : 'var(--gold-faint)',
                           color: type === 'Movable' ? 'var(--teal)' : type === 'Fixed' ? 'var(--rose)' : 'var(--gold)',
                           borderRadius: 4, fontWeight: 800, textTransform: 'uppercase'
                         }}>{type}</span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                         <div style={{ display: 'flex', gap: '0.35rem' }}>
                            {occupants.map(gid => (
                              <span key={gid} style={{ 
                                fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-gold)'
                              }}>{gid}</span>
                            ))}
                            {occupants.length === 0 && <span style={{ opacity: 0.2 }}>—</span>}
                         </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Chara Dasha Suite ── */}
      <section>
        <h3 className="label-caps" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--gold)', paddingLeft: '0.75rem' }}>
           Temporal Trajectory (Chara Dashā)
        </h3>
        {chart.dashas.chara && chart.dashas.chara.length > 0 ? (
          <div style={{ 
            padding: '2rem', 
            background: 'linear-gradient(135deg, rgba(201,168,76,0.05) 0%, rgba(0,0,0,0) 100%)', 
            borderRadius: 'var(--r-xl)',
            border: '1px solid var(--gold-soft)' 
          }}>
            <DashaTree nodes={chart.dashas.chara} birthDate={new Date(chart.meta.birthDate)} />
          </div>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--surface-1)', borderRadius: 'var(--r-lg)', border: '1px dashed var(--border-soft)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Initiate sequence analysis to generate timeline.</p>
          </div>
        )}
      </section>

    </div>
  )
}

export default JaiminiPanel
