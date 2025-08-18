import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import User from '@/models/User';
import dbConnect from './mongodb';
import { AuthenticatedUser, JWTPayload, AuthHandler, PermissionHandler } from '@/types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

export async function getCurrentUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return null;
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return null;
    }

    await dbConnect();
    const user = await User.findById(payload.userId).select('-password');
    
    if (!user || !user.isActive) {
      return null;
    }

    return user as AuthenticatedUser;
  } catch {
    return null;
  }
}

export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission);
}

export function requireAuth(handler: AuthHandler): AuthHandler {
  return async (request: NextRequest, user: AuthenticatedUser) => {
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return handler(request, user);
  };
}

export function requirePermission(permission: string): (handler: AuthHandler) => AuthHandler {
  return (handler: AuthHandler): AuthHandler => {
    return async (request: NextRequest, user: AuthenticatedUser, params?: unknown) => {
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      if (!hasPermission(user.permissions, permission)) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      
      return handler(request, user, params);
    };
  };
}