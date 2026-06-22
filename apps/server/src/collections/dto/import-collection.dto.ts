import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class ImportCollectionDto {
  @IsOptional()
  @IsUUID('4')
  targetCollectionId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  catalogDefinitionIds?: string[];
}
