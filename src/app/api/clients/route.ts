// ─────────────────────────────────────────────────────────────
//  src/app/api/clients/route.ts
//  CRUD Routes for CRM Client Management
//  Access restricted to PLATINUM users
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { Client } from '@/lib/db/models/Client'
import { User } from '@/lib/db/models/User'
import { getPlanetPosition, dateToJD, getAyanamsha, SWISSEPH_IDS } from '@/lib/engine/ephemeris'
import { calcVimshottari } from '@/lib/engine/dasha/vimshottari'

export const runtime = 'nodejs'

const ClientInputSchema = z.object({
  name:       z.string().min(1).max(100),
  email:      z.string().email().optional().or(z.literal('')),
  phone:      z.string().optional(),
  gender:     z.enum(['male', 'female', 'other']).optional(),
  birthDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime:  z.string(),
  birthPlace: z.string().min(1),
  latitude:   z.number(),
  longitude:  z.number(),
  timezone:   z.string(),
  tags:       z.array(z.string()).optional(),
  status:     z.enum(['active', 'inactive', 'prospective']).optional(),
})

// ── GET: List all clients for the consultant ──────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const userId  = session?.user?.id
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    
    // Platinum Check
    const user = await User.findById(userId).select('plan').lean()
    if ((user as any)?.plan !== 'platinum') {
      return NextResponse.json({ success: false, error: 'CRM requires Platinum tier' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ''
    const filter: any = { userId }
    
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    }

    const clientsRaw = await Client.find(filter)
      .sort({ lastSessionAt: -1, createdAt: -1 })
      .lean()

    // ── Calculate current dasha for each client ─────────────────
    const clients = clientsRaw.map(client => {
      try {
        const birthDate = new Date(`${client.birthDate}T${client.birthTime}Z`)
        const jd = dateToJD(birthDate)
        if (isNaN(jd)) throw new Error('Invalid birth date/time')

        // Get Moon longitude (Sidereal)
        const moonPos = getPlanetPosition(jd, SWISSEPH_IDS.Mo, true)
        const moonLonSid = moonPos.longitude
        
        const dashaTree = calcVimshottari(moonLonSid, birthDate, 2)
        const now = new Date()
        const nowMs = now.getTime()

        // Find currently active MD and AD
        let md = dashaTree.find(n => n.isCurrent)
        
        // Fallback: If isCurrent isn't set, find by date comparison
        if (!md) {
          md = dashaTree.find(n => nowMs >= new Date(n.start).getTime() && nowMs < new Date(n.end).getTime())
        }

        let ad = md?.children.find(n => n.isCurrent)
        if (md && !ad) {
          ad = md.children.find(n => nowMs >= new Date(n.start).getTime() && nowMs < new Date(n.end).getTime())
        }
        
        const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        
        let alert = null
        if (md && new Date(md.end) < thirtyDaysOut) {
          alert = { type: 'MD_CHANGE', date: md.end, lord: dashaTree[dashaTree.indexOf(md) + 1]?.lord || '??' }
        } else if (ad && new Date(ad.end) < thirtyDaysOut) {
          alert = { type: 'AD_CHANGE', date: ad.end, lord: md?.children[md.children.indexOf(ad) + 1]?.lord || '??' }
        }

        return {
          ...client,
          activeDasha: md ? `${md.lord.slice(0, 2)}-${ad?.lord.slice(0, 2) || '??'}` : null,
          activeDashaStart: ad?.start || md?.start || null,
          activeDashaEnd: ad?.end || md?.end || null,
          dashaAlert: alert
        }
      } catch (e) {
        console.error(`Dasha calc failed for client ${client.name}:`, e)
        return { ...client, activeDasha: null }
      }
    })

    return NextResponse.json({ success: true, clients })
  } catch (err) {
    console.error('[api/clients] GET', err)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

// ── POST: Create new client ───────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId  = session?.user?.id
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body    = await req.json()
    const parsed  = ClientInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.format() }, { status: 400 })
    }

    await connectDB()

    // Platinum Check
    const user = await User.findById(userId).select('plan').lean()
    if ((user as any)?.plan !== 'platinum') {
      return NextResponse.json({ success: false, error: 'CRM requires Platinum tier' }, { status: 403 })
    }

    const clientData = {
      ...parsed.data,
      userId,
      birthTime: parsed.data.birthTime.length === 5 ? `${parsed.data.birthTime}:00` : parsed.data.birthTime
    }

    const client = await Client.create(clientData)

    return NextResponse.json({ success: true, client })
  } catch (err) {
    console.error('[api/clients] POST', err)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
