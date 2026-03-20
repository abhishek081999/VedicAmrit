// ─────────────────────────────────────────────────────────────
//  POST /api/chart/save
//  Saves a calculated chart to MongoDB for the logged-in user.
//  Anonymous users get a guest-scoped save (userId: null).
//  Returns { success, chartId, slug }
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { Chart } from '@/lib/db/models/Chart'
import crypto from 'crypto'

export const runtime = 'nodejs'

const SaveSchema = z.object({
  name:       z.string().min(1).max(100),
  birthDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime:  z.string(),
  birthPlace: z.string().min(1),
  latitude:   z.number(),
  longitude:  z.number(),
  timezone:   z.string(),
  settings:   z.record(z.unknown()),
  isPublic:   z.boolean().default(false),
  isPersonal: z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const body    = await req.json()
    const parsed  = SaveSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
    }

    await connectDB()

    const { name, birthDate, birthTime, birthPlace, latitude, longitude, timezone, settings, isPublic, isPersonal } = parsed.data

    const userId = session?.user?.id

    // If saving as personal, unset older personal charts for this user
    if (isPersonal && userId) {
      await Chart.updateMany({ userId, isPersonal: true }, { isPersonal: false })
    }

    // Generate a short public slug if isPublic
    const slug = isPublic ? crypto.randomBytes(5).toString('hex') : null

    const chart = await Chart.create({
      userId:    userId ?? null,
      name,
      birthDate,
      birthTime: birthTime.length === 5 ? birthTime + ':00' : birthTime,
      birthPlace,
      latitude,
      longitude,
      timezone,
      settings,
      isPublic,
      isPersonal,
      slug,
    })

    return NextResponse.json({
      success: true,
      chartId: chart._id.toString(),
      slug:    chart.slug,
    })
  } catch (err) {
    console.error('[chart/save]', err)
    return NextResponse.json({ success: false, error: 'Failed to save chart' }, { status: 500 })
  }
}