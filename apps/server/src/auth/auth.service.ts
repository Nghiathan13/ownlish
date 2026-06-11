import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { env } from '../config/env';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshSessionsService } from './refresh-sessions.service';
import type { AuthResponse, AuthUser, PublicUser } from './types/auth.types';

type LogoutResponse = {
  success: true;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshSessionsService: RefreshSessionsService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, env.bcryptSaltRounds);
    const user = await this.usersService.create({
      email,
      passwordHash,
      name: dto.name?.trim() || undefined,
    });

    return this.createAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createAuthResponse(user);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toPublicUser(user);
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthResponse> {
    const refreshTokenHash = this.hashRefreshToken(dto.refreshToken);
    const session =
      await this.refreshSessionsService.findByTokenHash(refreshTokenHash);

    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.refreshSessionsService.revoke(session.id);
      throw new UnauthorizedException('Refresh token expired');
    }

    return this.rotateSessionAuthResponse(session.id, session.user);
  }

  async logout(dto: RefreshTokenDto): Promise<LogoutResponse> {
    const refreshTokenHash = this.hashRefreshToken(dto.refreshToken);
    const session =
      await this.refreshSessionsService.findByTokenHash(refreshTokenHash);

    if (session && !session.revokedAt) {
      await this.refreshSessionsService.revoke(session.id);
    }

    return { success: true };
  }

  private async createAuthResponse(user: AuthUser): Promise<AuthResponse> {
    const refreshToken = this.createRefreshToken();
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const refreshTokenExpiresAt = this.createRefreshTokenExpiresAt();

    await this.refreshSessionsService.create({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: refreshTokenExpiresAt,
    });

    return this.buildAuthResponse(user, refreshToken);
  }

  private async rotateSessionAuthResponse(
    sessionId: string,
    user: AuthUser,
  ): Promise<AuthResponse> {
    const refreshToken = this.createRefreshToken();
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const refreshTokenExpiresAt = this.createRefreshTokenExpiresAt();

    await this.refreshSessionsService.rotate(sessionId, {
      tokenHash: refreshTokenHash,
      expiresAt: refreshTokenExpiresAt,
    });

    return this.buildAuthResponse(user, refreshToken);
  }

  private async buildAuthResponse(
    user: AuthUser,
    refreshToken: string,
  ): Promise<AuthResponse> {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      refreshToken,
      user: this.toPublicUser(user),
    };
  }

  private createRefreshToken(): string {
    return randomBytes(64).toString('base64url');
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private createRefreshTokenExpiresAt(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.refreshTokenTtlDays);
    return expiresAt;
  }

  private toPublicUser(user: AuthUser): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
