import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateVocabWordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  word: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  ipa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  meaningVi?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  definition?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  example?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  band?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  level?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  wrongCount?: number;
}
