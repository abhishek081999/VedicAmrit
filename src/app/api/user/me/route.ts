// ─────────────────────────────────────────────────────────────
//  src/app/api/user/me/route.ts
//  Returns current user profile + personal birth chart
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'
import { Chart } from '@/lib/db/models/Chart'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const [user, personalChart] = await Promise.all([
      User.findById(session.user.id).select('-passwordHash').lean(),
      Chart.findOne({ userId: session.user.id, isPersonal: true }).lean(),
    ])

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user,
      personalChart: personalChart ? {
        name:       personalChart.name,
        birthDate:  personalChart.birthDate,
        birthTime:  personalChart.birthTime,
        birthPlace: personalChart.birthPlace,
        latitude:   personalChart.latitude,
        longitude:  personalChart.longitude,
        timezone:   personalChart.timezone,
        settings:   personalChart.settings,
      } : null,
    })

  } catch (err) {
    console.error('[user/me] error:', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
