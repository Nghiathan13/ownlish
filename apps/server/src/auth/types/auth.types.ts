import { Request } from 'express';
import { UserRole } from '@prisma/client';

export type AuthUser = {
  id: string;
  email: string;
  passwordHash: string | null;
  googleSub: string | null;
  name: string | null;
  avatarUrl: string | null;
  avatarStoragePath: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
};

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export type AuthRequest = Request & {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
};
