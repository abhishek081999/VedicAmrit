// ─────────────────────────────────────────────────────────────
//  GET /api/chart/list
//  Returns saved charts for the current user (most recent first)
//  Supports ?page=1&limit=20
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { Chart } from '@/lib/db/models/Chart'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = req.nextUrl
    const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'))
    const skip  = (page - 1) * limit

    await connectDB()

    const [charts, total] = await Promise.all([
      Chart.find({ userId: session.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('name birthDate birthTime birthPlace latitude longitude timezone settings isPublic isPersonal slug views lastViewedAt createdAt')
        .lean(),
      Chart.countDocuments({ userId: session.user.id }),
    ])

    return NextResponse.json({
      success: true,
      charts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error('[chart/list]', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch charts' }, { status: 500 })
  }
}