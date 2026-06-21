import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
} from 'class-validator';

export class CreateToeicRunDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  partNumbers!: number[];

  @IsInt()
  @IsPositive()
  testId!: number;

  @IsOptional()
  @IsIn(['practice', 'review_wrong', 'mock_test'])
  mode?: 'practice' | 'review_wrong' | 'mock_test';
}
