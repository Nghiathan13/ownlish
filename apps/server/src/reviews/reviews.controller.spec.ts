import { BadRequestException } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';

describe('ReviewsController', () => {
  const service = {
    listDifficultWords: jest.fn(),
    getOxfordPart: jest.fn(),
    gradeOxfordDefinition: jest.fn(),
  };
  const controller = new ReviewsController(service as never);
  const request = { user: { id: 'user-id' } } as never;

  beforeEach(() => jest.clearAllMocks());

  it('uses collection difficult words by default and supports Oxford', async () => {
    await Promise.all([
      controller.listDifficultWords(request),
      controller.listDifficultWords(request, ''),
      controller.listDifficultWords(request, 'collection'),
      controller.listDifficultWords(request, 'oxford'),
    ]);

    expect(service.listDifficultWords).toHaveBeenNthCalledWith(
      1,
      'user-id',
      'collection',
    );
    expect(service.listDifficultWords).toHaveBeenLastCalledWith(
      'user-id',
      'oxford',
    );
  });

  it('rejects an unsupported difficult-word source', () => {
    expect(() => controller.listDifficultWords(request, 'all')).toThrow(
      BadRequestException,
    );
  });

  it('delegates Oxford review reading and grading', async () => {
    await Promise.all([
      controller.getOxfordPart(request, 'A1', 2),
      controller.gradeOxfordDefinition(request, 'A1', 2, 'definition-id', {
        rating: 'GOOD',
        submissionId: '11111111-1111-4111-8111-111111111111',
      } as never),
    ]);

    expect(service.getOxfordPart).toHaveBeenCalledWith('user-id', 'A1', 2);
    expect(service.gradeOxfordDefinition).toHaveBeenCalledWith(
      'user-id',
      'A1',
      2,
      'definition-id',
      {
        rating: 'GOOD',
        submissionId: '11111111-1111-4111-8111-111111111111',
      },
    );
  });
});
