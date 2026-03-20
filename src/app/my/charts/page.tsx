'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/my/charts/page.tsx
//  Saved charts dashboard — lists all charts for logged-in user
//  Click a chart → loads it into the main calculator on home page
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

// ── Types ─────────────────────────────────────────────────────

interface SavedChart {
  _id:        string
  name:       string
  birthDate:  string
  birthTime:  string
  birthPlace: string
  latitude:   number
  longitude:  number
  timezone:   string
  settings:   Record<string, unknown>
  isPublic:   boolean
  isPersonal: boolean
  slug:       string | null
  createdAt:  string
}

interface Pagination {
  page: number; limit: number; total: number; pages: number
}

// ── Helpers ───────────────────────────────────────────────────

const RASHI = ['','Ar','Ta','Ge','Cn','Le','Vi','Li','Sc','Sg','Cp','Aq','Pi']

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00Z')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function fmtSaved(iso: string): string {
  const d   = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30)  return `${days}d ago`
  return fmtDate(iso.slice(0, 10))
}

// ── Chart Card ────────────────────────────────────────────────

function ChartCard({
  chart, onLoad, onDelete,
}: {
  chart: SavedChart
  key?:     string
  onLoad:   (c: SavedChart) => void
  onDelete: (id: string)    => void | Promise<void>
}) {
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  async function handleDelete() {
    if (!confirmDel) { setConfirmDel(true); return }
    setDeleting(true)
    await onDelete(chart._id)
    setDeleting(false)
  }

  return (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: '1.1rem 1.25rem',
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
      transition: 'border-color 0.15s, box-shadow 0.15s',
      cursor: 'default',
    }}
    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.borderColor = 'var(--border-bright)'
      e.currentTarget.style.boxShadow = 'var(--shadow-card)'
    }}
    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.borderColor = 'var(--border)'
      e.currentTarget.style.boxShadow = 'none'
    }}
    >
      {/* Name + public badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: '1.05rem',
          fontWeight: 600, color: 'var(--text-primary)', flex: 1,
        }}>
          {chart.name}
        </span>
        {chart.isPersonal && (
          <span className="badge badge-gold" style={{ fontSize: '0.62rem' }}>Personal</span>
        )}
        {chart.isPublic && (
          <span className="badge badge-accent" style={{ fontSize: '0.62rem' }}>Public</span>
        )}
      </div>

      {/* Birth info */}
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
        color: 'var(--text-secondary)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
      }}>
        <span>📅 {fmtDate(chart.birthDate)}</span>
        <span>🕐 {chart.birthTime.slice(0, 5)}</span>
      </div>
      <div style={{
        fontSize: '0.8rem', color: 'var(--text-muted)',
        fontFamily: 'var(--font-display)', fontStyle: 'italic',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        📍 {chart.birthPlace}
      </div>

      {/* Saved time */}
      <div style={{
        fontSize: '0.68rem', color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)', marginTop: 2,
      }}>
        Saved {fmtSaved(chart.createdAt)}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
        <button
          onClick={() => onLoad(chart)}
          className="btn btn-primary btn-sm"
          style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem' }}
        >
          Open Chart
        </button>

        {chart.slug && (
          <Link
            href={`/chart/${chart.slug}`}
            target="_blank"
            style={{
              padding: '0.3rem 0.65rem',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              display: 'flex', alignItems: 'center',
            }}
          >
            🔗
          </Link>
        )}

        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            padding: '0.3rem 0.65rem',
            background: confirmDel ? 'rgba(224,123,142,0.15)' : 'var(--surface-2)',
            border: `1px solid ${confirmDel ? 'rgba(224,123,142,0.40)' : 'var(--border)'}`,
            borderRadius: 'var(--r-md)',
            fontSize: '0.78rem',
            color: confirmDel ? 'var(--rose)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onBlur={() => setConfirmDel(false)}
        >
          {deleting ? '…' : confirmDel ? 'Confirm?' : '🗑'}
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export default function MyChartsPage() {
  const router  = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/my/charts')
    }
  }, [status, router])

  const [charts,  setCharts]  = useState<SavedChart[]>([])
  const [pag,     setPag]     = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [page,    setPage]    = useState(1)
  const [search,  setSearch]  = useState('')

  const fetchCharts = useCallback(async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/chart/list?page=${p}&limit=20`)
      const json = await res.json()
      if (res.status === 401) {
        router.push('/login?callbackUrl=/my/charts')
        return
      }
      if (!json.success) throw new Error(json.error)
      setCharts(json.charts)
      setPag(json.pagination)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { fetchCharts(page) }, [page, fetchCharts])

  function handleLoad(chart: SavedChart) {
    // Encode chart data in URL params → home page picks it up
    const params = new URLSearchParams({
      name:       chart.name,
      birthDate:  chart.birthDate,
      birthTime:  chart.birthTime,
      birthPlace: chart.birthPlace,
      lat:        chart.latitude.toString(),
      lng:        chart.longitude.toString(),
      tz:         chart.timezone,
    })
    router.push(`/?${params.toString()}`)
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/chart/delete?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setCharts((prev: SavedChart[]) => prev.filter((c: SavedChart) => c._id !== id))
      setPag((prev: Pagination | null) => prev ? { ...prev, total: prev.total - 1 } : prev)
    }
  }

  const filtered = charts.filter((c: SavedChart) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.birthPlace.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{
        padding: '0 2rem',
        height: 60,
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--header-bg)',
        gap: '1rem',
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <span style={{ fontSize: '1.5rem' }}>🪐</span>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem', fontWeight: 400,
              letterSpacing: '0.07em',
              color: 'var(--text-gold)',
            }}>
              Jyotiṣa
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', fontStyle: 'italic' }}>
              The Eye of the Vedas
            </span>
          </div>
        </Link>
        
        {/* Nav right */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/panchang"
            className="hide-mobile"
            style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none' }}
          >Pañcāṅga</Link>

          <Link href="/"
            className="hide-mobile"
            style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none' }}
          >Chart</Link>
          
          <Link href="/my/charts"
            style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--gold)', textDecoration: 'none' }}
          >My Charts</Link>

          {status === 'authenticated' ? (
            <Link href="/account"
              style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--gold)', textDecoration: 'none' }}
            >
              {session?.user?.name || 'Account'}
            </Link>
          ) : (
            <>
              <Link href="/login"
                style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none' }}
              >Sign In</Link>
              <Link href="/signup"
                className="btn btn-primary btn-sm hide-mobile"
              >Join Free</Link>
            </>
          )}
          
          <ThemeToggle />
        </nav>
      </header>

      <main style={{ flex: 1, maxWidth: 1000, width: '100%', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Page header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.3rem',
          }}>
            My Charts
          </h1>
          {pag && (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {pag.total} chart{pag.total !== 1 ? 's' : ''} saved
            </div>
          )}
        </div>

        {/* Search + New chart */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="Search by name or place…"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <Link href="/" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
            + New Chart
          </Link>
        </div>

        {/* States */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <div className="spin-loader" style={{
              width: 32, height: 32, margin: '0 auto 1rem',
              border: '3px solid var(--border)', borderTopColor: 'var(--gold)',
            }} />
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>Loading charts…</div>
          </div>
        )}

        {error && (
          <div style={{
            padding: '1rem', borderRadius: 'var(--r-md)',
            background: 'rgba(224,123,142,0.08)', border: '1px solid rgba(224,123,142,0.25)',
            color: 'var(--rose)', fontFamily: 'var(--font-display)', marginBottom: '1rem',
          }}>
            {error === 'Not authenticated'
              ? <>Please <Link href="/" style={{ color: 'var(--gold)' }}>sign in</Link> to view saved charts.</>
              : error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🪐</div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '1.2rem',
              color: 'var(--text-secondary)', marginBottom: '0.5rem',
            }}>
              {search ? 'No charts match your search' : 'No saved charts yet'}
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {search ? 'Try a different name or place' : 'Calculate a chart and click Save to get started'}
            </div>
            {!search && (
              <Link href="/" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
                Calculate a Chart
              </Link>
            )}
          </div>
        )}

        {/* Chart grid */}
        {!loading && filtered.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '0.85rem',
          }}>
            {filtered.map((chart: SavedChart) => (
              <ChartCard
                key={chart._id}
                chart={chart}
                onLoad={handleLoad}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pag && pag.pages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '0.5rem',
            marginTop: '2rem', flexWrap: 'wrap',
          }}>
            {Array.from({ length: pag.pages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  padding: '0.35rem 0.75rem',
                  background: p === page ? 'rgba(201,168,76,0.15)' : 'var(--surface-2)',
                  border: `1px solid ${p === page ? 'var(--border-bright)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-md)',
                  fontFamily: 'var(--font-mono)', fontSize: '0.82rem',
                  color: p === page ? 'var(--text-gold)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontWeight: p === page ? 700 : 400,
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </main>

      <footer style={{
        padding: '1rem 2rem', borderTop: '1px solid var(--border-soft)',
        textAlign: 'center', color: 'var(--text-muted)',
        fontFamily: 'var(--font-display)', fontSize: '0.8rem',
      }}>
        Powered by <span style={{ color: 'var(--text-gold)' }}>Swiss Ephemeris</span> · Kāla — free forever
      </footer>
    </div>
  )
}