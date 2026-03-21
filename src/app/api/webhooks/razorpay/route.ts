// ─────────────────────────────────────────────────────────────
//  src/app/api/webhooks/razorpay/route.ts
//  POST /api/webhooks/razorpay
//  Handles async Razorpay webhook events.
//
//  Configure in Razorpay Dashboard → Webhooks:
//    URL: https://yourdomain.com/api/webhooks/razorpay
//    Secret: set RAZORPAY_WEBHOOK_SECRET env var
//    Events to enable:
//      payment.captured
//      subscription.activated
//      subscription.charged
//      subscription.cancelled
//      subscription.completed
//
//  IMPORTANT: This route must NOT require auth — Razorpay calls
//  it directly. Security comes from HMAC signature verification.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'
import { Subscription } from '@/lib/db/models/Subscription'

export const runtime = 'nodejs'

// ── HMAC verification ─────────────────────────────────────────

function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

// ── Plan helpers ──────────────────────────────────────────────

function planFromPlanId(planId: string): 'vela' | 'hora' | null {
  if (planId.includes('vela')) return 'vela'
  if (planId.includes('hora')) return 'hora'
  return null
}

function intervalFromPlanId(planId: string): 'monthly' | 'yearly' {
  return planId.includes('yearly') ? 'yearly' : 'monthly'
}

function addInterval(date: Date, interval: 'monthly' | 'yearly'): Date {
  const d = new Date(date)
  if (interval === 'monthly') d.setMonth(d.getMonth() + 1)
  else d.setFullYear(d.getFullYear() + 1)
  return d
}

// ── Event handlers ─────────────────────────────────────────────

async function handlePaymentCaptured(payload: any) {
  // payment.captured fires for one-time orders (our checkout flow)
  // The verify route handles activation synchronously — this is a
  // safety net for cases where the client callback failed.
  const payment   = payload?.payment?.entity
  const orderId   = payment?.order_id
  const paymentId = payment?.id
  const notes     = payment?.notes ?? {}

  if (!notes.userId || !notes.plan) return   // not a subscription payment

  await connectDB()

  const existing = await Subscription.findOne({ providerSubscriptionId: paymentId })
  if (existing?.status === 'active') return  // already activated by verify route

  const plan     = notes.plan     as 'vela' | 'hora'
  const interval = notes.interval as 'monthly' | 'yearly' ?? 'monthly'
  const now      = new Date()
  const expiry   = addInterval(now, interval)
  const amount   = payment?.amount ?? 0

  await Subscription.findOneAndUpdate(
    { providerSubscriptionId: paymentId },
    {
      $set: {
        userId:                 notes.userId,
        plan,
        provider:               'razorpay',
        providerSubscriptionId: paymentId,
        providerCustomerId:     orderId,
        providerPlanId:         `${plan}_${interval}`,
        status:                 'active',
        interval,
        currentPeriodStart:     now,
        currentPeriodEnd:       expiry,
        cancelAtPeriodEnd:      false,
        amount,
        currency:               'INR',
      },
      $push: { events: { $each: [{ type: 'payment.captured', payload, receivedAt: now }], $slice: -10 } },
    },
    { upsert: true },
  )

  await User.findByIdAndUpdate(notes.userId, { plan, planExpiresAt: expiry })
}

async function handleSubscriptionCharged(payload: any) {
  // Fires on successful renewal — extend expiry by one period
  const sub    = payload?.subscription?.entity
  const planId = sub?.plan_id ?? ''

  if (!sub) return

  await connectDB()

  const plan     = planFromPlanId(planId)
  const interval = intervalFromPlanId(planId)
  const now      = new Date()
  const expiry   = addInterval(now, interval)

  const dbSub = await Subscription.findOneAndUpdate(
    { providerSubscriptionId: sub.id },
    {
      $set: {
        status:             'active',
        currentPeriodStart: now,
        currentPeriodEnd:   expiry,
        cancelAtPeriodEnd:  false,
      },
      $push: { events: { $each: [{ type: 'subscription.charged', payload, receivedAt: now }], $slice: -10 } },
    },
    { new: true },
  )

  if (dbSub?.userId && plan) {
    await User.findByIdAndUpdate(dbSub.userId, { plan, planExpiresAt: expiry })
  }
}

async function handleSubscriptionCancelled(payload: any) {
  const sub = payload?.subscription?.entity
  if (!sub) return

  await connectDB()

  const dbSub = await Subscription.findOneAndUpdate(
    { providerSubscriptionId: sub.id },
    {
      $set: {
        status:            'cancelled',
        cancelAtPeriodEnd: true,
        cancelledAt:       new Date(),
      },
      $push: { events: { $each: [{ type: 'subscription.cancelled', payload, receivedAt: new Date() }], $slice: -10 } },
    },
    { new: true },
  )

  // Don't downgrade immediately — let planExpiresAt handle it at period end
  // The middleware checks planExpiresAt on each request
  if (dbSub?.userId) {
    console.log(`[webhook] Subscription cancelled for user ${dbSub.userId}, expires ${dbSub.currentPeriodEnd}`)
  }
}

async function handleSubscriptionCompleted(payload: any) {
  // Subscription ran its full term — downgrade to kala
  const sub = payload?.subscription?.entity
  if (!sub) return

  await connectDB()

  const dbSub = await Subscription.findOneAndUpdate(
    { providerSubscriptionId: sub.id },
    {
      $set: { status: 'expired' },
      $push: { events: { $each: [{ type: 'subscription.completed', payload, receivedAt: new Date() }], $slice: -10 } },
    },
    { new: true },
  )

  if (dbSub?.userId) {
    await User.findByIdAndUpdate(dbSub.userId, { plan: 'kala', planExpiresAt: null })
  }
}

// ── Main route handler ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[webhook/razorpay] RAZORPAY_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  // Read raw body for signature verification
  const rawBody  = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''

  if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    console.warn('[webhook/razorpay] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: { event: string; payload: any }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload)
        break
      case 'subscription.activated':
      case 'subscription.charged':
        await handleSubscriptionCharged(event.payload)
        break
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.payload)
        break
      case 'subscription.completed':
        await handleSubscriptionCompleted(event.payload)
        break
      default:
        // Acknowledge unknown events — don't retry
        break
    }

    return NextResponse.json({ received: true })

  } catch (err) {
    console.error(`[webhook/razorpay] Handler error for ${event.event}:`, err)
    // Return 500 so Razorpay retries
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }
}
