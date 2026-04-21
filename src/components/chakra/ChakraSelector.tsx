// ─────────────────────────────────────────────────────────────
//  src/components/chakra/ChakraSelector.tsx
//  Unified chart container — style picker + config toggles
//  Supports all 4 Kāla-tier styles:
//    North Indian  |  South Indian  |  Sarvatobhadra
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useState } from 'react'
import { SouthIndianChakra }     from './SouthIndianChakra'
import { NorthIndianChakra }     from './NorthIndianChakra'
import { SarvatobhadraChakra }   from './SarvatobhadraChakra'
import { CircleChakra }          from './CircleChakra'

import type { GrahaData, Rashi, ChartStyle, ArudhaData, LagnaData } from '@/types/astrology'
import { getVargaPosition } from '@/lib/engine/vargas'
import { getNakshatra } from '@/lib/engine/nakshatra'

// ── Props ─────────────────────────────────────────────────────

interface ChakraSelectorProps {
  ascRashi:     Rashi
  grahas:       GrahaData[]
  // Panchang data — needed for Sarvatobhadra
  moonNakIndex?: number    // 0–26
  arudhas?:     ArudhaData  // for Āruḍha overlay
  transitGrahas?: GrahaData[]  // transit planet overlay
  comparisonGrahas?: GrahaData[] // partner chart overlay
  tithiNumber?:  number    // 1–30
  varaNumber?:   number    // 0=Sun … 6=Sat
  lagnas?:       LagnaData
  vargaName?:    string
  defaultStyle?: ChartStyle
  size?:         number
  userPlan?:     'free' | 'gold' | 'platinum'
  highlightHouses?: number[]
  headerControls?: React.ReactNode
  showSettingsOverride?: boolean
  onToggleSettings?: () => void
  hideInternalSettingsToggle?: boolean
}

// ── Style definitions ─────────────────────────────────────────

const STYLES: { id: ChartStyle; label: string; shortLabel: string; description: string; tier?: string }[] = [
  { id: 'north',         label: 'North Indian',  shortLabel: 'North',   description: 'Houses fixed, signs rotate' },
  { id: 'south',         label: 'South Indian',  shortLabel: 'South',   description: 'Signs fixed, houses rotate' },
  { id: 'sarvatobhadra', label: 'Sarvatobhadra', shortLabel: 'SBC',     description: '9×9 nakshatra wheel' },
  { id: 'circle',        label: 'Circle Wheel',  shortLabel: 'Circle',  description: '12 equal slices, ascendant at 9 o\'clock' },

]



// ── Component ─────────────────────────────────────────────────

