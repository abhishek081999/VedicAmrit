// VargaSwitcher.tsx — plan gated
'use client'
import React, { useState, useEffect } from 'react'
import { ChakraSelector } from './ChakraSelector'
import type { GrahaData, Rashi, UserPlan, ArudhaData, LagnaData, ChartOutput } from '@/types/astrology'
import { calcArudhaOutput } from '@/lib/engine/arudhas'
import { getActiveHouses } from '@/lib/engine/activeHouses'
import { getVargaPosition } from '@/lib/engine/vargas'

interface VargaMeta { name: string; full: string; topic: string; tier: 'free'|'gold'|'platinum' }

const VARGA_META: VargaMeta[] = [
  { name:'D1',  full:'Rashi',           topic:'Lagna chart — personality, body, overall life',        tier:'free' },
  { name:'D9',  full:'Navamsha',        topic:'Spouse & marriage — inner self, manifests after 35',   tier:'free' },
  { name:'D60', full:'Shastyamsha',     topic:'Past-life karma — karmic influences, soul evolution',  tier:'free' },
  { name:'D2',  full:'Hora',            topic:'Wealth & assets — income, Sun Hora and Moon Hora',     tier:'free' },
  { name:'D3',  full:'Drekkana',        topic:'Siblings — relationships, talents, abilities',         tier:'free' },
  { name:'D4',  full:'Chaturthamsha',   topic:'Home & property — dwelling, ancestral property',       tier:'free' },
  { name:'D7',  full:'Saptamsha',       topic:'Children — progeny, offspring, influence',             tier:'free' },
  { name:'D10', full:'Dasamsha',        topic:'Career — profession, achievements, reputation',        tier:'free' },
  { name:'D12', full:'Dwadasamsha',     topic:'Parents — relationship with parents, their influence', tier:'free' },
  { name:'D16', full:'Shodasamsha',     topic:'Vehicles & comforts — transport, luxuries',            tier:'free' },
  { name:'D20', full:'Vimsamsha',       topic:'Spirituality — religious actions, devotion',           tier:'free' },
  { name:'D24', full:'Chaturvimsamsha', topic:'Education — learning, academic achievements',          tier:'free' },
  { name:'D27', full:'Saptvimsamsha',  topic:'Innate strength — inherent qualities, talents',        tier:'free' },
  { name:'D30', full:'Trimsamsha',      topic:'Obstacles — negative influences, karmic challenges',   tier:'free' },
  { name:'D40', full:'Khavedamsha',     topic:'Life events and mother — auspicious or inauspicious',  tier:'free' },
  { name:'D45', full:'Akshavedamsha',   topic:'All life matters and father — comprehensive',          tier:'free' },
  { name:'D81', full:'Navamsha D81',    topic:'Detailed karmic analysis — sub-divisions of D9',      tier:'free' },
]

const VARGA_SHORT_LABEL: Record<string, string> = {
  D1: 'Rashi',
  D9: 'Navamsha',
  D10: 'Dasamsha',
  D7: 'Saptamsha',
  D60: 'Shastyamsha',
}

function planLevel(plan: UserPlan) { return plan==='platinum'?2:plan==='gold'?1:0 }
function tierLevel(tier: VargaMeta['tier']) { return tier==='platinum'?2:tier==='gold'?1:0 }
function isUnlocked(meta: VargaMeta, plan: UserPlan) { return planLevel(plan)>=tierLevel(meta.tier) }

interface Props {
  vargas: Record<string,GrahaData[]>; vargaLagnas: Record<string,Rashi>
  lagnas?: LagnaData
  ascRashi: Rashi; arudhas?: ArudhaData; userPlan?: UserPlan
  size?: number; moonNakIndex?: number; tithiNumber?: number; varaNumber?: number
  transitGrahas?: GrahaData[]; direction?: 'grid'|'column'
  comparisonGrahas?: GrahaData[] // partner chart
  onActiveVargaChange?: (v: string) => void
  mobileSelectedVarga?: string
  onMobileSelectedVargaChange?: (v: string) => void
  hideMobileSelector?: boolean
  chart?: ChartOutput
  transitMoonLon?: number
}

