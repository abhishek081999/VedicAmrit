// ─────────────────────────────────────────────────────────────
//  scripts/promote-admin.ts
//  Usage: npx tsx scripts/promote-admin.ts your-email@example.com
// ─────────────────────────────────────────────────────────────

import 'dotenv/config'
import mongoose from 'mongoose'
import { User } from '../src/lib/db/models/User'

async function promote() {
  const email = process.argv[2]
  if (!email) {
    console.error('Please provide an email address.')
    process.exit(1)
  }

  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI not found in environment.')
    process.exit(1)
  }

  await mongoose.connect(uri)
  console.log('Connected to MongoDB.')

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { role: 'admin' },
    { new: true }
  )

  if (user) {
    console.log(`Success: ${user.email} is now an admin.`)
  } else {
    console.error(`Error: User with email ${email} not found.`)
  }

  await mongoose.disconnect()
}

promote().catch(err => console.error(err))
