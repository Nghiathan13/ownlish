import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class ImportOxfordPartDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  catalogDefinitionIds!: string[];

  @IsOptional()
  @IsUUID('4')
  targetCollectionId?: string;
}
