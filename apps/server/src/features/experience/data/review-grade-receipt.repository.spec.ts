import { ReviewGradeSource } from '@prisma/client';
import { ReviewGradeReceiptRepository } from './review-grade-receipt.repository';

describe('ReviewGradeReceiptRepository', () => {
  it('locks the review subject and persists a user-scoped submission receipt', async () => {
    const transaction = {
      $executeRaw: jest.fn(),
      reviewGradeReceipt: {
        create: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const repository = new ReviewGradeReceiptRepository();
    const input = {
      userId: 'user-id',
      submissionId: '11111111-1111-4111-8111-111111111111',
      source: ReviewGradeSource.USER_VOCAB,
      subjectId: 'entry-id',
    };

    await repository.lockSubject(
      transaction as never,
      input.userId,
      input.source,
      input.subjectId,
    );
    await expect(
      repository.findBySubmission(
        transaction as never,
        input.userId,
        input.submissionId,
      ),
    ).resolves.toBeNull();
    await repository.create(transaction as never, input);

    expect(transaction.$executeRaw).toHaveBeenCalledTimes(1);
    expect(transaction.reviewGradeReceipt.findUnique).toHaveBeenCalledWith({
      where: {
        userId_submissionId: {
          userId: input.userId,
          submissionId: input.submissionId,
        },
      },
    });
    expect(transaction.reviewGradeReceipt.create).toHaveBeenCalledWith({
      data: input,
    });
  });
});
