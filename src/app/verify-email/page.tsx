'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [status,  setStatus]  = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your email address...')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Missing verification token.')
      return
    }

    async function verify() {
      try {
        const res  = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await res.json()
        
        if (data.success) {
          setStatus('success')
          setMessage('Email verified! Redirecting to login...')
          setTimeout(() => router.push('/login'), 3000)
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed.')
        }
      } catch (err) {
        setStatus('error')
        setMessage('Network error during verification.')
      }
    }

    verify()
  }, [token, router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', padding: '2rem' }}>
      <div className="card fade-up" style={{ maxWidth: 420, width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>
          {status === 'loading' && '⌛'}
          {status === 'success' && '✅'}
          {status === 'error' && '❌'}
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
          {status === 'loading' ? 'Verifying...' : status === 'success' ? 'Email Verified' : 'Verification Error'}
        </h1>

        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
          {message}
        </p>

        {status !== 'loading' && (
          <Link href="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Continue to Login
          </Link>
        )}
      </div>
    </div>
  )
}