export function ChakraSelector({
  ascRashi,
  grahas,
  lagnas,
  moonNakIndex = 0,
  arudhas,
  tithiNumber  = 1,
  varaNumber   = 0,
  defaultStyle = 'north',
  size         = 480,
  userPlan     = 'free',
  transitGrahas = [],
  comparisonGrahas = [],
  vargaName = 'D1',
  highlightHouses = [],
  headerControls,
  showSettingsOverride,
  onToggleSettings,
  hideInternalSettingsToggle = false,
}: ChakraSelectorProps) {
  const VALID_STYLES: ChartStyle[] = ['north','south','sarvatobhadra','circle']
  const [style, setStyle] = useState<ChartStyle>(
    VALID_STYLES.includes(defaultStyle as ChartStyle) ? defaultStyle as ChartStyle : 'north'
  )
  const [showDegrees,   setShowDegrees]   = useState(true)
  const [showNakshatra, setShowNakshatra] = useState(false)
  const [showKaraka,    setShowKaraka]    = useState(false)
  const [showArudha,    setShowArudha]    = useState(false)
  const [showTithi,     setShowTithi]     = useState(true)
  const [showVara,      setShowVara]      = useState(true)
  const [onlyNine,      setOnlyNine]      = useState(true)
  const [showNatal,     setShowNatal]     = useState(true)
  const [showTooltip,   setShowTooltip]   = useState(false)

  // Typography scaling
  const [fontScale,     setFontScale]     = useState(1.10)
  const [planetScale,   setPlanetScale]   = useState(1.05)
  const [arudhaScale,   setArudhaScale]   = useState(1.20)
  const [infoScale,     setInfoScale]     = useState(0.80)
  const [chartScale,    setChartScale]    = useState(1.10)

  const [lagnaSource,   setLagnaSource]   = useState('natal')
  
  const [showSettings,  setShowSettings]  = useState(false)
  const [showLegend,    setShowLegend]    = useState(true)
  const resolvedShowSettings = showSettingsOverride ?? showSettings
  const handleSettingsToggle = onToggleSettings ?? (() => setShowSettings(!showSettings))

  // Use smaller scale on mobile initially
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setChartScale(0.9)
    }
  }, [])

  const isSBC = style === 'sarvatobhadra'

  const displayGrahas = onlyNine 
    ? grahas.filter(g => !['Ur', 'Ne', 'Pl'].includes(g.id))
    : grahas

  // ── Calculate Divisional Lagna ────────────────────────────────
  // If the ascRashi doesn't match natal, we are in a varga chart.
  // We should derive the correct divisional degree for the AS label.
  const displayLagnas = React.useMemo(() => {
    if (!lagnas) return undefined
    if (lagnas.ascRashi === ascRashi && grahas.length > 0 && grahas[0].id === 'Su' && !('D9' in (grahas as any))) {
      // Very likely D1/Natal
      return lagnas
    }
    
    // If we have a vargaName and natal lagnas, project the ascendant
    if (vargaName && vargaName !== 'D1') {
      try {
        const vPos = getVargaPosition(lagnas.ascDegree, vargaName as any)
        const vNak = getNakshatra(vPos.totalDegree)
        return {
          ...lagnas,
          ascRashi: vPos.rashi as Rashi,
          ascDegreeInRashi: vPos.degree,
          // Re-calculate nakshatra for divisional lagna
          cusps: lagnas.cusps.map(c => getVargaPosition(c, vargaName as any).totalDegree)
        }
      } catch (e) {
        return lagnas
      }
    }
    
    return lagnas
  }, [lagnas, ascRashi, grahas, vargaName])

  // ── Project Comparison Grahas to correct Varga ──────────────────
  const displayComparison = React.useMemo(() => {
    if (!comparisonGrahas.length || vargaName === 'D1') return comparisonGrahas
    return comparisonGrahas
  }, [comparisonGrahas, vargaName])

  // ── Calculate Effective Ascendant Rashi ────────────────────────
  const effectiveAscRashi = React.useMemo(() => {
    if (lagnaSource === 'natal') return ascRashi
    if (lagnaSource === 'chandra') {
      const mo = grahas.find(g => g.id === 'Mo')
      return (mo?.rashi || ascRashi) as Rashi
    }
    if (lagnaSource === 'surya') {
      const su = grahas.find(g => g.id === 'Su')
      return (su?.rashi || ascRashi) as Rashi
    }
    if (lagnaSource === 'arudha') {
      return (arudhas?.AL || ascRashi) as Rashi
    }
    if (lagnaSource.startsWith('h')) {
      const hNum = parseInt(lagnaSource.substring(1))
      if (isNaN(hNum)) return ascRashi
      // hNum is 1-12. h1 is Natal Lagna.
      return (((ascRashi - 1 + hNum - 1) % 12) + 1) as Rashi
    }
    return ascRashi
  }, [ascRashi, lagnaSource, grahas, arudhas])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', width: '100%' }}>

      {/* ── Settings Toggle ────────────────────────────────── */}
      {!hideInternalSettingsToggle && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', flexWrap: 'nowrap' }}>
          {headerControls}
          <button
            onClick={handleSettingsToggle}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              whiteSpace: 'nowrap',
              padding: '0.4rem 0.75rem', fontSize: '0.75rem',
              borderRadius: '6px', border: '1px solid var(--border-soft)',
              background: resolvedShowSettings ? 'var(--gold-faint)' : 'transparent',
              color: resolvedShowSettings ? 'var(--gold)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: 'var(--shadow-sm)',
              fontFamily: 'var(--font-chart-planets)',
              letterSpacing: '0.04em',
            }}
          >
            <SettingsIcon />
            <span>{resolvedShowSettings ? 'Hide Panel' : 'Chart Settings'}</span>
          </button>
        </div>
      )}

      {resolvedShowSettings && (
        <div className="fade-in" style={{
          display: 'flex', flexDirection: 'column', gap: '1.25rem',
          padding: '1.25rem', background: 'var(--surface-2)', 
          borderRadius: '12px', border: '1px solid var(--border-soft)',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '0.5rem'
        }}>
          
          {/* Style switcher */}
          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 700, marginRight: '0.5rem' }}>STYLE:</span>
            {STYLES.map((s) => {
              const active = style === s.id
              const locked = s.tier === 'gold' && userPlan === 'free'
              return (
                <button
                  key={s.id}
                  onClick={() => locked ? (window.location.href = '/pricing') : setStyle(s.id as ChartStyle)}
                  title={locked ? `${s.label} — requires Gold plan` : s.description}
                  style={{
                    padding: '0.35rem 0.75rem', fontSize: '0.75rem',
                    fontFamily: 'var(--font-chart-planets)', letterSpacing: '0.04em',
                    cursor: 'pointer', border: '1px solid', borderRadius: '4px',
                    transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                    opacity: locked ? 0.55 : 1,
                    background: active ? 'var(--gold-faint)' : 'transparent',
                    borderColor: active ? 'var(--gold)' : locked ? 'var(--border-soft)' : 'var(--border)',
                    color: active ? 'var(--gold)' : 'var(--text-muted)',
                  }}
                >
                  {locked && <span style={{ fontSize: '0.6rem' }}>🔒</span>}
                  {s.label}
                </button>
              )
            })}
          </div>

          <div style={{ height: '1px', background: 'var(--border-soft)' }} />

          {/* Config toggles */}
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 700, marginRight: '0.25rem' }}>DISPLAY:</span>
            {!isSBC && (
              <>
                <Toggle label="9 Planets"   value={onlyNine}   onChange={setOnlyNine} />
                <Toggle label="Degrees"   value={showDegrees}   onChange={setShowDegrees} />
                <Toggle label="Nakshatra" value={showNakshatra} onChange={setShowNakshatra} />
                {userPlan !== 'free' && (
                  <Toggle label="Karaka" value={showKaraka} onChange={setShowKaraka} />
                )}
                {arudhas && (
                  <Toggle label="Āruḍha" value={showArudha} onChange={setShowArudha} />
                )}
                <Toggle label="Legend" value={showLegend} onChange={setShowLegend} />
                {transitGrahas.length > 0 && (
                  <Toggle label="Show Natal" value={showNatal} onChange={setShowNatal} />
                )}
                <Toggle label="Tooltip" value={showTooltip} onChange={setShowTooltip} />
              </>
            )}
            {isSBC && (
              <>
                <Toggle label="Tithi"  value={showTithi} onChange={setShowTithi} />
                <Toggle label="Vara"   value={showVara}  onChange={setShowVara} />
              </>
            )}
          </div>

          {!isSBC && (
            <>
              <div style={{ height: '1px', background: 'var(--border-soft)' }} />
              {/* Lagna Source Selector */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.4rem', 
                  color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.05em', fontSize: '0.72rem'
                }}>
                  LAGNA SOURCE
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  {[
                    { id: 'natal',   label: 'Natal' },
                    { id: 'chandra', label: 'Moon' },
                    { id: 'surya',   label: 'Sun' },
                    { id: 'arudha',  label: 'AL' },
                  ].map(ls => {
                    const active = lagnaSource === ls.id
                    return (
                      <button
                        key={ls.id} onClick={() => setLagnaSource(ls.id)}
                        style={{
                          padding: '0.3rem 0.75rem', fontSize: '0.72rem',
                          borderRadius: '4px', border: '1px solid', cursor: 'pointer',
                          fontFamily: 'var(--font-chart-planets)',
                          background: active ? 'var(--gold-faint)' : 'transparent',
                          borderColor: active ? 'var(--gold)' : 'var(--border-soft)',
                          color: active ? 'var(--gold)' : 'var(--text-muted)',
                        }}
                      >
                        {ls.label}
                      </button>
                    )
                  })}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>House:</span>
                <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {Array.from({length: 12}).map((_, i) => {
                    const id = `h${i+1}`
                    const active = lagnaSource === id
                    return (
                      <button
                        key={id} onClick={() => setLagnaSource(id)}
                        style={{
                          width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.7rem', borderRadius: '4px', border: '1px solid', cursor: 'pointer',
                          fontFamily: 'var(--font-mono)',
                          background: active ? 'var(--gold-faint)' : 'transparent',
                          borderColor: active ? 'var(--gold)' : 'var(--border-soft)',
                          color: active ? 'var(--gold)' : 'var(--text-muted)',
                          fontWeight: active ? 700 : 400
                        }}
                      >
                        {i+1}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          <div style={{ height: '1px', background: 'var(--border-soft)' }} />
          {/* Advanced Typography Scales */}
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 700 }}>TYPOGRAPHY:</span>
            <ScaleSlider label="Chart Size" value={chartScale} onChange={setChartScale} />
            <ScaleSlider label="Base Scale" value={fontScale} onChange={setFontScale} />
            <ScaleSlider label="Planets" value={planetScale} onChange={setPlanetScale} />
            <ScaleSlider label="Details" value={infoScale} onChange={setInfoScale} />
            <ScaleSlider label="Āruḍha" value={arudhaScale} onChange={setArudhaScale} />
          </div>
        </div>
      )}

      {/* ── Chart ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', overflow: 'hidden' }}>
        {style === 'south' && (
          <SouthIndianChakra
            ascRashi={effectiveAscRashi}
            grahas={showNatal ? displayGrahas : []}
            arudhas={arudhas}
            transitGrahas={transitGrahas}
            comparisonGrahas={displayComparison}
            showArudha={showArudha}
            size={Math.round(size * chartScale)}
            showDegrees={showDegrees}
            showNakshatra={showNakshatra}
            showKaraka={showKaraka}
            fontScale={fontScale}
            planetScale={planetScale}
            infoScale={infoScale}
            arudhaScale={arudhaScale}
            lagnas={displayLagnas}
            highlightHouses={highlightHouses}
            showTooltip={showTooltip}
          />
        )}
        {style === 'north' && (
          <NorthIndianChakra
            ascRashi={effectiveAscRashi}
            grahas={showNatal ? displayGrahas : []}
            arudhas={showArudha ? arudhas : undefined}
            transitGrahas={transitGrahas}
            comparisonGrahas={displayComparison}
            size={Math.round(size * chartScale)}
            showDegrees={showDegrees}
            showNakshatra={showNakshatra}
            showKaraka={showKaraka}
            fontScale={fontScale}
            planetScale={planetScale}
            infoScale={infoScale}
            arudhaScale={arudhaScale}
            lagnas={displayLagnas}
            highlightHouses={highlightHouses}
            showTooltip={showTooltip}
          />
        )}
        {style === 'sarvatobhadra' && (
          <SarvatobhadraChakra
            grahas={showNatal ? displayGrahas : []}
            moonNakIndex={moonNakIndex}
            tithiNumber={tithiNumber}
            varaNumber={varaNumber}
            size={Math.round(size * chartScale)}
            showTithi={showTithi}
            showVara={showVara}
            fontScale={fontScale}
          />
        )}

        {style === 'circle' && (
          <CircleChakra
            ascRashi={effectiveAscRashi} grahas={showNatal ? displayGrahas : []}
            size={Math.round(size * chartScale)}
            showDegrees={showDegrees} showNakshatra={showNakshatra}
            showKaraka={showKaraka} showArudha={showArudha}
            arudhas={arudhas} transitGrahas={transitGrahas}
            comparisonGrahas={displayComparison}
            fontScale={fontScale} planetScale={planetScale}
            lagnas={displayLagnas}
            showTooltip={showTooltip}
          />
        )}

      </div>

      {/* ── Legend ────────────────────────────────────────── */}
      {showLegend && !isSBC && (
        <div style={{
          display: 'flex', gap: '1rem', flexWrap: 'wrap',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--border-soft)',
        }}>
          {[
            { color: 'var(--dig-exalted)', label: 'Exalted' },
            { color: 'var(--dig-moola)', label: 'Moolatrikona' },
            { color: 'var(--dig-own)', label: 'Own sign' },
            { color: 'var(--dig-neutral)', label: 'Neutral' },
            { color: 'var(--dig-retro)', label: 'Retrograde (ᴿ)' },
            { color: 'var(--dig-debilitate)', label: 'Debilitated' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: color, display: 'inline-block', flexShrink: 0,
              }} />
              <span style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-chart-planets)',
              }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* SBC legend */}
      {showLegend && isSBC && (
        <div style={{
          display: 'flex', gap: '1.25rem', flexWrap: 'wrap',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--border-soft)',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-chart-planets)',
          color: 'var(--text-muted)',
        }}>
          <span><span style={{ color: 'rgba(208,232,240,0.7)' }}>■</span> Moon nakshatra</span>
          <span><span style={{ color: 'rgba(180,140,220,0.7)' }}>■</span> Current tithi</span>
          <span><span style={{ color: 'rgba(100,210,160,0.7)' }}>■</span> Vara lord</span>
          <span>Outer ring: 27 nakshatras · Second: tithis · Third: vara lords · Inner: aksharas</span>
        </div>
      )}
    </div>
  )
}

