import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminToeicQuestionService } from './admin-toeic-question.service';
import { AdminToeicRepository } from './lib/admin-toeic.repository';

describe('AdminToeicQuestionService', () => {
  const repositoryMock = {
    findQuestionById: jest.fn(),
    updateQuestionFields: jest.fn(),
  };

  let service: AdminToeicQuestionService;

  const existingQuestion = {
    id: 1001,
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminToeicQuestionService(
      repositoryMock as unknown as AdminToeicRepository,
    );
  });

  it('patches only answerKey and returns normalized DB values', async () => {
    repositoryMock.findQuestionById.mockResolvedValue(existingQuestion);
    repositoryMock.updateQuestionFields.mockResolvedValue({
      ...existingQuestion,
      answerKey: 'B',
    });

    const result = await service.patchQuestion(1001, { answerKey: 'B' });

    expect(repositoryMock.updateQuestionFields).toHaveBeenCalledWith(1001, {
      answerKey: 'B',
    });
    expect(result).toEqual({
      question: {
        id: 1001,
        answerKey: 'B',
      },
    });
  });

  it('normalizes empty answerKey to null in the response', async () => {
    repositoryMock.findQuestionById.mockResolvedValue(existingQuestion);
    repositoryMock.updateQuestionFields.mockResolvedValue({
      ...existingQuestion,
      answerKey: null,
    });

    const result = await service.patchQuestion(1001, { answerKey: '' });

    expect(repositoryMock.updateQuestionFields).toHaveBeenCalledWith(1001, {
      answerKey: null,
    });
    expect(result).toEqual({
      question: {
        id: 1001,
        answerKey: null,
      },
    });
  });

  it('does not update group when patching question only', async () => {
    repositoryMock.findQuestionById.mockResolvedValue(existingQuestion);
    repositoryMock.updateQuestionFields.mockResolvedValue({
      ...existingQuestion,
      answerKey: 'C',
    });

    await service.patchQuestion(1001, { answerKey: 'C' });

    expect(repositoryMock.updateQuestionFields).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid answerKey', async () => {
    repositoryMock.findQuestionById.mockResolvedValue(existingQuestion);

    await expect(
      service.patchQuestion(1001, { answerKey: 'E' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repositoryMock.updateQuestionFields).not.toHaveBeenCalled();
  });

  it('rejects empty patch body', async () => {
    repositoryMock.findQuestionById.mockResolvedValue(existingQuestion);

    await expect(service.patchQuestion(1001, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repositoryMock.updateQuestionFields).not.toHaveBeenCalled();
  });

  it('throws not found when question is missing', async () => {
    repositoryMock.findQuestionById.mockResolvedValue(null);

    await expect(
      service.patchQuestion(9999, { question: 'Bad' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
