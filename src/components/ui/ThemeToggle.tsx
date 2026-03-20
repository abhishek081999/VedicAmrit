'use client'
// ─────────────────────────────────────────────────────────
//  ThemeToggle.tsx
//  Sun / Moon icon button – toggles data-theme on <html>
//  Persists to localStorage as 'jyotish-theme'
// ─────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('jyotish-theme') as 'dark' | 'light' | null
    const initial = stored ?? 'dark'
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
    setMounted(true)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('jyotish-theme', next)
  }

  if (!mounted) return null

  return (
    <button
      id="theme-toggle-btn"
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      style={{
        background: 'var(--surface-3)',
        border: '1px solid var(--border)',
        borderRadius: '99px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.35rem 0.75rem',
        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
        color: 'var(--text-secondary)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-bright)'
        e.currentTarget.style.boxShadow = '0 0 12px var(--glow-gold-sm)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <span style={{
        display: 'inline-block',
        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s',
        transform: theme === 'light' ? 'rotate(180deg) scale(1.1)' : 'rotate(0deg) scale(1)',
        fontSize: '1rem',
        lineHeight: 1,
      }}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </span>
      <span style={{
        fontSize: '0.72rem',
        fontFamily: 'var(--font-display)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        {theme === 'dark' ? 'Light' : 'Dark'}
      </span>
    </button>
  )
}
