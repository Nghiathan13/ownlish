import { IsIn, IsOptional, IsString } from 'class-validator';

export class GetToeicRunDto {
  @IsOptional()
  @IsString()
  parts?: string;

  @IsOptional()
  @IsIn(['practice', 'review_wrong'])
  mode?: 'practice' | 'review_wrong';
}
