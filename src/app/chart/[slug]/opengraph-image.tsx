// src/app/chart/[slug]/opengraph-image.tsx
// Dynamic OG image for public chart pages
import { ImageResponse } from 'next/og'
import connectDB from '@/lib/db/mongodb'
import { Chart } from '@/lib/db/models/Chart'

export const runtime = 'nodejs'
export const size    = { width: 1200, height: 630 }
export const contentType = 'image/png'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default async function OGImage({ params }: { params: { slug: string } }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vedaansh.com'
  try {
    await connectDB()
    const chartRaw = await Chart.findOne({ slug: params.slug, isPublic: true })
      .select('name birthDate birthPlace').lean()

    const chart = chartRaw as any
    const name  = chart?.name      ?? 'Vedic Chart'
    const date  = chart?.birthDate
      ? (() => { const d = new Date(chart.birthDate + 'T12:00:00Z'); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}` })()
      : ''
    const place = chart?.birthPlace ?? ''

    return new ImageResponse(
      <div
        style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(135deg, #0e0e18 0%, #16162a 50%, #0e0e18 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Georgia, serif',
          position: 'relative',
        }}
      >
        {/* Gold border */}
        <div style={{
          position: 'absolute', inset: 24,
          border: '1px solid rgba(201,168,76,0.35)', borderRadius: 16,
          display: 'flex',
        }} />

        {/* Brand Icon */}
        <div style={{ marginBottom: 24, display: 'flex' }}>
          <img src={`${baseUrl}/veda-icon.png`} width="96" height="96" />
        </div>

        {/* Name */}
        <div style={{
          fontSize: 64, fontWeight: 700, color: '#f0ecff',
          textAlign: 'center', lineHeight: 1.1, marginBottom: 16, padding: '0 60px',
        }}>
          {name}
        </div>

        {/* Birth details */}
        {(date || place) && (
          <div style={{
            fontSize: 28, color: '#bbb5d8', textAlign: 'center',
            display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center',
          }}>
            {date  && <span>{date}</span>}
            {place && <span>📍 {place}</span>}
          </div>
        )}

        {/* Branding */}
        <div style={{
          position: 'absolute', bottom: 48, left: 0, right: 0,
          textAlign: 'center', fontSize: 22,
          color: '#c9a84c', letterSpacing: 4,
        }}>
          VEDAANSH · vedaansh.com
        </div>
      </div>,
      { width: 1200, height: 630 },
    )
  } catch {
    return new ImageResponse(
      <div style={{ width: '100%', height: '100%', background: '#0e0e18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9a84c', fontSize: 48, fontFamily: 'Georgia', gap: 20 }}>
        <img src={`${baseUrl}/veda-icon.png`} width="64" height="64" />
        Vedaansh
      </div>,
      { width: 1200, height: 630 }
    )
  }
}