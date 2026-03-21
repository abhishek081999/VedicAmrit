// ─────────────────────────────────────────────────────────────
//  src/app/api/payment/checkout/route.ts
//  POST /api/payment/checkout
//  Creates a Razorpay order for Velā or Horā subscription.
//  Returns { orderId, amount, currency, keyId } for the
//  client to open the Razorpay checkout modal.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Razorpay from 'razorpay'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'

export const runtime = 'nodejs'

// ── Razorpay client (singleton) ───────────────────────────────

let rzp: Razorpay | null = null
function getRazorpay(): Razorpay {
  if (!rzp) {
    const keyId     = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keyId || !keySecret) {
      throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set')
    }
    rzp = new Razorpay({ key_id: keyId, key_secret: keySecret })
  }
  return rzp
}

// ── Plan → amount map (paise = 1/100 of rupee) ───────────────

const PLAN_PRICES = {
  vela: { monthly: 29900, yearly: 299000 },   // ₹299/mo, ₹2990/yr
  hora: { monthly: 99900, yearly: 999000 },   // ₹999/mo, ₹9990/yr
} as const

// ── Input schema ──────────────────────────────────────────────

const CheckoutSchema = z.object({
  plan:     z.enum(['vela', 'hora']),
  interval: z.enum(['monthly', 'yearly']),
})

// ── Route handler ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to subscribe' },
        { status: 401 },
      )
    }

    const body   = await req.json().catch(() => null)
    const parsed = CheckoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan or interval' },
        { status: 400 },
      )
    }

    const { plan, interval } = parsed.data
    const amountPaise = PLAN_PRICES[plan][interval]

    await connectDB()

    // Get or create Razorpay customer for this user
    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const razorpay = getRazorpay()

    // Create Razorpay customer if not already on file
    let customerId = user.razorpayCustomerId
    if (!customerId) {
      const customer = await razorpay.customers.create({
        name:  user.name,
        email: user.email,
        fail_existing: 0,
      } as Parameters<typeof razorpay.customers.create>[0])
      customerId = customer.id
      await User.findByIdAndUpdate(user._id, { razorpayCustomerId: customerId })
    }

    // Create a one-time order (Razorpay subscription flow starts with an order)
    const order = await razorpay.orders.create({
      amount:   amountPaise,
      currency: 'INR',
      notes: {
        userId:   session.user.id,
        plan,
        interval,
        email:    user.email,
      },
    })

    return NextResponse.json({
      success:    true,
      orderId:    order.id,
      amount:     amountPaise,
      currency:   'INR',
      keyId:      process.env.RAZORPAY_KEY_ID,
      planLabel:  plan === 'vela' ? 'Velā' : 'Horā',
      userName:   user.name,
      userEmail:  user.email,
    })

  } catch (err) {
    console.error('[payment/checkout]', err)
    return NextResponse.json(
      { success: false, error: 'Failed to create payment order. Please try again.' },
      { status: 500 },
    )
  }
}
