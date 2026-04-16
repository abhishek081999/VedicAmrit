'use client'
import React, { useEffect, useState } from 'react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => {
        if (data.success) setUsers(data.users)
        setLoading(false)
      })
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleAdmin = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin'
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, updates: { role: nextRole } })
    })
    if (res.ok) {
      setUsers(users.map(u => u._id === userId ? { ...u, role: nextRole } : u))
    }
  }

  const filtered = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem 0' }}>
      <div className="spinner" style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <style jsx>{` @keyframes spin { to { transform: rotate(360deg); } } `}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* ── Header Area ──────────────────────────────────────── */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center', 
        gap: '1rem' 
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '1.5rem' : '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            User Management
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Manage permissions, plans, and system access for {users.length} unique accounts.
          </p>
        </div>
        
        <div style={{ position: 'relative', width: isMobile ? '100%' : '300px' }}>
          <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
          <input 
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.7rem 1rem 0.7rem 2.5rem',
              background: 'var(--surface-1)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--gold)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
      </div>

      {/* ── Users Table ─────────────────────────────────────── */}
      <div style={{ 
        background: 'var(--surface-1)', 
        border: '1px solid var(--border)', 
        borderRadius: 'var(--r-xl)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                {[
                  { label: 'Identified User', width: '35%' },
                  { label: 'Access Plan', width: '15%' },
                  { label: 'System Role', width: '15%' },
                  { label: 'Joined Date', width: '15%' },
                  { label: 'Executive Actions', width: '20%', align: 'right' }
                ].map((th, i) => (
                  <th key={i} style={{ 
                    width: th.width,
                    padding: '1.1rem 1.5rem', 
                    textAlign: (th.align as any) || 'left',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)'
                  }}>
                    {th.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr 
                  key={u._id} 
                  className="user-row"
                  style={{ 
                    borderBottom: i === filtered.length - 1 ? 'none' : '1px solid var(--border-soft)',
                    transition: 'all 0.15s'
                  }}
                >
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{ 
                        width: 40, height: 40, borderRadius: 'var(--r-md)', 
                        background: u.role === 'admin' ? 'var(--rose-faint)' : 'var(--gold-faint)', 
                        color: u.role === 'admin' ? 'var(--rose)' : 'var(--gold)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem',
                        boxShadow: 'inset 0 0 0 1px currentColor'
                      }}>
                        {u.name?.[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{u.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ 
                      padding: '0.3rem 0.6rem', borderRadius: 6, fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase',
                      background: u.plan === 'platinum' ? 'var(--accent-faint)' : u.plan === 'gold' ? 'var(--gold-faint)' : 'var(--surface-3)',
                      color: u.plan === 'platinum' ? 'var(--accent)' : u.plan === 'gold' ? 'var(--gold)' : 'var(--text-secondary)',
                      border: `1px solid currentColor`
                    }}>
                      {u.plan}
                    </span>
                  </td>

                  <td style={{ padding: '1rem 1.5rem' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                       <span style={{ width: 6, height: 6, borderRadius: '50%', background: u.role === 'admin' ? 'var(--rose)' : 'var(--text-muted)' }}></span>
                       <span style={{ fontSize: '0.85rem', color: u.role === 'admin' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: u.role === 'admin' ? 700 : 400 }}>
                         {u.role}
                       </span>
                     </div>
                  </td>

                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>

                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button 
                        onClick={() => toggleAdmin(u._id, u.role)}
                        title={u.role === 'admin' ? 'Revoke Admin Privileges' : 'Grant Admin Privileges'}
                        style={{
                          width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)',
                          background: 'var(--surface-1)', cursor: 'pointer', transition: 'all 0.15s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: u.role === 'admin' ? 'var(--rose)' : 'var(--text-muted)'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--gold)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-1)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                      >
                        {u.role === 'admin' ? '🚫' : '🛡️'}
                      </button>
                      <button 
                        title="View Full Profile"
                        style={{
                          width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)',
                          background: 'var(--surface-1)', cursor: 'pointer', transition: 'all 0.15s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--gold)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-1)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                      >
                        👁️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔦</div>
                    <div style={{ fontWeight: 600 }}>No users found matching &quot;{search}&quot;</div>
                    <div style={{ fontSize: '0.8rem' }}>Try adjusting your search criteria</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .user-row:hover {
          background: rgba(var(--gold-rgb, 201, 168, 76), 0.04);
        }
      `}</style>
    </div>
  )
}
