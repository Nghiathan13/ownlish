import { LearningActivityType } from '@prisma/client';
import { IsIn, IsInt, Max, Min } from 'class-validator';

export class SubmitLearningActivityCheckpointDto {
  @IsIn(Object.values(LearningActivityType))
  activityType!: LearningActivityType;

  @IsIn(['heartbeat', 'flush'])
  kind!: 'heartbeat' | 'flush';

  @IsInt()
  @Min(1)
  @Max(75)
  elapsedSeconds!: number;
}
