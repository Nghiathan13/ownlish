import { IsInt, Max, Min } from 'class-validator';

export class CreateToeicRuntimePartPracticeRunDto {
  @IsInt()
  @Min(1)
  @Max(7)
  partNumber!: number;
}
