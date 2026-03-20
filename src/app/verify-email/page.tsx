'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided.')
      return
    }

    async function verify() {
      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const data = await res.json()

        if (data.success) {
          setStatus('success')
          setMessage('Email verified successfully! You can now sign in.')
          setTimeout(() => router.push('/login'), 3000)
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed.')
        }
      } catch (err) {
        setStatus('error')
        setMessage('A network error occurred.')
      }
    }

    verify()
  }, [token, router])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-deep)', padding: '2rem'
    }}>
      <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-gold)', marginBottom: '1.5rem' }}>
          Email Verification
        </h1>

        {status === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div className="spin-loader" style={{ width: 40, height: 40, borderTopColor: 'var(--gold)' }} />
            <p style={{ color: 'var(--text-muted)' }}>Verifying your email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="fade-up">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>{message}</p>
            <Link href="/login" className="btn btn-primary" style={{ display: 'inline-flex' }}>
              Go to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="fade-up">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
            <p style={{ color: 'var(--rose)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>{message}</p>
            <Link href="/signup" className="btn btn-ghost" style={{ display: 'inline-flex' }}>
              Back to Signup
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
