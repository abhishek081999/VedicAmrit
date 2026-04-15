'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAppLayout } from '@/components/providers/LayoutProvider'
import { useChart } from '@/components/providers/ChartProvider'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const TOP_TABS: { id: string; label: string; icon: string; path?: string }[] = [
  { id: 'dashboard', label: 'Dashboard',   icon: '◫', path: '/' },
]

const NAKSHATRA_TABS: { id: string; label: string; icon: string; path?: string }[] = [
  { id: 'nakshatra-overview', label: 'Overview',  icon: '🌟', path: '/' },
  { id: 'nakshatra-navtara',  label: 'Navtara',   icon: '🔯', path: '/' },
  { id: 'nakshatra-bestdays', label: 'Best Days', icon: '📅', path: '/' },
  { id: 'nakshatra-muhurta',  label: 'Muhurta',   icon: '⚡', path: '/' },
  { id: 'nakshatra-panchaka', label: 'Panchaka',  icon: '🔥', path: '/' },
  { id: 'nakshatra-planet',   label: 'Planet',    icon: '✦', path: '/' },
  { id: 'nakshatra-compat',   label: 'Compat',    icon: '🔗', path: '/' },
  { id: 'nakshatra-remedies', label: 'Remedies',  icon: '🙏', path: '/' },
]

const ASTRO_GROUPS: { label: string; tabs: { id: string; label: string; icon: string; path?: string }[] }[] = [
  {
    label: 'Core Analysis',
    tabs: [
      { id: 'planets',   label: 'Planets',     icon: '✦', path: '/' },
      { id: 'dasha',     label: 'Daśā',        icon: '⏳', path: '/' },
      { id: 'house',     label: 'House',       icon: '🏠', path: '/' },
      { id: 'yogas',     label: 'Yogas',       icon: '✧', path: '/' },
      { id: 'kp-stellar', label: 'Stellar (KP)', icon: '⭐', path: '/' },
      { id: 'interpretation', label: 'Interpretation', icon: '✧', path: '/' },
    ]
  },
  {
    label: 'Predictive Timing',
    tabs: [
      { id: 'varshaphal', label: 'Solar Return (Varshfal)', icon: '☀️', path: '/' },
      { id: 'transit-scrubber', label: 'Time Scrubber', icon: '⏳', path: '/' },
      { id: 'roadmap',   label: 'Cosmic Roadmap', icon: '🛣️', path: '/' },
    ]
  },
  {
    label: 'Strength & Analytics',
    tabs: [
      { id: 'ashtakavarga', label: 'Aṣṭakavarga',  icon: '⬡', path: '/' },
      { id: 'shadbala',  label: 'Ṣaḍbala',      icon: '⚖', path: '/' },
      { id: 'bhava-bala', label: 'Bhāva Bala',   icon: '⌗', path: '/' },
      { id: 'vimsopaka',  label: 'Viṁśopaka',    icon: '⑳', path: '/' },
    ]
  },
  {
    label: 'Calculations',
    tabs: [
      { id: 'panchang',  label: 'Natal Pañcāṅga', icon: '📅', path: '/' },
      { id: 'astro-carto', label: 'Astro-Cartography', icon: '🌍', path: '/' },
    ]
  }
]

const PANCHANG_TABS: { id: string; label: string; icon: string; path?: string }[] = [
  { id: 'daily-panchang',   label: 'Daily Pañcāṅga',        icon: '📅', path: '/panchang' },
  { id: 'monthly-panchang', label: 'Monthly Calendar',       icon: '🗓', path: '/panchang/calendar' },
  { id: 'muhurta',          label: 'Muhūrta Finder',         icon: '🔍', path: '/muhurta' },
  { id: 'sbc',              label: 'Sarvatobhadra Chakra',   icon: '⬛', path: '/sbc' },
]

const MAIN_TABS: { id: string; label: string; icon: string; path?: string }[] = [
  { id: 'astro-vastu', label: 'Astro Vastu', icon: '🏠', path: '/' },
  { id: 'muhurta', label: 'Muhurta Finder', icon: '🕒', path: '/muhurta' },
  { id: 'prashna', label: 'Prashna (Horary)', icon: '🎯', path: '/prashna' },
  { id: 'compare', label: 'Synastry Overlay', icon: '⚭', path: '/compare' },
  { id: 'clients', label: 'CRM / Clients',   icon: '👥', path: '/clients' },
  { id: 'pricing',    label: 'Pricing',         icon: '💎', path: '/pricing' },
  { id: 'my-charts',    label: 'My Charts',     icon: '📚', path: '/my/charts' },
]

