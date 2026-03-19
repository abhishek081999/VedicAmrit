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
import type { GrahaData, Rashi, ChartStyle, ArudhaData } from '@/types/astrology'

// ── Props ─────────────────────────────────────────────────────

interface ChakraSelectorProps {
  ascRashi:     Rashi
  grahas:       GrahaData[]
  // Panchang data — needed for Sarvatobhadra
  moonNakIndex?: number    // 0–26
  arudhas?:     ArudhaData  // for Āruḍha overlay
  tithiNumber?:  number    // 1–30
  varaNumber?:   number    // 0=Sun … 6=Sat
  defaultStyle?: ChartStyle
  size?:         number
  userPlan?:     'kala' | 'vela' | 'hora'
}

// ── Style definitions ─────────────────────────────────────────

const STYLES: { id: ChartStyle; label: string; shortLabel: string; description: string }[] = [
  { id: 'north',         label: 'North Indian',  shortLabel: 'North', description: 'Houses fixed, signs rotate' },
  { id: 'south',         label: 'South Indian',  shortLabel: 'South', description: 'Signs fixed, houses rotate' },
  { id: 'sarvatobhadra', label: 'Sarvatobhadra', shortLabel: 'SBC',   description: '9×9 nakshatra wheel' },
]



// ── Component ─────────────────────────────────────────────────

export function ChakraSelector({
  ascRashi,
  grahas,
  moonNakIndex = 0,
  arudhas,
  tithiNumber  = 1,
  varaNumber   = 0,
  defaultStyle = 'north',
  size         = 480,
  userPlan     = 'kala',
}: ChakraSelectorProps) {
  const [style,         setStyle]         = useState<ChartStyle>(defaultStyle)
  const [showDegrees,   setShowDegrees]   = useState(true)
  const [showNakshatra, setShowNakshatra] = useState(false)
  const [showKaraka,    setShowKaraka]    = useState(false)
  const [showArudha,    setShowArudha]    = useState(false)
  const [showTithi,     setShowTithi]     = useState(true)
  const [showVara,      setShowVara]      = useState(true)

  const isSBC = style === 'sarvatobhadra'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      {/* ── Style switcher ─────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: '0.375rem', alignItems: 'center',
        flexWrap: 'wrap',
        borderBottom: '1px solid rgba(201,168,76,0.15)',
        paddingBottom: '0.75rem',
      }}>
        {STYLES.map((s) => {
          const active = style === s.id
          return (
            <button
              key={s.id}
              onClick={() => setStyle(s.id as ChartStyle)}
              title={s.description}
              style={{
                padding: '0.3rem 0.75rem',
                fontSize: '0.82rem',
                fontFamily: 'Cormorant Garamond, serif',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                border: '1px solid',
                borderRadius: '4px',
                transition: 'all 0.15s',
                background: active ? 'rgba(201,168,76,0.15)' : 'transparent',
                borderColor: active ? 'rgba(201,168,76,0.5)' : 'rgba(201,168,76,0.2)',
                color: active ? 'rgba(201,168,76,0.9)' : 'rgba(201,168,76,0.45)',
              }}
            >
              {s.shortLabel}
            </button>
          )
        })}

        <div style={{ flex: 1 }} />

        {/* ── Config toggles ──────────────────────────────── */}
        <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {!isSBC && (
            <>
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
        </div>
      </div>

      {/* ── Chart ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {style === 'south' && (
          <SouthIndianChakra
            ascRashi={ascRashi}
            grahas={grahas}
            arudhas={arudhas}
            showArudha={showArudha}
            size={size}
            showDegrees={showDegrees}
            showNakshatra={showNakshatra}
            showKaraka={showKaraka}
          />
        )}
        {style === 'north' && (
          <NorthIndianChakra
            ascRashi={ascRashi}
            grahas={grahas}
            arudhas={showArudha ? arudhas : undefined}
            size={size}
            showDegrees={showDegrees}
            showNakshatra={showNakshatra}
            showKaraka={showKaraka}
          />
        )}

        {style === 'sarvatobhadra' && (
          <SarvatobhadraChakra
            grahas={grahas}
            moonNakIndex={moonNakIndex}
            tithiNumber={tithiNumber}
            varaNumber={varaNumber}
            size={size}
            showTithi={showTithi}
            showVara={showVara}
          />
        )}
      </div>

      {/* ── Legend ────────────────────────────────────────── */}
      {!isSBC && (
        <div style={{
          display: 'flex', gap: '1rem', flexWrap: 'wrap',
          paddingTop: '0.5rem',
          borderTop: '1px solid rgba(201,168,76,0.1)',
        }}>
          {[
            { color: '#4ecdc4', label: 'Exalted' },
            { color: '#c9a84c', label: 'Moolatrikona' },
            { color: '#e2c97e', label: 'Own sign' },
            { color: '#c8c0e0', label: 'Neutral' },
            { color: '#d4788a', label: 'Retrograde (ᴿ)' },
            { color: '#e07070', label: 'Debilitated' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: color, display: 'inline-block', flexShrink: 0,
              }} />
              <span style={{
                fontSize: '0.75rem',
                color: 'rgba(184,176,212,0.55)',
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
          borderTop: '1px solid rgba(201,168,76,0.1)',
          fontSize: '0.75rem',
          fontFamily: 'Cormorant Garamond, serif',
          color: 'rgba(184,176,212,0.55)',
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
        background: value ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.08)',
        border: '1px solid',
        borderColor: value ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.12)',
        position: 'relative', display: 'inline-block',
        transition: 'background 0.2s, border-color 0.2s',
        flexShrink: 0,
      }}>
        <span style={{
          position: 'absolute', top: 2, left: value ? 13 : 2,
          width: 10, height: 10, borderRadius: '50%',
          background: value ? 'rgba(201,168,76,0.95)' : 'rgba(184,176,212,0.4)',
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
        color: value ? 'rgba(201,168,76,0.75)' : 'rgba(184,176,212,0.4)',
        fontFamily: 'Cormorant Garamond, serif',
        letterSpacing: '0.03em',
        transition: 'color 0.15s',
      }}>
        {label}
      </span>
    </label>
  )
}