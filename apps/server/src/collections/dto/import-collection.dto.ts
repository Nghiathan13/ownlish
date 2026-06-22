import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class ImportCollectionDto {
  @IsOptional()
  @IsUUID('4')
  targetCollectionId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  catalogDefinitionIds?: string[];
}
