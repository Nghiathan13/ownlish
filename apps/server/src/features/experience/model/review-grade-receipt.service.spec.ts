import { BadRequestException } from '@nestjs/common';
import { ReviewGradeSource } from '@prisma/client';
import { ReviewGradeReceiptService } from './review-grade-receipt.service';

describe('ReviewGradeReceiptService', () => {
  const input = {
    userId: 'user-id',
    submissionId: '11111111-1111-4111-8111-111111111111',
    source: ReviewGradeSource.OXFORD,
    subjectId: 'definition-id',
  };

  function createService() {
    const repository = {
      lockSubject: jest.fn(),
      findBySubmission: jest.fn(),
      create: jest.fn(),
    };

    return {
      repository,
      service: new ReviewGradeReceiptService(repository),
      transaction: {},
    };
  }

  it('locks before checking a receipt and records a first submission', async () => {
    const { repository, service, transaction } = createService();
    repository.findBySubmission.mockResolvedValue(null);

    await expect(service.isDuplicate(transaction, input)).resolves.toBe(false);
    await service.record(transaction as never, input);

    expect(repository.lockSubject).toHaveBeenCalledWith(
      transaction,
      input.userId,
      input.source,
      input.subjectId,
    );
    expect(repository.create).toHaveBeenCalledWith(transaction, input);
  });

  it('accepts an exact retry but rejects a reused submission ID for another word', async () => {
    const { repository, service, transaction } = createService();
    repository.findBySubmission.mockResolvedValue({
      source: ReviewGradeSource.OXFORD,
      subjectId: 'definition-id',
    });
    await expect(
      service.isDuplicate(transaction as never, input),
    ).resolves.toBe(true);

    repository.findBySubmission.mockResolvedValue({
      source: ReviewGradeSource.USER_VOCAB,
      subjectId: 'entry-id',
    });
    await expect(
      service.isDuplicate(transaction as never, input),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
