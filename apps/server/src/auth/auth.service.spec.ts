import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
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
    create: jest.fn(),
  };

  const jwtServiceMock = {
    signAsync: jest.fn(),
  };

  const user = {
    id: 'user-id',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    name: 'Test User',
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
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(usersServiceMock.create).toHaveBeenCalledWith({
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      name: 'Test User',
    });
    expect(result).toEqual({
      accessToken: 'access-token',
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
});
