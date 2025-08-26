import { MongoClient } from 'mongodb';
import { config } from './config';

const MONGODB_URI = config.mongodb.uri;
const MONGODB_ENABLED = config.mongodb.enabled;

let cachedClient: MongoClient | null = null;

export async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas - resumeAI database');
    cachedClient = client;
    return client;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

export async function getDatabase() {
  const client = await connectToDatabase();
  return client.db('resumeAI');
}


