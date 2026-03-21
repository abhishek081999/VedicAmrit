// ─────────────────────────────────────────────────────────────
//  DELETE /api/chart/delete?id=<chartId>
//  Deletes a chart owned by the current user, and its ChartCache
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { Chart, ChartCache } from '@/lib/db/models/Chart'

export const runtime = 'nodejs'

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 })

    await connectDB()

    // Find first so we have the cachedDataId before deletion
    const chart = await Chart.findOne({ _id: id, userId: session.user.id }).select('cachedDataId')
    if (!chart) {
      return NextResponse.json({ success: false, error: 'Chart not found' }, { status: 404 })
    }

    // Delete chart and its cache in parallel
    await Promise.all([
      Chart.deleteOne({ _id: id, userId: session.user.id }),
      chart.cachedDataId
        ? ChartCache.deleteOne({ _id: chart.cachedDataId })
        : Promise.resolve(),
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[chart/delete]', err)
    return NextResponse.json({ success: false, error: 'Failed to delete chart' }, { status: 500 })
  }
}