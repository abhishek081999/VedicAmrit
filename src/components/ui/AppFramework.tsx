'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAppLayout } from '@/components/providers/LayoutProvider'
import { useChart } from '@/components/providers/ChartProvider'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { routeAllowsWithoutChart } from '@/lib/chartGateRoutes'

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

const ASTROLOGY_ROUTE = '/astrology'

const TOP_TABS: { id: string; label: string; icon: string; path?: string }[] = [
  { id: 'dashboard', label: 'Dashboard',   icon: '◫', path: ASTROLOGY_ROUTE },
]

const NAKSHATRA_TABS: { id: string; label: string; icon: string; path?: string }[] = [
  { id: 'nakshatra-overview', label: 'Overview',  icon: '🌟', path: '/nakshatra/overview' },
  { id: 'nakshatra-navtara',  label: 'Navtara',   icon: '🔯', path: '/nakshatra/navtara' },
  { id: 'nakshatra-bestdays', label: 'Best Days', icon: '📅', path: '/nakshatra/bestdays' },
  { id: 'nakshatra-muhurta',  label: 'Muhurta',   icon: '⚡', path: '/nakshatra/muhurta' },
  { id: 'nakshatra-panchaka', label: 'Panchaka',  icon: '🔥', path: '/nakshatra/panchaka' },
  { id: 'nakshatra-planet',   label: 'Planet',    icon: '✦', path: '/nakshatra/planet' },
  { id: 'nakshatra-compat',   label: 'Compat',    icon: '🔗', path: '/nakshatra/compat' },
  { id: 'nakshatra-remedies', label: 'Remedies',  icon: '🙏', path: '/nakshatra/remedies' },
]

const ASTRO_GROUPS: { label: string; tabs: { id: string; label: string; icon: string; path?: string }[] }[] = [
  {
    label: 'Core Analysis',
    tabs: [
      { id: 'astro-details', label: 'Astro Details', icon: '📋', path: ASTROLOGY_ROUTE },
      { id: 'planets',   label: 'Planets',     icon: '✦', path: ASTROLOGY_ROUTE },
      { id: 'dasha',     label: 'Daśā',        icon: '⏳', path: ASTROLOGY_ROUTE },
      { id: 'house',     label: 'House',       icon: '🏠', path: ASTROLOGY_ROUTE },
      { id: 'yogas',     label: 'Yogas',       icon: '✧', path: ASTROLOGY_ROUTE },
      { id: 'kp-stellar', label: 'Stellar (KP)', icon: '⭐', path: ASTROLOGY_ROUTE },
      { id: 'interpretation', label: 'Interpretation', icon: '✧', path: ASTROLOGY_ROUTE },
    ]
  },
  {
    label: 'Predictive Timing',
    tabs: [
      { id: 'varshaphal', label: 'Solar Return (Varshfal)', icon: '☀️', path: ASTROLOGY_ROUTE },
    ]
  },
  {
    label: 'Strength & Analytics',
    tabs: [
      { id: 'ashtakavarga', label: 'Aṣṭakavarga',  icon: '⬡', path: ASTROLOGY_ROUTE },
      { id: 'shadbala',  label: 'Ṣaḍbala',      icon: '⚖', path: ASTROLOGY_ROUTE },
      { id: 'bhava-bala', label: 'Bhāva Bala',   icon: '⌗', path: ASTROLOGY_ROUTE },
      { id: 'vimsopaka',  label: 'Viṁśopaka',    icon: '⑳', path: ASTROLOGY_ROUTE },
    ]
  },
  {
    label: 'Calculations',
    tabs: [
      { id: 'panchang',  label: 'Natal Pañcāṅga', icon: '📅', path: ASTROLOGY_ROUTE },
    ]
  }
]

const PANCHANG_TABS: { id: string; label: string; icon: string; path?: string }[] = [
  { id: 'daily-panchang',   label: 'Daily Pañcāṅga',        icon: '📅', path: '/panchang' },
  { id: 'monthly-panchang', label: 'Monthly Calendar',       icon: '🗓', path: '/panchang/calendar' },
]

