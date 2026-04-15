
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function promote() {
  const email = process.argv[2];
  if (!email) {
    console.error('Please provide an email.');
    process.exit(1);
  }

  let uri = process.env.MONGODB_URI;
  let dbName = process.env.MONGODB_DB_NAME || 'jyotish';

  // Try to load from .env.local if not in process.env
  if (!uri) {
    try {
      const envPath = path.join(__dirname, '..', '.env.local');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const uriMatch = envContent.match(/^MONGODB_URI=(.*)$/m);
        if (uriMatch) uri = uriMatch[1].trim();
        const dbMatch = envContent.match(/^MONGODB_DB_NAME=(.*)$/m);
        if (dbMatch) dbName = dbMatch[1].trim();
      }
    } catch (e) {
      console.error('Error reading .env.local:', e);
    }
  }

  if (!uri) {
    console.error('MONGODB_URI not found.');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const result = await db.collection('users').updateOne(
      { email: email.toLowerCase().trim() },
      { $set: { role: 'admin' } }
    );

    if (result.matchedCount > 0) {
      console.log(`Success: ${email} is now an admin.`);
    } else {
      console.error(`Error: User with email ${email} not found.`);
    }
  } finally {
    await client.close();
  }
}

promote().catch(console.dir);
