
'use client'
import React, { useEffect, useState } from 'react'

export default function AdminRevenuePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/revenue')
      .then(r => r.json())
      .then(d => {
        if (d.success) setData(d.revenue)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Calculating financials...</div>
  if (!data) return <div>No revenue data found.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ── Revenue Overview ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <RevenueCard label="Est. MRR" value={`₹${data.mrrEstimate.toLocaleString()}`} icon="📈" color="var(--teal)" />
        <RevenueCard label="Active Subs" value={data.activeSubscriptions} icon="💎" color="var(--gold)" />
        <RevenueCard label="Total Subs" value={data.totalSubscriptions} icon="🧾" color="var(--accent)" />
      </div>

      <div className="admin-box">
        <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Subscription History</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.75rem' }}>Customer</th>
              <th style={{ padding: '0.75rem' }}>Plan</th>
              <th style={{ padding: '0.75rem' }}>Status</th>
              <th style={{ padding: '0.75rem' }}>Amount</th>
              <th style={{ padding: '0.75rem' }}>End Date</th>
            </tr>
          </thead>
          <tbody>
            {data.subscriptions.map((s: any) => (
              <tr key={s._id} style={{ borderBottom: '1px solid var(--border-soft)', fontSize: '0.85rem' }}>
                <td style={{ padding: '0.75rem' }}>
                  <div style={{ fontWeight: 600 }}>{s.userId?.name || 'Unknown'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.userId?.email || '--'}</div>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{ textTransform: 'capitalize' }}>{s.plan}</span> ({s.interval})
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{ 
                    padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                    background: s.status === 'active' ? 'rgba(78,205,196,0.1)' : 'var(--surface-3)',
                    color: s.status === 'active' ? 'var(--teal)' : 'var(--text-muted)'
                  }}>
                    {s.status}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                  {s.currency} {(s.amount / 100).toFixed(2)}
                </td>
                <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(s.currentPeriodEnd).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

function RevenueCard({ label, value, icon, color }: any) {
  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
      </div>
    </div>
  )
}
