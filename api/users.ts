import { Request, Response } from 'express';
import { connectToDatabase } from './mongodb';

export default async function handler(req: Request, res: Response) {
  const { db } = await connectToDatabase();
  const usersCollection = db.collection('users');

  try {
    switch (req.method) {
      case 'POST': {
        const newUser = req.body;
        await usersCollection.insertOne(newUser);
        const { password, ...userWithoutPassword } = newUser;
        return res.status(201).json(userWithoutPassword);
      }
      
      case 'PUT': {
        const updatedUser = req.body;
        const { id, ...updates } = updatedUser;
        await usersCollection.updateOne({ id: id }, { $set: updates });
        const finalUser = await usersCollection.findOne({ id: id });
        const { password, ...userWithoutPassword } = finalUser;
        return res.status(200).json(userWithoutPassword);
      }
      
      default:
        res.setHeader('Allow', ['POST', 'PUT']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Users Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
