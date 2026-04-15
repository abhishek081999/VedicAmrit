
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function checkAuthType() {
  const email = process.argv[2];
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const uriMatch = envContent.match(/^MONGODB_URI=(.*)$/m);
    if (uriMatch) uri = uriMatch[1].trim();
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('jyotish');
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (user) {
      console.log(JSON.stringify({
        email: user.email,
        hasPassword: !!user.passwordHash,
        oauthId: user.oauthId,
        oauthProvider: user.oauthProvider
      }, null, 2));
    } else {
      console.log("User not found");
    }
  } finally {
    await client.close();
  }
}
checkAuthType().catch(console.dir);
