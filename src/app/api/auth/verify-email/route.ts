// src/app/api/auth/verify-email/route.ts
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { MongoClient } from 'mongodb'

const mongoUri = process.env.MONGODB_URI!
const dbName   = process.env.MONGODB_DB_NAME || 'jyotish'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 })
    }

    const client = new MongoClient(mongoUri)
    await client.connect()
    const db = client.db(dbName)
    const users = db.collection('users')

    // Find valid/not-expired token
    const user = await users.findOne({
      verificationToken:   token,
      verificationExpires: { $gt: new Date() }
    })

    if (!user) {
      await client.close()
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 400 })
    }

    // Mark as verified
    await users.updateOne(
      { _id: user._id },
      { 
        $set: { emailVerified: new Date() },
        $unset: { verificationToken: "", verificationExpires: "" }
      }
    )

    await client.close()

    // Redirect to login or show success?
    return NextResponse.json({ success: true, message: 'Email verified successfully' })

  } catch (err) {
    console.error('[verify-email] error:', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
