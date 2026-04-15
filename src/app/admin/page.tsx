'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/admin/page.tsx
//  Main Admin Dashboard — Summary stats and charts.
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react'

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats')
        const json = await res.json()
        if (json.success) {
          setStats(json.stats)
        } else {
          setError(json.error || 'Failed to fetch stats')
        }
      } catch {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading system telemetry...</div>
  if (error) return <div style={{ color: 'var(--rose)' }}>Error: {error}</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ── Key Metrics ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <StatCard label="Total Users" value={stats.overview.totalUsers} icon="👥" color="var(--teal)" />
        <StatCard label="Total Charts" value={stats.overview.totalCharts} icon="🌌" color="var(--gold)" />
        <StatCard label="Active Subscriptions" value={stats.overview.activeSubscriptions} icon="💎" color="var(--accent)" />
        <StatCard label="System Uptime" value={`${Math.floor(stats.system.uptime / 3600)}h ${Math.floor((stats.system.uptime % 3600) / 60)}m`} icon="⚡" color="var(--rose)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        
        {/* ── Plan Distribution ──────────────────────────────── */}
        <div className="admin-box">
          <h3>Plan Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            <ProgressLine label="Free" value={stats.distribution.free ?? 0} total={stats.overview.totalUsers} color="var(--text-muted)" />
            <ProgressLine label="Gold" value={stats.distribution.gold ?? 0} total={stats.overview.totalUsers} color="var(--gold)" />
            <ProgressLine label="Platinum" value={stats.distribution.platinum ?? 0} total={stats.overview.totalUsers} color="var(--accent)" />
          </div>
        </div>

        {/* ── System Health ──────────────────────────────────── */}
        <div className="admin-box">
          <h3>System Health</h3>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Memory Usage</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stats.system.memoryUsage.toFixed(1)} MB</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Node.js Version</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stats.system.nodeVersion}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ───────────────────────────────────── */}
      <div className="admin-box">
        <h3>System Command Center</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
          <AdminAction icon="➕" label="Create Promo Code" sub="WIP / Marketing" />
          <AdminAction icon="📢" label="Global Announcement" sub="Notify all users" />
          <AdminAction icon="🧹" label="Cache Cleanup" sub="Refresh Upstash Redis" />
          <AdminAction icon="🛡️" label="Audit Logs" sub="View system events" />
        </div>
      </div>

      {/* ── Recent Activity ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="admin-box">
          <h3>Recent Signups</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: '0.85rem' }}>
            <tbody>
              {stats.recentActivities.users.map((u: any) => (
                <tr key={u._id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '0.75rem 0', fontWeight: 600 }}>{u.name}</td>
                  <td style={{ padding: '0.75rem 0', color: 'var(--text-muted)' }}>{u.plan}</td>
                  <td style={{ padding: '0.75rem 0', textAlign: 'right', fontSize: '0.75rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-box">
          <h3>Recent Charts</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: '0.85rem' }}>
            <tbody>
              {stats.recentActivities.charts.map((c: any) => (
                <tr key={c._id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '0.75rem 0', fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: '0.75rem 0', color: 'var(--text-muted)' }}>{c.birthPlace}</td>
                  <td style={{ padding: '0.75rem 0', textAlign: 'right', fontSize: '0.75rem' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .admin-box {
          background: var(--surface-1);
          border: 1px solid var(--border);
          border-radius: var(--r-lg);
          padding: 1.5rem;
        }
        h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
        }
      `}</style>
    </div>
  )
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    }}>
      <div style={{ 
        width: 48, height: 48, borderRadius: 'var(--r-md)', 
        background: `${color}15`, color: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
      </div>
    </div>
  )
}

function ProgressLine({ label, value, total, color }: any) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ color: 'var(--text-muted)' }}>{value} users ({pct.toFixed(1)}%)</span>
      </div>
      <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 0.6s ease-out' }} />
      </div>
    </div>
  )
}

function AdminAction({ icon, label, sub }: any) {
  return (
    <div style={{
      padding: '1rem',
      borderRadius: 'var(--r-md)',
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      cursor: 'not-allowed',
      opacity: 0.8,
      transition: 'all 0.15s'
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  )
}
