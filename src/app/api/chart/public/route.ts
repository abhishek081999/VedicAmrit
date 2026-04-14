// ─────────────────────────────────────────────────────────────
//  GET /api/chart/public?slug=<slug>
//  Returns saved chart metadata for a public slug.
//  No auth required — this is the public share endpoint.
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { Chart } from '@/lib/db/models/Chart'
import { User } from '@/lib/db/models/User'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug')
    if (!slug) {
      return NextResponse.json({ success: false, error: 'Missing slug' }, { status: 400 })
    }

    await connectDB()

    const chart = await Chart.findOneAndUpdate(
      { slug, isPublic: true },
      { 
        $inc: { views: 1 },
        $set: { lastViewedAt: new Date() }
      },
      { new: true }
    )
      .select('userId name birthDate birthTime birthPlace latitude longitude timezone settings slug views lastViewedAt createdAt')
      .lean()

    if (!chart) {
      return NextResponse.json({ success: false, error: 'Chart not found or not public' }, { status: 404 })
    }

    // ── Fetch Owner's Branding (Platinum Only) ────────────────
    const owner = await User.findById(chart.userId).select('plan brandName brandLogo').lean()
    
    const branding = ((owner as any)?.plan === 'platinum') ? {
      brandName: (owner as any).brandName,
      brandLogo: (owner as any).brandLogo
    } : null

    return NextResponse.json({ 
      success: true, 
      chart,
      branding
    })
  } catch (err) {
    console.error('[chart/public]', err)
    return NextResponse.json({ success: false, error: 'Failed to load chart' }, { status: 500 })
  }
}