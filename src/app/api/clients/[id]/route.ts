// ─────────────────────────────────────────────────────────────
//  src/app/api/clients/[id]/route.ts
//  Single Client Operations (GET, PATCH, DELETE)
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { Client } from '@/lib/db/models/Client'
import { User } from '@/lib/db/models/User'

export const runtime = 'nodejs'

const UpdateClientSchema = z.object({
  name:       z.string().optional(),
  email:      z.string().email().optional().or(z.literal('')),
  phone:      z.string().optional(),
  gender:     z.enum(['male', 'female', 'other']).optional(),
  birthDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  birthTime:  z.string().optional(),
  birthPlace: z.string().optional(),
  latitude:   z.number().optional(),
  longitude:  z.number().optional(),
  timezone:   z.string().optional(),
  tags:       z.array(z.string()).optional(),
  status:     z.enum(['active', 'inactive', 'prospective']).optional(),
  lastSessionAt: z.string().optional(),
  nextSessionAt: z.string().optional(),
  remedyAction:  z.enum(['add', 'update', 'delete']).optional(),
  remedyId:      z.string().optional(),
})

// Add Note Schema
const NoteSchema = z.object({
  type:     z.enum(['note', 'remedy']),
  content:  z.string().optional(),
  category: z.enum(['general', 'remedy', 'prediction', 'session']).optional(),
  title:    z.string().optional(),
  description: z.string().optional(),
  status:   z.enum(['suggested', 'started', 'completed', 'abandoned']).optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    const userId  = session?.user?.id
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const client = await Client.findOne({ _id: params.id, userId }).lean()
    if (!client) return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 })

    return NextResponse.json({ success: true, client })
  } catch (err) {
    console.error('[api/clients/[id]] GET', err)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    const userId  = session?.user?.id
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body    = await req.json()
    const parsed  = UpdateClientSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })

    await connectDB()
    const client = await Client.findOneAndUpdate(
      { _id: params.id, userId },
      { $set: parsed.data },
      { new: true }
    )

    if (!client) return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 })

    return NextResponse.json({ success: true, client })
  } catch (err) {
    console.error('[api/clients/[id]] PATCH', err)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Logic for adding a note
  try {
    const session = await auth()
    const userId  = session?.user?.id
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body    = await req.json()
    const parsed  = NoteSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })

    await connectDB()
    const { type, content, category, title, description, status } = parsed.data

    let update = {}
    if (type === 'note') {
      update = { 
        $push: { notes: { content, category, createdAt: new Date() } },
        $inc: { totalSessions: category === 'session' ? 1 : 0 },
        $set: category === 'session' ? { lastSessionAt: new Date() } : {}
      }
    } else if (type === 'remedy') {
      update = {
        $push: { remedies: { title, description, status, prescribedAt: new Date() } }
      }
    }

    const client = await Client.findOneAndUpdate(
      { _id: params.id, userId },
      update,
      { new: true }
    )

    if (!client) return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 })

    return NextResponse.json({ success: true, client })
  } catch (err) {
    console.error('[api/clients/[id]] POST (Note)', err)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    const userId  = session?.user?.id
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const client = await Client.findOneAndDelete({ _id: params.id, userId })
    if (!client) return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/clients/[id]] DELETE', err)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
