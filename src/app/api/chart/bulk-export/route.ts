// ─────────────────────────────────────────────────────────────
//  src/app/api/chart/bulk-export/route.ts
//  POST /api/chart/bulk-export
//
//  Receives an array of chart IDs, recalculates them,
//  generates HTML dossiers, and returns a .zip archive.
//
//  Tier: Platinum Only
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { Chart } from '@/lib/db/models/Chart'
import { User } from '@/lib/db/models/User'
import { calculateChart } from '@/lib/engine/calculator'
import { generateChartHTML } from '@/lib/pdf/chartHtml'
import JSZip from 'jszip'
import type { ChartSettings, UserPlan } from '@/types/astrology'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const plan = (session?.user as any)?.plan ?? 'free'

    if (plan !== 'platinum') {
      return NextResponse.json(
        { error: 'Bulk ZIP export is a Platinum-exclusive feature.', upgradeRequired: true },
        { status: 403 }
      )
    }

    const { chartIds } = await req.json().catch(() => ({}))
    if (!Array.isArray(chartIds) || chartIds.length === 0) {
      return NextResponse.json({ error: 'No chart IDs provided.' }, { status: 400 })
    }

    if (chartIds.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 charts per bulk export.' }, { status: 400 })
    }

    await connectDB()
    const userId = session?.user?.id
    
    // 1. Fetch user branding
    const user = await User.findById(userId).select('brandName brandLogo').lean()
    const branding = {
      brandName: (user as any)?.brandName,
      brandLogo: (user as any)?.brandLogo
    }

    // 2. Fetch all charts from DB
    const savedCharts = await Chart.find({
      _id: { $in: chartIds },
      user: userId
    }).lean()

    if (savedCharts.length === 0) {
      return NextResponse.json({ error: 'No charts found.' }, { status: 404 })
    }

    // 3. Generate dossiers and add to ZIP
    const zip = new JSZip()
    const folder = zip.folder('Jyotish_Dossiers')

    // Helper for local-to-UTC (simplified version of the logic in calculate/route.ts)
    const { fromZonedTime } = await import('date-fns-tz')
    const localToUTC = (date: string, time: string, tz: string) => {
      const safeTime = /^\d{2}:\d{2}:\d{2}$/.test(time) ? time : `${time}:00`
      const localDT  = `${date}T${safeTime}`
      const utcDate = fromZonedTime(localDT, tz)
      return { 
        utcDate: utcDate.toISOString().slice(0, 10), 
        utcTime: utcDate.toISOString().slice(11, 19) 
      }
    }

    // Process in small batches to avoid overwhelming the engine or memory
    const batchSize = 5
    for (let i = 0; i < savedCharts.length; i += batchSize) {
      const batch = savedCharts.slice(i, i + batchSize)
      await Promise.all(batch.map(async (sc) => {
        try {
          const { utcDate, utcTime } = localToUTC(sc.birthDate, sc.birthTime, sc.timezone)
          
          // Recalculate full chart output
          const chartData = await calculateChart({
            name:       sc.name,
            birthDate:  sc.birthDate,
            birthTime:  sc.birthTime,
            utcDate,
            utcTime,
            birthPlace: sc.birthPlace,
            latitude:   sc.latitude,
            longitude:  sc.longitude,
            timezone:   sc.timezone,
            settings:   (sc.settings || {}) as ChartSettings,
          }, 'platinum')

          // Generate HTML dossier
          const html = generateChartHTML(chartData, branding as any)
          
          // Add to ZIP (escaped filename)
          const filename = `${sc.name.replace(/[^a-z0-9]/gi, '_')}.html`
          folder?.file(filename, html)
        } catch (err) {
          console.error(`[bulk-export] Error processing chart ${sc._id}:`, err)
        }
      }))
    }

    // 4. Generate ZIP binary
    const zipData = await zip.generateAsync({ type: 'uint8array' })

    const timestamp = new Date().toISOString().slice(0, 10)
    return new NextResponse(zipData as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="Vedaansh_Export_${timestamp}.zip"`,
        'Cache-Control': 'no-store'
      }
    })

  } catch (err) {
    console.error('[bulk-export] Fatal error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
