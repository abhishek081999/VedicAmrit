import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import dbConnect from '@/lib/db/mongodb'
import { Chart } from '@/lib/db/models/Chart'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const chartId = searchParams.get('chartId')
    if (!chartId) return NextResponse.json({ success: false, error: 'Missing chartId' }, { status: 400 })

    await dbConnect()
    const chart = await Chart.findOne({ _id: chartId, userId: session.user.id })
    if (!chart) return NextResponse.json({ success: false, error: 'Chart not found' }, { status: 404 })

    return NextResponse.json({ success: true, notes: chart.notes || [] })
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { chartId, content } = await req.json()
    if (!chartId || !content) return NextResponse.json({ success: false, error: 'Missing chartId or content' }, { status: 400 })

    await dbConnect()
    const chart = await Chart.findOne({ _id: chartId, userId: session.user.id })
    if (!chart) return NextResponse.json({ success: false, error: 'Chart not found' }, { status: 404 })

    chart.notes.push({ content, createdAt: new Date() })
    await chart.save()

    return NextResponse.json({ success: true, notes: chart.notes })
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const chartId = searchParams.get('chartId')
    const noteId = searchParams.get('noteId')
    if (!chartId || !noteId) return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })

    await dbConnect()
    const chart = await Chart.findOne({ _id: chartId, userId: session.user.id })
    if (!chart) return NextResponse.json({ success: false, error: 'Chart not found' }, { status: 404 })

    chart.notes = chart.notes.filter((n: any) => n._id.toString() !== noteId)
    await chart.save()

    return NextResponse.json({ success: true, notes: chart.notes })
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
