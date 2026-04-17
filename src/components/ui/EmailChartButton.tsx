'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/EmailChartButton.tsx
//  Email delivery button — prompts for target email and
//  calls /api/chart/send-email.
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import type { ChartOutput } from '@/types/astrology'

interface Props {
  chart: ChartOutput
  compact?: boolean
  style?: React.CSSProperties
}

export function EmailChartButton({ chart, compact = false, style }: Props) {
  const { data: session } = useSession()
  const plan = (session?.user as any)?.plan ?? 'free'
  const isFree = plan === 'free'

  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus]   = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  async function handleSend() {
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.')
      setStatus('error')
      return
    }

    setLoading(true)
    setStatus('idle')
    setErrorMsg('')

    try {
      const res = await fetch('/api/chart/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chart, targetEmail: email }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setStatus('success')
        setTimeout(() => {
          setIsOpen(false)
          setStatus('idle')
        }, 3000)
      } else {
        throw new Error(data.error || 'Failed to send email')
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error occurred')
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = () => {
    if (isFree) {
      window.location.href = '/pricing?highlight=gold'
      return
    }
    setIsOpen(!isOpen)
  }

  const isMobileCompactPopup = compact && isMobile

  return (
    <div style={{ position: 'relative', display: 'inline-block', ...style }}>
      <button
        onClick={handleToggle}
        disabled={loading}
        title={isFree ? 'Email delivery requires Gold plan' : `Email dossier to client`}
        style={{
          display:        'inline-flex',
          alignItems:     'center',
          gap:            6,
          padding:        compact ? '5px 10px' : '7px 16px',
          borderRadius:   'var(--r-sm, 6px)',
          border:         `1px solid ${isFree ? 'var(--border-soft)' : 'var(--teal-soft, #4ecdc480)'}`,
          background:     isFree ? 'transparent' : 'rgba(78,205,196,0.08)',
          color:          isFree ? 'var(--text-muted)' : 'var(--teal, #4ecdc4)',
          cursor:         'pointer',
          fontSize:       compact ? '0.7rem' : '0.8rem',
          fontWeight:     600,
          fontFamily:     'inherit',
          transition:     'all 0.15s',
          whiteSpace:     'nowrap',
        }}
      >
        {isFree ? '🔒 ' : '✉️ '}
        {compact ? 'Email' : 'Email to Client'}
      </button>

      {isOpen && isMobileCompactPopup && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.42)',
            zIndex: 2000,
          }}
        />
      )}

      {isOpen && (
        <div style={{
          position: isMobileCompactPopup ? 'fixed' : 'absolute',
          top: isMobileCompactPopup ? 'auto' : 'calc(100% + 8px)',
          bottom: isMobileCompactPopup ? 12 : 'auto',
          right: isMobileCompactPopup ? 12 : 0,
          left: isMobileCompactPopup ? 12 : 'auto',
          width: isMobileCompactPopup ? 'auto' : 260,
          maxWidth: isMobileCompactPopup ? 'none' : 'calc(100vw - 24px)',
          background: 'var(--surface-1, #fff)',
          border: '1px solid var(--border, #eee)',
          borderRadius: 'var(--r-md, 8px)',
          padding: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          zIndex: isMobileCompactPopup ? 2001 : 100,
          animation: 'fadeUp 0.2s ease-out'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
            Send Dossier via Email
          </div>
          
          {status === 'success' ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--teal)', padding: '8px 0', textAlign: 'center' }}>
              ✓ Sent successfully to {email}
            </div>
          ) : (
            <>
              <input 
                type="email"
                placeholder="client@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                  fontSize: '0.85rem',
                  marginBottom: '8px',
                  outline: 'none',
                  background: 'var(--surface-2)'
                }}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              
              {status === 'error' && (
                <div style={{ fontSize: '0.7rem', color: 'var(--rose)', marginBottom: 8 }}>
                  {errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={handleSend}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '6px',
                    background: 'var(--teal)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: loading ? 'wait' : 'pointer'
                  }}
                >
                  {loading ? 'Sending...' : 'Send Now'}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    padding: '6px 10px',
                    background: 'var(--surface-3)',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
