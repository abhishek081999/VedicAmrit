'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/page.tsx
//  Home — birth form + full chart result
//  Redesigned: themed, animated, cleaner visual hierarchy
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { BirthForm }     from '@/components/ui/BirthForm'
import { VarshaphalPanel }   from '@/components/ui/VarshaphalPanel'
import { VargaSwitcher } from '@/components/chakra/VargaSwitcher'
import { DashaTree }     from '@/components/dasha/DashaTree'
import { GrahaTable }    from '@/components/ui/GrahaTable'
import { AshtakavargaGrid }   from '@/components/ui/AshtakavargaGrid'
import { YogaList }           from '@/components/ui/YogaList'
import { TransitOverlay }     from '@/components/ui/TransitOverlay'
import { ShadbalaTable } from '@/components/ui/ShadbalaTable'
import { useAppLayout } from '@/components/providers/LayoutProvider'
import type { ChartOutput, Rashi } from '@/types/astrology'
import { RASHI_NAMES, RASHI_SHORT } from '@/types/astrology'

// ─────────────────────────────────────────────────────────────
//  Panchang Panel
// ─────────────────────────────────────────────────────────────

function PanchangPanel({ p }: { p: ChartOutput['panchang'] }) {
  const fmtTime = (d: Date | string) =>
    new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  const items = [
    { label: 'Tithi',     value: p.tithi.name },
    { label: 'Nakshatra', value: p.nakshatra.name },
    { label: 'Yoga',      value: p.yoga.name },
    { label: 'Karana',    value: p.karana.name },
  ]

  const muhurtas = [
    { label: 'Rāhu Kālam',      times: p.rahuKalam,      color: 'var(--rose)',  neutral: false },
    { label: 'Gulikā Kālam',    times: p.gulikaKalam,    color: 'var(--rose)',  neutral: false },
    ...(p.abhijitMuhurta ? [{ label: 'Abhijit Muhūrta', times: p.abhijitMuhurta, color: 'var(--teal)', neutral: true }] : []),
  ]

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{
        background: 'var(--gradient-dark, linear-gradient(135deg, #4A0E17 0%, #2A0810 100%))',
        backgroundColor: '#350a11', // fallback
        padding: '1.5rem',
        borderRadius: 'var(--r-md)',
        color: '#ffffff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <span style={{ color: 'var(--gold)', filter: 'drop-shadow(0 0 4px rgba(201,168,76,0.5))', fontSize: '1.2rem' }}>☀️</span>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 600, letterSpacing: '0.02em', color: '#fff' }}>
            Daily Panchang
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map(({ label, value }) => (
            <div key={label} style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' 
            }}>
              <span style={{ 
                textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 600, 
                letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)' 
              }}>
                {label}
              </span>
              <span style={{ 
                fontWeight: 600, fontSize: '0.95rem', fontFamily: 'Cormorant Garamond, serif', 
                color: 'var(--gold-light, #fde68a)' 
              }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="label-caps" style={{ marginBottom: '0.75rem' }}>Muhūrta Windows</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {muhurtas.map(({ label, times, color, neutral }) => (
            <div key={label} style={{
              padding: '0.85rem 1rem',
              background: neutral ? 'rgba(78,205,196,0.06)' : 'rgba(224,123,142,0.06)',
              border: `1px solid ${neutral ? 'rgba(78,205,196,0.2)' : 'rgba(224,123,142,0.2)'}`,
              borderRadius: 'var(--r-md)',
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color, marginBottom: '0.35rem' }}>
                {label}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                {fmtTime(times.start)} – {fmtTime(times.end)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Arudha Panel
// ─────────────────────────────────────────────────────────────

const ARUDHA_TOPICS: Record<string, string> = {
  AL:  'Public image · worldly self',
  A2:  'Wealth · speech · sustenance',
  A3:  'Courage · siblings · skills',
  A4:  'Home · mother · property',
  A5:  'Intellect · children · karma',
  A6:  'Debts · enemies · service',
  A7:  'Spouse · partnerships',
  A8:  'Longevity · hidden matters',
  A9:  'Dharma · father · fortune',
  A10: 'Career · status · action',
  A11: 'Gains · elder siblings · wishes',
  A12: 'Loss · liberation',
}

function ArudhaPanel({ arudhas }: { arudhas: ChartOutput['arudhas'] }) {
  const keys = ['AL','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12'] as const

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ fontSize: '0.82rem', fontStyle: 'italic', color: 'var(--text-muted)', margin: 0 }}>
        Bhāva Āruḍhas — mirror of worldly reality, calculated by the BPHS algorithm.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.55rem' }}>
        {keys.map((key, i) => {
          const rashi = arudhas[key] as Rashi | undefined
          if (!rashi) return null
          const isAL  = key === 'AL'
          return (
            <div
              key={key}
              style={{
                padding: '0.7rem 1rem',
                background: isAL ? 'rgba(201,168,76,0.08)' : 'var(--surface-2)',
                border: `1px solid ${isAL ? 'var(--border-bright)' : 'var(--border-soft)'}`,
                borderRadius: 'var(--r-md)',
                display: 'flex', gap: '0.65rem', alignItems: 'flex-start',
                transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                cursor: 'default',
                animationDelay: `${i * 0.03}s`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-bright)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = 'var(--glow-gold)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isAL ? 'var(--border-bright)' : 'var(--border-soft)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: isAL ? 'var(--gold)' : 'var(--text-muted)',
                minWidth: 28,
                paddingTop: 3,
                fontWeight: 600,
              }}>
                {key}
              </span>
              <div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.02rem',
                  color: 'var(--text-primary)',
                  fontWeight: isAL ? 500 : 400,
                }}>
                  {RASHI_NAMES[rashi]}
                  <span style={{ marginLeft: 6, fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {RASHI_SHORT[rashi]}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 1 }}>
                  {ARUDHA_TOPICS[key]}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{
        display: 'flex', gap: '1rem', flexWrap: 'wrap',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border-soft)',
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
      }}>
        <span>
          <span style={{ color: 'var(--gold)' }}>Upapada (A12): </span>
          {arudhas.A12 ? RASHI_NAMES[arudhas.A12] : '—'} · quality of marriage
        </span>
        <span>
          <span style={{ color: 'var(--gold)' }}>Darapada (A7): </span>
          {arudhas.A7 ? RASHI_NAMES[arudhas.A7] : '—'} · partner&apos;s image
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Chart Summary sidebar strip
// ─────────────────────────────────────────────────────────────

function ChartSummary({ chart }: { chart: ChartOutput }) {
  const rows = [
    { label: 'Ascendant', value: `${RASHI_NAMES[chart.lagnas.ascRashi as Rashi]} ${chart.lagnas.ascDegreeInRashi.toFixed(1)}°` },
    { label: 'Ayanamsha', value: `${chart.meta.settings.ayanamsha} ${chart.meta.ayanamshaValue.toFixed(3)}°` },
    { label: 'Julian Day', value: chart.meta.julianDay.toFixed(4), mono: true },
  ]
  return (
    <div style={{
      marginTop: '0.85rem',
      padding: '0.85rem 1rem',
      background: 'var(--gold-faint)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
    }}>
      <div className="label-caps" style={{ marginBottom: '0.5rem' }}>Chart Summary</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {rows.map(({ label, value, mono }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span style={{
              color: 'var(--text-secondary)',
              fontFamily: mono ? 'var(--font-mono)' : 'inherit',
              fontSize: mono ? '0.72rem' : '0.8rem',
            }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Main Page
// ─────────────────────────────────────────────────────────────

export default function HomePage() {
  const { data: session, status } = useSession()
  const { activeTab } = useAppLayout()
  const [transitGrahas, setTransitGrahas] = useState<import('@/types/astrology').GrahaData[] | null>(null)
  const [dashaSystem, setDashaSystem] = useState<'vimshottari' | 'yogini' | 'chara'>('vimshottari')
  const searchParams = useSearchParams()
  
  const [chart,      setChart]      = useState<ChartOutput | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [saveDone,   setSaveDone]   = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [defaultChart, setDefaultChart] = useState<any>(null)
  const [fetchingDefault, setFetchingDefault] = useState(false)

  // 1. Fetch default chart if logged in
  useEffect(() => {
    if (status === 'authenticated') {
      setFetchingDefault(true)
      fetch('/api/user/me')
        .then(r => r.json())
        .then(data => {
          if (data.success && data.personalChart) {
             setDefaultChart(data.personalChart)
          }
        })
        .finally(() => setFetchingDefault(false))
    }
  }, [status])

  // 2. Open form if 'new=true' is in URL
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsFormOpen(true)
      setChart(null)
    }
  }, [searchParams])

  // 3. Open form by default ONLY if not authenticated or no default chart after fetching
  useEffect(() => {
    if (status === 'loading' || fetchingDefault) return
    if (!chart && !searchParams.get('name')) {
      // If we don't have a chart on screen, decide if form should be open
      if (status === 'unauthenticated' || (!fetchingDefault && !defaultChart)) {
        setIsFormOpen(true)
      }
    }
  }, [status, fetchingDefault, defaultChart, chart, searchParams])

  async function handleSave(type: 'regular' | 'personal' = 'regular') {
    if (!chart || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/chart/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       chart.meta.name,
          birthDate:  chart.meta.birthDate,
          birthTime:  chart.meta.birthTime,
          birthPlace: chart.meta.birthPlace,
          latitude:   chart.meta.latitude,
          longitude:  chart.meta.longitude,
          timezone:   chart.meta.timezone,
          settings:   chart.meta.settings,
          isPersonal: type === 'personal',
        })
      })
      if (res.ok) {
        setSaveDone(true)
        setTimeout(() => setSaveDone(false), 4000)
      }
    } catch (e) {
      console.error('Save failed', e)
    } finally {
      setSaving(false)
    }
  }

  const moonNakIndex = chart?.grahas.find((g) => g.id === 'Mo')?.nakshatraIndex ?? 0
  const tithiNumber  = chart?.panchang.tithi.number ?? 1
  const varaNumber   = chart?.panchang.vara.number  ?? 0

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
      {chart ? (
         <div className="fade-up" style={{ minWidth: 0 }}>
            
            {/* Headings Row & Birth Summary Strip */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem', borderBottom: '1px solid var(--border-soft)', paddingBottom: '2rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                 <div>
                    <span className="label-caps" style={{ color: 'var(--text-gold)', marginBottom: '0.25rem', display: 'block', fontSize: '0.65rem' }}>Astrological Portrait</span>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.75rem', fontWeight: 400, margin: '0', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                      {chart.meta.name}
                    </h1>
                 </div>

                 {/* Compact Birth Summary Strip */}
                 <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Born</span>
                       <span style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{chart.meta.birthDate}</span>
                       <span style={{ color: 'var(--border-bright)' }}>•</span>
                       <span style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{chart.meta.birthTime}</span>
                    </div>
                    <div style={{ width: 1, height: 16, background: 'var(--border-soft)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>In</span>
                       <span style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{chart.meta.birthPlace}</span>
                       <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>({chart.meta.latitude.toFixed(2)}N, {chart.meta.longitude.toFixed(2)}E)</span>
                    </div>
                    <div style={{ width: 1, height: 16, background: 'var(--border-soft)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ascendant</span>
                       <span style={{ fontWeight: 600, color: 'var(--text-gold)', fontSize: '0.9rem', fontFamily: 'var(--font-display)' }}>
                          {RASHI_NAMES[chart.lagnas.ascRashi as Rashi]} {chart.lagnas.ascDegreeInRashi.toFixed(1)}°
                       </span>
                    </div>
                 </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
                 {status === 'authenticated' && (
                   <button onClick={() => handleSave('regular')} disabled={saving || saveDone} className={`btn ${saveDone ? 'btn-ghost' : 'btn-primary'} btn-sm`}>
                     {saving ? 'Saving…' : saveDone ? '✓ Saved' : '+ Save Chart'}
                   </button>
                 )}
                 <button onClick={() => setIsFormOpen(true)} className="btn btn-secondary btn-sm" style={{ background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-bright)' }}>
                   ✎ Edit Details
                 </button>
                 <button onClick={() => { setChart(null); setIsFormOpen(true) }} className="btn btn-primary btn-sm" style={{ background: 'var(--gold-faint)', color: 'var(--text-gold)', border: '1px solid var(--gold)' }}>
                   + New Chart
                 </button>
              </div>
            </div>
           
            {/* Responsive: Dominant CHART | Tab Analysis */}
            <div className="chart-layout-grid" style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '2.5rem', 
              alignItems: 'start' 
            }}>
               {/* LEFT: Dominant chart area (Primary Focus) */}
               <div style={{ 
                 flex: '2 1 600px', 
                 minWidth: 'min(100%, 400px)', 
                 display: 'flex', 
                 flexDirection: 'column', 
                 gap: '1.5rem',
                 order: 1 // Chart stays 1st
               }}>
                  <TransitOverlay natalChart={chart} onTransitLoad={setTransitGrahas} />
                  <VargaSwitcher
                     vargas={chart.vargas}
                     vargaLagnas={chart.vargaLagnas ?? {}}
                     ascRashi={chart.lagnas.ascRashi}
                     arudhas={chart.arudhas}
                     moonNakIndex={moonNakIndex}
                     tithiNumber={tithiNumber}
                     varaNumber={varaNumber}
                     transitGrahas={transitGrahas ?? undefined}
                  />
               </div>

               {/* RIGHT: Active Tab Content (Sidebar Analysis) */}
               <div style={{ 
                 flex: '1 0 320px', 
                 maxWidth: '100%',
                 display: 'flex', flexDirection: 'column', 
                 gap: '1.5rem', 
                 position: 'sticky', 
                 top: '5.5rem',
                 paddingRight: '4px',
                 order: 2 // Dasha/Planets stay 2nd on responsive
               }}>
                 {activeTab === 'dashboard' && (
                    <>
                      <div className="card" style={{ padding: '1.25rem' }}>
                         <h3 className="label-caps" style={{ marginBottom: '0.75rem', fontSize: '0.65rem' }}>Active Timeline</h3>
                         <DashaTree nodes={chart.dashas.vimshottari} birthDate={new Date(chart.meta.birthDate)} />
                      </div>
                      <div className="card" style={{ padding: '1.25rem' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                           <h3 className="label-caps" style={{ margin: 0, fontSize: '0.65rem' }}>Planetary Micro-Details</h3>
                         </div>
                         <GrahaTable grahas={chart.grahas} lagnas={chart.lagnas} upagrahas={chart.upagrahas} limited={true} />
                      </div>
                    </>
                 )}

                 {activeTab === 'planets' && (
                    <div className="card fade-up" style={{ padding: '1.25rem' }}>
                       <h3 className="label-caps" style={{ marginBottom: '0.75rem', fontSize: '0.65rem' }}>Planetary Status & Diagnostics</h3>
                       <GrahaTable grahas={chart.grahas} lagnas={chart.lagnas} upagrahas={chart.upagrahas} />
                    </div>
                 )}

                 {activeTab === 'dasha' && (
                    <div className="card fade-up" style={{ padding: '1.5rem', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                        marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem',
                        paddingBottom: '1rem', borderBottom: '1px solid var(--border-soft)'
                      }}>
                        <div>
                          <h3 className="label-caps" style={{ margin: 0, color: 'var(--text-gold)', letterSpacing: '0.12em', fontSize: '0.7rem' }}>Time Sequence Analysis</h3>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Dynamic planetary cycles</div>
                        </div>

                        <div style={{ 
                          display: 'flex', background: 'var(--surface-3)', 
                          padding: '3px', borderRadius: '8px',
                          border: '1px solid var(--border-soft)'
                        }}>
                          {([
                            { id: 'vimshottari' as const, label: 'Viṁśottarī', desc: '120y' },
                            { id: 'yogini'      as const, label: 'Yoginī',     desc: '36y' },
                            { id: 'chara'       as const, label: 'Chara',      desc: '12s' },
                          ]).map(({ id, label, desc }) => (
                            <button 
                              key={id} 
                              onClick={() => setDashaSystem(id)} 
                              style={{
                                padding: '0.35rem 0.6rem',
                                background: dashaSystem === id ? 'var(--surface-1)' : 'transparent',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                minWidth: '75px',
                                boxShadow: dashaSystem === id ? '0 2px 8px rgba(0,0,0,0.2), 0 0 0 1px var(--border-bright)' : 'none',
                              }}
                            >
                              <span style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: dashaSystem === id ? 700 : 500,
                                color: dashaSystem === id ? 'var(--text-gold)' : 'var(--text-muted)',
                                fontFamily: 'var(--font-display)'
                              }}>{label}</span>
                              <span style={{ fontSize: '0.55rem', opacity: 0.5 }}>{desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {dashaSystem === 'vimshottari' && <DashaTree nodes={chart.dashas.vimshottari} birthDate={new Date(chart.meta.birthDate)} />}
                        {dashaSystem === 'yogini' && (
                          chart.dashas.yogini?.length 
                            ? <DashaTree nodes={chart.dashas.yogini} birthDate={new Date(chart.meta.birthDate)} /> 
                            : <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Yoginī computation required.</div>
                        )}
                        {dashaSystem === 'chara' && (
                          chart.dashas.chara?.length 
                            ? <DashaTree nodes={chart.dashas.chara} birthDate={new Date(chart.meta.birthDate)} /> 
                            : <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Chara computation required.</div>
                        )}
                      </div>
                    </div>
                 )}

                 {activeTab === 'panchang' && (
                    <div className="card fade-up" style={{ padding: '1.25rem' }}>
                       <h3 className="label-caps" style={{ marginBottom: '1rem', fontSize: '0.65rem' }}>Daily Pañcāṅga Analysis</h3>
                       <PanchangPanel p={chart.panchang} />
                    </div>
                 )}

                 {activeTab === 'ashtakavarga' && (
                    <div className="card fade-up" style={{ padding: '1.25rem' }}>
                       <h3 className="label-caps" style={{ marginBottom: '1rem', fontSize: '0.65rem' }}>Aṣṭakavarga</h3>
                       {chart.ashtakavarga
                         ? <AshtakavargaGrid ashtakavarga={chart.ashtakavarga} ascRashi={chart.lagnas.ascRashi ?? 1} />
                         : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>Recalculate chart to see Aṣṭakavarga.</p>
                       }
                    </div>
                 )}

                 {activeTab === 'yogas' && (
                    <div className="card fade-up" style={{ padding: '1.25rem' }}>
                       <h3 className="label-caps" style={{ marginBottom: '1rem', fontSize: '0.65rem' }}>Graha Yogas</h3>
                       {chart.yogas
                         ? <YogaList yogas={chart.yogas} />
                         : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>Recalculate chart to see Yogas.</p>
                       }
                    </div>
                 )}

                 {activeTab === 'shadbala' && (
                  <div className="card fade-up" style={{ padding: '1.25rem' }}>
                    <div className="label-caps" style={{ marginBottom: '1rem', fontSize: '0.65rem' }}>Ṣaḍbala Strength</div>
                    {chart.shadbala
                      ? <ShadbalaTable shadbala={chart.shadbala} />
                      : <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Recalculate chart to see Shadbala.</div>
                    }
                  </div>
                )}

                 {activeTab === 'varshaphal' && (
                    <div className="card fade-up" style={{ padding: '1.25rem' }}>
                       <h3 className="label-caps" style={{ marginBottom: '1rem', fontSize: '0.65rem' }}>Solar Return</h3>
                       <VarshaphalPanel natalChart={chart} />
                    </div>
                 )}

                {activeTab === 'arudhas' && (
                    <div className="card fade-up" style={{ padding: '1.25rem' }}>
                       <h3 className="label-caps" style={{ marginBottom: '1rem', fontSize: '0.65rem' }}>Bhāva Āruḍhas</h3>
                       <ArudhaPanel arudhas={chart.arudhas} />
                    </div>
                 )}
               </div>

               {/* BOTTOM: Dashboard Extended Details (Full width Diagnostics) */}
               {activeTab === 'dashboard' && (
                 <div style={{ 
                   flex: '1 1 100%', 
                   display: 'grid', 
                   gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
                   gap: '1.5rem', 
                   marginTop: '0.5rem',
                   order: 3 // Extended details always last
                 }}>
                    <div className="card fade-up" style={{ padding: '1.5rem' }}>
                        <h3 className="label-caps" style={{ marginBottom: '1.25rem', color: 'var(--text-gold)', fontSize: '0.7rem' }}>Ashtakavarga Grid</h3>
                        {chart.ashtakavarga 
                          ? <AshtakavargaGrid ashtakavarga={chart.ashtakavarga} ascRashi={chart.lagnas.ascRashi ?? 1} />
                          : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Aṣṭakavarga data unavailable.</p>
                        }
                    </div>

                    <div className="card fade-up" style={{ padding: '1.5rem' }}>
                        <h3 className="label-caps" style={{ marginBottom: '1.25rem', color: 'var(--text-gold)', fontSize: '0.7rem' }}>Planetary Strengths (Shadbala)</h3>
                        {chart.shadbala 
                          ? <ShadbalaTable shadbala={chart.shadbala} />
                          : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Shadbala data unavailable.</p>
                        }
                    </div>

                    <div className="card fade-up" style={{ padding: '1.5rem' }}>
                        <h3 className="label-caps" style={{ marginBottom: '1.25rem', color: 'var(--text-gold)', fontSize: '0.7rem' }}>Natal Panchang</h3>
                        <PanchangPanel p={chart.panchang} />
                    </div>

                    <div className="card fade-up" style={{ padding: '1.5rem' }}>
                        <h3 className="label-caps" style={{ marginBottom: '1.25rem', color: 'var(--text-gold)', fontSize: '0.7rem' }}>Graha Yogas</h3>
                        {chart.yogas 
                          ? <YogaList yogas={chart.yogas} />
                          : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Yoga data unavailable.</p>
                        }
                    </div>
                 </div>
               )}
            </div>
         </div>
      ) : (
         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            {!isFormOpen && (
              <div style={{ textAlign: 'center', opacity: 0.6 }} className="fade-in">
                <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'float 5s ease-in-out infinite' }}>🌌</div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>The Canvas is Empty</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Initiate a new consultation to cast an astrological chart.</p>
                <button onClick={() => setIsFormOpen(true)} className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
                  + Cast Natal Chart
                </button>
              </div>
            )}
         </div>
      )}

      {/* Footer inside main area */}
      <footer style={{
        marginTop: 'auto', paddingTop: '2rem', paddingBottom: '1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)'
      }}>
        <span>
          Powered by{' '}
          <span style={{ color: 'var(--text-gold)', fontStyle: 'italic' }}>Swiss Ephemeris</span>
          {' '}· Lahiri ayanamsha
        </span>
        <span>Kāla tier — free forever ✦</span>
      </footer>

      {/* ── Fixed Drawer for Birth Details Form ──────────────── */}
      <div 
        style={{
          position: 'absolute', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)',
          opacity: isFormOpen ? 1 : 0, pointerEvents: isFormOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease'
        }}
        onClick={() => chart && setIsFormOpen(false)}
      />
      <div style={{ 
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 450, maxWidth: '100vw',
        background: 'var(--surface-1)', zIndex: 101, boxShadow: '-8px 0 32px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-bright)',
        transform: isFormOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{
          padding: '1.5rem', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--surface-2)'
        }}>
          <div>
             <h2 style={{ fontSize: '1.4rem', margin: '0 0 0.2rem 0', fontFamily: 'var(--font-display)', color: 'var(--text-gold)', fontWeight: 600 }}>Birth Details</h2>
             <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', letterSpacing: '0.05em' }}>Janma Kāla Entry</span>
          </div>
          {chart && (
            <button 
              onClick={() => setIsFormOpen(false)}
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border-soft)', width: 36, height: 36, borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            >
              ✕
            </button>
          )}
        </div>
        
        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
            {(status === 'unauthenticated' || (!fetchingDefault)) && (
              <BirthForm
                onResult={(data) => { 
                  setChart(data);
                  setTimeout(() => setIsFormOpen(false), 300);
                }}
                onLoading={setLoading}
                autoSubmit
                initialName="Transit"
                initialData={defaultChart || undefined}
              />
            )}
           {chart && <ChartSummary chart={chart} />}
        </div>
      </div>
    </div>
  )
}