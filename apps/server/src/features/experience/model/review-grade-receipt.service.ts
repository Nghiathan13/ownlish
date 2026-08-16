import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  ExperienceReviewReceipts,
  ReviewGradeReceiptInput,
} from '../experience-review-receipts';
import { ReviewGradeReceiptRepository } from '../data/review-grade-receipt.repository';

@Injectable()
export class ReviewGradeReceiptService implements ExperienceReviewReceipts {
  constructor(
    private readonly reviewGradeReceiptRepository: ReviewGradeReceiptRepository,
  ) {}

  async isDuplicate(
    tx: Parameters<ExperienceReviewReceipts['isDuplicate']>[0],
    input: ReviewGradeReceiptInput,
  ) {
    await this.reviewGradeReceiptRepository.lockSubject(
      tx,
      input.userId,
      input.source,
      input.subjectId,
    );
    const receipt = await this.reviewGradeReceiptRepository.findBySubmission(
      tx,
      input.userId,
      input.submissionId,
    );
    if (!receipt) {
      return false;
    }

    if (
      receipt.source !== input.source ||
      receipt.subjectId !== input.subjectId
    ) {
      throw new BadRequestException('Review submission does not match.');
    }

    return true;
  }

  record(
    tx: Parameters<ExperienceReviewReceipts['record']>[0],
    input: ReviewGradeReceiptInput,
  ) {
    return this.reviewGradeReceiptRepository.create(tx, input);
  }
}
