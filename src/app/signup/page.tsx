'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/signup/page.tsx
//  Sign Up page — cosmic themed, registration flow
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default function SignupPage() {
  const router = useRouter()

  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [success,  setSuccess]  = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
        setLoading(false)
        return
      }

      setSuccess(data.message || 'Verification email sent. Please check your inbox.')
      setLoading(false)

    } catch (err) {
      setError('An error occurred during registration')
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
          background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)',
          top: '-100px', right: '10%',
          animation: 'orb-drift 22s ease-in-out infinite reverse',
        }} />
      </div>


      {/* ── Main ────────────────────────────────────────────── */}
      <main style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', position: 'relative', zIndex: 1
      }}>
        <div className="fade-up" style={{ width: '100%', maxWidth: 440 }}>
          <div className="card" style={{ padding: '2.5rem 2rem' }}>

            <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
              <h1 style={{ fontSize: '1.85rem', marginBottom: '0.55rem' }}>Start Your Journey</h1>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Join the platform to save charts and explore hidden patterns in time.
              </p>
            </div>

            {success ? (
              <div className="fade-up" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>📩</div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.8rem', color: 'var(--text-gold)' }}>Check your email</h2>
                <p style={{ color: 'var(--text-primary)', marginBottom: '2rem', lineHeight: 1.6 }}>
                  {success}
                </p>
                <Link href="/" className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>
                  Return to Home
                </Link>
              </div>
            ) : (
              <>
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

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                  <div>
                    <label className="field-label">Full Name</label>
                    <input
                      type="text"
                      className="input"
                      required
                      placeholder="Arjuna"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>

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
                    <label className="field-label">Password</label>
                    <input
                      type="password"
                      className="input"
                      required
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    By joining, you agree to our Terms and Privacy Policy.
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {loading ? 'Creating account…' : 'Explore the Stars'}
                  </button>
                </form>

                <div className="divider" style={{ margin: '1.75rem 0' }} />

                <button
                  onClick={() => signIn('google', { callbackUrl: '/' })}
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'center', gap: '0.8rem', border: '1px solid var(--border)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.84rem', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
                  Already have an account?{' '}
                  <Link href="/login" style={{ color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>
                    Sign In
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>

      <footer style={{
        padding: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)',
        fontFamily: 'var(--font-display)', letterSpacing: '0.02em'
      }}>
        Jyotiṣa · Advanced Vedic Astrology Software
      </footer>
    </div>
  )
}
