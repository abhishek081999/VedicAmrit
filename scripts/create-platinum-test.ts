// ─────────────────────────────────────────────────────────────
//  scripts/create-platinum-test.ts
//  Quick seed script for a Platinum test user
// ─────────────────────────────────────────────────────────────

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

// Manually parse .env.local
const envPath = path.join(process.cwd(), '.env.local')
const envFile = fs.readFileSync(envPath, 'utf-8')
const env: Record<string, string> = {}
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=')
  if (key && val) env[key.trim()] = val.join('=').trim().replace(/^"(.*)"$/, '$1')
})

const MONGODB_URI = env.MONGODB_URI
const MONGODB_DB_NAME = env.MONGODB_DB_NAME || 'jyotish'

const TEST_USER = {
  name:          'Platinum Test',
  email:         'test@vedaansh.com',
  password:      'platinum123',
  plan:          'platinum',
  emailVerified: new Date(),
}

async function run() {
  if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI not found in .env.local')
    process.exit(1)
  }

  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME })
    console.log('Connected.')

    const passwordHash = await bcrypt.hash(TEST_USER.password, 12)

    const db = mongoose.connection.db
    const usersCol = db.collection('users')

    // Check if user exists
    const existing = await usersCol.findOne({ email: TEST_USER.email })

    if (existing) {
      console.log(`User ${TEST_USER.email} already exists. Updating to PLATINUM...`)
      await usersCol.updateOne(
        { email: TEST_USER.email },
        { 
          $set: { 
            passwordHash,
            plan: 'platinum',
            emailVerified: new Date(),
            name: TEST_USER.name
          } 
        }
      )
    } else {
      console.log(`Creating new PLATINUM user: ${TEST_USER.email}...`)
      await usersCol.insertOne({
        name:          TEST_USER.name,
        email:         TEST_USER.email,
        passwordHash,
        plan:          'platinum',
        emailVerified: new Date(),
        preferences: {
          defaultAyanamsha: 'lahiri',
          defaultChartStyle: 'south',
          defaultHouseSystem: 'whole_sign',
          defaultNodeMode: 'mean',
          karakaScheme: 8,
          language: 'en',
          showDegrees: true,
          showNakshatra: false,
          showKaraka: false
        },
        devices: [],
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    console.log('──────────────────────────────────────────────────')
    console.log('✅ PLATINUM TEST USER READY')
    console.log(`📧 Email:    ${TEST_USER.email}`)
    console.log(`🔑 Password: ${TEST_USER.password}`)
    console.log('──────────────────────────────────────────────────')

  } catch (err) {
    console.error('Migration failed:', err)
  } finally {
    await mongoose.disconnect()
    process.exit()
  }
}

run()
