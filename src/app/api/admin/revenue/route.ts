
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { Subscription } from '@/lib/db/models/Subscription'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await connectDB()
    const subscriptions = await Subscription.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    // Calculate MRR (Monthly Recurring Revenue) roughly
    const active = subscriptions.filter(s => s.status === 'active')
    const mrr = active.reduce((acc, s) => {
      const monthlyAmount = s.interval === 'yearly' ? s.amount / 12 : s.amount
      // Normalize to a single currency for estimation (e.g., INR)
      // This is a simplification
      return acc + (monthlyAmount / 100) // Convert paise/cents to units
    }, 0)

    return NextResponse.json({ 
      success: true, 
      revenue: {
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: active.length,
        mrrEstimate: mrr,
        subscriptions
      }
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch revenue stats' }, { status: 500 })
  }
}
