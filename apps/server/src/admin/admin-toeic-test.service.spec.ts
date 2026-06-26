import { NotFoundException } from '@nestjs/common';
import { AdminToeicTestService } from './admin-toeic-test.service';
import { ToeicTestRawRepository } from './lib/toeic-test-raw.repository';
import type { TestsStorageService } from '../tests/tests-storage.service';

describe('AdminToeicTestService', () => {
  const repositoryMock = {
    findTests: jest.fn(),
    findTestById: jest.fn(),
  };

  const storageServiceMock = {
    createSignedUrls: jest.fn(),
  };

  let service: AdminToeicTestService;

  const listRecord = {
    id: 5,
    year: 2026,
    testNumber: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    parts: [
      {
        id: 10,
        testId: 5,
        partNumber: 5,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        groups: [{ _count: { questions: 30 } }, { _count: { questions: 18 } }],
      },
      {
        id: 11,
        testId: 5,
        partNumber: 6,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        groups: [{ _count: { questions: 16 } }],
      },
    ],
  };

  const rawRecord = {
    id: 5,
    year: 2026,
    testNumber: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    parts: [
      {
        id: 10,
        testId: 5,
        partNumber: 5,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        groups: [
          {
            id: 101,
            testPartId: 10,
            questionStart: 101,
            questionEnd: 103,
            groupType: 'single',
            accent: 'us',
            content: 'Passage',
            contentVi: 'Đoạn văn',
            audioStoragePath: 'toeic/audio/test.mp3',
            imageStoragePath: null,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
            questions: [
              {
                id: 1001,
                groupId: 101,
                questionNumber: 101,
                question: 'Q1',
                questionVi: 'C1',
                questionType: 'mcq',
                optionA: 'A1',
                optionB: 'B1',
                optionC: 'C1',
                optionD: 'D1',
                optionAVi: 'A1 vi',
                optionBVi: 'B1 vi',
                optionCVi: 'C1 vi',
                optionDVi: 'D1 vi',
                answerKey: 'A',
                explanationVi: 'Explain',
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-01-01T00:00:00.000Z'),
              },
            ],
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminToeicTestService(
      repositoryMock as unknown as ToeicTestRawRepository,
      storageServiceMock as unknown as TestsStorageService,
    );
  });

  it('lists all tests with part counts', async () => {
    repositoryMock.findTests.mockResolvedValue([listRecord]);

    await expect(service.listTests()).resolves.toEqual({
      items: [
        {
          id: 5,
          year: 2026,
          testNumber: 1,
          parts: [
            { partNumber: 5, groupCount: 2, questionCount: 48 },
            { partNumber: 6, groupCount: 1, questionCount: 16 },
          ],
        },
      ],
    });
    expect(repositoryMock.findTests).toHaveBeenCalledWith();
  });

  it('returns raw test tree with signed media URLs', async () => {
    repositoryMock.findTestById.mockResolvedValue(rawRecord);
    storageServiceMock.createSignedUrls.mockResolvedValue(
      new Map([
        [
          'toeic/audio/test.mp3',
          {
            url: 'https://signed.example/audio.mp3',
            expiresAt: '2026-06-26T12:00:00.000Z',
          },
        ],
      ]),
    );

    await expect(service.getRawTest(5)).resolves.toEqual({
      test: { id: 5, year: 2026, testNumber: 1 },
      parts: [
        {
          partNumber: 5,
          groups: [
            {
              id: 101,
              questionStart: 101,
              questionEnd: 103,
              groupType: 'single',
              accent: 'us',
              content: 'Passage',
              contentVi: 'Đoạn văn',
              audioUrl: 'https://signed.example/audio.mp3',
              audioUrlExpiresAt: '2026-06-26T12:00:00.000Z',
              imageUrl: null,
              imageUrlExpiresAt: null,
              questions: [
                {
                  id: 1001,
                  questionNumber: 101,
                  question: 'Q1',
                  questionVi: 'C1',
                  questionType: 'mcq',
                  optionA: 'A1',
                  optionB: 'B1',
                  optionC: 'C1',
                  optionD: 'D1',
                  optionAVi: 'A1 vi',
                  optionBVi: 'B1 vi',
                  optionCVi: 'C1 vi',
                  optionDVi: 'D1 vi',
                  answerKey: 'A',
                  explanationVi: 'Explain',
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it('throws 404 for unknown testId', async () => {
    repositoryMock.findTestById.mockResolvedValue(null);

    await expect(service.getRawTest(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
