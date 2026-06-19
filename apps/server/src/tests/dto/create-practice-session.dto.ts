import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
} from 'class-validator';

export class CreatePracticeSessionDto {
  @IsInt()
  @IsPositive()
  @IsOptional()
  partNumber?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @IsOptional()
  partNumbers?: number[];

  @IsInt()
  @IsPositive()
  testId!: number;

  @IsOptional()
  @IsIn(['normal', 'wrong_questions'])
  mode?: 'normal' | 'wrong_questions';
}
