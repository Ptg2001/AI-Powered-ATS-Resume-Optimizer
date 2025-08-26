import { getDatabase } from "~/lib/db";
import { verifyToken } from "~/lib/auth";
import { ObjectId } from "mongodb";

export async function loader({ request }: { request: Request }) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: "No token provided" }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const db = await getDatabase();
    const usersCollection = db.collection('users');
    
    // Convert string ID to ObjectId for MongoDB query
    const objectId = new ObjectId(decoded.userId);
    const user = await usersCollection.findOne({ _id: objectId });
    
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      valid: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