function Pill({ meta, plan, state, onClick }: {
  meta:VargaMeta; plan:UserPlan; state:'primary'|'secondary'|'none'; onClick:()=>void
}) {
  const unlocked = isUnlocked(meta, plan)
  const tierDisplayName = meta.tier === 'platinum' ? 'Platinum' : meta.tier === 'gold' ? 'Gold' : 'Free'
  return (
    <button
      onClick={onClick}
      title={unlocked ? `${meta.full} — ${meta.topic}` : `Requires ${tierDisplayName} plan`}
      style={{
        padding:'0.22rem 0.6rem', fontSize:'0.78rem',
        fontFamily:'JetBrains Mono,monospace', cursor:'pointer',
        border:'1px solid', borderRadius:'4px', transition:'all 0.12s',
        background: !unlocked?'transparent':state==='primary'?'var(--gold-faint)':state==='secondary'?'var(--accent-glow)':'transparent',
        borderColor: !unlocked?'var(--border-soft)':state==='primary'?'var(--gold)':state==='secondary'?'var(--accent)':'var(--border)',
        color: !unlocked?'var(--text-muted)':state==='primary'?'var(--gold)':state==='secondary'?'var(--accent)':'var(--text-muted)',
        opacity: unlocked?1:0.5, display:'inline-flex', alignItems:'center', gap:'0.2rem',
      }}>
      {!unlocked && <span style={{fontSize:'0.6rem'}}>&#x1F512;</span>}
      {meta.name}
    </button>
  )
}

function UpgradeNudge({ plan }: { plan: UserPlan }) {
  return null
}

function ChartLabel({ meta, accent }: { meta: VargaMeta; accent: 'gold'|'blue' }) {
  const isGold = accent === 'gold'
  return (
    <div style={{ 
       display:'flex', alignItems:'baseline', gap:'0.5rem',
       marginBottom:'0.5rem', paddingBottom:'0.4rem'
    }}>
      <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.85rem', fontWeight:'var(--fw-bold)', color:isGold?'var(--gold)':'var(--accent)' }}>
        {meta.name}
      </span>
      <span style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'1rem', color:'var(--text-primary)' }}>
        {meta.full}
      </span>
    </div>
  )
}

