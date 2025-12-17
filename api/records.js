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

      // Get the inserted record to return to frontend
      const insertedRecord = await db.collection('records').findOne({ _id: result.insertedId });

      await client.close();

      if (!insertedRecord) {
        return res.status(500).json({
          message: 'Failed to retrieve inserted record',
          insertedId: result.insertedId
        });
      }

      res.status(201).json(insertedRecord);
    } else if (req.method === 'PUT') {
      // Update an existing record
      const updatedRecord = req.body;

      if (!updatedRecord.id) {
        await client.close();
        return res.status(400).json({
          message: 'Record ID is required for updating',
          receivedBody: req.body
        });
      }

      console.log('Updating record with ID:', updatedRecord.id);

      const result = await db.collection('records').updateOne(
        { id: updatedRecord.id },
        { $set: updatedRecord }
      );

      if (result.matchedCount === 0) {
        await client.close();
        return res.status(404).json({
          message: 'Record not found for updating',
          recordId: updatedRecord.id,
          result: result
        });
      }

      // Return the updated record
      await client.close();
      res.status(200).json(updatedRecord);
    } else if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        await client.close();
        return res.status(400).json({
          message: 'Record ID is required for deletion',
          receivedBody: req.body
        });
      }

      console.log('Deleting record with ID:', id);

      const result = await db.collection('records').deleteOne({ id: id });

      await client.close();

      if (result.deletedCount === 0) {
        return res.status(404).json({
          message: 'Record not found',
          recordId: id,
          result: result
        });
      }

      res.status(200).json({
        message: 'Record deleted successfully',
        result: {
          deletedCount: result.deletedCount
        }
      });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }

    await client.close();
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};