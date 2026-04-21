'use client'
import React from 'react'
import dynamic from 'next/dynamic'
import { useChart } from '@/components/providers/ChartProvider'
import { useAppLayout } from '@/components/providers/LayoutProvider'

const NakshatraPanel = dynamic(() => import('@/components/ui/NakshatraPanel').then(m => m.NakshatraPanel), { ssr: false })

export default function NakshatraPage() {
  const { chart, setIsFormOpen } = useChart()
  const { activeTab } = useAppLayout()

  // If no chart is loaded, show a prompt
  if (!chart) {
    return (
      <div style={{ 
        flex: 1, display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', 
        gap: '1.5rem', padding: '6rem 2rem', textAlign: 'center' 
      }}>
        <div style={{ fontSize: '3rem', opacity: 0.5 }}>🌙</div>
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-gold)', fontWeight: 500 }}>Nakṣatra Intelligence</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: 450, fontSize: '0.95rem' }}>
          Please load or create a birth chart to access personalized nakshatra analysis, including Navtara, Muhurta compatibility, and remedies.
        </p>
        <button onClick={() => setIsFormOpen(true)} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
          ✦ Open Birth Form
        </button>
      </div>
    )
  }

  // Default to overview for the root path
  const subTab = 'overview'

  return (
    <div className="main-responsive-padding fade-up" style={{ minWidth: 0, padding: 'clamp(1rem, 3vw, 2rem)' }}>
      <div className="card" style={{ padding: '1.25rem', width: '100%' }}>
        <NakshatraPanel 
          chart={chart} 
          initialTab={subTab as any} 
        />
      </div>
    </div>
  )
}
