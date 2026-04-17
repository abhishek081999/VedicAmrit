'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAppLayout } from '@/components/providers/LayoutProvider'
import { useChart } from '@/components/providers/ChartProvider'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

// ── Navigation Progress Bar Animation ──
const progressKeyframes = `
@keyframes navProgress {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(-20%); }
  100% { transform: translateX(0); }
}
@keyframes pulseGlow {
  0% { box-shadow: 0 0 0 0 rgba(201, 168, 76, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(201, 168, 76, 0); }
  100% { box-shadow: 0 0 0 0 rgba(201, 168, 76, 0); }
}
`;

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
    ]
  }
]

const PANCHANG_TABS: { id: string; label: string; icon: string; path?: string }[] = [
  { id: 'daily-panchang',   label: 'Daily Pañcāṅga',        icon: '📅', path: '/panchang' },
  { id: 'monthly-panchang', label: 'Monthly Calendar',       icon: '🗓', path: '/panchang/calendar' },
]

const ADVANCED_ASTRO_TABS: { id: string; label: string; icon: string; path?: string }[] = [
  { id: 'jaimini', label: 'Jaimini Astrology', icon: '💠', path: '/' },
  { id: 'astro-vastu', label: 'Astro Vastu', icon: '🏠', path: '/vastu' },
  { id: 'astro-carto', label: 'AstroCartography', icon: '🌍', path: '/acg' },
  { id: 'sbc', label: 'Sarvatobhadra Chakra', icon: '⬛', path: '/sbc' },
  { id: 'muhurta', label: 'Muhurta Finder', icon: '🕒', path: '/muhurta' },
  { id: 'prashna', label: 'Prashna', icon: '🎯', path: '/prashna' },
  { id: 'compare', label: 'Synastry Overlay', icon: '⚭', path: '/compare' },
  { id: 'roadmap', label: 'Cosmic Roadmap', icon: '🛣️', path: '/roadmap' },
  { id: 'transit-scrubber', label: 'Time Scrubber', icon: '⏳', path: '/scrubber' },
]

const VEDIC_ICONS = {
  om: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M52.3,47.2c0.2,2,1.3,4,3.2,5.2c1.9,1.1,4.3,1.4,6.4,1.1c2-0.3,3.8-1.2,5.3-2.6c1.5-1.4,2.5-3.3,2.8-5.3 c0.3-2,0-4-1.1-5.7c-1.1-1.7-2.9-2.9-4.8-3.4c1.1-0.2,2.3-0.5,3.4-1c1.1-0.6,2.1-1.3,2.9-2.2c0.8-0.9,1.5-2,1.8-3.3 c0.4-1.3,0.4-2.7,0-4c-0.4-1.3-1.1-2.4-2-3.4c-1-0.9-2.2-1.6-3.6-2c-1.4-0.4-2.9-0.5-4.3-0.2c-1.4,0.3-2.8,1-3.9,1.9 c-1.1-0.9-2.4-1.6-3.8-1.9c-1.4-0.3-2.9-0.2-4.3,0.2c-1.4,0.4-2.7,1.1-3.6,2c-1,0.9-1.6,2.1-2,3.4c-0.4,1.3-0.4,2.7-0,4 c0.4,1.3,1,2.4,1.8,3.3c0.8,0.9,1.8,1.7,2.9,2.2c1.1,0.6,2.3,0.8,3.4,1c-2,0.5-3.8,1.7-4.8,3.4c-1.1,1.7-1.4,3.7-1.1,5.7 C50,44,50.8,45.8,52.3,47.2z M65.7,21.5c1.3,0.3,2.5,1,3.4,2c0.9,1,1.4,2.3,1.6,3.6c0.2,1.4,0,2.8-0.7,4.1 c-0.6,1.4-1.7,2.5-3.1,3.1c1.3,0.6,2.4,1.7,3,3.1c0.7,1.3,0.9,2.8,0.7,4.1c-0.2,1.4-0.7,2.6-1.6,3.6c-0.9,1-2,1.7-3.4,2 c-1.3,0.3-2.7,0.2-4-0.2c-1.4-0.4-2.4-1.2-3.2-2.3c-0.8-1-1.1-2.4-1.1-3.8c0-1.4,0.4-2.8,1.2-3.8c0.8-1.1,1.8-1.8,3.1-2.3 c-1.3-0.4-2.3-1.2-3.1-2.3c-0.7-1.1-1.1-2.4-1.1-3.8c0-1.4,0.3-2.7,1.1-3.8c0.8-1.1,1.8-1.9,3.1-2.3C63,21.3,64.4,21.3,65.7,21.5z"/></svg>`,
  swastik: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50,0v37.5H12.5V12.5H25v12.5h12.5V0H50z M12.5,50V12.5h37.5V50H12.5z M87.5,50H50V12.5H87.5V25h-12.5v12.5H87.5V50z M50,87.5V50h37.5v37.5H75v-12.5H62.5v12.5 H50z M12.5,87.5v-37.5H50v37.5H37.5v-12.5H25v12.5H12.5z"/></svg>`,
  ganesha: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50,10c-15,0-20,10-20,20s5,15,10,20c0,0-15,5-15,20c0,10,10,20,25,20s25-10,25-20c0-15-15-20-15-20c5-5,10-10,10-20 S65,10,50,10z M50,15c10,0,15,8,15,15s-5,15-10,20c-5,5-10,10-10,20c0,5,5,10,5,10s-10,0-10-10c0-10-5-15-10-20c-5-5-10-12-10-20 S40,15,50,15z"/></svg>`
}

