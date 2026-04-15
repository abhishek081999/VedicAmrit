
import 'dotenv/config'
import mongoose from 'mongoose'
import { User } from '../src/lib/db/models/User'

async function listUsers() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI not found')
    process.exit(1)
  }
  await mongoose.connect(uri)
  const users = await User.find({}, 'email name role').sort({ createdAt: -1 }).limit(10)
  console.log(JSON.stringify(users, null, 2))
  await mongoose.disconnect()
}

listUsers().catch(err => console.error(err))
