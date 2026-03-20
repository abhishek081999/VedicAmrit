// ─────────────────────────────────────────────────────────────
//  src/lib/db/models/Chart.ts
//  Chart + ChartCache Mongoose models
// ─────────────────────────────────────────────────────────────

import { Schema, model, models, type Document, type Types } from 'mongoose'
import type { ChartSettings, ChartOutput } from '@/types/astrology'

// ── Chart Model ───────────────────────────────────────────────

export interface IChart extends Document {
  _id:       Types.ObjectId
  userId:    Types.ObjectId | null   // null = anonymous
  name:      string
  birthDate: string   // "YYYY-MM-DD" — stored as string for precision
  birthTime: string   // "HH:MM:SS"
  birthPlace:string
  latitude:  number
  longitude: number
  timezone:  string   // IANA timezone e.g. "Asia/Kolkata"
  settings:  ChartSettings
  isPublic:  boolean
  isPersonal:boolean   // true = user's own birth chart
  slug:      string | null   // for public sharing
  notes:     Array<{ content: string; createdAt: Date }>
  cachedDataId: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const ChartSchema = new Schema<IChart>({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  name:      { type: String, required: true, trim: true, maxlength: 100 },
  birthDate: { type: String, required: true },
  birthTime: { type: String, required: true },
  birthPlace:{ type: String, required: true, trim: true },
  latitude:  { type: Number, required: true, min: -90,  max: 90 },
  longitude: { type: Number, required: true, min: -180, max: 180 },
  timezone:  { type: String, required: true },
  settings:  { type: Schema.Types.Mixed, required: true },
  isPublic:  { type: Boolean, default: false },
  isPersonal:{ type: Boolean, default: false, index: true },
  slug:      { type: String, unique: true, sparse: true },
  notes: [{
    content:   { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }],
  cachedDataId: { type: Schema.Types.ObjectId, ref: 'ChartCache', default: null },
}, {
  timestamps: true,
})

ChartSchema.index({ userId: 1, createdAt: -1 })
ChartSchema.index({ isPublic: 1, createdAt: -1 })

export const Chart = models.Chart || model<IChart>('Chart', ChartSchema)

// ── ChartCache Model ──────────────────────────────────────────
// Stores all calculated data — separate from Chart to keep Chart lean

export interface IChartCache extends Document {
  _id:       Types.ObjectId
  chartId:   Types.ObjectId
  ayanamsha: string
  version:   number    // increment to invalidate
  data:      ChartOutput
  expiresAt: Date
  createdAt: Date
}

const ChartCacheSchema = new Schema<IChartCache>({
  chartId:   { type: Schema.Types.ObjectId, ref: 'Chart', required: true, index: true },
  ayanamsha: { type: String, required: true },
  version:   { type: Number, default: 1 },
  data:      { type: Schema.Types.Mixed, required: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
}, {
  timestamps: { createdAt: true, updatedAt: false },
})

ChartCacheSchema.index({ chartId: 1, ayanamsha: 1 })

export const ChartCache = models.ChartCache || model<IChartCache>('ChartCache', ChartCacheSchema)
