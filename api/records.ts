import { Request, Response } from 'express';
import { connectToDatabase } from './mongodb';

export default async function handler(req: Request, res: Response) {
  const { db } = await connectToDatabase();
  const recordsCollection = db.collection('records');

  try {
    switch (req.method) {
      case 'POST': {
        const newRecord = req.body;
        await recordsCollection.insertOne(newRecord);
        return res.status(201).json(newRecord);
      }
      
      case 'PUT': {
        const updatedRecord = req.body;
        const { id, ...updates } = updatedRecord;
        await recordsCollection.updateOne({ id }, { $set: updates });
        const finalRecord = await recordsCollection.findOne({ id });
        return res.status(200).json(finalRecord);
      }
      
      case 'DELETE': {
        const { id } = req.body;
        const result = await recordsCollection.deleteOne({ id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Record not found' });
        }
        return res.status(200).json({ message: 'Record deleted successfully' });
      }
      
      default:
        res.setHeader('Allow', ['POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error)
  {
    console.error('API Records Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
