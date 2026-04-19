'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AdminSidebar({ user, onClose }: { user: any, onClose?: () => void }) {
  const pathname = usePathname()

  const links = [
    { href: '/admin', icon: '📊', label: 'Dashboard' },
    { href: '/admin/users', icon: '👥', label: 'Users' },
    { href: '/admin/charts', icon: '📚', label: 'Charts' },
    { href: '/admin/revenue', icon: '💰', label: 'Revenue' },
    { href: '/admin/reel', icon: '🎬', label: 'Reel Generator' },
    { href: '/admin/reel/video', icon: '🎞️', label: 'Reel Video' },
  ]

  return (
    <aside style={{
        width: '100%',
        height: '100%',
        background: 'var(--surface-2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-soft)' }}>
          <Link href="/admin" onClick={onClose} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🛡️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Admin</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 600 }}>Command Center</div>
            </div>
          </Link>
        </div>

        <nav style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {links.map(link => {
            const isActive = pathname === link.href
            return (
              <Link 
                key={link.href}
                href={link.href} 
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--r-md)',
                  textDecoration: 'none',
                  color: isActive ? 'var(--gold)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--gold-faint)' : 'transparent',
                  fontSize: '0.9rem',
                  transition: 'all 0.15s',
                  fontWeight: isActive ? 600 : 400,
                  borderLeft: `3px solid ${isActive ? 'var(--gold)' : 'transparent'}`,
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            )
          })}
          <div style={{ height: 1, background: 'var(--border-soft)', margin: '1rem 0' }} />
          <Link 
            href="/" 
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--r-md)',
              textDecoration: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem'
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>🏠</span>
            <span>Back to App</span>
          </Link>
        </nav>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gold)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {user.name?.[0]}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Administrator</div>
            </div>
          </div>
        </div>
      </aside>
  )
}