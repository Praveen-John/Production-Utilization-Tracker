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
      const records = await db.collection('records').find({}).toArray();
      res.status(200).json(records);
    } else if (req.method === 'POST') {
      const newRecord = req.body;
      const result = await db.collection('records').insertOne(newRecord);
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