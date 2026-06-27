import { IsOptional, IsString } from 'class-validator';

export class PatchToeicQuestionDto {
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
