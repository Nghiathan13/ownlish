import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthRequest } from '../auth/types/auth.types';
import { UsersService } from '../users/users.service';
import { AdminTestsController } from './admin-tests.controller';
import { AdminToeicGroupService } from './admin-toeic-group.service';
import { AdminToeicTestService } from './admin-toeic-test.service';

describe('AdminTestsController', () => {
  const groupServiceMock = {
    getRawGroup: jest.fn(),
    patchRawGroup: jest.fn(),
  };

  const testServiceMock = {
    listTests: jest.fn(),
    getRawTest: jest.fn(),
  };

  const usersServiceMock = {
    findById: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates GET to AdminToeicGroupService when admin', async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminTestsController],
      providers: [
        { provide: AdminToeicGroupService, useValue: groupServiceMock },
        { provide: AdminToeicTestService, useValue: testServiceMock },
        AdminGuard,
        { provide: UsersService, useValue: usersServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest<AuthRequest>();
          request.user = {
            id: 'admin-id',
            email: 'admin@example.com',
            role: UserRole.ADMIN,
          };
          return true;
        },
      })
      .compile();

    usersServiceMock.findById.mockResolvedValue({
      id: 'admin-id',
      role: UserRole.ADMIN,
    });
    groupServiceMock.getRawGroup.mockResolvedValue({ group: { id: 101 } });

    const controller = module.get(AdminTestsController);
    await expect(controller.getGroupRaw(101)).resolves.toEqual({
      group: { id: 101 },
    });
    expect(groupServiceMock.getRawGroup).toHaveBeenCalledWith(101);
  });

  it('delegates listTests to AdminToeicTestService when admin', async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminTestsController],
      providers: [
        { provide: AdminToeicGroupService, useValue: groupServiceMock },
        { provide: AdminToeicTestService, useValue: testServiceMock },
        AdminGuard,
        { provide: UsersService, useValue: usersServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    testServiceMock.listTests.mockResolvedValue({ items: [] });

    const controller = module.get(AdminTestsController);
    await expect(controller.listTests()).resolves.toEqual({ items: [] });
    expect(testServiceMock.listTests).toHaveBeenCalledWith();
  });

  it('delegates getTestRaw to AdminToeicTestService when admin', async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminTestsController],
      providers: [
        { provide: AdminToeicGroupService, useValue: groupServiceMock },
        { provide: AdminToeicTestService, useValue: testServiceMock },
        AdminGuard,
        { provide: UsersService, useValue: usersServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    testServiceMock.getRawTest.mockResolvedValue({
      test: { id: 5, year: 2026, testNumber: 1 },
      parts: [],
    });

    const controller = module.get(AdminTestsController);
    await expect(controller.getTestRaw(5)).resolves.toEqual({
      test: { id: 5, year: 2026, testNumber: 1 },
      parts: [],
    });
    expect(testServiceMock.getRawTest).toHaveBeenCalledWith(5);
  });

  it('forbids non-admin users', async () => {
    usersServiceMock.findById.mockResolvedValue({
      id: 'user-id',
      role: UserRole.USER,
    });

    const guard = new AdminGuard(usersServiceMock as unknown as UsersService);
    const context = {
      switchToHttp: () => ({
        getRequest: () =>
          ({
            user: {
              id: 'user-id',
              email: 'user@example.com',
              role: UserRole.USER,
            },
          }) satisfies Pick<AuthRequest, 'user'>,
      }),
    } as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(groupServiceMock.getRawGroup).not.toHaveBeenCalled();
  });
});
