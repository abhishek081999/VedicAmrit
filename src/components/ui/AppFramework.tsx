'use client'
import React, { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAppLayout } from '@/components/providers/LayoutProvider'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const TABS: { id: string; label: string; icon: string; path?: string }[] = [
  { id: 'dashboard', label: 'Dashboard',   icon: '◫', path: '/' },
  { id: 'planets',   label: 'Planets',     icon: '✦', path: '/' },
  { id: 'dasha',     label: 'Daśā',        icon: '⏳', path: '/' },
  { id: 'ashtakavarga', label: 'Aṣṭakavarga',  icon: '⬡', path: '/' },
  { id: 'yogas',        label: 'Yogas',         icon: '✧', path: '/' },
  { id: 'varshaphal',   label: 'Varṣaphal',     icon: '☀', path: '/' },
  { id: 'shadbala',  label: 'Ṣaḍbala',      icon: '⚖', path: '/' },
  { id: 'panchang',  label: 'Natal Pañcāṅga', icon: '📅', path: '/' },
  { id: 'muhurta',          label: 'Muhūrta Finder',  icon: '🔍', path: '/muhurta' },
  { id: 'monthly-panchang', label: 'Monthly Calendar', icon: '🗓', path: '/panchang/calendar' },
  { id: 'daily-panchang', label: 'Daily Pañcāṅga', icon: '📅', path: '/panchang' },
  { id: 'arudhas',   label: 'Āruḍhas',     icon: '☯', path: '/' },
]

export function AppFramework({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const { isSidenavOpen, setIsSidenavOpen, activeTab, setActiveTab } = useAppLayout()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row', position: 'relative', overflow: 'hidden', background: 'var(--bg-page)' }}>
      
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
        className="sidenav"
        style={{
          width: 250, flexShrink: 0,
          background: 'var(--surface-2)',
          borderRight: '1px solid var(--border)',
          zIndex: 50, display: 'flex', flexDirection: 'column',
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
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-gold)', letterSpacing: '0.05em' }}>Vedic Amrit</span>
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
          {TABS.map(t => {
            const isCurrentPage = (t.path === pathname)
            const isActive = t.path === '/' ? (isCurrentPage && activeTab === t.id) : isCurrentPage
            const handleNav = () => {
              setActiveTab(t.id)
              if (window.innerWidth < 1024) setIsSidenavOpen(false)
            }
            const style: React.CSSProperties = {
              display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.65rem 0.75rem',
              background: isActive ? 'var(--gold-faint)' : 'transparent', border: 'none',
              borderLeft: `3px solid ${isActive ? 'var(--gold)' : 'transparent'}`,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderRadius: '0 var(--r-md) var(--r-md) 0', cursor: 'pointer', textAlign: 'left',
              fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem', transition: 'all 0.15s',
              width: '100%', textDecoration: 'none'
            }
            return (
              <Link key={t.id} href={t.path || '/'} onClick={handleNav} style={style}>
                 <span style={{ fontSize: '1rem', opacity: isActive ? 1 : 0.5 }}>{t.icon}</span>
                 <span style={{ fontWeight: isActive ? 600 : 400 }}>{t.label}</span>
              </Link>
            )
          })}
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
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', position: 'relative',
          zIndex: 1, overflowY: 'auto', minWidth: 0,
          marginLeft: isSidenavOpen ? 250 : 0,
          transition: 'margin-left 0.4s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Top Header */}
        <header style={{
          padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid var(--header-border)`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          position: 'sticky', top: 0, zIndex: 40, background: 'var(--header-bg)', gap: '1rem',
          transition: 'background 0.3s ease'
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
            {!isSidenavOpen && (
              <span className="fade-in" style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-gold)', letterSpacing: '0.02em' }}>
                Vedic Amrit
              </span>
            )}
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <nav style={{ display: 'flex', gap: '1.5rem' }}>
              <Link href="/panchang" style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--header-text-muted)', textDecoration: 'none', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Pañcāṅga</Link>
              <Link href="/my/charts" style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--header-text-muted)', textDecoration: 'none', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Library</Link>
            </nav>
            <div style={{ width: 1, height: 16, background: 'var(--border-soft)' }} />
            <ThemeToggle />
          </div>
        </header>

        {/* Dynamic Content */}
        <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </main>

    </div>
  )
}