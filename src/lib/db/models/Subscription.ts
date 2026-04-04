// ─────────────────────────────────────────────────────────────
//  src/lib/db/models/Subscription.ts
//  Subscription model — tracks Razorpay & Stripe billing
// ─────────────────────────────────────────────────────────────

import { Schema, model, models, type Document, type Types } from 'mongoose'
import type { UserPlan } from '@/types/astrology'

export type PaymentProvider = 'razorpay' | 'stripe'
export type SubscriptionStatus =
  | 'active'
  | 'cancelled'
  | 'expired'
  | 'past_due'
  | 'trialing'
  | 'pending'

export interface ISubscription extends Document {
  _id:      Types.ObjectId
  userId:   Types.ObjectId

  plan:     UserPlan          // 'gold' | 'platinum'
  provider: PaymentProvider

  // Provider-specific IDs
  providerSubscriptionId: string   // Razorpay sub_xxx or Stripe sub_xxx
  providerCustomerId:     string   // Razorpay customer or Stripe customer
  providerPlanId:         string   // Razorpay plan_xxx or Stripe price_xxx

  status:    SubscriptionStatus
  interval:  'monthly' | 'yearly'

  // Billing period
  currentPeriodStart: Date
  currentPeriodEnd:   Date

  // Cancellation
  cancelAtPeriodEnd: boolean
  cancelledAt:       Date | null

  // Amount (in smallest currency unit: paise for INR, cents for USD)
  amount:   number
  currency: 'INR' | 'USD' | 'EUR'

  // Webhook event log (last 10 events)
  events: Array<{
    type:      string
    payload:   Record<string, unknown>
    receivedAt:Date
  }>

  createdAt: Date
  updatedAt: Date
}

const SubscriptionSchema = new Schema<ISubscription>({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  plan:     { type: String, enum: ['gold','platinum'], required: true },
  provider: { type: String, enum: ['razorpay','stripe'], required: true },

  providerSubscriptionId: { type: String, required: true, unique: true },
  providerCustomerId:     { type: String, required: true },
  providerPlanId:         { type: String, required: true },

  status:   { type: String, enum: ['active','cancelled','expired','past_due','trialing','pending'], default: 'pending' },
  interval: { type: String, enum: ['monthly','yearly'], required: true },

  currentPeriodStart: { type: Date, required: true },
  currentPeriodEnd:   { type: Date, required: true },

  cancelAtPeriodEnd: { type: Boolean, default: false },
  cancelledAt:       { type: Date, default: null },

  amount:   { type: Number, required: true },
  currency: { type: String, enum: ['INR','USD','EUR'], required: true },

  events: [{
    type:      { type: String, required: true },
    payload:   { type: Schema.Types.Mixed },
    receivedAt:{ type: Date, default: Date.now },
    _id: false,
  }],
}, {
  timestamps: true,
})

SubscriptionSchema.index({ userId: 1, status: 1 })
SubscriptionSchema.index({ providerSubscriptionId: 1 })
SubscriptionSchema.index({ currentPeriodEnd: 1 })

export const Subscription = models.Subscription
  || model<ISubscription>('Subscription', SubscriptionSchema)

export default Subscription
