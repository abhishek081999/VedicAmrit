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
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: isMobile ? '2rem 1rem' : '4rem 2rem', minHeight: '80vh' }}>
        <div className="card glass-glow" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: isMobile ? '2rem' : '3.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ 
            position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', 
            background: 'radial-gradient(circle at center, var(--gold-faint) 0%, transparent 70%)',
            zIndex: -1, opacity: 0.5
          }} />
          <div style={{ fontSize: isMobile ? '3.5rem' : '4.5rem', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 20px var(--gold-glow))' }}>🌍</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.8rem' : '2.2rem', color: 'var(--text-gold)', marginBottom: '1rem', fontWeight: 700 }}>Birth Data Required</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: 1.6, fontSize: '1rem' }}>
            Astrocartography uses your precise birth moment to map planetary power lines across the globe. Enter your details to begin your relocation journey.
          </p>
          <Link href="/?new=true" className="btn btn-primary" style={{ padding: '0.85rem 2.5rem', textDecoration: 'none', fontSize: '1rem' }}>
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
      gap: isMobile ? '1rem' : '2rem', 
      padding: isMobile ? '1rem' : '2.5rem',
      position: 'relative'
    }}>
      {/* Background Decor */}
      <div style={{ 
        position: 'absolute', top: 0, right: 0, width: '40%', height: '400px', 
        background: 'radial-gradient(ellipse at top right, var(--gold-faint) 0%, transparent 70%)',
        zIndex: -1, pointerEvents: 'none', opacity: 0.6
      }} />

      <header style={{ marginBottom: isMobile ? '0.5rem' : '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <span className="badge-accent" style={{ padding: '0.25rem 0.75rem', fontSize: '0.65rem' }}>Phase 8 — Advanced Core</span>
          <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, var(--border-bright), transparent)' }} />
          <span className="label-caps" style={{ color: 'var(--gold)', letterSpacing: '0.2em' }}>Precision Mapping</span>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem' }}>
          <div>
            <h1 style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: isMobile ? '2rem' : '3.2rem', 
              fontWeight: 800, 
              margin: 0,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(to bottom, var(--text-primary), var(--text-secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Global Horizon Mapping
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem', maxWidth: '700px', fontSize: isMobile ? '0.95rem' : '1.15rem', lineHeight: 1.5 }}>
              Decrypt the celestial blueprint across terrestrial space. Discover locations where your planetary potential reaches its zenith.
            </p>
          </div>
          
          {!isMobile && (
            <div style={{ display: 'flex', gap: '1.5rem', padding: '1rem 1.25rem', borderLeft: '2px solid var(--gold-faint)', background: 'var(--surface-1)', borderRadius: '12px' }}>
                <StatItem label="Active Layers" value={selectedPlanets.size} />
                <StatItem label="Planet Lines" value={selectedPlanets.size * 4} />
                <StatItem label="Crossings" value={activeParans.length} />
            </div>
          )}
        </div>
      </header>

      <main style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', 
        gap: isMobile ? '1.5rem' : '2.5rem', 
        alignItems: 'start' 
      }}>
        <div className="card glass" style={{ 
          padding: '0.35rem', 
          overflow: 'hidden', 
          height: isMobile ? '600px' : '820px', 
          border: '1px solid var(--border-bright)',
          boxShadow: 'var(--shadow-lift)',
          position: 'relative'
        }}>
          <AstroCartographyMap 
            jd={chart.meta.julianDay} 
            birthCoords={[chart.meta.latitude, chart.meta.longitude]} 
            onVisiblePlanetsChange={handlePlanetsChange}
          />
        </div>
        <aside 
          className="acg-side-scroll"
          style={{ 
            position: isMobile ? 'static' : 'sticky', 
            top: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            maxHeight: isMobile ? 'none' : 'calc(100vh - 5rem)',
            overflowY: isMobile ? 'visible' : 'auto',
            paddingRight: isMobile ? 0 : '0.5rem'
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            .acg-side-scroll::-webkit-scrollbar { width: 4px; }
            .acg-side-scroll::-webkit-scrollbar-track { background: transparent; }
            .acg-side-scroll::-webkit-scrollbar-thumb { background: var(--gold-faint); border-radius: 10px; }
          ` }} />
          <AstroCartographyAnalysis 
            visiblePlanets={selectedPlanets} 
            parans={activeParans}
            natalData={natalData}
          />
          
          <div className="card-gold" style={{ padding: '1.1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>💡</span>
            <div>
              <p style={{ margin: 0, color: 'var(--text-on-gold)', fontWeight: 700, fontSize: '0.82rem' }}>Relocation Intelligence</p>
              <p style={{ margin: '0.3rem 0 0', color: 'var(--text-on-gold)', opacity: 0.82, fontSize: '0.73rem', lineHeight: 1.45 }}>
                Click anywhere on the map to instantly see your relocated Ascendant, nearest planetary line, and life-area interpretation for that location.
              </p>
            </div>
          </div>
        </aside>
      </main>

      {isMobile && (
        <footer style={{ marginTop: '1rem', padding: '1rem', textAlign: 'center', opacity: 0.6 }}>
           <p className="label-caps" style={{ fontSize: '0.6rem' }}>© Vedaansh Relocation Suite</p>
        </footer>
      )}
    </div>
  )
}

function StatItem({ label, value }: { label: string, value: number | string }) {
    return (
        <div style={{ textAlign: 'right' }}>
            <div className="label-caps" style={{ fontSize: '0.6rem', marginBottom: '0.2rem' }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>{value}</div>
        </div>
    )
}

