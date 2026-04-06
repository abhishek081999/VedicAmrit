// ─────────────────────────────────────────────────────────────
//  src/app/api/health/route.ts
//  GET /api/health
//  Used by Render for health checks
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      app: 'Vedaansh',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  )
}
