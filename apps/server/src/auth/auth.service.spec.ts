import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { env } from '../config/env';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const usersServiceMock = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByRefreshTokenHash: jest.fn(),
    create: jest.fn(),
    updateRefreshToken: jest.fn(),
    clearRefreshToken: jest.fn(),
  };

  const jwtServiceMock = {
    signAsync: jest.fn(),
  };

  const user = {
    id: 'user-id',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    name: 'Test User',
    refreshTokenHash: null,
    refreshTokenExpiresAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
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
    expect(usersServiceMock.updateRefreshToken).toHaveBeenCalledWith(
      user.id,
      {
        refreshTokenHash: expect.any(String),
        refreshTokenExpiresAt: expect.any(Date),
      },
    );
    expect(result).toMatchObject({
      accessToken: 'access-token',
      refreshToken: expect.any(String),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
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
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(usersServiceMock.updateRefreshToken).toHaveBeenCalledWith(
      user.id,
      {
        refreshTokenHash: expect.any(String),
        refreshTokenExpiresAt: expect.any(Date),
      },
    );
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

  it('returns the current public user', async () => {
    usersServiceMock.findById.mockResolvedValue(user);

    await expect(service.me('user-id')).resolves.toEqual({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  });

  it('refreshes an active session and rotates the refresh token', async () => {
    const activeUser = {
      ...user,
      refreshTokenHash: 'stored-hash',
      refreshTokenExpiresAt: new Date(Date.now() + 60_000),
    };
    usersServiceMock.findByRefreshTokenHash.mockResolvedValue(activeUser);
    jwtServiceMock.signAsync.mockResolvedValue('new-access-token');

    const result = await service.refresh({ refreshToken: 'refresh-token' });

    expect(usersServiceMock.findByRefreshTokenHash).toHaveBeenCalledWith(
      expect.any(String),
    );
    expect(usersServiceMock.updateRefreshToken).toHaveBeenCalledWith(
      user.id,
      {
        refreshTokenHash: expect.any(String),
        refreshTokenExpiresAt: expect.any(Date),
      },
    );
    expect(result).toMatchObject({
      accessToken: 'new-access-token',
      refreshToken: expect.any(String),
      user: {
        id: user.id,
        email: user.email,
      },
    });
  });

  it('rejects expired refresh tokens and clears stored token', async () => {
    usersServiceMock.findByRefreshTokenHash.mockResolvedValue({
      ...user,
      refreshTokenHash: 'stored-hash',
      refreshTokenExpiresAt: new Date(Date.now() - 60_000),
    });

    await expect(
      service.refresh({ refreshToken: 'expired-refresh-token' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(usersServiceMock.clearRefreshToken).toHaveBeenCalledWith(user.id);
  });

  it('logs out by clearing a matching refresh token', async () => {
    usersServiceMock.findByRefreshTokenHash.mockResolvedValue(user);

    await expect(
      service.logout({ refreshToken: 'refresh-token' }),
    ).resolves.toEqual({ success: true });
    expect(usersServiceMock.clearRefreshToken).toHaveBeenCalledWith(user.id);
  });
});
