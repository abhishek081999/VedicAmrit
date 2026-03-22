import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'
import { Subscription } from '@/lib/db/models/Subscription'
import { sendWelcomeEmail } from '@/lib/email'

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

function addInterval(date: Date, interval: 'monthly' | 'yearly'): Date {
  const d = new Date(date)
  if (interval === 'monthly') d.setMonth(d.getMonth() + 1)
  else d.setFullYear(d.getFullYear() + 1)
  return d
}

async function handlePaymentCaptured(payload: any) {
  const payment   = payload?.payment?.entity
  const notes     = payment?.notes ?? {}

  if (!notes.userId || !notes.plan) return 

  await connectDB()

  // Avoid duplicate processing if verify route already handled it
  const existing = await Subscription.findOne({ providerSubscriptionId: payment.id })
  if (existing?.status === 'active') return 

  const plan     = notes.plan     as 'vela' | 'hora'
  const interval = notes.interval as 'monthly' | 'yearly' ?? 'monthly'
  const now      = new Date()
  const expiry   = addInterval(now, interval)
  const amount   = payment.amount ?? 0

  // 1. Update Subscription doc
  await Subscription.findOneAndUpdate(
    { providerSubscriptionId: payment.id },
    {
      $set: {
        userId:                 notes.userId,
        plan,
        provider:               'razorpay',
        providerSubscriptionId: payment.id,
        providerCustomerId:     payment.order_id,
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
    { upsert: true }
  )

  // 2. Upgrade User record
  const user = await User.findByIdAndUpdate(notes.userId, { 
    plan, 
    planExpiresAt: expiry 
  })

  // 3. Send Welcome Email
  if (user?.email) {
    await sendWelcomeEmail(user.email, plan, expiry)
  }
}


// ── Main route handler ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[webhook/razorpay] RAZORPAY_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

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
      // You can add subscription.cancelled, etc. here later if using Recurring Subscriptions API
      default:
        break
    }

    return NextResponse.json({ received: true })

  } catch (err) {
    console.error(`[webhook/razorpay] Handler error:`, err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }
}

