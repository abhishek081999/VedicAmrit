'use client'
import React from 'react'
import dynamic from 'next/dynamic'
import { useChart } from '@/components/providers/ChartProvider'

const JaiminiPanel = dynamic(() => import('@/components/ui/JaiminiPanel'), { ssr: false })

export default function JaiminiPage() {
  const { chart, setIsFormOpen } = useChart()

  if (!chart) {
    return (
      <div style={{ 
        flex: 1, display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', 
        gap: '1.5rem', padding: '6rem 2rem', textAlign: 'center' 
      }}>
        <div style={{ fontSize: '3rem', opacity: 0.5 }}>💠</div>
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-gold)', fontWeight: 500 }}>Jaimini Astrology</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: 450, fontSize: '0.95rem' }}>
          Please load or create a birth chart to access Jaimini-specific intelligence, including Chara Dashas, Karakas, and Arudhas.
        </p>
        <button onClick={() => setIsFormOpen(true)} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
          ✦ Open Birth Form
        </button>
      </div>
    )
  }

  return (
    <div className="main-responsive-padding fade-up" style={{ minWidth: 0, padding: 'clamp(1rem, 3vw, 2rem)' }}>
      <div className="card" style={{ padding: '1.25rem', width: '100%' }}>
        <JaiminiPanel chart={chart} />
      </div>
    </div>
  )
}
