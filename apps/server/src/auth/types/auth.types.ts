import { Request } from 'express';

export type AuthUser = {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicUser = Omit<AuthUser, 'passwordHash'>;

export type AuthResponse = {
  accessToken: string;
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
