// ─────────────────────────────────────────────────────────────
//  src/app/api/auth/verify/route.ts
//  Email verification endpoint — unsets token and sets emailVerified
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const mongoUri = process.env.MONGODB_URI!
const dbName   = process.env.MONGODB_DB_NAME || 'jyotish'

export async function POST(req: Request) {
  try {
    const { token } = await req.json()
    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 })
    }

    const client = new MongoClient(mongoUri)
    await client.connect()
    const db = client.db(dbName)
    const users = db.collection('users')

    // Find user with matching token and valid expiration
    const user = await users.findOne({ 
      verificationToken: token,
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
    return NextResponse.json({ success: true, message: 'Email verified' })

  } catch (err) {
    console.error('[verify-api]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
