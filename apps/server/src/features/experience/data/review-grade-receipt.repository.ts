import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ReviewGradeReceiptInput } from '../experience-review-receipts';

type Transaction = Prisma.TransactionClient;

@Injectable()
export class ReviewGradeReceiptRepository {
  async lockSubject(
    tx: Transaction,
    userId: string,
    source: string,
    subjectId: string,
  ) {
    await tx.$executeRaw(
      Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${userId}), hashtext(${`review:${source}:${subjectId}`}))`,
    );
  }

  findBySubmission(tx: Transaction, userId: string, submissionId: string) {
    return tx.reviewGradeReceipt.findUnique({
      where: { userId_submissionId: { userId, submissionId } },
    });
  }

  async create(tx: Transaction, input: ReviewGradeReceiptInput) {
    await tx.reviewGradeReceipt.create({ data: input });
  }
}
