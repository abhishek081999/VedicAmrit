// ─────────────────────────────────────────────────────────────
//  src/app/api/auth/refresh-plan/route.ts
//  GET /api/auth/refresh-plan
//  Reads the user's current plan from MongoDB and returns it.
//  Called by the account page after redirect from payment.
//  The client then calls NextAuth update({ plan }) to refresh
//  the JWT token without requiring a full re-login.
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findById(session.user.id)
      .select('plan planExpiresAt')
      .lean() as { plan: string; planExpiresAt: Date | null } | null

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Check if plan has expired — downgrade to free if so
    const effectivePlan = (() => {
      if (user.plan === 'free') return 'free'
      if (user.planExpiresAt && new Date(user.planExpiresAt) < new Date()) return 'free'
      return user.plan
    })()

    return NextResponse.json({
      success: true,
      plan:    effectivePlan,
      expiresAt: user.planExpiresAt,
    })
  } catch (err) {
    console.error('[auth/refresh-plan]', err)
    return NextResponse.json({ success: false, error: 'Failed to refresh plan' }, { status: 500 })
  }
}
