'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/forgot/page.tsx
//  Forgot Password page — request a reset link by email
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [sent,    setSent]    = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
      } else {
        setSent(true)
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* ── Ambient orb ──────────────────────────────────────── */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', width: 500, height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)',
          top: '-80px', left: '20%',
          animation: 'orb-drift 18s ease-in-out infinite',
        }} />
      </div>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', position: 'relative', zIndex: 1,
      }}>
        <div className="fade-up" style={{ width: '100%', maxWidth: 420 }}>
          <div className="card" style={{ padding: '2.5rem 2rem' }}>

            {sent ? (
              /* ── Success state ──────────────────────────────── */
              <div className="fade-up" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem' }}>📬</div>
                <h1 style={{ fontSize: '1.6rem', marginBottom: '0.6rem' }}>Check Your Inbox</h1>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
                  If <strong>{email}</strong> is registered with a password, a reset link has been sent.
                  The link expires in <strong>1 hour</strong>.
                </p>
                <Link
                  href="/login"
                  className="btn btn-ghost"
                  style={{ fontSize: '0.85rem', display: 'inline-flex' }}
                >
                  ← Back to Sign In
                </Link>
              </div>
            ) : (
              /* ── Form state ─────────────────────────────────── */
              <>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{ fontSize: '2.4rem', marginBottom: '0.75rem' }}>🔑</div>
                  <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Forgot Password?</h1>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Enter the email address linked to your account and we&apos;ll send you a reset link.
                  </p>
                </div>

                {error && (
                  <div style={{
                    padding: '0.75rem 1rem', borderRadius: 'var(--r-md)',
                    background: 'rgba(224,123,142,0.1)', border: '1px solid rgba(224,123,142,0.2)',
                    color: 'var(--rose)', fontSize: '0.82rem', marginBottom: '1.5rem',
                    textAlign: 'center',
                  }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label className="field-label">Email Address</label>
                    <input
                      id="forgot-email"
                      type="email"
                      className="input"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      autoFocus
                    />
                  </div>

                  <button
                    id="forgot-submit"
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}
                  >
                    {loading ? 'Sending…' : 'Send Reset Link'}
                  </button>
                </form>

                <p style={{ textAlign: 'center', fontSize: '0.82rem', marginTop: '1.75rem', color: 'var(--text-muted)' }}>
                  Remembered it?{' '}
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
        fontFamily: 'var(--font-display)', letterSpacing: '0.02em',
      }}>
        Jyotiṣa · The Eye of the Vedas
      </footer>
    </div>
  )
}
