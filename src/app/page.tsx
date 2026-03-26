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
import { PersonalDayCard } from '@/components/dashboard/PersonalDayCard'
import { GrahaTable }    from '@/components/ui/GrahaTable'
import { AshtakavargaGrid }   from '@/components/ui/AshtakavargaGrid'
import { YogaList }           from '@/components/ui/YogaList'
import { TransitOverlay }     from '@/components/ui/TransitOverlay'
import { ShadbalaTable } from '@/components/ui/ShadbalaTable'
import { VimsopakaBalaPanel } from '@/components/ui/VimsopakaBalaPanel'
import { PlanetsWorkspace } from '@/components/ui/PlanetsWorkspace'
import { InterpretationPanel } from '@/components/ui/InterpretationPanel'
import { NakshatraPanel } from '@/components/ui/NakshatraPanel'
import { HousePanel } from '@/components/ui/HousePanel'
import { ExportPdfButton } from '@/components/ui/ExportPdfButton'
import { useAppLayout } from '@/components/providers/LayoutProvider'
import { useChart } from '@/components/providers/ChartProvider'
import type { ChartOutput, Rashi, ChartSettings } from '@/types/astrology'
import { DEFAULT_SETTINGS, NAKSHATRA_NAMES as NAK_NAMES } from '@/types/astrology'
import { RASHI_NAMES, RASHI_SHORT } from '@/types/astrology'
import { PlanetDetailCard } from '@/components/ui/PlanetDetailCard'
import { getGraNakPositions, getNakshatraCharacteristics } from '@/lib/engine/nakshatraAdvanced'

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
  const userPlan = ((session?.user as any)?.plan ?? 'kala') as 'kala' | 'vela' | 'hora'
  const { activeTab } = useAppLayout()
  const [userPrefs, setUserPrefs] = useState<ChartSettings>(DEFAULT_SETTINGS)
  const [transitGrahas, setTransitGrahas] = useState<import('@/types/astrology').GrahaData[] | null>(null)
  const [dashaSystem, setDashaSystem] = useState<'vimshottari' | 'ashtottari' | 'yogini' | 'chara'>( 'vimshottari')
  const [vimshottariTara, setVimshottariTara] = useState<string>('Mo')
  const [altVimshottari, setAltVimshottari] = useState<import('@/types/astrology').DashaNode[] | null>(null)
  const searchParams = useSearchParams()
  
  const { chart, setChart, isFormOpen, setIsFormOpen } = useChart()
  const [loading,    setLoading]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [saveDone,   setSaveDone]   = useState(false)
  const [defaultChart, setDefaultChart] = useState<any>(null)
  const [fetchingDefault, setFetchingDefault] = useState(false)

  // 1. Fetch default chart if logged in (with client-side caching)
  useEffect(() => {
    if (status === 'authenticated') {
      // Check local cache first for instant load
      const cached = sessionStorage.getItem('jyotish_user_me')
      if (cached) {
        try {
          const data = JSON.parse(cached)
          if (data.success) {
            if (data.personalChart) setDefaultChart(data.personalChart)
            if (data.user?.preferences) {
              const prefs = data.user.preferences
              setUserPrefs(prev => ({
                ...prev,
                ...(prefs.defaultAyanamsha    ? { ayanamsha:    prefs.defaultAyanamsha    } : {}),
                ...(prefs.defaultHouseSystem  ? { houseSystem:  prefs.defaultHouseSystem  } : {}),
                ...(prefs.defaultNodeMode     ? { nodeMode:     prefs.defaultNodeMode     } : {}),
                ...(prefs.karakaScheme        ? { karakaScheme: prefs.karakaScheme        } : {}),
                ...(prefs.showDegrees   != null ? { showDegrees:  prefs.showDegrees   } : {}),
                ...(prefs.showNakshatra != null ? { showNakshatra:prefs.showNakshatra } : {}),
                ...(prefs.showKaraka    != null ? { showKaraka:   prefs.showKaraka    } : {}),
              }))
            }
          }
        } catch (e) {
          sessionStorage.removeItem('jyotish_user_me')
        }
      }

      setFetchingDefault(true)
      fetch('/api/user/me')
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            // Update cache
            sessionStorage.setItem('jyotish_user_me', JSON.stringify(data))
            
            if (data.personalChart) {
               setDefaultChart(data.personalChart)
            }
            // Apply user preferences
            if (data.user?.preferences) {
              const prefs = data.user.preferences
              setUserPrefs(prev => ({
                ...prev,
                ...(prefs.defaultAyanamsha    ? { ayanamsha:    prefs.defaultAyanamsha    } : {}),
                ...(prefs.defaultHouseSystem  ? { houseSystem:  prefs.defaultHouseSystem  } : {}),
                ...(prefs.defaultNodeMode     ? { nodeMode:     prefs.defaultNodeMode     } : {}),
                ...(prefs.karakaScheme        ? { karakaScheme: prefs.karakaScheme        } : {}),
                ...(prefs.showDegrees   != null ? { showDegrees:  prefs.showDegrees   } : {}),
                ...(prefs.showNakshatra != null ? { showNakshatra:prefs.showNakshatra } : {}),
                ...(prefs.showKaraka    != null ? { showKaraka:   prefs.showKaraka    } : {}),
              }))
            }
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

  useEffect(() => {
    if (!chart || vimshottariTara === 'Mo') { setAltVimshottari(null); return }
    let refLon: number | null = null
    if (vimshottariTara === 'As') {
      refLon = chart.lagnas.ascDegree
    } else {
      const g = chart.grahas.find(g => g.id === vimshottariTara)
      if (g) refLon = g.lonSidereal
    }
    if (refLon === null) { setAltVimshottari(null); return }
    import('@/lib/engine/dasha/vimshottari').then(({ calcVimshottari }) => {
      const nodes = calcVimshottari(refLon!, new Date(chart.meta.birthDate), 4)
      setAltVimshottari(nodes)
    })
  }, [chart, vimshottariTara])

    const moonNakIndex = chart?.grahas.find((g) => g.id === 'Mo')?.nakshatraIndex ?? 0
  const tithiNumber  = chart?.panchang.tithi.number ?? 1
  const varaNumber   = chart?.panchang.vara.number  ?? 0

  return (
    <div className="main-responsive-padding" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {chart ? (
         <div className="fade-up" style={{ minWidth: 0 }}>
            
            {/* Headings Row & Birth Summary Strip */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem', borderBottom: '1px solid var(--border-soft)', paddingBottom: '2rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                 <div>
                    <span className="label-caps" style={{ color: 'var(--text-gold)', marginBottom: '0.25rem', display: 'block', fontSize: '0.65rem' }}>Astrological Portrait</span>
                    <h1 className="chart-name" style={{ fontFamily: 'var(--font-display)', fontWeight: 400, margin: '0', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
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

              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', flexWrap: 'wrap' }}>
                 {status === 'authenticated' && (
                   <button onClick={() => handleSave('regular')} disabled={saving || saveDone} className={`btn ${saveDone ? 'btn-ghost' : 'btn-primary'} btn-sm`}>
                     {saving ? 'Saving…' : saveDone ? '✓ Saved' : '+ Save Chart'}
                   </button>
                 )}
                 <ExportPdfButton chart={chart} compact />
                 <button onClick={() => setIsFormOpen(true)} className="btn btn-secondary btn-sm" style={{ background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-bright)' }}>
                   ✎ Edit Details
                 </button>
                 <button onClick={() => { setChart(null); setIsFormOpen(true) }} className="btn btn-primary btn-sm" style={{ background: 'var(--gold-faint)', color: 'var(--text-gold)', border: '1px solid var(--gold)' }}>
                   + New Chart
                 </button>
              </div>
            </div>
           
            {/* ── Full-width workspaces (replaces two-column layout) ── */}
            {(activeTab.startsWith('nakshatra-') || activeTab === 'varshaphal' || activeTab === 'planets' || activeTab === 'house' || activeTab === 'interpretation') && (
              <div className={`${(activeTab === 'planets' || activeTab === 'house') ? '' : 'card'} fade-up`} style={{ padding: (activeTab === 'planets' || activeTab === 'house') ? '0' : '1.25rem', width: '100%' }}>
                {activeTab.startsWith('nakshatra-') ? (
                  <NakshatraPanel 
                    chart={chart} 
                    initialTab={activeTab.replace('nakshatra-', '') as any} 
                  />
                  ) : activeTab === 'planets' ? (
                    <PlanetsWorkspace chart={chart} />
                  ) : activeTab === 'house' ? (
                    <HousePanel chart={chart} />
                ) : activeTab === 'interpretation' ? (
                  <InterpretationPanel interpretation={chart.interpretation} />
                  ) : (
                  <VarshaphalPanel natalChart={chart} />
                )}
              </div>
            )}

             {/* Responsive: Dominant CHART | Tab Analysis — hidden when full-width workspace active */}
             {!activeTab.startsWith('nakshatra-') && activeTab !== 'varshaphal' && activeTab !== 'planets' && activeTab !== 'house' && <div className="chart-layout-grid">
               {/* LEFT: Dominant chart area (Primary Focus) */}
               <div style={{ 
                 flex: '1 1 600px', 
                 minWidth: 'min(100%, 600px)', 
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
                     lagnas={chart.lagnas}
                     arudhas={chart.arudhas}
                     userPlan={userPlan}
                     moonNakIndex={moonNakIndex}
                     tithiNumber={tithiNumber}
                     varaNumber={varaNumber}
                     transitGrahas={transitGrahas ?? undefined}
                  />
               </div>

               {/* RIGHT: Active Tab Content (Sidebar Analysis) */}
               <div className="sticky-desktop" style={{ 
                 flex: '1 1 350px', 
                 maxWidth: '100%',
                 minWidth: 'min(100%, 350px)',
                 display: 'flex', flexDirection: 'column', 
                 gap: '1.5rem', 
                 paddingRight: '4px',
                 order: 2 // Dasha/Planets stay 2nd on responsive
               }}>
                  {activeTab === 'dashboard' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          flexWrap: 'wrap',
                          paddingBottom: '0.75rem',
                          borderBottom: '1px solid var(--border-soft)',
                        }}
                      >
                        <div>
                          <div className="label-caps" style={{ marginBottom: '0.5rem', fontSize: '0.65rem' }}>
                            Dashboard
                          </div>
                          <h2
                            style={{
                              margin: 0,
                              fontFamily: 'var(--font-display)',
                              fontWeight: 600,
                              fontSize: '1.5rem',
                              letterSpacing: '-0.01em',
                              color: 'var(--text-primary)',
                              lineHeight: 1.15,
                            }}
                          >
                            Today at a glance
                          </h2>
                          <p style={{ margin: '0.45rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                            Cosmic weather, suitability, and your dasha flow—centered on your birth Moon.
                          </p>
                        </div>

                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.78rem',
                            color: 'var(--text-muted)',
                            padding: '0.5rem 0.75rem',
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border-soft)',
                            borderRadius: 'var(--r-md)',
                            whiteSpace: 'nowrap',
                          }}
                          title="Birth Moon Nakshatra"
                        >
                          Moon: {chart.panchang.nakshatra.name}
                        </div>
                      </div>

                       <PersonalDayCard 
                         birthMoonNakIdx={chart.panchang.nakshatra.index} 
                         birthMoonName={chart.panchang.nakshatra.name} 
                       />
                       
                       <div className="card" style={{ padding: '1.25rem' }}>
                          <h3 className="label-caps" style={{ marginBottom: '1.25rem', fontSize: '0.65rem' }}>Daily Activity Suitability</h3>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                             {[
                               { label: 'Spiritual',  icon: '🧘', rating: 95, color: 'var(--teal)' },
                               { label: 'Wellness',   icon: '🌿', rating: 82, color: 'var(--teal)' },
                               { label: 'Learning',   icon: '📚', rating: 78, color: 'var(--gold)' },
                               { label: 'Business',   icon: '💼', rating: 45, color: 'var(--rose)' },
                               { label: 'Travel',     icon: '✈️', rating: 30, color: 'var(--rose)' },
                               { label: 'Property',   icon: '🏠', rating: 15, color: 'var(--rose)' },
                             ].map((act, i) => (
                               <div key={i} style={{ padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                                   <span style={{ fontSize: '1rem' }}>{act.icon}</span>
                                   <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>{act.label}</span>
                                 </div>
                                 <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                                   <div style={{ height: '100%', width: `${act.rating}%`, background: act.color }} />
                                 </div>
                                 <div style={{ fontSize: '0.65rem', fontWeight: 700, color: act.color, textAlign: 'right' }}>{act.rating}%</div>
                               </div>
                             ))}
                          </div>
                       </div>

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
                             { id: 'ashtottari'  as const, label: 'Aṣṭottarī',  desc: '108y' },
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
                         {dashaSystem === 'vimshottari' && (
                           <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                             <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' }}>
                               <span style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:600,
                                 letterSpacing:'0.08em', textTransform:'uppercase' }}>
                                 Starting Tara
                               </span>
                               {(['Mo','As','Su','Ma','Me','Ju','Ve','Sa','Ra','Ke'] as const).map(id => {
                                 const locked = userPlan === 'kala' && id !== 'Mo'
                                 const labels: Record<string,string> = {
                                   Mo:'Moon', As:'Lagna', Su:'Sun', Ma:'Mars', Me:'Mercury',
                                   Ju:'Jupiter', Ve:'Venus', Sa:'Saturn', Ra:'Rahu', Ke:'Ketu',
                                 }
                                 return (
                                   <button key={id}
                                     onClick={() => locked ? (window.location.href='/pricing') : setVimshottariTara(id)}
                                     title={locked ? 'Requires Vela plan' : `Start from ${labels[id]} nakshatra`}
                                     style={{
                                       padding:'0.2rem 0.55rem', fontSize:'0.7rem', fontFamily:'inherit',
                                       background: vimshottariTara===id ? 'var(--gold-faint)' : 'var(--surface-3)',
                                       border: `1px solid ${vimshottariTara===id ? 'var(--gold)' : 'var(--border-soft)'}`,
                                       borderRadius:'var(--r-sm)', cursor:'pointer', transition:'all 0.12s',
                                       color: locked ? 'var(--text-muted)' : (vimshottariTara===id ? 'var(--text-gold)' : 'var(--text-secondary)'),
                                       opacity: locked ? 0.5 : 1,
                                       display:'inline-flex', alignItems:'center', gap:'0.2rem',
                                     }}>
                                     {locked && <span style={{fontSize:'0.6rem'}}>&#x1F512;</span>}
                                     {labels[id]}
                                   </button>
                                 )
                               })}
                             </div>
                             <DashaTree
                               nodes={vimshottariTara==='Mo' ? chart.dashas.vimshottari : (altVimshottari ?? chart.dashas.vimshottari)}
                               birthDate={new Date(chart.meta.birthDate)}
                             />
                           </div>
                         )}
                         {dashaSystem === 'ashtottari' && (
                           chart.dashas.ashtottari?.length 
                             ? <DashaTree nodes={chart.dashas.ashtottari} birthDate={new Date(chart.meta.birthDate)} /> 
                             : <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Aṣṭottarī computation required.</div>
                         )}
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

                  {activeTab === 'yogas' && (
                     <div className="card fade-up" style={{ padding: '1.25rem' }}>
                        <h3 className="label-caps" style={{ marginBottom: '1rem', fontSize: '0.65rem' }}>Graha Yogas</h3>
                        {chart.yogas
                          ? <YogaList yogas={chart.yogas} />
                          : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>Recalculate chart to see Yogas.</p>
                        }
                     </div>
                  )}

                  {activeTab === 'arudhas' && (
                     <div className="card fade-up" style={{ padding: '1.25rem' }}>
                        <h3 className="label-caps" style={{ marginBottom: '1rem', fontSize: '0.65rem' }}>Bhāva Āruḍhas</h3>
                        <ArudhaPanel arudhas={chart.arudhas} />
                     </div>
                  )}

                  {activeTab === 'shadbala' && (
                    <div className="card fade-up" style={{ padding: '1rem' }}>
                      <div className="label-caps" style={{ marginBottom: '0.75rem', fontSize: '0.65rem' }}>
                        Ṣaḍbala Quick Widget
                      </div>
                      {chart.shadbala ? (
                        <ShadbalaTable
                          shadbala={chart.shadbala}
                          hideDetails={true}
                          preferClassicCharts={true}
                          variant="widget"
                        />
                      ) : (
                        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                          Shadbala data unavailable.
                        </p>
                      )}
                    </div>
                  )}

                  {activeTab === 'vimsopaka' && (
                    <div className="card fade-up" style={{ padding: '1rem' }}>
                      <div className="label-caps" style={{ marginBottom: '0.75rem', fontSize: '0.65rem' }}>
                        Viṁśopaka Quick View
                      </div>
                      {chart.vimsopaka ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-gold)' }}>
                              {chart.vimsopaka.planets[chart.vimsopaka.strongest]?.shodasvarga.toFixed(1)}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Strongest: {chart.vimsopaka.strongest}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--rose)' }}>
                              {chart.vimsopaka.planets[chart.vimsopaka.weakest]?.shodasvarga.toFixed(1)}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Weakest: {chart.vimsopaka.weakest}</div>
                          </div>
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                          Vimsopaka data unavailable.
                        </p>
                      )}
                    </div>
                  )}
                </div>
             </div>}  {/* end chart-layout-grid conditional */}

               {/* BOTTOM: Full-width Shadbala below charts */}
               {activeTab === 'shadbala' && (
                 <div className="card fade-up" style={{ padding: '1.25rem', marginTop: '1.5rem' }}>
                   <div className="label-caps" style={{ marginBottom: '1rem', fontSize: '0.65rem' }}>Ṣaḍbala Strength</div>
                   {chart.shadbala
                     ? <ShadbalaTable shadbala={chart.shadbala} />
                     : <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Recalculate chart to see Shadbala.</div>
                   }
                 </div>
               )}

               {/* BOTTOM: Full-width Ashtakavarga below charts */}
               {activeTab === 'ashtakavarga' && (
                 <div className="card fade-up" style={{ padding: '1.25rem', marginTop: '1.5rem' }}>
                   <div className="label-caps" style={{ marginBottom: '1rem', fontSize: '0.65rem' }}>Aṣṭakavarga Intelligence</div>
                   {chart.ashtakavarga
                     ? <AshtakavargaGrid ashtakavarga={chart.ashtakavarga} ascRashi={chart.lagnas.ascRashi ?? 1} />
                     : <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Recalculate chart to see Aṣṭakavarga.</div>
                   }
                 </div>
               )}

                {/* BOTTOM: Full-width Vimsopaka below charts */}
                {activeTab === 'vimsopaka' && (
                  <div className="card fade-up" style={{ padding: '0.1rem', marginTop: '1.5rem' }}>
                    {chart.vimsopaka
                      ? <VimsopakaBalaPanel vimsopaka={chart.vimsopaka} userPlan={userPlan} />
                      : <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1.25rem' }}>Viṁśopaka data unavailable — recalculate chart.</div>
                    }
                  </div>
                )}

               {/* BOTTOM: Dashboard Extended Details (Full width Diagnostics) */}
               {activeTab === 'dashboard' && (
                  <div style={{ 
                    flex: '1 1 100%', 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', 
                    gap: '1.5rem', 
                    marginTop: '1.5rem',
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
                          ? <ShadbalaTable shadbala={chart.shadbala} hideDetails={true} preferClassicCharts={true} />
                          : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Shadbala data unavailable.</p>
                        }
                    </div>

                    <div className="card fade-up" style={{ padding: '1.5rem' }}>
                        <h3 className="label-caps" style={{ marginBottom: '1.25rem', color: 'var(--text-gold)', fontSize: '0.7rem' }}>Viṁśopaka Bala (16 Vargas)</h3>
                        {chart.vimsopaka 
                          ? <VimsopakaBalaPanel vimsopaka={chart.vimsopaka} userPlan={userPlan} />
                          : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Viṁśopaka data unavailable.</p>
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
      ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '2rem' }}>
            {!isFormOpen && (
              <div style={{ 
                textAlign: 'center', 
                maxWidth: '600px',
                padding: '3rem 2rem',
                background: 'var(--surface-1)',
                border: '1px solid var(--border-soft)',
                borderRadius: 'var(--r-lg)',
                boxShadow: 'var(--shadow-deep)',
              }} className="fade-in">
                <div style={{ fontSize: '4.5rem', marginBottom: '1.5rem', animation: 'float 6s ease-in-out infinite' }}>🌌</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--text-primary)', margin: '0 0 1rem 0', fontWeight: 500, letterSpacing: '-0.02em' }}>
                  The Cosmic Canvas
                </h2>
                <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', marginBottom: '2.5rem', lineHeight: 1.6 }}>
                  Initiate a new astrological consultation to cast a chart. 
                  Choose between a detailed Birth Chart or a quick analysis of the current celestial moment.
                </p>
                
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => {
                      setIsFormOpen(true);
                      setChart(null);
                    }} 
                    className="btn btn-primary" 
                    style={{ padding: '0.85rem 2rem', fontSize: '1rem', minWidth: '180px' }}
                  >
                    ✦ Cast Natal Chart
                  </button>
                  <button 
                    onClick={() => {
                      setIsFormOpen(true);
                    }} 
                    className="btn btn-secondary" 
                    style={{ 
                      padding: '0.85rem 2rem', 
                      fontSize: '1rem', 
                      minWidth: '180px',
                      background: 'rgba(201,168,76,0.05)',
                      border: '1px solid var(--gold)',
                      color: 'var(--text-gold)'
                    }}
                  >
                    🕒 Add Current Chart
                  </button>
                </div>
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
          position: 'fixed', inset: 0, zIndex: 1100,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          opacity: isFormOpen ? 1 : 0, pointerEvents: isFormOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease'
        }}
        onClick={() => setIsFormOpen(false)}
      />
      <div className="form-drawer" style={{ 
        position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 1101, 
        boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
        background: 'var(--surface-1)',
        display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-bright)',
        transform: isFormOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        width: 450, // Default width for desktop (overridden by class on mobile)
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
          <button 
            onClick={() => setIsFormOpen(false)}
            style={{ 
              background: 'var(--surface-3)', 
              border: '1px solid var(--border-soft)', 
              width: 32, height: 32, borderRadius: '50%', 
              fontSize: '1rem', cursor: 'pointer', color: 'var(--text-primary)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              transition: 'all 0.2s',
              zIndex: 10
            }}
          >
            ✕
          </button>
        </div>
        
        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
            {/* 
                Optimization: Render BirthForm immediately if query params are present (from "My Charts" or deep links).
                Don't wait for the background user/me fetch to finish.
            */}
            {(status === 'unauthenticated' || !fetchingDefault || !!searchParams.get('name')) && (
              <BirthForm
                onResult={(data) => { 
                  setChart(data);
                  setTimeout(() => setIsFormOpen(false), 300);
                }}
                onLoading={setLoading}
                autoSubmit={!!searchParams.get('name')}
                initialName="Natal Chart"
                initialData={chart ? {
                  name: chart.meta.name,
                  birthDate: chart.meta.birthDate,
                  birthTime: chart.meta.birthTime,
                  birthPlace: chart.meta.birthPlace,
                  latitude: chart.meta.latitude,
                  longitude: chart.meta.longitude,
                  timezone: chart.meta.timezone,
                  settings: { ...userPrefs, ...chart.meta.settings },
                } : (defaultChart || undefined)}
              />
            )}
           {chart && <ChartSummary chart={chart} />}
        </div>
      </div>
    </div>
  )
}
