import { IsIn, IsOptional } from 'class-validator';

export class GetPartPracticeRunDto {
  @IsOptional()
  @IsIn(['practice', 'review_wrong'])
  mode?: 'practice' | 'review_wrong';
}
