// ─────────────────────────────────────────────────────────────
//  src/lib/db/models/Client.ts
//  CRM Client Management model for Platinum users
// ─────────────────────────────────────────────────────────────

import { Schema, model, models, type Document, type Types } from 'mongoose'
import type { ChartSettings, Rashi } from '@/types/astrology'

export interface IClientNote {
  content:   string
  category:  'general' | 'remedy' | 'prediction' | 'session'
  createdAt: Date
}

export interface IClientRemedy {
  title:       string
  description: string
  status:      'suggested' | 'started' | 'completed' | 'abandoned'
  prescribedAt: Date
  completedAt?: Date
}

export interface IClient extends Document {
  _id:       Types.ObjectId
  userId:    Types.ObjectId   // The Consultant (Platinum User)
  
  // Basic Info
  name:      string
  email?:    string
  phone?:    string
  gender?:   'male' | 'female' | 'other'
  
  // Birth Details (to calculate chart)
  birthDate: string   // "YYYY-MM-DD"
  birthTime: string   // "HH:MM:SS"
  birthPlace:string
  latitude:  number
  longitude: number
  timezone:  string
  
  // CRM Metadata
  tags:      string[]
  notes:     IClientNote[]
  remedies:  IClientRemedy[]
  status:    'active' | 'inactive' | 'prospective'
  
  // Dashboard Aggregates
  lastSessionAt?: Date
  nextSessionAt?: Date
  totalSessions:  number
  
  // Settings specific to this client (overrides user defaults)
  preferredSettings?: Partial<ChartSettings>
  
  createdAt: Date
  updatedAt: Date
}

const ClientSchema = new Schema<IClient>({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  name:      { type: String, required: true, trim: true },
  email:     { type: String, lowercase: true, trim: true },
  phone:     { type: String, trim: true },
  gender:    { type: String, enum: ['male', 'female', 'other'], default: 'other' },
  
  birthDate: { type: String, required: true },
  birthTime: { type: String, required: true },
  birthPlace:{ type: String, required: true, trim: true },
  latitude:  { type: Number, required: true },
  longitude: { type: Number, required: true },
  timezone:  { type: String, required: true },
  
  tags:      [{ type: String, trim: true }],
  notes: [{
    content:   { type: String, required: true },
    category:  { type: String, enum: ['general', 'remedy', 'prediction', 'session'], default: 'general' },
    createdAt: { type: Date, default: Date.now },
  }],
  remedies: [{
    title:       { type: String, required: true },
    description: { type: String, default: '' },
    status:      { type: String, enum: ['suggested', 'started', 'completed', 'abandoned'], default: 'suggested' },
    prescribedAt:{ type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  }],
  status:    { type: String, enum: ['active', 'inactive', 'prospective'], default: 'active' },
  
  lastSessionAt: { type: Date, default: null },
  nextSessionAt: { type: Date, default: null },
  totalSessions:  { type: Number, default: 0 },
  
  preferredSettings: { type: Schema.Types.Mixed, default: null },
}, {
  timestamps: true,
})

// Quick search indexes
ClientSchema.index({ name: 'text', email: 'text', tags: 'text' })
ClientSchema.index({ userId: 1, lastSessionAt: -1 })
ClientSchema.index({ userId: 1, createdAt: -1 })

export const Client = models.Client || model<IClient>('Client', ClientSchema)
