// ─────────────────────────────────────────────────────────────
//  src/app/api/user/me/route.ts
//  Returns current user profile + personal birth chart
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'
import { Chart } from '@/lib/db/models/Chart'

export async function GET() {
  try {
    // Parallelize session check and DB connection
    const [session] = await Promise.all([
      auth(),
      connectDB()
    ])

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const user = await User.findById(session.user.id).select('-passwordHash').lean()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    let personalChartRaw = null
    if ((user as any).defaultChartId) {
      personalChartRaw = await Chart.findById((user as any).defaultChartId).lean()
    } else {
      personalChartRaw = await Chart.findOne({ userId: session.user.id, isPersonal: true }).lean()
    }

    const personalChart = personalChartRaw as any

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

// ── PATCH — update preferences ────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const allowed = [
      'defaultAyanamsha', 'defaultChartStyle', 'defaultHouseSystem',
      'defaultNodeMode', 'karakaScheme', 'language',
      'showDegrees', 'showNakshatra', 'showKaraka',
    ]

    // Build update object
    const update: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) {
        update[`preferences.${key}`] = body[key]
      }
    }

    // Also allow name update
    if (body.name && typeof body.name === 'string') {
      update['name'] = body.name.trim().slice(0, 100)
    }

    await connectDB()
    const user = await User.findById(session.user.id).select('plan').lean()
    
    // Allow brand updates for Platinum users
    if ((user as any)?.plan === 'platinum') {
      if ('brandName' in body) update['brandName'] = body.brandName?.trim().slice(0, 100) || null
      if ('brandLogo' in body) update['brandLogo'] = body.brandLogo?.trim() || null
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 })
    }

    await User.findByIdAndUpdate(session.user.id, { $set: update })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[user/me PATCH]', err)
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
  }
}
