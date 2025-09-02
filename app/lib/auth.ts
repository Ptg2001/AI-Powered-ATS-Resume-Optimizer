import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { getDatabase } from './db';

const JWT_SECRET = config.jwt.secret;

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: config.jwt.expiresIn });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch (error) {
    return null;
  }
}

// Google OAuth helper: find or create user by Google profile
export async function findOrCreateUserFromGoogle(profile: { sub: string; email?: string; name?: string; picture?: string; }): Promise<{ id: string; email?: string; name?: string; }>{
  const db = await getDatabase();
  const users = db.collection('users');

  const googleId = profile.sub;

  // Try to find by googleId first
  let user = await users.findOne({ googleId });
  if (!user && profile.email) {
    // Fallback: find by email and link
    user = await users.findOne({ email: profile.email });
    if (user) {
      await users.updateOne({ _id: user._id }, { $set: { googleId } });
    }
  }

  if (!user) {
    // Create a new user document with googleId (no password)
    const insert = await users.insertOne({
      googleId,
      email: profile.email || null,
      name: profile.name || 'Google User',
      avatar: profile.picture || null,
      createdAt: new Date(),
      provider: 'google'
    });
    user = await users.findOne({ _id: insert.insertedId });
  }

  if (!user) {
    throw new Error('Failed to create or retrieve user');
  }

  return { id: user._id.toString(), email: user.email, name: user.name };
}
