import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class SyncAttemptPartDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  partNumber!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  correctCount!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  wrongCount!: number;
}

export class SyncAttemptProgressDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => SyncAttemptPartDto)
  parts!: SyncAttemptPartDto[];

  @IsOptional()
  @IsBoolean()
  finish?: boolean;
}
