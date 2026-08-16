import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ExperienceController } from './api/experience.controller';
import { ExperienceAwardRepository } from './data/experience-award.repository';
import { ReviewGradeReceiptRepository } from './data/review-grade-receipt.repository';
import { EXPERIENCE_AWARDER } from './experience-awarder';
import { EXPERIENCE_REVIEW_RECEIPTS } from './experience-review-receipts';
import { ExperienceSummaryRepository } from './data/experience-summary.repository';
import { ExperienceAwardService } from './model/experience-award.service';
import { ReviewGradeReceiptService } from './model/review-grade-receipt.service';
import { ExperienceSummaryService } from './model/experience-summary.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ExperienceController],
  providers: [
    ExperienceAwardService,
    ExperienceAwardRepository,
    ReviewGradeReceiptRepository,
    ReviewGradeReceiptService,
    ExperienceSummaryRepository,
    ExperienceSummaryService,
    { provide: EXPERIENCE_AWARDER, useExisting: ExperienceAwardService },
    {
      provide: EXPERIENCE_REVIEW_RECEIPTS,
      useExisting: ReviewGradeReceiptService,
    },
  ],
  exports: [EXPERIENCE_AWARDER, EXPERIENCE_REVIEW_RECEIPTS],
})
export class ExperienceModule {}
