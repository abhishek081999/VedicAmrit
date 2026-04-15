
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { Chart } from '@/lib/db/models/Chart'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await connectDB()
    const charts = await Chart.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean()
      
    return NextResponse.json({ success: true, charts })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch charts' }, { status: 500 })
  }
}