export function VargaSwitcher({
  vargas, vargaLagnas, ascRashi, arudhas, userPlan='free', lagnas,
  size=500, moonNakIndex=0, tithiNumber=1, varaNumber=0,
  transitGrahas=[], direction='grid', onActiveVargaChange,
  mobileSelectedVarga,
  onMobileSelectedVargaChange,
  hideMobileSelector = false,
  chart, transitMoonLon, comparisonGrahas = [],
}: Props) {
  const [selected, setSelected] = useState<string[]>(['D1', 'D9'])
  const [chartSettingsOpen, setChartSettingsOpen] = useState<Record<string, boolean>>({})
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const available = VARGA_META.filter(v => v.name in vargas || v.tier==='free')

  function handleClick(meta: VargaMeta) {
    if (!isUnlocked(meta, userPlan)) { window.location.href='/pricing'; return }
    const name = meta.name
    
    if (isMobile) {
      setSelected([name])
      if (onMobileSelectedVargaChange) onMobileSelectedVargaChange(name)
      if (onActiveVargaChange) onActiveVargaChange(name)
      return
    }

    // On Desktop: Keep 2 charts, update the 2nd one
    const p1 = selected[0] || 'D1'
    if (name === p1) return 
    setSelected([p1, name])
    if (onActiveVargaChange) onActiveVargaChange(name)
  }

  function chartProps(name: string) {
    return {
      grahas: vargas[name] ?? vargas['D1'] ?? [],
      varAscRashi: (vargaLagnas[name] ?? ascRashi) as Rashi,
    }
  }

  // Logic for which charts to render
  const chartsToDisplay = React.useMemo(() => {
    if (isMobile) {
      const mobileCandidate = mobileSelectedVarga || selected[0]
      const mobileMeta = mobileCandidate ? VARGA_META.find(v => v.name === mobileCandidate) : null
      const mobileUnlocked = mobileMeta ? isUnlocked(mobileMeta, userPlan) : false
      if (mobileCandidate && mobileUnlocked) return [mobileCandidate]
      const firstVisible = selected.find(name => {
        const meta = VARGA_META.find(v => v.name === name)
        return meta ? isUnlocked(meta, userPlan) : true
      }) || 'D1'
      return [firstVisible]
    }
    
    // Always 2 on desktop
    const p1 = selected[0] || 'D1'
    const p2 = selected[1] || 'D9'
    return [p1, p2]
  }, [selected, isMobile, userPlan, mobileSelectedVarga])

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:'1.25rem' }}>
      
      {/* ── Mobile Dropdown — (Desktop Pills Removed per request) ── */}
      {isMobile && !hideMobileSelector ? (
        <div style={{
          padding: '0.75rem 1rem', background: 'var(--surface-2)',
          border: '1px solid var(--gold-soft)', borderRadius: '12px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <label style={{ 
            fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 700, 
            display: 'block', marginBottom: '0.5rem', letterSpacing: '0.05em' 
          }}>
            SELECT DIVISIONAL CHART
          </label>
          <select 
            value={mobileSelectedVarga || chartsToDisplay[0]} 
            onChange={(e) => {
              const meta = VARGA_META.find(v => v.name === e.target.value)
              if (meta) handleClick(meta)
            }}
            style={{
              width: '100%', padding: '0.65rem', background: 'var(--surface-1)',
              color: 'var(--text-primary)', border: '1px solid var(--border)',
              borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'Cormorant Garamond, serif'
            }}
          >
            {available.map(v => (
              <option key={v.name} value={v.name}>
                {v.name} — {v.full} {!isUnlocked(v, userPlan) ? '🔒' : ''}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {/* ── Chart Rendering ─────────────────────────────────── */}
      <div className={direction==='grid' && !isMobile ? 'varga-grid' : ''} style={{
        display: (direction==='grid' && !isMobile) ? 'grid' : 'flex',
        flexDirection: (direction==='grid' && !isMobile) ? undefined : 'column',
        gap: '1.5rem', marginTop: '0.5rem',
      }}>
        {chartsToDisplay.map((name, idx) => {
          const meta = VARGA_META.find(v => v.name === name) ?? { name, full:name, topic:'', tier:'free' as const }
          const { grahas, varAscRashi } = chartProps(name)
          
          const vArudhasRaw = calcArudhaOutput(varAscRashi, grahas)
          const vArudhas: ArudhaData = {
            ...vArudhasRaw,
            suryaArudhas: {},
            chandraArudhas: {}
          }

          return (
            <div key={idx} className="fade-up" style={{
              padding:'1.25rem', background:'var(--surface-1)',
              border:`1px solid ${idx===0 ? 'var(--gold)' : 'var(--border)'}`,
              borderRadius:'var(--r-lg)', boxShadow:'var(--shadow-card)',
              display: 'flex', flexDirection: 'column'
            }}>
              {/*
                Keep D9 controls in the same top row as the D9 label.
              */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-soft)', paddingBottom: '0.5rem' }}>
                <ChartLabel meta={meta} accent={idx===0 ? 'gold' : 'blue'} />
                
                {!isMobile && idx === 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setChartSettingsOpen((prev) => ({ ...prev, [name]: !prev[name] }))
                    }
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-soft)',
                      background: chartSettingsOpen[name] ? 'var(--gold-faint)' : 'transparent',
                      color: chartSettingsOpen[name] ? 'var(--gold)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)',
                      fontFamily: 'var(--font-chart-planets)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <span aria-hidden>⚙️</span>
                    <span>{chartSettingsOpen[name] ? 'Hide Panel' : 'Chart Settings'}</span>
                  </button>
                )}

                {isMobile && (
                  <div style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <select
                      value={name}
                      onChange={(e) => {
                        const m = VARGA_META.find(v => v.name === e.target.value)
                        if (m) handleClick(m)
                      }}
                      style={{
                        padding: '0.3rem 0.5rem',
                        fontSize: '0.76rem',
                        background: 'var(--surface-2)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--gold-soft)',
                        borderRadius: 6,
                        fontFamily: 'var(--font-display)',
                        maxWidth: 150,
                      }}
                    >
                      {available.map(v => (
                        <option key={v.name} value={v.name} disabled={!isUnlocked(v, userPlan)}>
                          {v.name} — {VARGA_SHORT_LABEL[v.name] ?? v.full}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        setChartSettingsOpen((prev) => ({ ...prev, [name]: !prev[name] }))
                      }
                      aria-label={chartSettingsOpen[name] ? 'Hide chart settings' : 'Show chart settings'}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        border: '1px solid var(--border-soft)',
                        background: chartSettingsOpen[name] ? 'var(--gold-faint)' : 'transparent',
                        color: chartSettingsOpen[name] ? 'var(--gold)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        ⚙️
                      </span>
                    </button>
                  </div>
                )}

                {!isMobile && idx === 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <select 
                      value={name} 
                      onChange={(e) => {
                        const m = VARGA_META.find(v => v.name === e.target.value)
                        if (m) handleClick(m)
                      }}
                      style={{
                        padding: '0.3rem 0.6rem', fontSize: '0.75rem', 
                        background: 'var(--surface-2)', color: 'var(--gold)',
                        border: '1px solid var(--gold-soft)', borderRadius: '4px',
                        fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        minWidth: '170px',
                      }}
                    >
                      {available.map(v => (
                        <option key={v.name} value={v.name} disabled={!isUnlocked(v, userPlan)}>
                          {v.name} {v.full} {!isUnlocked(v, userPlan) ? '🔒' : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        setChartSettingsOpen((prev) => ({ ...prev, [name]: !prev[name] }))
                      }
                      title={chartSettingsOpen[name] ? 'Hide chart settings' : 'Show chart settings'}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        border: '1px solid var(--border-soft)',
                        background: chartSettingsOpen[name] ? 'var(--gold-faint)' : 'transparent',
                        color: chartSettingsOpen[name] ? 'var(--gold)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        ⚙️
                      </span>
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display:'flex',justifyContent:'center',marginTop:'1rem', flex: 1 }}>
                <ChakraSelector
                  ascRashi={varAscRashi} grahas={grahas} size={isMobile ? 320 : 400}
                  vargaName={name}
                  userPlan={userPlan} lagnas={lagnas} defaultStyle="north" arudhas={vArudhas}
                  transitGrahas={name === 'D1' ? transitGrahas : []} 
                  comparisonGrahas={comparisonGrahas.length > 0 ? comparisonGrahas.map(g => {
                    const vPos = getVargaPosition(g.totalDegree, name as any)
                    return { ...g, totalDegree: vPos.totalDegree, degree: vPos.degree, rashi: vPos.rashi as Rashi }
                  }) : []}
                  moonNakIndex={moonNakIndex}
                  tithiNumber={tithiNumber} varaNumber={varaNumber}
                  highlightHouses={chart ? getActiveHouses(chart, transitMoonLon, grahas, { ...lagnas!, ascRashi: varAscRashi }) : []}
                  showSettingsOverride={Boolean(chartSettingsOpen[name])}
                  onToggleSettings={() =>
                    setChartSettingsOpen((prev) => ({ ...prev, [name]: !prev[name] }))
                  }
                  hideInternalSettingsToggle={!isMobile ? (idx === 0 || idx === 1) : true}
                />
              </div>

              {/* Description at the bottom */}
              <div style={{ 
                marginTop: '1.25rem', paddingTop: '0.75rem', 
                borderTop: '1px solid var(--border-soft)', 
                fontSize: '0.78rem', color: 'var(--text-muted)', 
                fontFamily: 'Cormorant Garamond, serif',
                letterSpacing: '0.02em', fontStyle: 'italic',
                textAlign: 'center'
              }}>
                {meta.topic.includes(' — ') ? meta.topic.split(' — ')[1] : meta.topic}
              </div>
            </div>
          )
        })}
      </div>
    </div>



  )
}
