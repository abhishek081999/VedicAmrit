// ─────────────────────────────────────────────────────────────
//  POST /api/chart/chart/toggle-public
//  Toggles visibility of a specific saved chart between private and public.
//  Returns { success, isPublic, slug }
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { Chart } from '@/lib/db/models/Chart'
import crypto from 'crypto'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { chartId } = await req.json()
    if (!chartId) {
      return NextResponse.json({ success: false, error: 'Missing chartId' }, { status: 400 })
    }

    await connectDB()

    const chart = await Chart.findOne({ _id: chartId, userId: session.user.id })
    if (!chart) {
      return NextResponse.json({ success: false, error: 'Chart not found or access denied' }, { status: 404 })
    }

    const nextIsPublic = !chart.isPublic
    let nextSlug = chart.slug

    if (nextIsPublic && !nextSlug) {
      nextSlug = crypto.randomBytes(5).toString('hex')
    }

    chart.isPublicSource = nextIsPublic // Just being safe with internal field if any
    chart.isPublic = nextIsPublic
    chart.slug     = nextSlug
    await chart.save()

    return NextResponse.json({
      success: true,
      isPublic: chart.isPublic,
      slug:     chart.slug,
    })
  } catch (err) {
    console.error('[chart/toggle-public]', err)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}
