// ─────────────────────────────────────────────────────────────
//  src/app/api/chart/export/route.ts
//  GET /api/chart/export
//
//  Accepts a full ChartOutput as POST body (JSON) and returns
//  a print-ready HTML document.
//
//  Tier: Velā+ (gated in middleware + checked here)
//  Usage: open in new tab → browser prints to PDF
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { generateChartHTML } from '@/lib/pdf/chartHtml'
import type { ChartOutput } from '@/types/astrology'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    // ── Auth check ────────────────────────────────────────────
    const session = await auth()
    const plan = (session?.user as any)?.plan ?? 'kala'

    if (plan === 'kala') {
      return NextResponse.json(
        {
          error: 'PDF export requires Velā or Horā plan.',
          upgradeRequired: true,
          upgradeUrl: '/pricing',
        },
        { status: 403 },
      )
    }

    // ── Parse body ────────────────────────────────────────────
    const body = await req.json().catch(() => null)
    if (!body || !body.meta || !body.grahas) {
      return NextResponse.json(
        { error: 'Invalid chart data.' },
        { status: 400 },
      )
    }

    const chart = body as ChartOutput

    // ── Generate HTML ─────────────────────────────────────────
    const html = generateChartHTML(chart)

    // ── Return as HTML document ───────────────────────────────
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        // Hint filename for when user saves from print dialog
        'Content-Disposition': `inline; filename="${encodeURIComponent(chart.meta.name)}-jyotish.html"`,
      },
    })
  } catch (err) {
    console.error('[chart/export] Error:', err)
    return NextResponse.json(
      { error: 'Export failed. Please try again.' },
      { status: 500 },
    )
  }
}
