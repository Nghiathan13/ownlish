import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import type { AuthRequest, JwtPayload } from './types/auth.types';

function isValidJwtRole(role: unknown): role is UserRole {
  return role === UserRole.USER || role === UserRole.ADMIN;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      if (!isValidJwtRole(payload.role)) {
        throw new UnauthorizedException('Invalid access token');
      }

      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid access token');
    }

    return true;
  }

  private extractToken(request: Request) {
    const authorization = request.headers.authorization;

    if (!authorization) {
      return null;
    }

    const [type, token] = authorization.split(' ');

    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}
