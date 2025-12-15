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
    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Log the raw body for debugging
      console.log('Raw request body type:', typeof req.body);
      console.log('Raw request body:', req.body);

      // Parse JSON body - req.body might already be an object or a string
      let body;
      if (typeof req.body === 'object') {
        body = req.body;
      } else if (typeof req.body === 'string') {
        try {
          body = JSON.parse(req.body);
        } catch (e) {
          console.error('JSON parse error:', e);
          await client.close();
          return res.status(400).json({
            message: 'Invalid JSON in request body',
            body: req.body,
            error: e.message
          });
        }
      } else {
        await client.close();
        return res.status(400).json({
          message: 'Invalid request body type',
          type: typeof req.body,
          body: req.body
        });
      }

      console.log('Parsed body:', body);

      if (req.method === 'POST') {
        const result = await db.collection('users').insertOne(body);
        await client.close();
        res.status(201).json(result);
      } else if (req.method === 'PUT') {
        const id = body.id;
        if (!id) {
          await client.close();
          return res.status(400).json({
            message: 'User ID is required',
            receivedBody: body
          });
        }

        const updateData = { ...body };
        delete updateData.id; // Remove id from update data

        console.log('Updating user:', id);
        console.log('Update data:', updateData);

        const result = await db.collection('users').updateOne(
          { id: id },
          { $set: updateData }
        );

        await client.close();

        if (result.matchedCount === 0) {
          return res.status(404).json({
            message: 'User not found',
            userId: id,
            result: result
          });
        }

        res.status(200).json({
          message: 'User updated successfully',
          result: {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount
          }
        });
      }
    } else {
      await client.close();
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
      stack: error.stack
    });
  }
};