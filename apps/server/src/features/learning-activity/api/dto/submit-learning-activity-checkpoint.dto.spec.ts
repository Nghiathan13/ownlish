import { LearningActivityType } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SubmitLearningActivityCheckpointDto } from './submit-learning-activity-checkpoint.dto';

describe('SubmitLearningActivityCheckpointDto', () => {
  it('accepts a bounded heartbeat checkpoint', async () => {
    await expect(
      validate(
        plainToInstance(SubmitLearningActivityCheckpointDto, {
          activityType: LearningActivityType.VOCABULARY_REVIEW,
          kind: 'heartbeat',
          elapsedSeconds: 60,
        }),
      ),
    ).resolves.toHaveLength(0);
  });

  it('rejects invalid checkpoint types and elapsed ranges', async () => {
    await expect(
      validate(
        plainToInstance(SubmitLearningActivityCheckpointDto, {
          activityType: 'unknown',
          kind: 'other',
          elapsedSeconds: 76,
        }),
      ),
    ).resolves.not.toHaveLength(0);
  });
});
