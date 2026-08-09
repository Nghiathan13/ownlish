import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { env } from '../config/env';
import { UsersService } from '../users/users.service';
import { ProfileAvatarStorageService } from '../users/profile-avatar-storage.service';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GoogleTokenService } from './google-token.service';
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
    private readonly googleTokenService: GoogleTokenService,
    private readonly profileAvatarStorageService: ProfileAvatarStorageService,
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

    if (!user.passwordHash) {
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

  async googleLogin(dto: GoogleLoginDto): Promise<AuthResponse> {
    const verified = await this.googleTokenService.verifyAuthorizationCode(
      dto.code,
    );
    const email = verified.email.trim().toLowerCase();

    const userByGoogleSub = await this.usersService.findByGoogleSub(
      verified.sub,
    );
    if (userByGoogleSub) {
      const user =
        verified.avatarUrl && verified.avatarUrl !== userByGoogleSub.avatarUrl
          ? await this.usersService.updateGoogleAvatar(
              userByGoogleSub.id,
              verified.avatarUrl,
            )
          : userByGoogleSub;

      return this.createAuthResponse(user);
    }

    const userByEmail = await this.usersService.findByEmail(email);
    if (userByEmail) {
      if (userByEmail.googleSub && userByEmail.googleSub !== verified.sub) {
        throw new ConflictException(
          'Email is linked to another Google account',
        );
      }

      const linkedUser = userByEmail.googleSub
        ? userByEmail
        : await this.usersService.linkGoogleSub(userByEmail.id, verified.sub, {
            name: userByEmail.name ? undefined : (verified.name ?? undefined),
            avatarUrl: verified.avatarUrl ?? undefined,
          });

      return this.createAuthResponse(linkedUser);
    }

    const user = await this.usersService.create({
      email,
      googleSub: verified.sub,
      name: verified.name ?? undefined,
      avatarUrl: verified.avatarUrl,
      passwordHash: null,
    });

    return this.createAuthResponse(user);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toPublicUser(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    file:
      | {
          buffer: Buffer;
          mimetype: string;
        }
      | undefined,
  ): Promise<PublicUser> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Display name is required');
    }

    let uploadedAvatarStoragePath: string | undefined;

    if (file) {
      uploadedAvatarStoragePath =
        await this.profileAvatarStorageService.uploadAvatar({
          body: file.buffer,
          mimeType: file.mimetype,
          userId,
        });
    }

    try {
      const updatedUser = await this.usersService.updateProfile(userId, {
        name,
        avatarStoragePath: uploadedAvatarStoragePath,
      });

      if (uploadedAvatarStoragePath && user.avatarStoragePath) {
        await this.profileAvatarStorageService
          .removeAvatar(user.avatarStoragePath)
          .catch(() => undefined);
      }

      return this.toPublicUser(updatedUser);
    } catch (error) {
      if (uploadedAvatarStoragePath) {
        await this.profileAvatarStorageService
          .removeAvatar(uploadedAvatarStoragePath)
          .catch(() => undefined);
      }

      throw error;
    }
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthResponse> {
    const refreshToken = this.getRequiredRefreshToken(dto);
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const session =
      await this.refreshSessionsService.findByTokenHash(refreshTokenHash);

    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.refreshSessionsService.revoke(session.id);
      throw new UnauthorizedException('Refresh token expired');
    }

    const response = await this.rotateSessionAuthResponse(
      session.id,
      session.user,
      refreshTokenHash,
    );

    if (!response) {
      throw new ConflictException('Refresh token was rotated. Retry request.');
    }

    return response;
  }

  async logout(dto: RefreshTokenDto): Promise<LogoutResponse> {
    if (!dto.refreshToken) {
      return { success: true };
    }

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
    currentTokenHash: string,
  ): Promise<AuthResponse | null> {
    const refreshToken = this.createRefreshToken();
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const refreshTokenExpiresAt = this.createRefreshTokenExpiresAt();

    const didRotate =
      await this.refreshSessionsService.rotateIfCurrentTokenMatches(
        sessionId,
        currentTokenHash,
        {
          tokenHash: refreshTokenHash,
          expiresAt: refreshTokenExpiresAt,
        },
      );

    if (!didRotate) {
      return null;
    }

    return this.buildAuthResponse(user, refreshToken);
  }

  private async buildAuthResponse(
    user: AuthUser,
    refreshToken: string,
  ): Promise<AuthResponse> {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
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

  private getRequiredRefreshToken(dto: RefreshTokenDto): string {
    if (!dto.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return dto.refreshToken;
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
      avatarUrl:
        (user.avatarStoragePath
          ? this.profileAvatarStorageService.getPublicUrl(
              user.avatarStoragePath,
            )
          : null) ?? user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
