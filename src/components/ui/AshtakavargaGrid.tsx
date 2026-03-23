// ─────────────────────────────────────────────────────────────
//  src/components/ui/AshtakavargaGrid.tsx
//  REDESIGNED: Modern-Classic Ashtakavarga Workspace
//  Features: Interactive SAV/BAV, Traditional Chart Views, & Heatmaps
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import type { AshtakavargaResult } from '@/lib/engine/ashtakavarga'
import { RASHI_SHORT } from '@/types/astrology'
import { 
  Palette, ScrollText, ChevronRight, Zap, 
  Map as MapIcon, Grid, LayoutDashboard,
  Trophy, AlertTriangle, Info
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

const PLANET_ORDER = ['Su','Mo','Ma','Me','Ju','Ve','Sa'] as const
const PLANET_NAMES: Record<string, string> = {
  Su:'Sun', Mo:'Moon', Ma:'Mars', Me:'Mercury',
  Ju:'Jupiter', Ve:'Venus', Sa:'Saturn', Total: 'Total (SAV)'
}
const PLANET_COLOR: Record<string, string> = {
  Su:'#f59e0b', Mo:'#93c5fd', Ma:'#f87171',
  Me:'#34d399', Ju:'#fbbf24', Ve:'#f472b6', Sa:'#c084fc',
}

// ── Helper: Strength Styling ───────────────────────────────────

function getBinduTheme(n: number, isSAV: boolean) {
  const threshold = isSAV ? 25 : 4
  const neutral = isSAV ? 20 : 3
  
  if (n >= threshold + 5) return { color: 'var(--teal)', bg: 'rgba(20, 184, 166, 0.1)', border: 'var(--teal)' }
  if (n >= threshold) return { color: 'var(--blue)', bg: 'rgba(59, 130, 246, 0.1)', border: 'var(--blue)' }
  if (n >= neutral) return { color: 'var(--text-gold)', bg: 'rgba(201, 168, 76, 0.05)', border: 'var(--gold)' }
  return { color: 'var(--rose)', bg: 'rgba(244, 63, 94, 0.1)', border: 'var(--rose)' }
}

// ── North Indian (Diamond) Sub-Chart ──────────────────────────

function NorthIndianGrid({ data, ascRashi, size = 320 }: { data: number[], ascRashi: number, size?: number }) {
  const S = size
  const Q = S / 4, M = S / 2

  const polyPts = (h: number): [number, number][] => {
    switch (h) {
      case 1: return [[Q, Q], [M, M], [3*Q, Q], [M, 0]]
      case 2: return [[0, 0], [Q, Q], [M, 0]]
      case 3: return [[0, 0], [0, M], [Q, Q]]
      case 4: return [[0, M], [Q, 3*Q], [M, M], [Q, Q]]
      case 5: return [[0, M], [0, S], [Q, 3*Q]]
      case 6: return [[Q, 3*Q], [0, S], [M, S]]
      case 7: return [[Q, 3*Q], [M, S], [3*Q, 3*Q], [M, M]]
      case 8: return [[3*Q, 3*Q], [M, S], [S, S]]
      case 9: return [[3*Q, 3*Q], [S, S], [S, M]]
      case 10: return [[3*Q, Q], [M, M], [3*Q, 3*Q], [S, M]]
      case 11: return [[3*Q, Q], [S, M], [S, 0]]
      case 12: return [[M, 0], [3*Q, Q], [S, 0]]
      default: return []
    }
  }

  const getPos = (h: number) => {
    const o = S * 0.05
    switch(h) {
      case 1:  return { x: M,     y: M - o }
      case 4:  return { x: M - o, y: M }
      case 7:  return { x: M,     y: M + o }
      case 10: return { x: M + o, y: M }
      default:
        const pts = polyPts(h)
        return { 
          x: pts.reduce((s,p)=>s+p[0],0)/pts.length, 
          y: pts.reduce((s,p)=>s+p[1],0)/pts.length 
        }
    }
  }

  return (
    <svg viewBox={`0 0 ${S} ${S}`} width={S} height={S} style={{ display: 'block', margin: 'auto' }}>
      {Array.from({ length: 12 }, (_, i) => {
        const h = i + 1
        const pts = polyPts(h)
        const sign = ((ascRashi - 1 + h - 1) % 12) + 1
        const val = data[h-1]
        const theme = getBinduTheme(val, data.reduce((a,b)=>a+b,0) > 100)
        const pos = getPos(h)
        
        return (
          <g key={h}>
            <polygon 
              points={pts.map(p=>p.join(',')).join(' ')} 
              fill={theme.bg} stroke="var(--border)" strokeWidth="1"
            />
            <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fontSize={S*0.08} fontWeight={700} fill={theme.color}>
              {val}
            </text>
            <text x={pos.x} y={pos.y + S*0.06} textAnchor="middle" fontSize={S*0.03} fill="var(--text-muted)" opacity={0.6}>
              {sign}
            </text>
          </g>
        )
      })}
      <rect width={S} height={S} fill="none" stroke="var(--gold)" strokeWidth="2" />
    </svg>
  )
}

// ── South Indian (Square) Sub-Chart ───────────────────────────

function SouthIndianGrid({ data, ascRashi, size = 320 }: { data: number[], ascRashi: number, size?: number }) {
  const S = size
  const grid = [
    [12, 1, 2, 3],
    [11, 0, 0, 4],
    [10, 0, 0, 5],
    [9, 8, 7, 6]
  ]
  const cell = S / 4

  // Map rashi to bindu count
  const rashiToBindu: Record<number, number> = {}
  for (let h = 1; h <= 12; h++) {
    const r = ((ascRashi - 1 + h - 1) % 12) + 1
    rashiToBindu[r] = data[h-1]
  }

  return (
    <svg viewBox={`0 0 ${S} ${S}`} width={S} height={S} style={{ display: 'block', margin: 'auto' }}>
      {grid.map((row, ri) => row.map((r, ci) => {
        if (r === 0) return null
        const val = rashiToBindu[r] || 0
        const theme = getBinduTheme(val, data.reduce((a,b)=>a+b,0) > 100)
        const x = ci * cell
        const y = ri * cell
        
        return (
          <g key={r}>
            <rect x={x} y={y} width={cell} height={cell} fill={theme.bg} stroke="var(--border)" />
            {r === ascRashi && (
               <line x1={x} y1={y} x2={x+cell*0.3} y2={y+cell*0.3} stroke="var(--gold)" strokeWidth="2" />
            )}
            <text x={x+cell/2} y={y+cell/2} textAnchor="middle" dominantBaseline="middle" fontSize={S*0.08} fontWeight={700} fill={theme.color}>
              {val}
            </text>
            <text x={x+4} y={y+12} fontSize={S*0.03} fill="var(--text-muted)" fontWeight={600}>
              {RASHI_SHORT[r as keyof typeof RASHI_SHORT]}
            </text>
          </g>
        )
      }))}
      <rect width={S} height={S} fill="none" stroke="var(--gold)" strokeWidth="2" />
    </svg>
  )
}

// ── Main Workspace ────────────────────────────────────────────

export function AshtakavargaGrid({ ashtakavarga, ascRashi }: { ashtakavarga: AshtakavargaResult, ascRashi: number }) {
  const [activeTab, setActiveTab] = useState<'sav' | 'bav'>('sav')
  const [activePlanet, setActivePlanet] = useState<string>('Su')
  const [displayMode, setDisplayMode] = useState<'modern' | 'north' | 'south' | 'table'>('modern')

  const stats = useMemo(() => {
    const houses = ashtakavarga.sav.map((v, i) => ({ house: i+1, val: v, rashi: ((ascRashi - 1 + i) % 12) + 1 }))
    const sorted = [...houses].sort((a,b) => b.val - a.val)
    return {
      highest: sorted[0],
      lowest: sorted[sorted.length-1],
      avg: (ashtakavarga.savTotal / 12).toFixed(1)
    }
  }, [ashtakavarga.sav, ascRashi, ashtakavarga.savTotal])

  const renderGrid = (data: number[], isSAV: boolean) => {
    const isChart = displayMode === 'north' || displayMode === 'south'
    
    if (displayMode === 'north') return <NorthIndianGrid data={data} ascRashi={ascRashi} />
    if (displayMode === 'south') return <SouthIndianGrid data={data} ascRashi={ascRashi} />
    
    if (displayMode === 'table') {
       return (
         <div className="card no-scrollbar" style={{ overflowX: 'auto', background: 'var(--surface-1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Planet</th>
                  {Array.from({ length: 12 }, (_, i) => <th key={i} style={{ padding: '0.75rem' }}>H{i+1}</th>)}
                </tr>
              </thead>
              <tbody>
                {PLANET_ORDER.map(p => (
                  <tr key={p} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: PLANET_COLOR[p] }}>{p}</td>
                    {ashtakavarga.bav[p].bindus.map((v, i) => (
                      <td key={i} style={{ textAlign: 'center', padding: '0.5rem', background: getBinduTheme(v, false).bg }}>{v}</td>
                    ))}
                  </tr>
                ))}
                <tr style={{ background: 'rgba(201, 168, 76, 0.05)', fontWeight: 800 }}>
                  <td style={{ padding: '0.75rem', color: 'var(--text-gold)' }}>SAV</td>
                  {ashtakavarga.sav.map((v, i) => (
                    <td key={i} style={{ textAlign: 'center', padding: '0.75rem', color: getBinduTheme(v, true).color }}>{v}</td>
                  ))}
                </tr>
              </tbody>
            </table>
         </div>
       )
    }

    // Modern Heatmap Grid
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
        {data.map((v, i) => {
          const theme = getBinduTheme(v, isSAV)
          const rashi = ((ascRashi - 1 + i) % 12) + 1
          return (
            <div key={i} style={{
              padding: '1.25rem 0.5rem', borderRadius: 'var(--r-md)', border: `1px solid ${theme.border}44`,
              background: theme.bg, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.25rem',
              transition: 'all 0.2s'
            }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>H{i+1} · {RASHI_SHORT[rashi as keyof typeof RASHI_SHORT]}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: theme.color }}>{v}</div>
              <div style={{ height: 4, width: '60%', margin: '4px auto 0', background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(v / (isSAV ? 40 : 8)) * 100}%`, background: theme.color }} />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* ── Top Header ────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
           <h2 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <LayoutDashboard style={{ color: 'var(--gold)' }} /> Aṣṭakavarga Intelligence
           </h2>
           <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 600, marginTop: '0.25rem' }}>
             The Eight-fold Strength analysis reveals the deep karmic support system behind each house. 
             Samudaya (SAV) shows overall power, while Bhinna (BAV) tracks planetary contributions.
           </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <div className="card" style={{ padding: '0.75rem 1rem', background: 'var(--surface-2)', border: '1px solid var(--border-bright)', textAlign: 'center' }}>
             <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>SAV Quality</div>
             <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--teal)' }}>{ashtakavarga.savTotal}</div>
             <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Typical: 337</div>
           </div>
           <div className="card" style={{ padding: '0.75rem 1rem', background: 'var(--surface-2)', border: '1px solid var(--border-bright)', textAlign: 'center' }}>
             <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Average</div>
             <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-gold)' }}>{stats.avg}</div>
             <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Bindus / Sign</div>
           </div>
        </div>
      </div>

      {/* ── Control Bar ────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', background: 'var(--surface-3)', padding: '0.5rem', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
           {[
             { id: 'sav', label: 'Summary (SAV)', icon: Grid },
             { id: 'bav', label: 'Planets (BAV)', icon: Zap },
           ].map(t => (
             <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{
               padding: '0.6rem 1rem', border: 'none', borderRadius: 'var(--r-md)', cursor: 'pointer',
               background: activeTab === t.id ? 'var(--surface-1)' : 'transparent',
               color: activeTab === t.id ? 'var(--text-gold)' : 'var(--text-muted)',
               fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', transition: '0.2s'
             }}>
               <t.icon size={14} /> {t.label}
             </button>
           ))}
        </div>

        <div style={{ display: 'flex', gap: '0.25rem' }}>
           {[
             { id: 'modern', icon: Palette, label: 'Modern' },
             { id: 'north',  icon: ScrollText, label: 'Diamond' },
             { id: 'south',  icon: MapIcon, label: 'Square' },
             { id: 'table',  icon: ChevronRight, label: 'Table' },
           ].map(m => (
             <button key={m.id} onClick={() => setDisplayMode(m.id as any)} style={{
               padding: '0.4rem 0.6rem', border: 'none', borderRadius: 'calc(var(--r-md) - 4px)', cursor: 'pointer',
               background: displayMode === m.id ? 'var(--gold-faint)' : 'transparent',
               color: displayMode === m.id ? 'var(--text-gold)' : 'var(--text-muted)',
               fontSize: '0.65rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem'
             }}>
               <m.icon size={13} /> {m.label}
             </button>
           ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* ── Left side: Insights ─────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           {activeTab === 'sav' ? (
             <>
               <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--teal)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                   <Trophy style={{ color: 'var(--gold)' }} />
                   <span className="label-caps">Powerhouse House</span>
                 </div>
                 <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>House {stats.highest.house} ({RASHI_SHORT[stats.highest.rashi as keyof typeof RASHI_SHORT]})</div>
                 <p style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                   With {stats.highest.val} bindus, this sector is highly auspicious. Efforts related to this house's significations will yield significant results.
                 </p>
               </div>
               <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--rose)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                   <AlertTriangle style={{ color: 'var(--rose)' }} />
                   <span className="label-caps">Vulnerable Sector</span>
                 </div>
                 <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>House {stats.lowest.house} ({RASHI_SHORT[stats.lowest.rashi as keyof typeof RASHI_SHORT]})</div>
                 <p style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                   With only {stats.lowest.val} bindus, this area requires careful handling and remedial measures to overcome natural friction.
                 </p>
               </div>
             </>
           ) : (
             <div className="card" style={{ padding: '1rem' }}>
                <div className="label-caps" style={{ marginBottom: '1rem' }}>Select Planet</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                   {PLANET_ORDER.map(p => (
                     <button key={p} onClick={() => setActivePlanet(p)} style={{
                       padding: '0.75rem 0.25rem', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                       background: activePlanet === p ? PLANET_COLOR[p] : 'var(--surface-1)',
                       color: activePlanet === p ? '#000' : 'var(--text-primary)',
                       fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: '0.2s'
                     }}>
                       {p}
                     </button>
                   ))}
                </div>
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-soft)', paddingTop: '1rem' }}>
                   <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Planet Focus</div>
                   <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{PLANET_NAMES[activePlanet]} BAV</div>
                   <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                     Total contribution: {ashtakavarga.bav[activePlanet].total} bindus. 
                     Typically {activePlanet === 'Ve' ? 52 : activePlanet === 'Su' || activePlanet === 'Sa' || activePlanet === 'Ma' ? 48 : 54} is average.
                   </p>
                </div>
             </div>
           )}

           <div className="card" style={{ padding: '1rem', background: 'var(--surface-2)', border: '1px solid var(--border-bright)' }}>
             <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--gold)', marginBottom: '0.5rem' }}>
                <Info size={16} /> <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>Astrological Tip</span>
             </div>
             <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
               Transit planets (Gochar) produce their best results when they pass through signs where they have 4 or more bindus in their own BAV and the SAV is 25+.
             </p>
           </div>
        </div>

        {/* ── Right side: Visualization ────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           <div className="card" style={{ padding: '1.25rem', background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
               <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                 {activeTab === 'sav' ? 'Samudaya (All Planets Combined)' : `${PLANET_NAMES[activePlanet]} Bhinna View`}
               </h3>
               {displayMode !== 'table' && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ascendant Sign: {RASHI_SHORT[ascRashi as keyof typeof RASHI_SHORT]}</div>}
             </div>
             
             <div style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               {renderGrid(activeTab === 'sav' ? ashtakavarga.sav : ashtakavarga.bav[activePlanet].bindus, activeTab === 'sav')}
             </div>
           </div>
        </div>

      </div>
    </div>
  )
}