// ── Toggle widget ─────────────────────────────────────────────

function Toggle({
  label, value, onChange,
}: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: '0.35rem',
      cursor: 'pointer', userSelect: 'none',
    }}>
      <span style={{
        width: 30, height: 16, borderRadius: 8,
        background: value ? 'var(--gold-faint)' : 'var(--surface-3)',
        border: '1px solid',
        borderColor: value ? 'var(--gold)' : 'var(--border)',
        position: 'relative', display: 'inline-block',
        transition: 'background 0.2s, border-color 0.2s',
        flexShrink: 0,
      }}>
        <span style={{
          position: 'absolute', top: 2, left: value ? 13 : 2,
          width: 10, height: 10, borderRadius: '50%',
          background: value ? 'var(--gold)' : 'var(--text-muted)',
          transition: 'left 0.15s',
        }} />
      </span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
        style={{ display: 'none' }}
      />
      <span style={{
        fontSize: '0.78rem',
        color: value ? 'var(--gold)' : 'var(--text-muted)',
        fontFamily: 'Cormorant Garamond, serif',
        letterSpacing: '0.03em',
        transition: 'color 0.15s',
      }}>
        {label}
      </span>
    </label>
  )
}

function ScaleSlider({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '60px' }}>{label}</span>
      <input 
        type="range" min="0.6" max="1.8" step="0.05" 
        value={value} 
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '70px', accentColor: 'var(--gold)' }}
      />
      <span style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)', width: '25px' }}>
        {value.toFixed(2)}
      </span>
    </div>
  )
}

function SettingsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  )
}
