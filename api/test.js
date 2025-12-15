const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'production_db';

const DEFAULT_ADMIN = {
  id: 'admin-001',
  username: 'admin',
  password: 'password123',
  name: 'Super Admin',
  role: 'ADMIN'
};

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('Testing API connection...');

    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);

    // Check if admin exists, if not, create it
    const adminUser = await db.collection('users').findOne({ id: DEFAULT_ADMIN.id });
    if (!adminUser) {
      await db.collection('users').insertOne(DEFAULT_ADMIN);
      console.log('Default admin user created');
    }

    const users = await db.collection('users').find({}).project({ password: 0 }).toArray();
    const records = await db.collection('records').find({}).toArray();

    await client.close();

    res.status(200).json({
      success: true,
      message: 'API is working',
      users,
      records
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error',
      details: {
        hasMongoUri: !!MONGODB_URI,
        mongoUriLength: MONGODB_URI ? MONGODB_URI.length : 0
      }
    });
  }
};