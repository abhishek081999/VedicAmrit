
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('Usage: node reset-password.cjs <email> <password>');
    process.exit(1);
  }

  let uri = process.env.MONGODB_URI;
  let dbName = process.env.MONGODB_DB_NAME || 'jyotish';

  if (!uri) {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const uriMatch = envContent.match(/^MONGODB_URI=(.*)$/m);
    if (uriMatch) uri = uriMatch[1].trim();
    const dbMatch = envContent.match(/^MONGODB_DB_NAME=(.*)$/m);
    if (dbMatch) dbName = dbMatch[1].trim();
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    
    console.log(`Hashing password for ${email}...`);
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    const result = await db.collection('users').updateOne(
      { email: email.toLowerCase() },
      { $set: { passwordHash: hash } }
    );

    if (result.matchedCount > 0) {
      console.log(`Success: Password updated for ${email}.`);
    } else {
      console.error(`Error: User ${email} not found.`);
    }
  } finally {
    await client.close();
  }
}

resetPassword().catch(console.dir);
