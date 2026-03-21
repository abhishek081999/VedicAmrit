'use client'
// ─────────────────────────────────────────────────────────
//  ThemeToggle.tsx
//  Icon button – toggles data-theme on <html>
//  Persists to localStorage as 'jyotish-theme'
// ─────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'

type ThemeType = 'dark' | 'light' | 'classic'

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeType>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('jyotish-theme') as ThemeType | null
    const initial = stored && ['dark', 'light', 'classic'].includes(stored) ? stored : 'dark'
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
    setMounted(true)
  }, [])

  const toggle = () => {
    const nextThemeMap: Record<ThemeType, ThemeType> = {
      dark: 'light',
      light: 'classic',
      classic: 'dark'
    }
    const next = nextThemeMap[theme] || 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('jyotish-theme', next)
  }

  if (!mounted) return null

  let icon = '☀️'
  let label = 'Light'
  let transform = 'rotate(0deg) scale(1)'

  if (theme === 'dark') {
    icon = '☀️'
    label = 'Light'
    transform = 'rotate(0deg) scale(1)'
  } else if (theme === 'light') {
    icon = '📜'
    label = 'Classic'
    transform = 'rotate(360deg) scale(1.1)'
  } else if (theme === 'classic') {
    icon = '🌙'
    label = 'Dark'
    transform = 'rotate(180deg) scale(1)'
  }

  return (
    <button
      id="theme-toggle-btn"
      onClick={toggle}
      aria-label={`Switch to ${label} theme`}
      title={`Switch to ${label} theme`}
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
        transform,
        fontSize: '1rem',
        lineHeight: 1,
      }}>
        {icon}
      </span>
      <span style={{
        fontSize: '0.72rem',
        fontFamily: 'var(--font-display)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </button>
  )
}
