import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthRequest } from '../auth/types/auth.types';
import { UsersService } from '../users/users.service';
import { AdminTestsController } from './admin-tests.controller';
import { AdminToeicGroupService } from './admin-toeic-group.service';
import { AdminToeicQuestionService } from './admin-toeic-question.service';
import { AdminToeicTestService } from './admin-toeic-test.service';

describe('AdminTestsController', () => {
  const groupServiceMock = {
    patchGroup: jest.fn(),
    deleteGroupAudio: jest.fn(),
    uploadGroupAudio: jest.fn(),
    deleteGroupImage: jest.fn(),
    uploadGroupImage: jest.fn(),
  };

  const questionServiceMock = {
    patchQuestion: jest.fn(),
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

  it('delegates patchGroup to AdminToeicGroupService when admin', async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminTestsController],
      providers: [
        { provide: AdminToeicGroupService, useValue: groupServiceMock },
        { provide: AdminToeicQuestionService, useValue: questionServiceMock },
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
    groupServiceMock.patchGroup.mockResolvedValue({
      group: { id: 101, content: 'Updated' },
    });

    const controller = module.get(AdminTestsController);
    await expect(
      controller.patchGroup(101, { content: 'Updated' }),
    ).resolves.toEqual({
      group: { id: 101, content: 'Updated' },
    });
    expect(groupServiceMock.patchGroup).toHaveBeenCalledWith(101, {
      content: 'Updated',
    });
  });

  it('delegates deleteGroupImage to AdminToeicGroupService when admin', async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminTestsController],
      providers: [
        { provide: AdminToeicGroupService, useValue: groupServiceMock },
        { provide: AdminToeicQuestionService, useValue: questionServiceMock },
        { provide: AdminToeicTestService, useValue: testServiceMock },
        AdminGuard,
        { provide: UsersService, useValue: usersServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    groupServiceMock.deleteGroupImage.mockResolvedValue({
      group: { id: 101, imageUrl: null, imageUrlExpiresAt: null },
    });

    const controller = module.get(AdminTestsController);
    await expect(controller.deleteGroupImage(101)).resolves.toEqual({
      group: { id: 101, imageUrl: null, imageUrlExpiresAt: null },
    });
    expect(groupServiceMock.deleteGroupImage).toHaveBeenCalledWith(101);
  });

  it('delegates deleteGroupAudio to AdminToeicGroupService when admin', async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminTestsController],
      providers: [
        { provide: AdminToeicGroupService, useValue: groupServiceMock },
        { provide: AdminToeicQuestionService, useValue: questionServiceMock },
        { provide: AdminToeicTestService, useValue: testServiceMock },
        AdminGuard,
        { provide: UsersService, useValue: usersServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    groupServiceMock.deleteGroupAudio.mockResolvedValue({
      group: { id: 101, audioUrl: null, audioUrlExpiresAt: null },
    });

    const controller = module.get(AdminTestsController);
    await expect(controller.deleteGroupAudio(101)).resolves.toEqual({
      group: { id: 101, audioUrl: null, audioUrlExpiresAt: null },
    });
    expect(groupServiceMock.deleteGroupAudio).toHaveBeenCalledWith(101);
  });

  it('delegates uploadGroupAudio to AdminToeicGroupService when admin', async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminTestsController],
      providers: [
        { provide: AdminToeicGroupService, useValue: groupServiceMock },
        { provide: AdminToeicQuestionService, useValue: questionServiceMock },
        { provide: AdminToeicTestService, useValue: testServiceMock },
        AdminGuard,
        { provide: UsersService, useValue: usersServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    const file = {
      buffer: Buffer.from('mp3'),
      mimetype: 'audio/mpeg',
      originalname: 'clip.mp3',
    };

    groupServiceMock.uploadGroupAudio.mockResolvedValue({
      group: {
        id: 101,
        audioUrl: 'https://signed.example/ets26_t01_01.mp3',
        audioUrlExpiresAt: '2026-06-26T12:00:00.000Z',
      },
    });

    const controller = module.get(AdminTestsController);
    await expect(controller.uploadGroupAudio(101, file)).resolves.toEqual({
      group: {
        id: 101,
        audioUrl: 'https://signed.example/ets26_t01_01.mp3',
        audioUrlExpiresAt: '2026-06-26T12:00:00.000Z',
      },
    });
    expect(groupServiceMock.uploadGroupAudio).toHaveBeenCalledWith(101, file);
  });

  it('delegates uploadGroupImage to AdminToeicGroupService when admin', async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminTestsController],
      providers: [
        { provide: AdminToeicGroupService, useValue: groupServiceMock },
        { provide: AdminToeicQuestionService, useValue: questionServiceMock },
        { provide: AdminToeicTestService, useValue: testServiceMock },
        AdminGuard,
        { provide: UsersService, useValue: usersServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    const file = {
      buffer: Buffer.from('png'),
      mimetype: 'image/png',
      originalname: 'photo.png',
    };

    groupServiceMock.uploadGroupImage.mockResolvedValue({
      group: {
        id: 101,
        imageUrl: 'https://signed.example/ets26_t01_01.png',
        imageUrlExpiresAt: '2026-06-26T12:00:00.000Z',
      },
    });

    const controller = module.get(AdminTestsController);
    await expect(controller.uploadGroupImage(101, file)).resolves.toEqual({
      group: {
        id: 101,
        imageUrl: 'https://signed.example/ets26_t01_01.png',
        imageUrlExpiresAt: '2026-06-26T12:00:00.000Z',
      },
    });
    expect(groupServiceMock.uploadGroupImage).toHaveBeenCalledWith(101, file);
  });

  it('delegates patchQuestion to AdminToeicQuestionService when admin', async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminTestsController],
      providers: [
        { provide: AdminToeicGroupService, useValue: groupServiceMock },
        { provide: AdminToeicQuestionService, useValue: questionServiceMock },
        { provide: AdminToeicTestService, useValue: testServiceMock },
        AdminGuard,
        { provide: UsersService, useValue: usersServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    questionServiceMock.patchQuestion.mockResolvedValue({
      question: { id: 1001, answerKey: 'B' },
    });

    const controller = module.get(AdminTestsController);
    await expect(
      controller.patchQuestion(1001, { answerKey: 'B' }),
    ).resolves.toEqual({
      question: { id: 1001, answerKey: 'B' },
    });
    expect(questionServiceMock.patchQuestion).toHaveBeenCalledWith(1001, {
      answerKey: 'B',
    });
  });

  it('delegates listTests to AdminToeicTestService when admin', async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminTestsController],
      providers: [
        { provide: AdminToeicGroupService, useValue: groupServiceMock },
        { provide: AdminToeicQuestionService, useValue: questionServiceMock },
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
        { provide: AdminToeicQuestionService, useValue: questionServiceMock },
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
    expect(groupServiceMock.patchGroup).not.toHaveBeenCalled();
  });
});
