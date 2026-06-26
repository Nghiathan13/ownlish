import { Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsInt,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PatchToeicGroupRawGroupDto {
  @IsOptional()
  @IsString()
  groupType?: string | null;

  @IsOptional()
  @IsString()
  accent?: string | null;

  @IsOptional()
  @IsString()
  content?: string | null;

  @IsOptional()
  @IsString()
  contentVi?: string | null;
}

export class PatchToeicGroupRawQuestionDto {
  @IsDefined()
  @IsInt()
  @IsPositive()
  id!: number;

  @IsOptional()
  @IsString()
  question?: string | null;

  @IsOptional()
  @IsString()
  questionVi?: string | null;

  @IsOptional()
  @IsString()
  questionType?: string | null;

  @IsOptional()
  @IsString()
  optionA?: string | null;

  @IsOptional()
  @IsString()
  optionB?: string | null;

  @IsOptional()
  @IsString()
  optionC?: string | null;

  @IsOptional()
  @IsString()
  optionD?: string | null;

  @IsOptional()
  @IsString()
  optionAVi?: string | null;

  @IsOptional()
  @IsString()
  optionBVi?: string | null;

  @IsOptional()
  @IsString()
  optionCVi?: string | null;

  @IsOptional()
  @IsString()
  optionDVi?: string | null;

  @IsOptional()
  @IsString()
  answerKey?: string | null;

  @IsOptional()
  @IsString()
  explanationVi?: string | null;
}

export class PatchToeicGroupRawDto {
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => PatchToeicGroupRawGroupDto)
  group!: PatchToeicGroupRawGroupDto;

  @IsDefined()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PatchToeicGroupRawQuestionDto)
  questions!: PatchToeicGroupRawQuestionDto[];
}
