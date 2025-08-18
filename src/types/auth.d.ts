import { IUser } from '@/models/User';
import { NextRequest } from 'next/server';

export interface AuthenticatedUser extends Omit<IUser, 'password'> {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'moderator' | 'author' | 'user';
  permissions: string[];
  isActive: boolean;
  isBanned: boolean;
  banReason?: string;
  bannedBy?: string;
  bannedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  userId: string;
  role: string;
}

export type AuthHandler = (request: NextRequest, user: AuthenticatedUser, params?: unknown) => Promise<Response>;
export type PermissionHandler = (permission: string) => (handler: AuthHandler) => AuthHandler;