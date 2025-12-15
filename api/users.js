const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'production_db';

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);

    if (req.method === 'GET') {
      const users = await db.collection('users').find({}).project({ password: 0 }).toArray();
      res.status(200).json(users);
    } else if (req.method === 'POST') {
      const newUser = req.body;
      const result = await db.collection('users').insertOne(newUser);
      res.status(201).json(result);
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }

    await client.close();
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};