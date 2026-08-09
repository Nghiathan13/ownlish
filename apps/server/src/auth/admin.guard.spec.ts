import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { AdminGuard } from './admin.guard';
import type { AuthRequest } from './types/auth.types';

describe('AdminGuard', () => {
  const usersServiceMock = {
    findById: jest.fn(),
  };

  const createContext = (request: Partial<AuthRequest>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as ExecutionContext;

  let guard: AdminGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new AdminGuard(usersServiceMock as unknown as UsersService);
  });

  it('forbids non-admin users', async () => {
    usersServiceMock.findById.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      role: UserRole.USER,
    });

    const context = createContext({
      user: {
        id: 'user-id',
        email: 'user@example.com',
        role: UserRole.USER,
      },
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows admin users from database role', async () => {
    usersServiceMock.findById.mockResolvedValue({
      id: 'admin-id',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    });

    const context = createContext({
      user: {
        id: 'admin-id',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(usersServiceMock.findById).toHaveBeenCalledWith('admin-id');
  });

  it('forbids when user no longer exists', async () => {
    usersServiceMock.findById.mockResolvedValue(null);

    const context = createContext({
      user: {
        id: 'missing-id',
        email: 'missing@example.com',
        role: UserRole.ADMIN,
      },
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
