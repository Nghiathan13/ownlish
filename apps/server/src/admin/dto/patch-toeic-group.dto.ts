import { IsOptional, IsString } from 'class-validator';

export class PatchToeicGroupDto {
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
