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
import { EastIndianChakra }      from './EastIndianChakra'
import { SarvatobhadraChakra }   from './SarvatobhadraChakra'
import { CircleChakra }          from './CircleChakra'
import { BhavaChakra }           from './BhavaChakra'
import type { GrahaData, Rashi, ChartStyle, ArudhaData, LagnaData } from '@/types/astrology'

// ── Props ─────────────────────────────────────────────────────

interface ChakraSelectorProps {
  ascRashi:     Rashi
  grahas:       GrahaData[]
  // Panchang data — needed for Sarvatobhadra
  moonNakIndex?: number    // 0–26
  arudhas?:     ArudhaData  // for Āruḍha overlay
  transitGrahas?: GrahaData[]  // transit planet overlay
  tithiNumber?:  number    // 1–30
  varaNumber?:   number    // 0=Sun … 6=Sat
  lagnas?:       LagnaData
  defaultStyle?: ChartStyle
  size?:         number
  userPlan?:     'kala' | 'vela' | 'hora'
}

// ── Style definitions ─────────────────────────────────────────

const STYLES: { id: ChartStyle; label: string; shortLabel: string; description: string; tier?: string }[] = [
  { id: 'north',         label: 'North Indian',  shortLabel: 'North',   description: 'Houses fixed, signs rotate' },
  { id: 'south',         label: 'South Indian',  shortLabel: 'South',   description: 'Signs fixed, houses rotate' },
  { id: 'east',          label: 'East Indian',   shortLabel: 'East',    description: 'Bengali / Odisha fixed-sign grid' },
  { id: 'sarvatobhadra', label: 'Sarvatobhadra', shortLabel: 'SBC',     description: '9×9 nakshatra wheel' },
  { id: 'circle',        label: 'Circle Wheel',  shortLabel: 'Circle',  description: '12 equal slices, ascendant at 9 o\'clock' },
  { id: 'bhava',         label: 'Bhava Chakra',  shortLabel: 'Bhava',   description: 'Unequal houses from actual Placidus cusps', tier: 'vela' },
  { id: 'bhava_chalita', label: 'Bhava Chalita', shortLabel: 'Chalita', description: 'Sripati Bhava Chalita midpoint wheel',       tier: 'vela' },
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
  userPlan     = 'kala',
  transitGrahas = [],
}: ChakraSelectorProps) {
  const [style,         setStyle]         = useState<ChartStyle>(defaultStyle)
  const [showDegrees,   setShowDegrees]   = useState(true)
  const [showNakshatra, setShowNakshatra] = useState(false)
  const [showKaraka,    setShowKaraka]    = useState(false)
  const [showArudha,    setShowArudha]    = useState(false)
  const [showTithi,     setShowTithi]     = useState(true)
  const [showVara,      setShowVara]      = useState(true)
  const [onlyNine,      setOnlyNine]      = useState(true)

  // Typography scaling
  const [fontScale,     setFontScale]     = useState(1.10)
  const [planetScale,   setPlanetScale]   = useState(1.05)
  const [arudhaScale,   setArudhaScale]   = useState(1.20)
  const [infoScale,     setInfoScale]     = useState(0.80)
  const [chartScale,    setChartScale]    = useState(1.0)
  
  const [showSettings,  setShowSettings]  = useState(false)

  // Use smaller scale on mobile initially
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setChartScale(0.9)
    }
  }, [])

  const isSBC = style === 'sarvatobhadra'

  // Filter 9 planets vs All
  const displayGrahas = onlyNine 
    ? grahas.filter(g => !['Ur', 'Ne', 'Pl'].includes(g.id))
    : grahas

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      {/* ── Style switcher ─────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: '0.375rem', alignItems: 'center',
        flexWrap: 'wrap',
        borderBottom: '1px solid var(--border-soft)',
        paddingBottom: '0.75rem',
      }}>
        {STYLES.map((s) => {
          const active = style === s.id
          const locked = s.tier === 'vela' && userPlan === 'kala'
          return (
            <button
              key={s.id}
              onClick={() => locked ? (window.location.href = '/pricing') : setStyle(s.id as ChartStyle)}
              title={locked ? `${s.label} — requires Velā plan` : s.description}
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.8rem',
                fontFamily: 'Cormorant Garamond, serif',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                border: '1px solid',
                borderRadius: '4px',
                transition: 'all 0.15s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                opacity: locked ? 0.55 : 1,
                background: active ? 'var(--gold-faint)' : 'transparent',
                borderColor: active ? 'var(--gold)' : locked ? 'var(--border-soft)' : 'var(--border)',
                color: active ? 'var(--gold)' : 'var(--text-muted)',
              }}
            >
              {locked && <span style={{ fontSize: '0.6rem' }}>🔒</span>}
              {s.shortLabel}
            </button>
          )
        })}

        <div style={{ flex: 1 }} />

        {/* ── Config toggles ──────────────────────────────── */}
        <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {!isSBC && (
            <>
              <Toggle label="9 Planets"   value={onlyNine}   onChange={setOnlyNine} />
              <Toggle label="Degrees"   value={showDegrees}   onChange={setShowDegrees} />
              <Toggle label="Nakshatra" value={showNakshatra} onChange={setShowNakshatra} />
              {userPlan !== 'kala' && (
                <Toggle label="Karaka" value={showKaraka} onChange={setShowKaraka} />
              )}
              {arudhas && (
                <Toggle label="Āruḍha" value={showArudha} onChange={setShowArudha} />
              )}
            </>
          )}
          {isSBC && (
            <>
              <Toggle label="Tithi"  value={showTithi} onChange={setShowTithi} />
              <Toggle label="Vara"   value={showVara}  onChange={setShowVara} />
            </>
          )}

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              marginLeft: '0.5rem', padding: '0.2rem 0.6rem',
              fontSize: '0.8rem', cursor: 'pointer',
              background: showSettings ? 'var(--gold-faint)' : 'transparent',
              border: '1px solid',
              borderColor: showSettings ? 'var(--gold)' : 'var(--border)',
              borderRadius: '4px', color: showSettings ? 'var(--gold)' : 'var(--text-muted)'
            }}
            title="Advanced Typography Settings"
          >
            ⚙ Text Scales
          </button>
        </div>
      </div>

        {/* ── Advanced Settings Panel ───────────────────────── */}
        {showSettings && (
          <div style={{
            padding: '0.75rem 1rem', background: 'var(--surface-2)', 
            borderRadius: '6px', border: '1px solid var(--border-soft)',
            display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <ScaleSlider label="Chart Size" value={chartScale} onChange={setChartScale} />
            <ScaleSlider label="Base Scale" value={fontScale} onChange={setFontScale} />
            <ScaleSlider label="Planets" value={planetScale} onChange={setPlanetScale} />
            <ScaleSlider label="Details" value={infoScale} onChange={setInfoScale} />
            <ScaleSlider label="Āruḍha" value={arudhaScale} onChange={setArudhaScale} />
          </div>
        )}

      {/* ── Chart ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', overflow: 'hidden' }}>
        {style === 'south' && (
          <SouthIndianChakra
            ascRashi={ascRashi}
            grahas={displayGrahas}
            arudhas={arudhas}
            transitGrahas={transitGrahas}
            showArudha={showArudha}
            size={Math.round(size * chartScale)}
            showDegrees={showDegrees}
            showNakshatra={showNakshatra}
            showKaraka={showKaraka}
            fontScale={fontScale}
            planetScale={planetScale}
            infoScale={infoScale}
            arudhaScale={arudhaScale}
          />
        )}
        {style === 'north' && (
          <NorthIndianChakra
            ascRashi={ascRashi}
            grahas={displayGrahas}
            arudhas={showArudha ? arudhas : undefined}
            transitGrahas={transitGrahas}
            size={Math.round(size * chartScale)}
            showDegrees={showDegrees}
            showNakshatra={showNakshatra}
            showKaraka={showKaraka}
            fontScale={fontScale}
            planetScale={planetScale}
            infoScale={infoScale}
            arudhaScale={arudhaScale}
          />
        )}
        {style === 'east' && (
          <EastIndianChakra
            ascRashi={ascRashi}
            grahas={displayGrahas}
            size={Math.round(size * chartScale)}
            showDegrees={showDegrees}
            showNakshatra={showNakshatra}
            showKaraka={showKaraka}
          />
        )}

        {style === 'sarvatobhadra' && (
          <SarvatobhadraChakra
            grahas={displayGrahas}
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
            ascRashi={ascRashi} grahas={displayGrahas}
            size={Math.round(size * chartScale)}
            showDegrees={showDegrees} showNakshatra={showNakshatra}
            showKaraka={showKaraka} showArudha={showArudha}
            arudhas={arudhas} transitGrahas={transitGrahas}
            fontScale={fontScale} planetScale={planetScale}
          />
        )}
        {(style === 'bhava' || style === 'bhava_chalita') && lagnas && (
          <BhavaChakra
            ascRashi={ascRashi} ascDegree={lagnas.ascDegree}
            cusps={style === 'bhava_chalita' ? lagnas.bhavalCusps : lagnas.cusps}
            grahas={displayGrahas} size={Math.round(size * chartScale)}
            showDegrees={showDegrees} showNakshatra={showNakshatra}
            showKaraka={showKaraka} showArudha={showArudha}
            arudhas={arudhas} transitGrahas={transitGrahas}
            fontScale={fontScale} planetScale={planetScale}
            showCuspDegrees={showDegrees}
            label={style === 'bhava_chalita' ? 'Bhava Chalita' : 'Bhava Chakra'}
          />
        )}
        {(style === 'bhava' || style === 'bhava_chalita') && !lagnas && (
          <div style={{padding:'2rem',textAlign:'center',color:'var(--text-muted)',fontSize:'0.85rem'}}>
            Bhava Chakra requires chart data.
          </div>
        )}
      </div>

      {/* ── Legend ────────────────────────────────────────── */}
      {!isSBC && (
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
                fontFamily: 'Cormorant Garamond, serif',
              }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* SBC legend */}
      {isSBC && (
        <div style={{
          display: 'flex', gap: '1.25rem', flexWrap: 'wrap',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--border-soft)',
          fontSize: '0.75rem',
          fontFamily: 'Cormorant Garamond, serif',
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