const MAIN_TABS: { id: string; label: string; icon: string; path?: string }[] = [
  { id: 'clients',    label: 'CRM / Clients', icon: '👥', path: '/clients' },
  { id: 'pricing',    label: 'Pricing',       icon: '💎', path: '/pricing' },
  { id: 'my-charts',  label: 'My Charts',     icon: '📚', path: '/my/charts' },
]

export function AppFramework({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const { isSidenavOpen, setIsSidenavOpen, activeTab, setActiveTab, language, setLanguage } = useAppLayout()
  const { chart, isFormOpen, setIsFormOpen } = useChart()
  const [isAstroOpen, setIsAstroOpen] = useState(true)
  const [isAdvancedAstroOpen, setIsAdvancedAstroOpen] = useState(false)
  const [isPanchangOpen, setIsPanchangOpen] = useState(false)
  const [isNakshatraOpen, setIsNakshatraOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setIsNavigating(false)
    const saved = localStorage.getItem('astro-nav-expanded')
    if (saved !== null) {
      setIsAstroOpen(saved === 'true')
    }
    const savedAdv = localStorage.getItem('advanced-astro-nav-expanded')
    if (savedAdv !== null) {
      setIsAdvancedAstroOpen(savedAdv === 'true')
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
  }, [pathname])

  const toggleAstroOpen = () => {
    setIsAstroOpen(prev => {
      const next = !prev
      localStorage.setItem('astro-nav-expanded', String(next))
      return next
    })
  }

  const toggleAdvancedAstroOpen = () => {
    setIsAdvancedAstroOpen(prev => {
      const next = !prev
      localStorage.setItem('advanced-astro-nav-expanded', String(next))
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
      
      // Start navigation animation
      if (t.path !== pathname) {
        setIsNavigating(true)
      }

      if (isAstrologyTab && !chart) {
        setIsFormOpen(true)
      }
      setActiveTab(t.id)
      if (window.innerWidth < 1024) setIsSidenavOpen(false)
    }

    const style: React.CSSProperties = {
      display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.7rem 0.75rem',
      background: isActive ? 'var(--gold-faint)' : 'transparent', 
      border: 'none',
      borderLeft: `3px solid ${isActive ? 'var(--gold)' : 'transparent'}`,
      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
      borderRadius: '0 var(--r-md) var(--r-md) 0', 
      cursor: 'pointer', 
      textAlign: 'left',
      fontFamily: 'var(--font-body)', 
      fontSize: '0.9rem', 
      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      letterSpacing: '0.04em',
      width: '100%', 
      textDecoration: 'none',
      paddingLeft: isSub ? '2rem' : '0.85rem',
      position: 'relative',
      overflow: 'hidden'
    }

    return (
      <Link 
        key={t.id} 
        href={t.path || '/'} 
        onClick={handleNav} 
        style={style}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'var(--surface-3)'
            e.currentTarget.style.paddingLeft = isSub ? '2.15rem' : '1rem'
            e.currentTarget.style.color = 'var(--text-primary)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.paddingLeft = isSub ? '2rem' : '0.85rem'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }
        }}
      >
         <span style={{ 
           fontSize: '1.1rem', 
           opacity: isActive ? 1 : 0.6,
           transition: 'transform 0.2s',
           transform: isActive ? 'scale(1.1)' : 'scale(1)',
           filter: isActive ? 'drop-shadow(0 0 4px var(--gold))' : 'none'
         }}>
           {t.icon}
         </span>
         <span style={{ 
           fontWeight: isActive ? 600 : 400,
           transition: 'all 0.2s',
           textShadow: isActive ? '0 0 1px rgba(201,168,76,0.2)' : 'none'
         }}>
           {t.label}
         </span>
         {isActive && (
           <div style={{
             position: 'absolute', right: '0.5rem', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--gold)',
             boxShadow: '0 0 8px var(--gold)',
             animation: 'pulseGlow 2s infinite'
           }} />
         )}
      </Link>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: 'var(--bg-page)' }}>
      <style dangerouslySetInnerHTML={{ __html: progressKeyframes }} />
      
      {/* ── Global Top Progress Bar ── */}
      {isNavigating && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, transparent, var(--gold), #fff)',
          zIndex: 9999,
          animation: 'navProgress 1.5s ease-in-out forwards'
        }} />
      )}
      
      {/* ── Top Global Header ────────────────────────────────── */}
      <header className="app-header">
        {/* Left: Toggler + Brand */}
        <div className="app-header-left">
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
          
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <div style={{ width: 22, height: 22, color: 'var(--gold)' }} dangerouslySetInnerHTML={{ __html: VEDIC_ICONS.swastik }} />
            <span 
              className={`fade-in logo-title-header ${isSidenavOpen ? 'hide-mobile' : ''}`}
              style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-gold)', letterSpacing: '0.04em' }}
            >
              Vedaansh
            </span>
            <div style={{ width: 14, height: 14, color: 'var(--gold)', opacity: 0.5 }} dangerouslySetInnerHTML={{ __html: VEDIC_ICONS.om }} />
          </Link>

          {isOffline && (
            <div style={{ background: 'var(--rose)', color: '#fff', fontSize: '0.6rem', padding: '2px 8px', borderRadius: 4, fontWeight: 800, letterSpacing: '0.05em' }}>OFFLINE</div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="app-header-right">
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
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-soft)', background: 'linear-gradient(to bottom, var(--surface-1), var(--surface-2))' }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--gold)', marginBottom: '0.5rem' }}>
              <div style={{ width: 44, height: 44 }} dangerouslySetInnerHTML={{ __html: VEDIC_ICONS.ganesha }} />
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.6rem', color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1rem', opacity: 0.8 }}>॥ श्री गणेशाय नमः ॥</div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
               <div style={{ width: 28, height: 28, color: 'var(--gold)', opacity: 0.8 }} dangerouslySetInnerHTML={{ __html: VEDIC_ICONS.swastik }} />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, flex: 1 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-gold)', letterSpacing: '0.05em' }}>Vedaansh</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 600 }}>TATTVA & JYOTIṢA</span>
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
              onClick={toggleAdvancedAstroOpen}
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
                <span style={{ fontSize: '1rem', opacity: 0.5 }}>⚛</span>
                <span>Advanced Astrology</span>
              </div>
              <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{isAdvancedAstroOpen ? '▲' : '▼'}</span>
            </button>
            <div style={{
              overflow: 'hidden',
              maxHeight: isAdvancedAstroOpen ? '800px' : '0',
              transition: 'max-height 0.3s ease-in-out',
              display: 'flex', flexDirection: 'column', gap: '0.25rem'
            }}>
              {ADVANCED_ASTRO_TABS.map(t => renderTab(t, true))}
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
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--gold)', opacity: 0.2, marginBottom: '0.5rem' }}>
              <div style={{ width: 24, height: 24 }} dangerouslySetInnerHTML={{ __html: VEDIC_ICONS.om }} />
            </div>
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
            className="floating-scroll-top"
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