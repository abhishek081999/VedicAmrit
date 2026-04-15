
'use client'
import React, { useEffect, useState } from 'react'

export default function AdminChartsPage() {
  const [charts, setCharts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/charts')
      .then(r => r.json())
      .then(data => {
        if (data.success) setCharts(data.charts)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading repository...</div>

  return (
    <div className="admin-box">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Global Chart Repository</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{charts.length} Total Charts</span>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <th style={{ padding: '0.75rem' }}>Profile Name</th>
            <th style={{ padding: '0.75rem' }}>Owner</th>
            <th style={{ padding: '0.75rem' }}>Location</th>
            <th style={{ padding: '0.75rem' }}>Created</th>
          </tr>
        </thead>
        <tbody>
          {charts.map(c => (
            <tr key={c._id} style={{ borderBottom: '1px solid var(--border-soft)', fontSize: '0.9rem' }}>
              <td style={{ padding: '0.75rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.birthDate} {c.birthTime}</div>
              </td>
              <td style={{ padding: '0.75rem' }}>
                <div style={{ fontWeight: 500 }}>{c.userId?.name || 'Unknown'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.userId?.email || '--'}</div>
              </td>
              <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                {c.birthPlace}
              </td>
              <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                {new Date(c.createdAt).toLocaleDateString()}
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
