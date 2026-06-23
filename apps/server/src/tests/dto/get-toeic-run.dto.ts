import { IsIn, IsOptional, IsString } from 'class-validator';

export class GetToeicRunDto {
  /** Comma-separated part numbers used as a read-only visible scope filter. */
  @IsOptional()
  @IsString()
  parts?: string;

  @IsOptional()
  @IsIn(['practice', 'review_wrong'])
  mode?: 'practice' | 'review_wrong';
}
