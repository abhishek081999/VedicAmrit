'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/login/page.tsx
//  Sign In page — cosmic themed, supports Credentials + Google
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const errorParam = searchParams.get('error')

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(errorParam === 'CredentialsSignin' ? 'Invalid email or password' : null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* ── Ambient background ─────────────────────────────── */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', width: 600, height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,124,246,0.08) 0%, transparent 70%)',
          top: '-100px', left: '10%',
          animation: 'orb-drift 20s ease-in-out infinite',
        }} />
      </div>

      {/* ── Header ──────────────────────────────────────────── */}
      <header style={{
        padding: '0 2rem', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(16px)',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--header-bg)',
        borderBottom: '1px solid var(--border-soft)',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <span style={{ fontSize: '1.4rem' }}>🪐</span>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '1.2rem',
            fontWeight: 400, color: 'var(--text-gold)', letterSpacing: '0.05em'
          }}>Jyotiṣa</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* ── Main ────────────────────────────────────────────── */}
      <main style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', position: 'relative', zIndex: 1
      }}>
        <div className="fade-up" style={{ width: '100%', maxWidth: 420 }}>
          <div className="card" style={{ padding: '2.5rem 2rem' }}>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Welcome Back</h1>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Sign in to access your saved charts and cosmic insights.
              </p>
            </div>

            {error && (
              <div style={{
                padding: '0.75rem 1rem', borderRadius: 'var(--r-md)',
                background: 'rgba(224,123,142,0.1)', border: '1px solid rgba(224,123,142,0.2)',
                color: 'var(--rose)', fontSize: '0.82rem', marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="field-label">Email Address</label>
                <input
                  type="email"
                  className="input"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <label className="field-label">Password</label>
                  <Link href="/forgot" style={{ fontSize: '0.72rem', color: 'var(--gold)', textDecoration: 'none' }}>
                    Forgot?
                  </Link>
                </div>
                <input
                  type="password"
                  className="input"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <div className="divider" style={{ margin: '1.75rem 0' }} />

            <button
              onClick={() => signIn('google', { callbackUrl })}
              className="btn btn-ghost"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '0.5rem' }}>
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.82rem', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <Link href="/signup" style={{ color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer style={{
        padding: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)',
        fontFamily: 'var(--font-display)', letterSpacing: '0.02em'
      }}>
        Jyotiṣa · The Eye of the Vedas
      </footer>
    </div>
  )
}
