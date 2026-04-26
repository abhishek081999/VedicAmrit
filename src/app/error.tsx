'use client'
import React, { useEffect } from 'react'
import Image from 'next/image'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Vedaansh error]', error)
  }, [error])

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.5rem',
      padding: '3rem 1.5rem',
      background: 'var(--bg-page, #09090f)',
      textAlign: 'center',
    }}>
      <Image src="/veda-icon.png" alt="Vedaansh" width={64} height={64} style={{ opacity: 0.5 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p style={{
          fontSize: '0.8rem',
          letterSpacing: '0.2em',
          color: 'var(--rose, #e07b8e)',
          textTransform: 'uppercase',
          margin: 0,
        }}>
          Something went wrong
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display, "Playfair Display", serif)',
          fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
          fontWeight: 400,
          color: 'var(--text-primary, #f0ecff)',
          margin: 0,
          lineHeight: 1.2,
        }}>
          An unexpected error occurred
        </h1>
        <p style={{
          color: 'var(--text-muted, #7a7498)',
          fontSize: '1rem',
          maxWidth: 400,
          margin: '0.25rem auto 0',
          lineHeight: 1.6,
        }}>
          The stars aligned unexpectedly. Refreshing usually fixes it.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
        <button
          onClick={reset}
          style={{
            padding: '0.6rem 1.5rem',
            background: 'var(--gold, #c9a84c)',
            color: 'var(--text-on-gold, #0e0e18)',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: '0.9rem',
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '0.02em',
          }}
        >
          Try Again
        </button>
        <a
          href="/"
          style={{
            padding: '0.6rem 1.5rem',
            background: 'transparent',
            color: 'var(--text-secondary, #bbb5d8)',
            border: '1px solid var(--border, rgba(201,168,76,0.14))',
            borderRadius: 8,
            fontWeight: 500,
            fontSize: '0.9rem',
            textDecoration: 'none',
          }}
        >
          Go Home
        </a>
      </div>

      {error.digest && (
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted, #7a7498)', fontFamily: 'monospace', marginTop: '0.5rem' }}>
          Error ID: {error.digest}
        </p>
      )}
    </div>
  )
}
