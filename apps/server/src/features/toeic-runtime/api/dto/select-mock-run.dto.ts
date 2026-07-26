import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  Max,
  Min,
  IsPositive,
  IsString,
  Matches,
} from 'class-validator';

export class SelectToeicRuntimeMockRunDto {
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
  @IsInt()
  @Min(1)
  @Max(180)
  timeLimitMinutes?: number;
}