const ADVANCED_ASTRO_TABS: { id: string; label: string; icon: string; path?: string }[] = [
  { id: 'jaimini', label: 'Jaimini Astrology', icon: '💠', path: '/jaimini' },
  { id: 'astro-vastu', label: 'Astro Vastu', icon: '🏠', path: '/vastu' },
  { id: 'astro-carto', label: 'AstroCartography', icon: '🌍', path: '/acg' },
  { id: 'sbc', label: 'Sarvatobhadra Chakra', icon: '⬛', path: '/sbc' },
  { id: 'muhurta', label: 'Muhurta Finder', icon: '🕒', path: '/muhurta' },
  { id: 'prashna', label: 'Prashna', icon: '🎯', path: '/prashna' },
  { id: 'compare', label: 'Kundali Matching', icon: '⚭', path: '/compare' },
  { id: 'roadmap', label: 'Cosmic Roadmap', icon: '🛣️', path: '/roadmap' },
  { id: 'transit-scrubber', label: 'Time Scrubber', icon: '⏳', path: '/scrubber' },
]

const VEDIC_ICONS = {
  om: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M52.3,47.2c0.2,2,1.3,4,3.2,5.2c1.9,1.1,4.3,1.4,6.4,1.1c2-0.3,3.8-1.2,5.3-2.6c1.5-1.4,2.5-3.3,2.8-5.3 c0.3-2,0-4-1.1-5.7c-1.1-1.7-2.9-2.9-4.8-3.4c1.1-0.2,2.3-0.5,3.4-1c1.1-0.6,2.1-1.3,2.9-2.2c0.8-0.9,1.5-2,1.8-3.3 c0.4-1.3,0.4-2.7,0-4c-0.4-1.3-1.1-2.4-2-3.4c-1-0.9-2.2-1.6-3.6-2c-1.4-0.4-2.9-0.5-4.3-0.2c-1.4,0.3-2.8,1-3.9,1.9 c-1.1-0.9-2.4-1.6-3.8-1.9c-1.4-0.3-2.9-0.2-4.3,0.2c-1.4,0.4-2.7,1.1-3.6,2c-1,0.9-1.6,2.1-2,3.4c-0.4,1.3-0.4,2.7-0,4 c0.4,1.3,1,2.4,1.8,3.3c0.8,0.9,1.8,1.7,2.9,2.2c1.1,0.6,2.3,0.8,3.4,1c-2,0.5-3.8,1.7-4.8,3.4c-1.1,1.7-1.4,3.7-1.1,5.7 C50,44,50.8,45.8,52.3,47.2z M65.7,21.5c1.3,0.3,2.5,1,3.4,2c0.9,1,1.4,2.3,1.6,3.6c0.2,1.4,0,2.8-0.7,4.1 c-0.6,1.4-1.7,2.5-3.1,3.1c1.3,0.6,2.4,1.7,3,3.1c0.7,1.3,0.9,2.8,0.7,4.1c-0.2,1.4-0.7,2.6-1.6,3.6c-0.9,1-2,1.7-3.4,2 c-1.3,0.3-2.7,0.2-4-0.2c-1.4-0.4-2.4-1.2-3.2-2.3c-0.8-1-1.1-2.4-1.1-3.8c0-1.4,0.4-2.8,1.2-3.8c0.8-1.1,1.8-1.8,3.1-2.3 c-1.3-0.4-2.3-1.2-3.1-2.3c-0.7-1.1-1.1-2.4-1.1-3.8c0-1.4,0.3-2.7,1.1-3.8c0.8-1.1,1.8-1.9,3.1-2.3C63,21.3,64.4,21.3,65.7,21.5z"/></svg>`,
  swastik: `<svg viewBox="0 0 120 120" fill="currentColor"><path d="M60 20 L 60 60 L 100 60 Q 115 60 110 80 Q 105 100 85 100 L 85 85 Q 95 85 95 75 Q 95 65 85 65 L 60 65 L 60 105 Q 60 120 40 115 Q 20 110 20 90 L 35 90 Q 35 100 45 100 Q 55 100 55 90 L 55 65 L 15 65 Q 0 65 5 45 Q 10 25 30 25 L 30 40 Q 20 40 20 50 Q 20 60 30 60 L 55 60 L 55 20 Q 55 5 75 10 Q 95 15 95 35 L 80 35 Q 80 25 70 25 Q 60 25 60 35 V 20 Z" /><circle cx="40" cy="40" r="5" /><circle cx="80" cy="40" r="5" /><circle cx="40" cy="80" r="5" /><circle cx="80" cy="80" r="5" /></svg>`,
  ganesha: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M50 20 C 35 20, 25 32, 25 45 C 25 60, 35 70, 50 75 C 65 70, 75 60, 75 45 C 75 32, 65 20, 50 20 Z" opacity="0.3" /><path d="M25 45 C 10 45, 10 75, 30 75 C 40 75, 45 70, 50 65 C 55 70, 60 75, 70 75 C 90 75, 90 45, 75 45" /><path d="M50 65 L 50 85 C 50 92, 58 92, 68 92" /><circle cx="50" cy="38" r="4" fill="currentColor" stroke="none" /></svg>`,
  ganeshaSwastik: `<svg viewBox="0 0 120 120" fill="currentColor">
    <g opacity="0.15">
      <path d="M60 20 L 60 60 L 100 60 Q 115 60 110 80 Q 105 100 85 100 L 85 85 Q 95 85 95 75 Q 95 65 85 65 L 60 65 L 60 105 Q 60 120 40 115 Q 20 110 20 90 L 35 90 Q 35 100 45 100 Q 55 100 55 90 L 55 65 L 15 65 Q 0 65 5 45 Q 10 25 30 25 L 30 40 Q 20 40 20 50 Q 20 60 30 60 L 55 60 L 55 20 Q 55 5 75 10 Q 95 15 95 35 L 80 35 Q 80 25 70 25 Q 60 25 60 35 V 20 Z" />
      <circle cx="40" cy="40" r="5" /><circle cx="80" cy="40" r="5" /><circle cx="40" cy="80" r="5" /><circle cx="80" cy="80" r="5" />
    </g>
    <g transform="translate(10, 5) scale(0.8)">
      <path d="M30.63,77.67c-9.43-13.04-12.22-32.41-2.3-41.01c-2.28-8.02-11.02-10.6-18.19-8.23 C-0.23,31.87-0.99,40.02,0.69,48.47c1.56,7.83,7.99,31.71,10.79,37.66c1.24,2.64,2.78,4.04,4.58,4.32c2.54,0.4,5.6-1.43,9.11-5.16 L30.63,77.67L30.63,77.67z M37.21,47.99c5.67,2,6.33,4.37,7.38,9.55c-0.65-0.57-1.25-1.16-1.8-1.77c-0.09,0.07-0.19,0.13-0.29,0.18 c-1.23,0.64-2.8,0.05-3.52-1.32c-0.61-1.17-0.39-2.52,0.45-3.29C38.68,50.22,37.97,49.1,37.21,47.99L37.21,47.99z M55.9,10.26 h-5.63c-0.01-0.81-0.56-1.68-1.22-2.18c2.01-0.47,3.35-1.47,4.14-3.19c0.73,2.02,2.33,2.65,3.96,3.19 C56.35,8.55,55.91,9.51,55.9,10.26L55.9,10.26z M69,47.99c-5.67,2-6.33,4.37-7.38,9.55c0.65-0.57,1.25-1.16,1.8-1.77 c0.09,0.07,0.19,0.13,0.29,0.18c1.23,0.64,2.8,0.05,3.52-1.32c0.61-1.17,0.39-2.52-0.45-3.29C67.52,50.22,68.24,49.1,69,47.99 L69,47.99z M32.91,32.48c12.95-5.35,26.47-5.57,40.62,0c9.35-12.51-24.19-17.86-11.8-25.13C58.32,6.22,54.77,4.22,53.24,0 c-1.65,3.6-4.27,6.38-8.46,7.35C56.82,16.34,22.81,18.58,32.91,32.48L32.91,32.48z M75.17,75.96c9.43-13.04,12.22-32.41,2.3-41.01 c2.28-8.02,11.02-10.6,18.19-8.23c10.37,3.43,11.13,11.58,9.45,20.04c-1.56,7.83-7.99,31.71-10.79,37.66 c-1.24,2.64,2.78,4.04-4.58,4.32c-2.54,0.4-5.6-1.43-9.11-5.16L75.17,75.96L75.17,75.96z M72.8,38.28 c-15.29-4.85-28.42-4.41-38.75-0.21c-7.5,5.47-8.23,14.04-4.73,25.63c2.4,7.94,6.76,10.58,9.01,16.68 c6.44,17.44,3.08,47.17,43.53,41.89c4.55-0.59,8.75-1.77,12.59-3.56c9.99-6.06-3.86-6.69-7.78-6.91 c-21.58-1.25-23.04-8.24-18.05-27.29l2.02-7.71C77.82,58.76,80.49,44.36,72.8,38.28L72.8,38.28z"/>
    </g>
  </svg>`
}

