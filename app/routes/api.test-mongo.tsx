import { MongoClient } from 'mongodb';

export async function loader() {
  const testUri = "mongodb+srv://piyushhole:Piyushhole2001@ecom.neu3z5n.mongodb.net/resumeAI?retryWrites=true&w=majority&appName=resumeAI&authSource=admin&directConnection=false";
  
  try {
    console.log('🧪 Testing MongoDB connection...');
    console.log('Test URI:', testUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    const client = new MongoClient(testUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 15000,
      retryWrites: true,
      w: 'majority',
      authSource: 'admin',
      ssl: true,
      tls: true
    });
    
    await client.connect();
    console.log('✅ Test connection successful!');
    
    // Test ping
    await client.db('admin').command({ ping: 1 });
    console.log('✅ Test ping successful!');
    
    // Test database access
    const db = client.db('resumeAI');
    const collections = await db.listCollections().toArray();
    console.log('✅ Database access successful!');
    console.log('Collections found:', collections.length);
    
    await client.close();
    
    return new Response(JSON.stringify({ 
      status: "success",
      message: "MongoDB connection test passed!",
      collections: collections.length,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ MongoDB test failed:', error);
    
    return new Response(JSON.stringify({ 
      status: "error",
      message: "MongoDB connection test failed",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

