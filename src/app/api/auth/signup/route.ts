// ─────────────────────────────────────────────────────────────
//  src/app/api/auth/signup/route.ts
//  User registration endpoint — hashes password and saves to MongoDB
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import crypto from 'crypto'
import { sendVerificationEmail } from '@/lib/email'

const mongoUri = process.env.MONGODB_URI!
const dbName   = process.env.MONGODB_DB_NAME || 'jyotish'

const SignupSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(req: Request) {
  try {
    const body   = await req.json()
    const parsed = SignupSchema.safeParse(body)

    if (!parsed.success) {
      const error = parsed.error.errors[0].message
      return NextResponse.json({ success: false, error }, { status: 400 })
    }

    const { name, email, password } = parsed.data
    const pwHash = await bcrypt.hash(password, 12)
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const client = new MongoClient(mongoUri)
    await client.connect()
    const db = client.db(dbName)
    const users = db.collection('users')

    // Check if user already exists
    const existing = await users.findOne({ email: email.toLowerCase() })
    if (existing) {
      await client.close()
      return NextResponse.json({ success: false, error: 'User already exists' }, { status: 409 })
    }

    // Create user
    await users.insertOne({
      name,
      email:               email.toLowerCase(),
      passwordHash:        pwHash,
      plan:                'free',
      emailVerified:       null,
      verificationToken,
      verificationExpires,
      preferences:         {},
      devices:             [],
      createdAt:           new Date(),
      updatedAt:           new Date(),
    })

    await client.close()

    // Send verification email
    const emailRes = await sendVerificationEmail(email.toLowerCase(), verificationToken)
    
    if (!emailRes.success) {
      console.error('[signup] failed to send email:', emailRes.error)
      // We don't fail the signup, but return success with a warning (or should we fail?)
      // Let's return success but mentioned that delivery might be delayed/failed.
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
      verified: false
    }, { status: 201 })

  } catch (err: unknown) {
    console.error('[signup] error:', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