const MAIN_TABS: { id: string; label: string; icon: string; path?: string }[] = [
  { id: 'clients',    label: 'CRM / Clients', icon: '👥', path: '/clients' },
  { id: 'pricing',    label: 'Pricing',       icon: '💎', path: '/pricing' },
  { id: 'my-charts',  label: 'My Charts',     icon: '📚', path: '/my/charts' },
]

/** Keep in sync with `.sidenav.open + .main-content` in `globals.css` */
const SIDENAV_WIDTH_PX = 212

export function AppFramework({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const { isSidenavOpen, setIsSidenavOpen, activeTab, setActiveTab, language, setLanguage } = useAppLayout()
  const { chart, isFormOpen, setIsFormOpen, setChart, setPendingDestination } = useChart()
  const [isAstroOpen, setIsAstroOpen] = useState(true)
  const [isAdvancedAstroOpen, setIsAdvancedAstroOpen] = useState(false)
  const [isPanchangOpen, setIsPanchangOpen] = useState(false)
  const [isNakshatraOpen, setIsNakshatraOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isSidenavOpen) setProfileMenuOpen(false)
  }, [isSidenavOpen])

  useEffect(() => {
    if (!profileMenuOpen) return
    const onDoc = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [profileMenuOpen])

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
    const isActive = t.path === ASTROLOGY_ROUTE ? (isCurrentPage && activeTab === t.id) : isCurrentPage
    
    const handleNav = (e: React.MouseEvent) => {
      const isAstrologyTab = t.path === ASTROLOGY_ROUTE || !t.path
      
      // Start navigation animation
      if (t.path !== pathname) {
        setIsNavigating(true)
      }

      if (!chart && t.path && !isAstrologyTab && !routeAllowsWithoutChart(t.path)) {
        e.preventDefault()
        setPendingDestination(t.path)
        setIsFormOpen(true)
        router.push('/astrology?new=true')
      } else if (isAstrologyTab && !chart) {
        setIsFormOpen(true)
      }
      setActiveTab(t.id)
      if (window.innerWidth < 1024) setIsSidenavOpen(false)
    }

    const style: React.CSSProperties = {
      display: 'flex', alignItems: 'center', gap: '0.48rem', padding: '0.36rem 0.5rem',
      background: isActive ? 'var(--gold-faint)' : 'transparent', 
      border: 'none',
      borderLeft: `2px solid ${isActive ? 'var(--gold)' : 'transparent'}`,
      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
      borderRadius: '0 var(--r-md) var(--r-md) 0', 
      cursor: 'pointer', 
      textAlign: 'left',
      fontFamily: 'var(--font-body)', 
      fontSize: '0.8rem', 
      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      letterSpacing: '0.02em',
      width: '100%', 
      textDecoration: 'none',
      paddingLeft: isSub ? '1.15rem' : '0.52rem',
      minHeight: 36,
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
            e.currentTarget.style.paddingLeft = isSub ? '1.28rem' : '0.62rem'
            e.currentTarget.style.color = 'var(--text-primary)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.paddingLeft = isSub ? '1.15rem' : '0.52rem'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }
        }}
      >
         <span style={{ 
           fontSize: '0.95rem', 
           lineHeight: 1,
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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: 'transparent' }}>
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
          
          <Link
            href="/home"
            onClick={() => {
              setChart(null)
              setIsFormOpen(false)
              setActiveTab('dashboard')
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}
          >
            <img 
              src="/veda-icon.png" 
              alt="Vedaansh Logo"
              style={{ width: 34, height: 34, objectFit: 'contain' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span 
                className={`fade-in logo-title-header ${isSidenavOpen ? 'hide-mobile' : ''}`}
                style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--logo-text-title)', letterSpacing: '0.04em' }}
              >
                Vedaansh
              </span>
              <span style={{ fontSize: '0.55rem', color: 'var(--logo-text-sub)', letterSpacing: '0.05em', fontWeight: 600, opacity: 0.9, whiteSpace: 'nowrap' }}>
                ॥ श्री गणेशाय नमः ॥
              </span>
            </div>
          </Link>

          {isOffline && (
            <div style={{ background: 'var(--rose)', color: '#fff', fontSize: '0.6rem', padding: '2px 8px', borderRadius: 4, fontWeight: 800, letterSpacing: '0.05em' }}>OFFLINE</div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="app-header-right">
          <Link
            href="/astrology"
            onClick={() => {
              setActiveTab('dashboard')
              if (window.innerWidth < 1024) setIsSidenavOpen(false)
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.2rem 0.45rem',
              borderRadius: '999px',
              border: '1px solid var(--border-soft)',
              color: 'var(--header-text-muted)',
              textDecoration: 'none',
              fontSize: '0.5rem',
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginRight: '0.5rem',
              opacity: 0.7,
            }}
            className="show-mobile-only"
          >
            Dashboard
          </Link>
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
            width: SIDENAV_WIDTH_PX,
            flexShrink: 0,
            background: 'var(--surface-2)',
            borderRight: '1px solid var(--border)',
            zIndex: 1500,
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            transform: isSidenavOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.32s cubic-bezier(0.16,1,0.3,1)',
            boxShadow: isSidenavOpen ? '4px 0 24px rgba(0,0,0,0.12)' : 'none',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
          }}
        >
          {/* Logo area */}
          <div style={{ padding: '0.6rem 0.65rem', borderBottom: '1px solid var(--border-soft)', background: 'var(--logo-gradient)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
              <Link
                href="/home"
                onClick={() => {
                  setChart(null)
                  setIsFormOpen(false)
                  setActiveTab('dashboard')
                  if (window.innerWidth < 1024) setIsSidenavOpen(false)
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', minWidth: 0, flex: 1 }}
              >
                <img
                  src="/veda-icon.png"
                  alt="Vedaansh Logo"
                  style={{ width: 34, height: 34, objectFit: 'contain' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05, minWidth: 0 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.12rem', fontWeight: 700, color: 'var(--logo-text-title)', letterSpacing: '0.04em' }}>Vedaansh</span>
                  <span style={{ fontSize: '0.58rem', color: 'var(--logo-text-sub)', letterSpacing: '0.08em', fontWeight: 600, whiteSpace: 'nowrap', opacity: 0.92 }}>॥ श्री गणेशाय नमः ॥</span>
                </div>
              </Link>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setIsSidenavOpen(false)}
                style={{
                  background: 'none', border: '1px solid var(--border-soft)', borderRadius: 6,
                  width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.72rem', 
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-soft)'}
              >
                ✕
              </button>
            </div>
          </div>

          {/* User Profile Block */}
          <div style={{ padding: '0.5rem 0.65rem', borderBottom: '1px solid var(--border-soft)' }}>
            {status === 'loading' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.5 }}>
                <div style={{ width: 32, height: 32, borderRadius: 'var(--r-md)', background: 'var(--surface-3)', animation: 'pulse 1.5s infinite' }} />
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Syncing...</div>
              </div>
            ) : status === 'authenticated' && session?.user ? (
              <div ref={profileMenuRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Account menu"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.38rem 0.42rem',
                    borderRadius: 'var(--r-md)',
                    transition: 'background 0.15s',
                    background: profileMenuOpen ? 'var(--surface-3)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    font: 'inherit',
                  }}
                  onMouseEnter={(e) => {
                    if (!profileMenuOpen) e.currentTarget.style.background = 'var(--surface-3)'
                  }}
                  onMouseLeave={(e) => {
                    if (!profileMenuOpen) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 'var(--r-md)',
                      background: 'var(--gold-faint)',
                      border: '1px solid var(--gold)',
                      color: 'var(--text-gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.88rem',
                      flexShrink: 0,
                    }}
                  >
                    {session.user.name?.[0] || '★'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {session.user.name || 'Account'}
                    </div>
                    <div
                      style={{
                        color: 'var(--text-gold)',
                        fontSize: '0.6rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        marginTop: 1,
                      }}
                    >
                      {profileMenuOpen ? 'Close ▴' : 'Account ▾'}
                    </div>
                  </div>
                </button>
                {profileMenuOpen && (
                  <div
                    role="menu"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: '100%',
                      marginTop: 6,
                      padding: '0.35rem',
                      background: 'var(--surface-1)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-md)',
                      boxShadow: 'var(--shadow-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      zIndex: 40,
                    }}
                  >
                    <Link
                      href="/account"
                      role="menuitem"
                      onClick={() => {
                        setProfileMenuOpen(false)
                        if (window.innerWidth < 1024) setIsSidenavOpen(false)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.42rem 0.5rem',
                        borderRadius: 6,
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--surface-3)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <span aria-hidden style={{ fontSize: '0.85rem' }}>
                        👤
                      </span>
                      Profile
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileMenuOpen(false)
                        setIsSidenavOpen(false)
                        void signOut({ callbackUrl: '/' })
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.42rem 0.5rem',
                        borderRadius: 6,
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                        width: '100%',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(224, 123, 142, 0.12)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <span aria-hidden style={{ fontSize: '0.85rem' }}>
                        ⎋
                      </span>
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                href="/login"
                onClick={() => { if (window.innerWidth < 1024) setIsSidenavOpen(false) }}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  padding: '0.45rem 0.65rem', background: 'var(--gold-faint)', borderRadius: 'var(--r-md)',
                  color: 'var(--text-gold)', textDecoration: 'none', fontWeight: 600, fontSize: '0.8rem',
                  border: '1px solid var(--border)'
                }}
              >
                👤 Sign In
              </Link>
            )}
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: '0.35rem 0.4rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.08rem' }}>
            <div className="label-caps" style={{ padding: '0.22rem 0.45rem 0.28rem', fontSize: '0.58rem', opacity: 0.55 }}>Navigation</div>
            {TOP_TABS.map(t => renderTab(t))}
            
            <button
              type="button"
              onClick={toggleAstroOpen}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.36rem 0.48rem',
                background: 'transparent', border: 'none', borderLeft: '2px solid transparent',
                color: 'var(--text-secondary)', borderRadius: '0 var(--r-md) var(--r-md) 0', cursor: 'pointer', textAlign: 'left',
                fontFamily: 'var(--font-body)', fontSize: '0.8rem', transition: 'all 0.15s',
                letterSpacing: '0.02em',
                width: '100%',
                minHeight: 36,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.48rem' }}>
                <span style={{ fontSize: '0.92rem', opacity: 0.55 }} aria-hidden>🌌</span>
                <span>Astrology</span>
              </div>
              <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{isAstroOpen ? '▲' : '▼'}</span>
            </button>
            
            <div style={{
              overflow: 'hidden',
              maxHeight: isAstroOpen ? '1200px' : '0',
              transition: 'max-height 0.3s ease-in-out',
              display: 'flex', flexDirection: 'column', gap: '0.1rem'
            }}>
              {ASTRO_GROUPS.map((group, gIdx) => (
                <div key={group.label} style={{ marginTop: gIdx === 0 ? '0' : '0.32rem' }}>
                  <div style={{ 
                    fontSize: '0.58rem', 
                    fontWeight: 700, 
                    color: 'var(--text-muted)', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.08em',
                    padding: '0.18rem 0.85rem',
                    opacity: 0.62
                  }}>
                    {group.label}
                  </div>
                  {group.tabs.map(t => renderTab(t, true))}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={toggleAdvancedAstroOpen}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.36rem 0.48rem',
                background: 'transparent', border: 'none', borderLeft: '2px solid transparent',
                color: 'var(--text-secondary)', borderRadius: '0 var(--r-md) var(--r-md) 0', cursor: 'pointer', textAlign: 'left',
                fontFamily: 'var(--font-body)', fontSize: '0.8rem', transition: 'all 0.15s',
                letterSpacing: '0.02em',
                width: '100%',
                minHeight: 36,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.48rem' }}>
                <span style={{ fontSize: '0.92rem', opacity: 0.55 }} aria-hidden>⚛</span>
                <span>Advanced Astrology</span>
              </div>
              <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{isAdvancedAstroOpen ? '▲' : '▼'}</span>
            </button>
            <div style={{
              overflow: 'hidden',
              maxHeight: isAdvancedAstroOpen ? '800px' : '0',
              transition: 'max-height 0.3s ease-in-out',
              display: 'flex', flexDirection: 'column', gap: '0.1rem'
            }}>
              {ADVANCED_ASTRO_TABS.map(t => renderTab(t, true))}
            </div>

            <button
              type="button"
              onClick={toggleNakshatraOpen}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.36rem 0.48rem',
                background: 'transparent', border: 'none', borderLeft: '2px solid transparent',
                color: 'var(--text-secondary)', borderRadius: '0 var(--r-md) var(--r-md) 0', cursor: 'pointer', textAlign: 'left',
                fontFamily: 'var(--font-body)', fontSize: '0.8rem', transition: 'all 0.15s',
                letterSpacing: '0.02em',
                width: '100%',
                minHeight: 36,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.48rem' }}>
                <span style={{ fontSize: '0.95rem' }} aria-hidden>🌙</span>
                <span style={{ fontWeight: 600, letterSpacing: '0.01em' }}>Nakṣatra</span>
              </div>
              <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{isNakshatraOpen ? '▲' : '▼'}</span>
            </button>
            <div style={{
              overflow: 'hidden',
              maxHeight: isNakshatraOpen ? '800px' : '0',
              transition: 'max-height 0.3s ease-in-out',
              display: 'flex', flexDirection: 'column', gap: '0.1rem'
            }}>
              {NAKSHATRA_TABS.map(t => renderTab(t, true))}
            </div>

            <button
              type="button"
              onClick={togglePanchangOpen}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.36rem 0.48rem',
                background: 'transparent', border: 'none', borderLeft: '2px solid transparent',
                color: 'var(--text-secondary)', borderRadius: '0 var(--r-md) var(--r-md) 0', cursor: 'pointer', textAlign: 'left',
                fontFamily: 'var(--font-body)', fontSize: '0.8rem', transition: 'all 0.15s',
                letterSpacing: '0.02em',
                width: '100%',
                minHeight: 36,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.48rem' }}>
                <span style={{ fontSize: '0.92rem', opacity: 0.55 }} aria-hidden>📅</span>
                <span>Pañcāṅga</span>
              </div>
              <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{isPanchangOpen ? '▲' : '▼'}</span>
            </button>
            
            <div style={{
              overflow: 'hidden',
              maxHeight: isPanchangOpen ? '500px' : '0',
              transition: 'max-height 0.3s ease-in-out',
              display: 'flex', flexDirection: 'column', gap: '0.1rem'
            }}>
              {PANCHANG_TABS.map(t => renderTab(t, true))}
            </div>

            {MAIN_TABS.map(t => renderTab(t))}
          </nav>

          {/* Bottom Actions */}
          <div style={{ padding: '0.55rem 0.55rem 0.65rem', borderTop: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--gold)', opacity: 0.22, marginBottom: '0.15rem' }}>
              <div style={{ width: 20, height: 20 }} dangerouslySetInnerHTML={{ __html: VEDIC_ICONS.om }} />
            </div>
            <Link href="/astrology?new=true" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', paddingTop: '0.45rem', paddingBottom: '0.45rem', textDecoration: 'none' }}>
              + New Consultation
            </Link>
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