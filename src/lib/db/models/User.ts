// ─────────────────────────────────────────────────────────────
//  src/lib/db/models/User.ts
//  User Mongoose model with full TypeScript types
// ─────────────────────────────────────────────────────────────

import mongoose, { Schema, model, models, type Document, type Types } from 'mongoose'
import type {
  UserPlan, AyanamshaMode, ChartStyle, HouseSystem, NodeMode, KarakaScheme
} from '@/types/astrology'

// ── Interfaces ────────────────────────────────────────────────

export interface IUserPreferences {
  defaultAyanamsha:   AyanamshaMode
  defaultChartStyle:  ChartStyle
  defaultHouseSystem: HouseSystem
  defaultNodeMode:    NodeMode
  karakaScheme:       KarakaScheme
  language:           'en' | 'sa' | 'hi' | 'ru'
  showDegrees:        boolean
  showNakshatra:      boolean
  showKaraka:         boolean
}

export interface IUserDevice {
  fingerprint: string
  userAgent:   string
  lastSeen:    Date
  ip:          string
}

export interface IUser extends Document {
  _id:          Types.ObjectId
  email:        string
  name:         string
  image:        string | null
  plan:         UserPlan
  planExpiresAt:Date | null

  // Auth
  passwordHash:   string | null
  oauthProvider:  'google' | 'apple' | null
  oauthId:        string | null
  emailVerified:  Date | null
  verificationToken: string | null
  verificationExpires: Date | null

  // Device management (max 3 per Vela/Hora)
  devices: IUserDevice[]

  // Preferences
  preferences: IUserPreferences

  // Subscription
  razorpayCustomerId: string | null
  stripeCustomerId:   string | null

  createdAt: Date
  updatedAt: Date
}

// ── Schema ────────────────────────────────────────────────────

const UserPreferencesSchema = new Schema<IUserPreferences>({
  defaultAyanamsha:   { type: String, default: 'lahiri' },
  defaultChartStyle:  { type: String, default: 'south' },
  defaultHouseSystem: { type: String, default: 'whole_sign' },
  defaultNodeMode:    { type: String, default: 'mean' },
  karakaScheme:       { type: Number, default: 8 },
  language:           { type: String, default: 'en' },
  showDegrees:        { type: Boolean, default: true },
  showNakshatra:      { type: Boolean, default: false },
  showKaraka:         { type: Boolean, default: false },
}, { _id: false })

const UserDeviceSchema = new Schema<IUserDevice>({
  fingerprint: { type: String, required: true },
  userAgent:   { type: String, default: '' },
  lastSeen:    { type: Date,   default: Date.now },
  ip:          { type: String, default: '' },
}, { _id: false })

const UserSchema = new Schema<IUser>({
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  name:         { type: String, required: true, trim: true },
  image:        { type: String, default: null },
  plan:         { type: String, enum: ['kala','vela','hora'], default: 'kala' },
  planExpiresAt:{ type: Date,   default: null },

  passwordHash:   { type: String, default: null, select: false },
  oauthProvider:  { type: String, enum: ['google', 'apple', null], default: null },
  oauthId:        { type: String, default: null },
  emailVerified:  { type: Date,   default: null },
  verificationToken:   { type: String, default: null },
  verificationExpires: { type: Date,   default: null },

  devices: { type: [UserDeviceSchema], default: [] },

  preferences: { type: UserPreferencesSchema, default: () => ({}) },

  razorpayCustomerId: { type: String, default: null },
  stripeCustomerId:   { type: String, default: null },
}, {
  timestamps: true,
})

// ── Indexes ───────────────────────────────────────────────────

UserSchema.index({ email: 1 })
UserSchema.index({ oauthProvider: 1, oauthId: 1 })

// ── Methods ───────────────────────────────────────────────────

UserSchema.methods.isPlanActive = function(): boolean {
  if (this.plan === 'kala') return true
  if (!this.planExpiresAt) return false
  return this.planExpiresAt > new Date()
}

UserSchema.methods.canAddDevice = function(): boolean {
  if (this.plan === 'kala') return false
  return this.devices.length < 3
}

// ── Export ────────────────────────────────────────────────────

export const User = models.User || model<IUser>('User', UserSchema)
export default User
