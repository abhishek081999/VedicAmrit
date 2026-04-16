'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { useChart } from '@/components/providers/ChartProvider'
import Link from 'next/link'

const AstroVastuPanel = dynamic(() => import('@/components/ui/AstroVastuPanel').then(m => m.AstroVastuPanel), { ssr: false })

export default function VastuPage() {
  const { chart } = useChart()

  if (!chart) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
        <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🏠</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--text-gold)', marginBottom: '1rem' }}>Birth Data Required</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Astro-Vastu calculates the alignment of your natal planets with the 16 directions of your living space. 
            We need your birth chart to begin.
          </p>
          <Link href="/?new=true" className="btn btn-primary" style={{ padding: '0.75rem 2rem', textDecoration: 'none' }}>
            Enter Birth Details
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-up" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '1.5rem', 
      padding: 'var(--spacing-md, 1rem)',
      maxWidth: '1400px',
      margin: '0 auto',
      width: '100%'
    }}>
      <header style={{ padding: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <span className="badge-accent">Advance Module</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-gold)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Space & Time Alignment</span>
        </div>
        <h1 style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', 
          fontWeight: 700, 
          margin: 0,
          lineHeight: 1.2
        }}>
          Astro-Vastu Intelligence
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem', maxWidth: '800px', fontSize: 'clamp(0.95rem, 2vw, 1.1rem)', lineHeight: 1.6 }}>
          Analyze the 45 Deities of the Vastu Purusha Mandala and the 16 Zonal Strengths specifically mapped to your unique planetary signature.
        </p>
      </header>

      <div className="card" style={{ padding: 'clamp(1rem, 3vw, 2rem)', overflow: 'hidden' }}>
        <AstroVastuPanel chart={chart} />
      </div>

      <footer style={{ 
        marginTop: '1rem', 
        padding: 'clamp(1.25rem, 4vw, 2rem)', 
        background: 'var(--surface-2)', 
        borderRadius: 'var(--r-md)', 
        border: '1px solid var(--border-soft)' 
      }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-gold)', marginBottom: '1rem' }}>Vedic Directional Wisdom</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
          Astro-Vastu is the bridge between the micro-cosmos (your horoscope) and the macro-cosmos (your environment). 
          By balancing the elements (Pancha Bhootas) based on your strongest and weakest planets, you create a resonance that 
          amplifies prosperity and well-being.
        </p>
      </footer>
    </div>
  )
}
