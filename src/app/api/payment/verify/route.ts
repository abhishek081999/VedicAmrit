// ─────────────────────────────────────────────────────────────
//  src/app/api/payment/verify/route.ts
//  POST /api/payment/verify
//  Called by the Razorpay modal handler after payment.
//  Verifies the HMAC signature, creates a Subscription doc,
//  and upgrades user.plan in MongoDB.
//
//  This is the synchronous activation path. The webhook at
//  /api/webhooks/razorpay handles async retry/renewal events.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'
import { Subscription } from '@/lib/db/models/Subscription'

export const runtime = 'nodejs'

const VerifySchema = z.object({
  paymentId: z.string().min(1),
  orderId:   z.string().min(1),
  signature: z.string().min(1),
  plan:      z.enum(['vela', 'hora']),
  interval:  z.enum(['monthly', 'yearly']),
})

const PLAN_PRICES = {
  vela: { monthly: 29900, yearly: 299000 },
  hora: { monthly: 99900, yearly: 999000 },
} as const

function addInterval(date: Date, interval: 'monthly' | 'yearly'): Date {
  const d = new Date(date)
  if (interval === 'monthly') d.setMonth(d.getMonth() + 1)
  else d.setFullYear(d.getFullYear() + 1)
  return d
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body   = await req.json().catch(() => null)
    const parsed = VerifySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 })
    }

    const { paymentId, orderId, signature, plan, interval } = parsed.data

    // ── 1. Verify Razorpay HMAC signature ────────────────────
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) throw new Error('RAZORPAY_KEY_SECRET not set')

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    if (expectedSig !== signature) {
      console.warn('[payment/verify] Signature mismatch', { orderId, paymentId })
      return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 400 })
    }

    // ── 2. Activate subscription in DB ───────────────────────
    await connectDB()

    const now    = new Date()
    const expiry = addInterval(now, interval)
    const amount = PLAN_PRICES[plan][interval]

    // Upsert subscription record
    await Subscription.findOneAndUpdate(
      { providerSubscriptionId: paymentId },
      {
        $set: {
          userId:                 session.user.id,
          plan,
          provider:               'razorpay',
          providerSubscriptionId: paymentId,
          providerCustomerId:     orderId,     // order_id as correlation key
          providerPlanId:         `${plan}_${interval}`,
          status:                 'active',
          interval,
          currentPeriodStart:     now,
          currentPeriodEnd:       expiry,
          cancelAtPeriodEnd:      false,
          amount,
          currency:               'INR',
        },
        $push: {
          events: {
            $each: [{ type: 'payment.verified', payload: { paymentId, orderId }, receivedAt: now }],
            $slice: -10,
          },
        },
      },
      { upsert: true, new: true },
    )

    // Upgrade user plan
    await User.findByIdAndUpdate(session.user.id, {
      plan,
      planExpiresAt: expiry,
    })

    return NextResponse.json({ success: true, plan, expiresAt: expiry })

  } catch (err) {
    console.error('[payment/verify]', err)
    return NextResponse.json(
      { success: false, error: 'Activation failed. Contact support if payment was charged.' },
      { status: 500 },
    )
  }
}
