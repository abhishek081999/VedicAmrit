'use client'

import React, { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useChart } from '@/components/providers/ChartProvider'
import Link from 'next/link'

const AstroCartographyMap = dynamic(() => import('@/components/ui/AstroCartographyMap'), { ssr: false })
const AstroCartographyAnalysis = dynamic(() => import('@/components/ui/AstroCartographyAnalysis').then(m => m.AstroCartographyAnalysis), { ssr: false })

export default function ACGPage() {
  const { chart } = useChart()
  const [selectedPlanets, setSelectedPlanets] = useState<Set<any>>(new Set(['Su', 'Mo', 'Ju', 'Ve']))
  const [activeParans, setActiveParans] = useState<any[]>([])
  const [natalData, setNatalData] = useState<any[]>([])
  const [isMobile, setIsMobile] = useState(false)

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handlePlanetsChange = useCallback((planets: Set<any>, parans: any[], rawNatal?: any[]) => {
    setSelectedPlanets(planets)
    setActiveParans(parans)
    if (rawNatal) setNatalData(rawNatal)
  }, [])

  if (!chart) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: isMobile ? '2rem 1rem' : '4rem 2rem' }}>
        <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: isMobile ? '2rem' : '3rem' }}>
          <div style={{ fontSize: isMobile ? '3rem' : '4rem', marginBottom: '1.5rem' }}>🌍</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.5rem' : '1.8rem', color: 'var(--text-gold)', marginBottom: '1rem' }}>Birth Data Required</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6, fontSize: '0.9rem' }}>
            Astrocartography requires your exact birth coordinates to map your personal power lines across the globe.
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
      gap: isMobile ? '1.5rem' : '2rem', 
      padding: isMobile ? '1rem' : '2rem' 
    }}>
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="badge-accent">Premium Module</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-gold)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Relocation Intelligence</span>
        </div>
        <h1 style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: isMobile ? '1.8rem' : '2.5rem', 
          fontWeight: 700, 
          margin: 0,
          lineHeight: 1.2
        }}>
          Global Horizon Mapping
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', maxWidth: '800px', fontSize: isMobile ? '0.95rem' : '1.1rem' }}>
          Explore how planetary positions resonate with different locations worldwide.
        </p>
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', 
        gap: '2rem', 
        alignItems: 'start' 
      }}>
        <div className="card" style={{ 
          padding: '0.5rem', 
          overflow: 'hidden', 
          height: isMobile ? '550px' : '750px', 
          border: '1px solid var(--gold-faint)' 
        }}>
          <AstroCartographyMap 
            jd={chart.meta.julianDay} 
            birthCoords={[chart.meta.latitude, chart.meta.longitude]} 
            onVisiblePlanetsChange={handlePlanetsChange}
          />
        </div>
        <aside style={{ 
          position: isMobile ? 'static' : 'sticky', 
          top: '2rem' 
        }}>
          <AstroCartographyAnalysis 
            visiblePlanets={selectedPlanets} 
            parans={activeParans}
            natalData={natalData}
          />
        </aside>
      </div>

      <footer className="card-primary" style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--gold-faint)' }}>
        <p style={{ margin: 0, color: 'var(--text-on-gold)', fontWeight: 500, fontSize: isMobile ? '0.85rem' : '1rem' }}>
          💡 <strong>Pro Tip:</strong> Click any city on the map to see how your Rising Sign (Lagna) shifts.
        </p>
      </footer>
    </div>
  )
}
