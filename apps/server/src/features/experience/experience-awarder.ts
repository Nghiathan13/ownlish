import type { Prisma } from '@prisma/client';

export type ExperienceAward =
  | {
      type: 'correct-answer';
      userId: string;
      questionKey: string;
      bucket: 'test' | 'mock';
    }
  | {
      type: 'mock-part';
      userId: string;
      testKey: string;
      partNumber: number;
    }
  | {
      type: 'dictation-segment';
      userId: string;
      videoId: string;
      segmentId: string;
    }
  | { type: 'dictation-video'; userId: string; videoId: string }
  | {
      type: 'review-easy';
      userId: string;
      source: 'user-vocab' | 'oxford';
      subjectId: string;
    };

export interface ExperienceAwarder {
  award(
    tx: Prisma.TransactionClient,
    experienceAward: ExperienceAward,
  ): Promise<number>;
}

export const EXPERIENCE_AWARDER = Symbol('EXPERIENCE_AWARDER');

export const noExperienceAwards: ExperienceAwarder = {
  award: () => Promise.resolve(0),
};
