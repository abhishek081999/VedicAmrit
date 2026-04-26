'use client'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
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
      <Image src="/veda-icon.png" alt="Vedaansh" width={64} height={64} style={{ opacity: 0.7 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p style={{
          fontSize: '0.8rem',
          letterSpacing: '0.2em',
          color: 'var(--gold, #c9a84c)',
          textTransform: 'uppercase',
          margin: 0,
        }}>
          404 · Page Not Found
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display, "Playfair Display", serif)',
          fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
          fontWeight: 400,
          color: 'var(--text-primary, #f0ecff)',
          margin: 0,
          lineHeight: 1.2,
        }}>
          This page doesn&apos;t exist
        </h1>
        <p style={{
          color: 'var(--text-muted, #7a7498)',
          fontSize: '1rem',
          maxWidth: 400,
          margin: '0.25rem auto 0',
          lineHeight: 1.6,
        }}>
          The chart you&apos;re looking for may have been made private, or the link is incorrect.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
        <Link href="/" style={{
          padding: '0.6rem 1.5rem',
          background: 'var(--gold, #c9a84c)',
          color: 'var(--text-on-gold, #0e0e18)',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.9rem',
          textDecoration: 'none',
          letterSpacing: '0.02em',
        }}>
          ✦ New Chart
        </Link>
        <Link href="/panchang" style={{
          padding: '0.6rem 1.5rem',
          background: 'transparent',
          color: 'var(--text-secondary, #bbb5d8)',
          border: '1px solid var(--border, rgba(201,168,76,0.14))',
          borderRadius: 8,
          fontWeight: 500,
          fontSize: '0.9rem',
          textDecoration: 'none',
        }}>
          Daily Panchang
        </Link>
      </div>

      <p style={{
        marginTop: '2rem',
        fontSize: '0.75rem',
        color: 'var(--text-muted, #7a7498)',
        letterSpacing: '0.15em',
      }}>
        VEDAANSH · vedaansh.com
      </p>
    </div>
  )
}
