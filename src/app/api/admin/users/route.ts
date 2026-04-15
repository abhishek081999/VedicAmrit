
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await connectDB()
    const users = await User.find().sort({ createdAt: -1 }).select('-passwordHash').lean()
    return NextResponse.json({ success: true, users })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { userId, updates } = await req.json()
    await connectDB()
    const user = await User.findByIdAndUpdate(userId, updates, { new: true })
    return NextResponse.json({ success: true, user })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
