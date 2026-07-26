import { IsInt, Min } from 'class-validator';

export class UpdateMockTimerDto {
  @IsInt()
  @Min(0)
  remainingSeconds!: number;
}
