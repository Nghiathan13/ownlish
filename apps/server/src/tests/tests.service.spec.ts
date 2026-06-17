import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { TestsStorageService } from './tests-storage.service';
import { TestsService } from './tests.service';

describe('TestsService', () => {
  let service: TestsService;

  const prismaMock = {
    toeicTestPart: {
      findUnique: jest.fn(),
    },
  };

  const storageMock = {
    createSignedUrls: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: TestsStorageService, useValue: storageMock },
      ],
    }).compile();

    service = module.get<TestsService>(TestsService);
  });

  it('includes answerKey in getPart question payload', async () => {
    prismaMock.toeicTestPart.findUnique.mockResolvedValue({
      testId: 1,
      partNumber: 1,
      test: { id: 1 },
      groups: [
        {
          id: 10,
          questionStart: 1,
          questionEnd: 1,
          groupType: null,
          accent: null,
          content: null,
          contentVi: null,
          audioStoragePath: null,
          imageStoragePath: null,
          questions: [
            {
              id: 100,
              questionNumber: 1,
              question: 'Sample?',
              questionVi: null,
              answerKey: 'b',
              optionA: 'A',
              optionB: 'B',
              optionC: 'C',
              optionD: 'D',
              optionAVi: null,
              optionBVi: null,
              optionCVi: null,
              optionDVi: null,
            },
          ],
        },
      ],
    });
    storageMock.createSignedUrls.mockResolvedValue(new Map());

    await expect(service.getPart(1, 1)).resolves.toMatchObject({
      groups: [
        {
          questions: [
            {
              id: 100,
              answerKey: 'B',
            },
          ],
        },
      ],
    });
  });

  it('throws when getPart target is missing', async () => {
    prismaMock.toeicTestPart.findUnique.mockResolvedValue(null);

    await expect(service.getPart(1, 9)).rejects.toBeInstanceOf(NotFoundException);
  });
});
