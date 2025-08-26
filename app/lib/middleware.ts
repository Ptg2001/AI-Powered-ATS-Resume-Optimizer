import { verifyToken } from './auth';
import { getDatabase } from './db';
import { ObjectId } from 'mongodb';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export async function authenticateUser(request: Request): Promise<{ user: any; error?: string }> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'No token provided' };
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return { user: null, error: 'Invalid token' };
  }

  try {
    const db = await getDatabase();
    const usersCollection = db.collection('users');
    
    const objectId = new ObjectId(decoded.userId);
    const user = await usersCollection.findOne({ _id: objectId });
    
    if (!user) {
      return { user: null, error: 'User not found' };
    }

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, error: 'Authentication failed' };
  }
}

export function requireAuth(handler: Function) {
  return async (request: Request) => {
    const authResult = await authenticateUser(request);
    
    if (authResult.error || !authResult.user) {
      return new Response(JSON.stringify({ error: authResult.error || 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Add user to request context
    (request as any).user = authResult.user;
    
    return handler(request);
  };
}
