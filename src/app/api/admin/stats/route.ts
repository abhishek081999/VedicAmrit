// ─────────────────────────────────────────────────────────────
//  src/app/api/admin/stats/route.ts
//  GET /api/admin/stats
//  Admin-only analytics and system health metrics.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'
import { Chart } from '@/lib/db/models/Chart'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const user = session?.user as any

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 })
    }

    await connectDB()

    // Aggregate stats
    const [
      totalUsers,
      totalCharts,
      planCounts,
      recentUsers,
      recentCharts
    ] = await Promise.all([
      User.countDocuments(),
      Chart.countDocuments(),
      User.aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 } } }
      ]),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email plan createdAt').lean(),
      Chart.find().sort({ createdAt: -1 }).limit(5).select('name birthPlace createdAt').lean()
    ])

    const stats = {
      overview: {
        totalUsers,
        totalCharts,
        activeSubscriptions: planCounts.filter(p => p._id !== 'free').reduce((acc, p) => acc + p.count, 0)
      },
      distribution: planCounts.reduce((acc: any, p) => {
        acc[p._id] = p.count
        return acc
      }, {}),
      recentActivities: {
        users: recentUsers,
        charts: recentCharts
      },
      system: {
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // in MB
        uptime: process.uptime()
      }
    }

    return NextResponse.json({ success: true, stats })

  } catch (err) {
    console.error('[admin/stats] Error:', err)
    return NextResponse.json({ error: 'Failed to fetch admin stats.' }, { status: 500 })
  }
}
