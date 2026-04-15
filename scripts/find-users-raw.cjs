
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || 'jyotish');
    const users = await db.collection('users').find({}, { projection: { email: 1, name: 1, role: 1 } }).sort({ _id: -1 }).limit(5).toArray();
    console.log(JSON.stringify(users, null, 2));
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
