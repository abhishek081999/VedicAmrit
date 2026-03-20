// ─────────────────────────────────────────────────────────────
//  DELETE /api/chart/delete?id=<chartId>
//  Deletes a chart owned by the current user
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { Chart } from '@/lib/db/models/Chart'

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

    const result = await Chart.deleteOne({ _id: id, userId: session.user.id })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Chart not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[chart/delete]', err)
    return NextResponse.json({ success: false, error: 'Failed to delete chart' }, { status: 500 })
  }
}