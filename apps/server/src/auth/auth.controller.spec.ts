import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { env } from '../config/env';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { AuthRequest } from './types/auth.types';

describe('AuthController', () => {
  let controller: AuthController;
  let responseMock: Pick<Response, 'clearCookie' | 'cookie'>;

  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    me: jest.fn(),
  };

  const jwtServiceMock = {
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    responseMock = {
      clearCookie: jest.fn(),
      cookie: jest.fn(),
    } as Pick<Response, 'clearCookie' | 'cookie'>;

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            ttl: env.authRateLimit.ttlMs,
            limit: env.authRateLimit.limit,
          },
        ]),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates register to AuthService', async () => {
    const dto = {
      email: 'test@example.com',
      password: 'test123456',
      name: 'Test User',
    };
    const response = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-id',
        email: dto.email,
        name: dto.name,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    };
    authServiceMock.register.mockResolvedValue(response);

    await expect(
      controller.register(dto, responseMock as Response),
    ).resolves.toEqual({
      accessToken: response.accessToken,
      user: response.user,
    });
    expect(authServiceMock.register).toHaveBeenCalledWith(dto);
    expect(responseMock.cookie).toHaveBeenCalledWith(
      env.refreshTokenCookie.name,
      response.refreshToken,
      expect.objectContaining({ httpOnly: true, path: '/auth' }),
    );
  });

  it('delegates login to AuthService', async () => {
    const dto = {
      email: 'test@example.com',
      password: 'test123456',
    };
    const response = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-id',
        email: dto.email,
        name: 'Test User',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    };
    authServiceMock.login.mockResolvedValue(response);

    await expect(controller.login(dto, responseMock as Response)).resolves.toEqual(
      {
        accessToken: response.accessToken,
        user: response.user,
      },
    );
    expect(authServiceMock.login).toHaveBeenCalledWith(dto);
    expect(responseMock.cookie).toHaveBeenCalledWith(
      env.refreshTokenCookie.name,
      response.refreshToken,
      expect.objectContaining({ httpOnly: true, path: '/auth' }),
    );
  });

  it('delegates refresh to AuthService', async () => {
    const dto = {
      refreshToken: 'refresh-token',
    };
    const response = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      user: {
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    };
    authServiceMock.refresh.mockResolvedValue(response);

    await expect(
      controller.refresh({ headers: {} } as Request, dto, responseMock as Response),
    ).resolves.toEqual({
      accessToken: response.accessToken,
      user: response.user,
    });
    expect(authServiceMock.refresh).toHaveBeenCalledWith(dto);
    expect(responseMock.cookie).toHaveBeenCalledWith(
      env.refreshTokenCookie.name,
      response.refreshToken,
      expect.objectContaining({ httpOnly: true, path: '/auth' }),
    );
  });

  it('refreshes using the HttpOnly cookie when the body is empty', async () => {
    const response = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      user: {
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    };
    authServiceMock.refresh.mockResolvedValue(response);

    await expect(
      controller.refresh(
        {
          headers: {
            cookie: `${env.refreshTokenCookie.name}=cookie-refresh-token`,
          },
        } as Request,
        {},
        responseMock as Response,
      ),
    ).resolves.toEqual({
      accessToken: response.accessToken,
      user: response.user,
    });
    expect(authServiceMock.refresh).toHaveBeenCalledWith({
      refreshToken: 'cookie-refresh-token',
    });
  });

  it('delegates logout to AuthService', async () => {
    const dto = {
      refreshToken: 'refresh-token',
    };
    const response = { success: true };
    authServiceMock.logout.mockResolvedValue(response);

    await expect(
      controller.logout({ headers: {} } as Request, dto, responseMock as Response),
    ).resolves.toBe(response);
    expect(authServiceMock.logout).toHaveBeenCalledWith(dto);
    expect(responseMock.clearCookie).toHaveBeenCalledWith(
      env.refreshTokenCookie.name,
      expect.objectContaining({ path: '/auth' }),
    );
  });

  it('delegates current user lookup to AuthService', async () => {
    const request = {
      user: {
        id: 'user-id',
        email: 'test@example.com',
      },
    } as AuthRequest;
    const response = {
      id: 'user-id',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    authServiceMock.me.mockResolvedValue(response);

    await expect(controller.me(request)).resolves.toBe(response);
    expect(authServiceMock.me).toHaveBeenCalledWith('user-id');
  });
});
