// ─────────────────────────────────────────────────────────────
//  src/app/api/chart/send-email/route.ts
//  POST /api/chart/send-email
//
//  Sends the Jyotish Master Dossier (HTML attachment) to a client.
//  Tier: Gold+
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { generateChartHTML } from '@/lib/pdf/chartHtml'
import { sendChartEmail } from '@/lib/email'
import type { ChartOutput } from '@/types/astrology'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const plan = (session?.user as any)?.plan ?? 'free'

    if (plan === 'free') {
      return NextResponse.json(
        { error: 'Email delivery requires Gold or Platinum plan.', upgradeRequired: true },
        { status: 403 }
      )
    }

    const { chart, targetEmail } = await req.json().catch(() => ({}))

    if (!chart || !targetEmail) {
      return NextResponse.json(
        { error: 'Chart data and target email are required.' },
        { status: 400 }
      )
    }

    const userId = session?.user?.id
    let branding = null
    let senderName = process.env.NEXT_PUBLIC_APP_NAME || 'Vedaansh'

    if (userId) {
      const { User } = await import('@/lib/db/models/User')
      await (await import('@/lib/db/mongodb')).default()
      const user = await User.findById(userId).select('plan brandName brandLogo').lean()
      
      if ((user as any)?.plan === 'platinum') {
        branding = {
          brandName: (user as any).brandName,
          brandLogo: (user as any).brandLogo
        }
        if ((user as any).brandName) {
            senderName = (user as any).brandName
        }
      }
    }

    // 1. Generate the HTML dossier
    const htmlContent = generateChartHTML(chart as ChartOutput, branding as any)

    // 2. Send the email
    const result = await sendChartEmail(targetEmail, (chart as ChartOutput).meta.name, htmlContent, senderName)

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Chart emailed successfully.' })
    } else {
      console.error('[send-email] Resend error:', result.error)
      return NextResponse.json({ success: false, error: 'Failed to send email.' }, { status: 500 })
    }

  } catch (err) {
    console.error('[send-email] Fatal error:', err)
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 })
  }
}
