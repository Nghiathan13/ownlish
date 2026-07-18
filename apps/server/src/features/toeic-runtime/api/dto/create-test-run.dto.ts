import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
} from 'class-validator';

export class CreateToeicRuntimeTestRunDto {
  @IsString()
  @Matches(/^(ets|ybm)\d{2}-t\d{2}$/)
  testKey!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  partNumbers!: number[];

  @IsOptional()
  @IsIn(['practice', 'mock_test'])
  mode?: 'practice' | 'mock_test';
}