export function AppFramework({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const { isSidenavOpen, setIsSidenavOpen, activeTab, setActiveTab, language, setLanguage } = useAppLayout()
  const { chart, isFormOpen, setIsFormOpen } = useChart()
  const [isAstroOpen, setIsAstroOpen] = useState(true)
  const [isPanchangOpen, setIsPanchangOpen] = useState(false)
  const [isNakshatraOpen, setIsNakshatraOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const saved = localStorage.getItem('astro-nav-expanded')
    if (saved !== null) {
      setIsAstroOpen(saved === 'true')
    }
    const savedP = localStorage.getItem('panchang-nav-expanded')
    if (savedP !== null) {
      setIsPanchangOpen(savedP === 'true')
    }
    const savedN = localStorage.getItem('nakshatra-nav-expanded')
    if (savedN !== null) {
      setIsNakshatraOpen(savedN === 'true')
    }

    // PWA: Monitor online/offline status
    setIsOffline(!navigator.onLine)
    const onOnline = () => setIsOffline(false)
    const onOffline = () => setIsOffline(true)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const toggleAstroOpen = () => {
    setIsAstroOpen(prev => {
      const next = !prev
      localStorage.setItem('astro-nav-expanded', String(next))
      return next
    })
  }

  const togglePanchangOpen = () => {
    setIsPanchangOpen(prev => {
      const next = !prev
      localStorage.setItem('panchang-nav-expanded', String(next))
      return next
    })
  }

  const toggleNakshatraOpen = () => {
    setIsNakshatraOpen(prev => {
      const next = !prev
      localStorage.setItem('nakshatra-nav-expanded', String(next))
      return next
    })
  }

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const top = e.currentTarget.scrollTop
    setShowScrollTop(top > 400)
  }

  const scrollToTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderTab = (t: { id: string; label: string; icon: string; path?: string }, isSub?: boolean) => {
    const isCurrentPage = (t.path === pathname)
    const isActive = t.path === '/' ? (isCurrentPage && activeTab === t.id) : isCurrentPage
    const handleNav = (e: React.MouseEvent) => {
      const isAstrologyTab = t.path === '/' || !t.path
      if (isAstrologyTab && !chart) {
        setIsFormOpen(true)
      }

      setActiveTab(t.id)
      if (window.innerWidth < 1024) setIsSidenavOpen(false)
    }
    const style: React.CSSProperties = {
      display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.65rem 0.75rem',
      background: isActive ? 'var(--gold-faint)' : 'transparent', border: 'none',
      borderLeft: `3px solid ${isActive ? 'var(--gold)' : 'transparent'}`,
      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
      borderRadius: '0 var(--r-md) var(--r-md) 0', cursor: 'pointer', textAlign: 'left',
      fontFamily: 'var(--font-body)', fontSize: '0.9rem', transition: 'all 0.15s',
      letterSpacing: '0.04em',
      width: '100%', textDecoration: 'none',
      paddingLeft: isSub ? '2rem' : '0.75rem'
    }
    return (
      <Link key={t.id} href={t.path || '/'} onClick={handleNav} style={style}>
         <span style={{ fontSize: '1rem', opacity: isActive ? 1 : 0.5 }}>{t.icon}</span>
         <span style={{ fontWeight: isActive ? 600 : 400 }}>{t.label}</span>
      </Link>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: 'var(--bg-page)' }}>
      
      {/* ── Top Global Header ────────────────────────────────── */}
      <header style={{
        padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid var(--header-border)`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        background: 'var(--header-bg)', gap: '0.75rem',
        zIndex: 200, flexShrink: 0,
        height: '60px'
      }}>
        {/* Left: Toggler + Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button 
            onClick={() => setIsSidenavOpen((o: boolean) => !o)}
            style={{
              width: 36, height: 36, borderRadius: 'var(--r-sm)', background: 'var(--surface-3)', 
              border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <span style={{ fontSize: '1.25rem' }}>☰</span>
          </button>
          <span 
            className={`fade-in logo-title-header ${isSidenavOpen ? 'hide-mobile' : ''}`}
            style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-gold)', letterSpacing: '0.02em' }}
          >
            Vedaansh
          </span>
          {isOffline && (
            <div style={{ background: 'var(--rose)', color: '#fff', fontSize: '0.6rem', padding: '2px 8px', borderRadius: 4, fontWeight: 800, letterSpacing: '0.05em' }}>OFFLINE</div>
          )}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <nav className="hide-mobile" style={{ display: 'flex', gap: '1.25rem' }}>
            <Link href="/panchang" style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--header-text-muted)', textDecoration: 'none', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Pañcāṅga</Link>
            <Link href="/sbc"      style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--header-text-muted)', textDecoration: 'none', letterSpacing: '0.12em', textTransform: 'uppercase' }}>SBC</Link>
            <Link href="/my/charts" style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--header-text-muted)', textDecoration: 'none', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Library</Link>
          </nav>
          <div className="hide-mobile" style={{ width: 1, height: 16, background: 'var(--border-soft)' }} />
          <ThemeToggle />
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        
        {/* ── Ambient background orbs ─────────────────────────── */}
        <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', width: 600, height: 600, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,124,246,0.12) 0%, transparent 70%)',
            top: '-200px', left: '30%', animation: 'orb-drift 18s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201,168,76,0.09) 0%, transparent 70%)',
            bottom: '-100px', right: '10%', animation: 'orb-drift 22s ease-in-out infinite reverse',
          }} />
        </div>

        {/* ── Mobile overlay backdrop ─────────── */}
        {isSidenavOpen && (
          <div
            onClick={() => setIsSidenavOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 49,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
            }}
            className="sidenav-mobile-overlay"
          />
        )}

        {/* ── Sidenav (Left Global Sidebar) ───────────────────── */}
        <aside
          className={`sidenav ${isSidenavOpen ? 'open' : ''}`}
          style={{
            width: 250, flexShrink: 0,
            background: 'var(--surface-2)',
            borderRight: '1px solid var(--border)',
            zIndex: 1500, display: 'flex', flexDirection: 'column',
            position: 'fixed', top: 0, left: 0, bottom: 0,
            transform: isSidenavOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)',
            boxShadow: isSidenavOpen ? '4px 0 32px rgba(0,0,0,0.15)' : 'none',
            overflowY: 'auto',
          }}
        >
          {/* Logo area */}
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-soft)' }}>
            <span style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 0 8px rgba(201,168,76,0.3))' }}>🪐</span>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, flex: 1 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-gold)', letterSpacing: '0.05em' }}>Vedaansh</span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.08em', fontStyle: 'italic' }}>Vedic Astrology</span>
            </div>
            <button
              onClick={() => setIsSidenavOpen(false)}
              style={{
                background: 'none', border: '1px solid var(--border-soft)', borderRadius: 6,
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', 
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-soft)'}
            >
              ✕
            </button>
          </div>

          {/* User Profile Block */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-soft)' }}>
            {status === 'loading' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.5 }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: 'var(--surface-3)', animation: 'pulse 1.5s infinite' }} />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Syncing...</div>
              </div>
            ) : status === 'authenticated' && session?.user ? (
              <Link 
                href="/account"
                onClick={() => { if (window.innerWidth < 1024) setIsSidenavOpen(false) }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none',
                  padding: '0.5rem', borderRadius: 'var(--r-md)', transition: 'all 0.15s'
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--r-md)', background: 'var(--gold-faint)', border: '1px solid var(--gold)',
                  color: 'var(--text-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', flexShrink: 0
                }}>
                  {session.user.name?.[0] || '★'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {session.user.name || 'Account'}
                  </div>
                  <div style={{ color: 'var(--text-gold)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
                    Settings ›
                  </div>
                </div>
              </Link>
            ) : (
              <Link 
                href="/login" 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.65rem 1rem', background: 'var(--gold-faint)', borderRadius: 'var(--r-md)',
                  color: 'var(--text-gold)', textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem',
                  border: '1px solid var(--border)'
                }}
              >
                👤 Sign In
              </Link>
            )}
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div className="label-caps" style={{ padding: '0.5rem 0.75rem', fontSize: '0.65rem', opacity: 0.5 }}>Navigation</div>
            {TOP_TABS.map(t => renderTab(t))}
            
            <button
              onClick={toggleAstroOpen}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.75rem',
                background: 'transparent', border: 'none', borderLeft: '3px solid transparent',
                color: 'var(--text-secondary)', borderRadius: '0 var(--r-md) var(--r-md) 0', cursor: 'pointer', textAlign: 'left',
                fontFamily: 'var(--font-body)', fontSize: '0.9rem', transition: 'all 0.15s',
                letterSpacing: '0.04em',
                width: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <span style={{ fontSize: '1rem', opacity: 0.5 }}>🌌</span>
                <span>Astrology</span>
              </div>
              <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{isAstroOpen ? '▲' : '▼'}</span>
            </button>
            
            <div style={{
              overflow: 'hidden',
              maxHeight: isAstroOpen ? '1200px' : '0',
              transition: 'max-height 0.3s ease-in-out',
              display: 'flex', flexDirection: 'column', gap: '0.25rem'
            }}>
              {ASTRO_GROUPS.map((group, gIdx) => (
                <div key={group.label} style={{ marginTop: gIdx === 0 ? '0' : '0.5rem' }}>
                  <div style={{ 
                    fontSize: '0.62rem', 
                    fontWeight: 700, 
                    color: 'var(--text-muted)', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.1em',
                    padding: '0.4rem 2rem',
                    opacity: 0.6
                  }}>
                    {group.label}
                  </div>
                  {group.tabs.map(t => renderTab(t, true))}
                </div>
              ))}
            </div>

            <button
              onClick={toggleNakshatraOpen}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.75rem',
                background: 'transparent', border: 'none', borderLeft: '3px solid transparent',
                color: 'var(--text-secondary)', borderRadius: '0 var(--r-md) var(--r-md) 0', cursor: 'pointer', textAlign: 'left',
                fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem', transition: 'all 0.15s',
                width: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <span style={{ fontSize: '1.1rem' }}>🌙</span>
                <span style={{ fontWeight: 600, letterSpacing: '0.01em' }}>Nakṣatra</span>
              </div>
              <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{isNakshatraOpen ? '▲' : '▼'}</span>
            </button>
            <div style={{
              overflow: 'hidden',
              maxHeight: isNakshatraOpen ? '800px' : '0',
              transition: 'max-height 0.3s ease-in-out',
              display: 'flex', flexDirection: 'column', gap: '0.25rem'
            }}>
              {NAKSHATRA_TABS.map(t => renderTab(t, true))}
            </div>

            <button
              onClick={togglePanchangOpen}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.75rem',
                background: 'transparent', border: 'none', borderLeft: '3px solid transparent',
                color: 'var(--text-secondary)', borderRadius: '0 var(--r-md) var(--r-md) 0', cursor: 'pointer', textAlign: 'left',
                fontFamily: 'var(--font-body)', fontSize: '0.9rem', transition: 'all 0.15s',
                letterSpacing: '0.04em',
                width: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <span style={{ fontSize: '1rem', opacity: 0.5 }}>📅</span>
                <span>Pañcāṅga</span>
              </div>
              <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{isPanchangOpen ? '▲' : '▼'}</span>
            </button>
            
            <div style={{
              overflow: 'hidden',
              maxHeight: isPanchangOpen ? '500px' : '0',
              transition: 'max-height 0.3s ease-in-out',
              display: 'flex', flexDirection: 'column', gap: '0.25rem'
            }}>
              {PANCHANG_TABS.map(t => renderTab(t, true))}
            </div>

            {MAIN_TABS.map(t => renderTab(t))}
          </nav>

          {/* Bottom Actions */}
          <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link href="/?new=true" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', textDecoration: 'none' }}>
              + New Consultation
            </Link>
            {status === 'authenticated' && (
              <button onClick={() => signOut()} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
                <span style={{ fontSize: '1rem' }}>⎋</span> Logout
              </button>
            )}
          </div>
        </aside>

        {/* ── Main Work Area ───────────────────────────────────── */}
        <main
          ref={mainRef}
          onScroll={handleScroll}
          className="main-content"
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', position: 'relative',
            zIndex: isFormOpen ? 1200 : 1, overflowY: 'auto', overflowX: 'hidden', minWidth: 0,
            transition: 'margin-left 0.4s cubic-bezier(0.16,1,0.3,1)',
            scrollBehavior: 'smooth'
          }}
        >
          {/* Dynamic Content */}
          <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>

          {/* Floating Scroll to Top button */}
          <button
            onClick={scrollToTop}
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'var(--surface-1)',
              border: '1px solid var(--gold)',
              color: 'var(--gold)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 15px var(--gold-faint)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 1000,
              opacity: showScrollTop ? 1 : 0,
              transform: showScrollTop ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
              pointerEvents: showScrollTop ? 'auto' : 'none',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--gold-faint)'
              e.currentTarget.style.transform = 'translateY(-4px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--surface-1)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>↑</span>
          </button>
        </main>
      </div>
    </div>
  )
}