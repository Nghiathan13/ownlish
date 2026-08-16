import type { Prisma, ReviewGradeSource } from '@prisma/client';

export type ReviewGradeReceiptInput = {
  userId: string;
  submissionId: string;
  source: ReviewGradeSource;
  subjectId: string;
};

export interface ExperienceReviewReceipts {
  isDuplicate(
    tx: Prisma.TransactionClient,
    input: ReviewGradeReceiptInput,
  ): Promise<boolean>;
  record(
    tx: Prisma.TransactionClient,
    input: ReviewGradeReceiptInput,
  ): Promise<void>;
}

export const EXPERIENCE_REVIEW_RECEIPTS = Symbol('EXPERIENCE_REVIEW_RECEIPTS');

export const noExperienceReviewReceipts: ExperienceReviewReceipts = {
  isDuplicate: () => Promise.resolve(false),
  record: () => Promise.resolve(),
};
