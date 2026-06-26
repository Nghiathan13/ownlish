import { IsIn, IsInt, IsOptional, IsPositive } from 'class-validator';

export class CreatePartPracticeRunDto {
  @IsInt()
  @IsPositive()
  partNumber!: number;

  @IsOptional()
  @IsIn(['practice', 'review_wrong'])
  mode?: 'practice' | 'review_wrong';
}
