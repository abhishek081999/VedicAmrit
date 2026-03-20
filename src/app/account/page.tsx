'use client'
import React, { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

interface PersonalChart {
  name:       string
  birthDate:  string
  birthTime:  string
  birthPlace: string
  latitude:   number
  longitude:  number
  timezone:   string
}

export default function AccountPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [personalChart, setPersonalChart] = useState<PersonalChart | null>(null)
  const [loadingMe, setLoadingMe] = useState(true)

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/user/me')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.personalChart) {
            setPersonalChart(data.personalChart)
          }
        })
        .finally(() => setLoadingMe(false))
    }
  }, [status])

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  if (status === 'loading' || (status === 'authenticated' && loadingMe)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spin-loader" style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--gold)' }} />
      </div>
    )
  }

  const user = session?.user

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>


      {/* ── Main ────────────────────────────────────────────── */}
      <main style={{ flex: 1, maxWidth: 1000, width: '100%', margin: '0 auto', padding: '3.5rem 1.5rem' }}>

        <div className="fade-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, var(--gold), var(--accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--glow-gold)'
            }}>
              {user?.image ? (
                <img 
                  src={user.image} 
                  alt={user.name || 'Profile'} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <span style={{ fontSize: '2rem', color: 'white', fontWeight: 600 }}>
                  {user?.name?.[0] || user?.email?.[0] || 'U'}
                </span>
              )}
            </div>
            <div>
              <h1 style={{ marginBottom: '0.25rem', fontSize: '2.4rem' }}>{user?.name || 'Vedic Soul'}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>{user?.email}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

            {/* Account Details */}
            <section className="card">
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                👤 Personal Details
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label className="field-label">Name</label>
                  <p style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>{user?.name}</p>
                </div>
                <div>
                  <label className="field-label">Email</label>
                  <p style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>{user?.email}</p>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
                  Edit Profile
                </button>
              </div>
            </section>

            {/* My Birth Chart */}
            <section className="card card-gold">
               <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                🪐 My Birth Details
              </h2>
              {personalChart ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500, marginBottom: '0.25rem' }}>{personalChart.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {personalChart.birthDate} · {personalChart.birthTime.slice(0, 5)}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      📍 {personalChart.birthPlace}
                    </div>
                  </div>
                  <Link 
                    href={`/?name=${personalChart.name}&birthDate=${personalChart.birthDate}&birthTime=${personalChart.birthTime}&birthPlace=${personalChart.birthPlace}&lat=${personalChart.latitude}&lng=${personalChart.longitude}&tz=${personalChart.timezone}`}
                    className="btn btn-primary btn-sm"
                    style={{ justifyContent: 'center' }}
                  >
                    Load My Chart
                  </Link>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                    You haven't set your own birth details yet.
                  </p>
                  <Link href="/" className="btn btn-ghost btn-sm">
                    Set Birth Details
                  </Link>
                </div>
              )}
            </section>

            {/* Plan / Subscription */}
            <section className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  💎 Membership
                </h2>
                <span className="badge badge-gold" style={{ padding: '0.3rem 0.7rem' }}>
                   {(user as any)?.plan || 'Kāla'} Plan
                </span>
              </div>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                You are currently on the <strong>{(user as any)?.plan || 'Free Kāla'}</strong> tier. 
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link href="/pricing" className="btn btn-accent btn-sm" style={{ justifyContent: 'center' }}>
                  Manage Subscription
                </Link>
              </div>
            </section>
          </div>

          {/* Quick Links */}
          <div style={{ marginTop: '3.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '1.25rem' }}>Quick Actions</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              <Link href="/my/charts" className="stat-chip" style={{ textDecoration: 'none' }}>
                <div className="stat-label">Dashboard</div>
                <div className="stat-value">Saved Charts</div>
                <div className="stat-sub">View & Manage history</div>
              </Link>
              <Link href="/" className="stat-chip" style={{ textDecoration: 'none' }}>
                <div className="stat-label">Calculator</div>
                <div className="stat-value">New Chart</div>
                <div className="stat-sub">Cast a new birth chart</div>
              </Link>
              <div onClick={() => signOut({ callbackUrl: '/' })} className="stat-chip" style={{ cursor: 'pointer' }}>
                <div className="stat-label" style={{ color: 'var(--rose)' }}>Session</div>
                <div className="stat-value" style={{ color: 'var(--rose)' }}>Sign Out</div>
                <div className="stat-sub">End current session</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer style={{
        padding: '2rem', textAlign: 'center', color: 'var(--text-muted)',
        fontFamily: 'var(--font-display)', borderTop: '1px solid var(--border-soft)'
      }}>
        © 2026 Jyotiṣa · Advanced Vedic Astrology Software
      </footer>
    </div>
  )
}
