
'use client'
import React, { useEffect, useState } from 'react'

export default function AdminChartsPage() {
  const [charts, setCharts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    fetch('/api/admin/charts')
      .then(r => r.json())
      .then(data => {
        if (data.success) setCharts(data.charts)
        setLoading(false)
      })
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const filtered = charts.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.birthPlace?.toLowerCase().includes(search.toLowerCase()) ||
    c.userId?.name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem 0' }}>
      <div className="spinner" style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <style jsx>{` @keyframes spin { to { transform: rotate(360deg); } } `}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* ── Header Area ───────────────────────────────────────── */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center', 
        gap: '1rem' 
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '1.5rem' : '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Global Chart Repository
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Browse and manage the collective intelligence of {charts.length} sidereal horoscopes.
          </p>
        </div>
        
        <div style={{ position: 'relative', width: isMobile ? '100%' : '300px' }}>
          <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
          <input 
            type="text"
            placeholder="Search charts, owners, locations..."
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

      <div style={{ 
        background: 'var(--surface-1)', 
        border: '1px solid var(--border)', 
        borderRadius: 'var(--r-xl)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                {[
                  { label: 'Chart Profile', width: '30%' },
                  { label: 'Owner Account', width: '25%' },
                  { label: 'Point of Origin', width: '25%' },
                  { label: 'Calculation Date', width: '20%', align: 'right' }
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
              {filtered.map((c, i) => (
                <tr 
                  key={c._id} 
                  className="chart-row"
                  style={{ 
                    borderBottom: i === filtered.length - 1 ? 'none' : '1px solid var(--border-soft)',
                    transition: 'all 0.15s'
                  }}
                >
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{ 
                        width: 38, height: 38, borderRadius: 'var(--r-md)', 
                        background: 'var(--surface-3)', color: 'var(--gold)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
                      }}>
                        🌌
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{c.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                          {c.birthDate} · {c.birthTime}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {c.userId?.name || 'Guest Explorer'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {c.userId?.email || '--'}
                    </div>
                  </td>

                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <span>📍</span>
                      <span style={{ fontWeight: 500 }}>{c.birthPlace}</span>
                    </div>
                  </td>

                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📜</div>
                    <div style={{ fontWeight: 600 }}>No astronomical records match your query</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .chart-row:hover {
          background: rgba(var(--gold-rgb, 201, 168, 76), 0.04);
        }
      `}</style>
    </div>
  )
}
