import { Request } from 'express';

export type AuthUser = {
  id: string;
  email: string;
  passwordHash: string | null;
  googleSub: string | null;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicUser = Omit<AuthUser, 'passwordHash' | 'googleSub'>;

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
};

export type JwtPayload = {
  sub: string;
  email: string;
};

export type AuthRequest = Request & {
  user: {
    id: string;
    email: string;
  };
};
