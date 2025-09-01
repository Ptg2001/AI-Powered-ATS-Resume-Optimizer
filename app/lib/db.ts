import { MongoClient } from 'mongodb';
import { config } from './config';

const MONGODB_URI = config.mongodb.uri;
const MONGODB_ENABLED = config.mongodb.enabled;

let cachedClient: MongoClient | null = null;

export async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  console.log('🔍 MongoDB Connection Debug:');
  console.log('URI format:', MONGODB_URI.includes('mongodb+srv://') ? 'mongodb+srv' : 'mongodb');
  console.log('Host:', MONGODB_URI.match(/@([^/]+)/)?.[1] || 'unknown');
  console.log('Database:', MONGODB_URI.match(/\/([^?]+)/)?.[1] || 'unknown');

  // Add proper MongoDB connection options
  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 20000,
    retryWrites: true,
    w: 'majority',
    authSource: 'admin',
    ssl: true,
    tls: true,
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames: false
  });
  
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas - resumeAI database');
    
    // Test the connection
    await client.db('admin').command({ ping: 1 });
    console.log('✅ MongoDB ping successful');
    
    cachedClient = client;
    return client;
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    
    // Try alternative connection string format
    if (MONGODB_URI.includes('mongodb+srv://')) {
      console.log('🔄 Trying alternative connection format...');
      const altUri = MONGODB_URI.replace('mongodb+srv://', 'mongodb://');
      
      try {
        const altClient = new MongoClient(altUri, {
          maxPoolSize: 5,
          serverSelectionTimeoutMS: 15000,
          socketTimeoutMS: 45000,
          connectTimeoutMS: 20000,
          retryWrites: true,
          w: 'majority',
          authSource: 'admin',
          ssl: true,
          tls: true
        });
        
        await altClient.connect();
        console.log('✅ Connected using alternative format');
        
        await altClient.db('admin').command({ ping: 1 });
        console.log('✅ Alternative connection ping successful');
        
        cachedClient = altClient;
        return altClient;
      } catch (altError) {
        console.error('❌ Alternative connection also failed:', altError);
      }
    }
    
    throw error;
  }
}

export async function getDatabase() {
  const client = await connectToDatabase();
  return client.db('resumeAI');
}


