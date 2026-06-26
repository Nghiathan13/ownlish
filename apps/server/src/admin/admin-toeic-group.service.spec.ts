import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminToeicGroupService } from './admin-toeic-group.service';
import { ToeicGroupRawRepository } from './lib/toeic-group-raw.repository';

describe('AdminToeicGroupService', () => {
  const repositoryMock = {
    findGroupById: jest.fn(),
    updateGroupRaw: jest.fn(),
  };

  let service: AdminToeicGroupService;

  const existingGroup = {
    id: 101,
    testPartId: 10,
    questionStart: 1,
    questionEnd: 3,
    groupType: 'single',
    accent: 'us',
    content: 'Passage',
    contentVi: 'Đoạn văn',
    audioStoragePath: 'toeic/audio/test.mp3',
    imageStoragePath: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    testPart: {
      testId: 5,
      partNumber: 4,
    },
    questions: [
      {
        id: 1001,
        groupId: 101,
        questionNumber: 1,
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminToeicGroupService(
      repositoryMock as unknown as ToeicGroupRawRepository,
    );
  });

  it('returns raw group data', async () => {
    repositoryMock.findGroupById.mockResolvedValue(existingGroup);

    await expect(service.getRawGroup(101)).resolves.toEqual({
      group: {
        id: 101,
        testId: 5,
        partNumber: 4,
        questionStart: 1,
        questionEnd: 3,
        groupType: 'single',
        accent: 'us',
        content: 'Passage',
        contentVi: 'Đoạn văn',
        audioStoragePath: 'toeic/audio/test.mp3',
        imageStoragePath: null,
        questions: [
          {
            id: 1001,
            questionNumber: 1,
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
    });
  });

  it('throws not found when group is missing', async () => {
    repositoryMock.findGroupById.mockResolvedValue(null);

    await expect(service.getRawGroup(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('patches allowed fields and normalizes empty strings to null', async () => {
    repositoryMock.findGroupById.mockResolvedValue(existingGroup);
    repositoryMock.updateGroupRaw.mockResolvedValue({
      ...existingGroup,
      groupType: null,
      content: 'Updated',
      questions: [
        {
          ...existingGroup.questions[0],
          question: 'Updated Q',
          answerKey: null,
        },
      ],
    });

    const result = await service.patchRawGroup(101, {
      group: {
        groupType: '',
        accent: 'uk',
        content: 'Updated',
        contentVi: '',
      },
      questions: [
        {
          id: 1001,
          question: 'Updated Q',
          questionVi: '',
          answerKey: '',
        },
      ],
    });

    expect(repositoryMock.updateGroupRaw).toHaveBeenCalledWith(
      101,
      {
        groupType: null,
        accent: 'uk',
        content: 'Updated',
        contentVi: null,
      },
      [
        expect.objectContaining({
          id: 1001,
          question: 'Updated Q',
          questionVi: null,
          answerKey: null,
        }),
      ],
    );
    expect(result.group.content).toBe('Updated');
  });

  it('rejects invalid answerKey', async () => {
    repositoryMock.findGroupById.mockResolvedValue(existingGroup);

    await expect(
      service.patchRawGroup(101, {
        group: {
          groupType: 'single',
        },
        questions: [
          {
            id: 1001,
            answerKey: 'E',
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects question id outside group', async () => {
    repositoryMock.findGroupById.mockResolvedValue(existingGroup);

    await expect(
      service.patchRawGroup(101, {
        group: {
          groupType: 'single',
        },
        questions: [
          {
            id: 9999,
            question: 'Bad',
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
