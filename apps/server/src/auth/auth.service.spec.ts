import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { env } from '../config/env';
import { UsersService } from '../users/users.service';
import { ProfileAvatarStorageService } from '../users/profile-avatar-storage.service';
import { AuthService } from './auth.service';
import { GoogleTokenService } from './google-token.service';
import { RefreshSessionsService } from './refresh-sessions.service';
import { getMockCallArg } from '../testing/jest-mock-call';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const usersServiceMock = {
    findByEmail: jest.fn(),
    findByGoogleSub: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    linkGoogleSub: jest.fn(),
    updateProfile: jest.fn(),
    updateGoogleAvatar: jest.fn(),
  };

  const profileAvatarStorageServiceMock = {
    getPublicUrl: jest.fn(),
    removeAvatar: jest.fn(),
    uploadAvatar: jest.fn(),
  };

  const refreshSessionsServiceMock = {
    create: jest.fn(),
    findByTokenHash: jest.fn(),
    rotateIfCurrentTokenMatches: jest.fn(),
    revoke: jest.fn(),
  };

  const jwtServiceMock = {
    signAsync: jest.fn(),
  };

  const googleTokenServiceMock = {
    verifyAuthorizationCode: jest.fn(),
  };

  const user = {
    id: 'user-id',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    googleSub: null,
    name: 'Test User',
    avatarUrl: null,
    role: UserRole.USER,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    profileAvatarStorageServiceMock.getPublicUrl.mockReturnValue(null);
    profileAvatarStorageServiceMock.removeAvatar.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
        {
          provide: RefreshSessionsService,
          useValue: refreshSessionsServiceMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        {
          provide: GoogleTokenService,
          useValue: googleTokenServiceMock,
        },
        {
          provide: ProfileAvatarStorageService,
          useValue: profileAvatarStorageServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('registers a user with normalized email and hashed password', async () => {
    usersServiceMock.findByEmail.mockResolvedValue(null);
    usersServiceMock.create.mockResolvedValue(user);
    jwtServiceMock.signAsync.mockResolvedValue('access-token');
    jest.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);

    const result = await service.register({
      email: ' Test@Example.com ',
      password: 'password123',
      name: ' Test User ',
    });

    expect(usersServiceMock.findByEmail).toHaveBeenCalledWith(
      'test@example.com',
    );
    expect(bcrypt.hash).toHaveBeenCalledWith(
      'password123',
      env.bcryptSaltRounds,
    );
    expect(usersServiceMock.create).toHaveBeenCalledWith({
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      name: 'Test User',
    });
    expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    expect(refreshSessionsServiceMock.create).toHaveBeenCalledTimes(1);
    const sessionCreateArgs = getMockCallArg<{
      userId: string;
      tokenHash: string;
      expiresAt: Date;
    }>(refreshSessionsServiceMock.create);
    expect(sessionCreateArgs.userId).toBe(user.id);
    expect(typeof sessionCreateArgs.tokenHash).toBe('string');
    expect(sessionCreateArgs.expiresAt).toBeInstanceOf(Date);
    expect(result).toMatchObject({
      accessToken: 'access-token',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
    expect(typeof result.refreshToken).toBe('string');
  });

  it('throws conflict when registering an existing email', async () => {
    usersServiceMock.findByEmail.mockResolvedValue(user);

    await expect(
      service.register({
        email: 'test@example.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in with valid credentials', async () => {
    usersServiceMock.findByEmail.mockResolvedValue(user);
    jwtServiceMock.signAsync.mockResolvedValue('access-token');
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const result = await service.login({
      email: ' Test@Example.com ',
      password: 'password123',
    });

    expect(usersServiceMock.findByEmail).toHaveBeenCalledWith(
      'test@example.com',
    );
    expect(bcrypt.compare).toHaveBeenCalledWith(
      'password123',
      'hashed-password',
    );
    expect(result.accessToken).toBe('access-token');
    expect(typeof result.refreshToken).toBe('string');
    expect(refreshSessionsServiceMock.create).toHaveBeenCalledTimes(1);
    const loginSessionArgs = getMockCallArg<{
      userId: string;
      tokenHash: string;
      expiresAt: Date;
    }>(refreshSessionsServiceMock.create);
    expect(loginSessionArgs.userId).toBe(user.id);
    expect(typeof loginSessionArgs.tokenHash).toBe('string');
    expect(loginSessionArgs.expiresAt).toBeInstanceOf(Date);
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('throws unauthorized when login email does not exist', async () => {
    usersServiceMock.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws unauthorized when login password is invalid', async () => {
    usersServiceMock.findByEmail.mockResolvedValue(user);
    jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      service.login({
        email: 'test@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws unauthorized when password login is used for Google-only user', async () => {
    usersServiceMock.findByEmail.mockResolvedValue({
      ...user,
      passwordHash: null,
      googleSub: 'google-sub',
    });

    await expect(
      service.login({
        email: 'test@example.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it('creates a Google user and returns auth response', async () => {
    const googleUser = {
      ...user,
      passwordHash: null,
      googleSub: 'google-sub',
      name: 'Google User',
      avatarUrl: 'https://lh3.googleusercontent.com/avatar',
    };

    googleTokenServiceMock.verifyAuthorizationCode.mockResolvedValue({
      sub: 'google-sub',
      email: 'test@example.com',
      name: 'Google User',
      avatarUrl: 'https://lh3.googleusercontent.com/avatar',
    });
    usersServiceMock.findByGoogleSub.mockResolvedValue(null);
    usersServiceMock.findByEmail.mockResolvedValue(null);
    usersServiceMock.create.mockResolvedValue(googleUser);
    jwtServiceMock.signAsync.mockResolvedValue('access-token');

    const result = await service.googleLogin({ code: 'authorization-code' });

    expect(googleTokenServiceMock.verifyAuthorizationCode).toHaveBeenCalledWith(
      'authorization-code',
    );
    expect(usersServiceMock.create).toHaveBeenCalledWith({
      email: 'test@example.com',
      googleSub: 'google-sub',
      name: 'Google User',
      avatarUrl: 'https://lh3.googleusercontent.com/avatar',
      passwordHash: null,
    });
    expect(result.accessToken).toBe('access-token');
  });

  it('links Google to an existing password account by email', async () => {
    const linkedUser = {
      ...user,
      googleSub: 'google-sub',
    };

    googleTokenServiceMock.verifyAuthorizationCode.mockResolvedValue({
      sub: 'google-sub',
      email: 'test@example.com',
      name: 'Google User',
      avatarUrl: 'https://lh3.googleusercontent.com/avatar',
    });
    usersServiceMock.findByGoogleSub.mockResolvedValue(null);
    usersServiceMock.findByEmail.mockResolvedValue(user);
    usersServiceMock.linkGoogleSub.mockResolvedValue(linkedUser);
    jwtServiceMock.signAsync.mockResolvedValue('access-token');

    const result = await service.googleLogin({ code: 'authorization-code' });

    expect(usersServiceMock.linkGoogleSub).toHaveBeenCalledWith(
      user.id,
      'google-sub',
      {
        name: undefined,
        avatarUrl: 'https://lh3.googleusercontent.com/avatar',
      },
    );
    expect(result.user.email).toBe('test@example.com');
  });

  it('refreshes the avatar of an existing Google user', async () => {
    const googleUser = {
      ...user,
      googleSub: 'google-sub',
      avatarUrl: 'https://lh3.googleusercontent.com/old-avatar',
    };
    const updatedGoogleUser = {
      ...googleUser,
      avatarUrl: 'https://lh3.googleusercontent.com/new-avatar',
    };

    googleTokenServiceMock.verifyAuthorizationCode.mockResolvedValue({
      sub: 'google-sub',
      email: 'test@example.com',
      name: 'Google User',
      avatarUrl: 'https://lh3.googleusercontent.com/new-avatar',
    });
    usersServiceMock.findByGoogleSub.mockResolvedValue(googleUser);
    usersServiceMock.updateGoogleAvatar.mockResolvedValue(updatedGoogleUser);
    jwtServiceMock.signAsync.mockResolvedValue('access-token');

    const result = await service.googleLogin({ code: 'authorization-code' });

    expect(usersServiceMock.updateGoogleAvatar).toHaveBeenCalledWith(
      googleUser.id,
      'https://lh3.googleusercontent.com/new-avatar',
    );
    expect(result.user.avatarUrl).toBe(updatedGoogleUser.avatarUrl);
  });

  it('throws conflict when email is linked to another Google account', async () => {
    googleTokenServiceMock.verifyAuthorizationCode.mockResolvedValue({
      sub: 'new-google-sub',
      email: 'test@example.com',
      name: 'Google User',
    });
    usersServiceMock.findByGoogleSub.mockResolvedValue(null);
    usersServiceMock.findByEmail.mockResolvedValue({
      ...user,
      googleSub: 'existing-google-sub',
    });

    await expect(
      service.googleLogin({ code: 'authorization-code' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns the current public user', async () => {
    usersServiceMock.findById.mockResolvedValue(user);

    await expect(service.me('user-id')).resolves.toEqual({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  });

  it('prioritizes a custom profile avatar and removes the previous file after saving', async () => {
    const userWithCustomAvatar = {
      ...user,
      avatarStoragePath: 'users/user-id/previous-avatar.png',
    };
    const updatedUser = {
      ...userWithCustomAvatar,
      name: 'Updated User',
      avatarStoragePath: 'users/user-id/new-avatar.png',
    };

    usersServiceMock.findById.mockResolvedValue(userWithCustomAvatar);
    profileAvatarStorageServiceMock.uploadAvatar.mockResolvedValue(
      updatedUser.avatarStoragePath,
    );
    usersServiceMock.updateProfile.mockResolvedValue(updatedUser);
    profileAvatarStorageServiceMock.getPublicUrl.mockReturnValue(
      'https://example.com/new-avatar.png',
    );

    await expect(
      service.updateProfile(
        user.id,
        { name: ' Updated User ' },
        { buffer: Buffer.from('image'), mimetype: 'image/png' },
      ),
    ).resolves.toMatchObject({
      name: 'Updated User',
      avatarUrl: 'https://example.com/new-avatar.png',
    });

    expect(profileAvatarStorageServiceMock.uploadAvatar).toHaveBeenCalledWith({
      body: Buffer.from('image'),
      mimeType: 'image/png',
      userId: user.id,
    });
    expect(usersServiceMock.updateProfile).toHaveBeenCalledWith(user.id, {
      name: 'Updated User',
      avatarStoragePath: updatedUser.avatarStoragePath,
    });
    expect(profileAvatarStorageServiceMock.removeAvatar).toHaveBeenCalledWith(
      userWithCustomAvatar.avatarStoragePath,
    );
  });

  it('refreshes an active session and rotates the refresh token', async () => {
    refreshSessionsServiceMock.findByTokenHash.mockResolvedValue({
      id: 'session-id',
      userId: user.id,
      tokenHash: 'stored-hash',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      user,
    });
    jwtServiceMock.signAsync.mockResolvedValue('new-access-token');
    refreshSessionsServiceMock.rotateIfCurrentTokenMatches.mockResolvedValue(
      true,
    );

    const result = await service.refresh({ refreshToken: 'refresh-token' });

    expect(refreshSessionsServiceMock.findByTokenHash).toHaveBeenCalledTimes(1);
    const refreshLookupHash = getMockCallArg<string>(
      refreshSessionsServiceMock.findByTokenHash,
    );
    expect(typeof refreshLookupHash).toBe('string');
    expect(
      refreshSessionsServiceMock.rotateIfCurrentTokenMatches,
    ).toHaveBeenCalledTimes(1);
    const rotatedSessionId = getMockCallArg<string>(
      refreshSessionsServiceMock.rotateIfCurrentTokenMatches,
      0,
      0,
    );
    expect(rotatedSessionId).toBe('session-id');
    const currentTokenHash = getMockCallArg<string>(
      refreshSessionsServiceMock.rotateIfCurrentTokenMatches,
      0,
      1,
    );
    expect(typeof currentTokenHash).toBe('string');
    const rotatePayload = getMockCallArg<{
      tokenHash: string;
      expiresAt: Date;
    }>(refreshSessionsServiceMock.rotateIfCurrentTokenMatches, 0, 2);
    expect(typeof rotatePayload.tokenHash).toBe('string');
    expect(rotatePayload.expiresAt).toBeInstanceOf(Date);
    expect(result).toMatchObject({
      accessToken: 'new-access-token',
      user: {
        id: user.id,
        email: user.email,
      },
    });
    expect(typeof result.refreshToken).toBe('string');
  });

  it('returns a retryable conflict when another request rotates the token first', async () => {
    refreshSessionsServiceMock.findByTokenHash.mockResolvedValue({
      id: 'session-id',
      userId: user.id,
      tokenHash: 'stored-hash',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      user,
    });
    refreshSessionsServiceMock.rotateIfCurrentTokenMatches.mockResolvedValue(
      false,
    );

    await expect(
      service.refresh({ refreshToken: 'refresh-token' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects expired refresh tokens and clears stored token', async () => {
    refreshSessionsServiceMock.findByTokenHash.mockResolvedValue({
      id: 'session-id',
      userId: user.id,
      tokenHash: 'stored-hash',
      expiresAt: new Date(Date.now() - 60_000),
      revokedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      user,
    });

    await expect(
      service.refresh({ refreshToken: 'expired-refresh-token' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(refreshSessionsServiceMock.revoke).toHaveBeenCalledWith(
      'session-id',
    );
  });

  it('logs out by clearing a matching refresh token', async () => {
    refreshSessionsServiceMock.findByTokenHash.mockResolvedValue({
      id: 'session-id',
      userId: user.id,
      tokenHash: 'stored-hash',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      user,
    });

    await expect(
      service.logout({ refreshToken: 'refresh-token' }),
    ).resolves.toEqual({ success: true });
    expect(refreshSessionsServiceMock.revoke).toHaveBeenCalledWith(
      'session-id',
    );
  });
});
