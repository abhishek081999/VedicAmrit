
'use client'
import React, { useEffect, useState } from 'react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => {
        if (data.success) setUsers(data.users)
        setLoading(false)
      })
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

  if (loading) return <div>Loading users...</div>

  return (
    <div className="admin-box">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>User Management</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{users.length} Total Users</span>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <th style={{ padding: '0.75rem' }}>User</th>
            <th style={{ padding: '0.75rem' }}>Plan</th>
            <th style={{ padding: '0.75rem' }}>Role</th>
            <th style={{ padding: '0.75rem' }}>Joined</th>
            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id} style={{ borderBottom: '1px solid var(--border-soft)', fontSize: '0.9rem' }}>
              <td style={{ padding: '0.75rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
              </td>
              <td style={{ padding: '0.75rem' }}>
                <span style={{ 
                  padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                  background: u.plan === 'platinum' ? 'var(--accent-faint)' : u.plan === 'gold' ? 'var(--gold-faint)' : 'var(--surface-3)',
                  color: u.plan === 'platinum' ? 'var(--accent)' : u.plan === 'gold' ? 'var(--gold)' : 'var(--text-secondary)'
                }}>
                  {u.plan}
                </span>
              </td>
              <td style={{ padding: '0.75rem' }}>
                 <span style={{ color: u.role === 'admin' ? 'var(--rose)' : 'inherit', fontWeight: u.role === 'admin' ? 700 : 400 }}>
                   {u.role}
                 </span>
              </td>
              <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                {new Date(u.createdAt).toLocaleDateString()}
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                <button 
                  onClick={() => toggleAdmin(u._id, u.role)}
                  style={{
                    padding: '0.35rem 0.75rem', borderRadius: 6, border: '1px solid var(--border)',
                    background: 'var(--surface-2)', fontSize: '0.75rem', cursor: 'pointer',
                    color: 'var(--text-primary)'
                  }}
                >
                  {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .admin-box {
          background: var(--surface-1);
          border: 1px solid var(--border);
          border-radius: var(--r-lg);
          padding: 1.5rem;
        }
      `}</style>
    </div>
  )
}
