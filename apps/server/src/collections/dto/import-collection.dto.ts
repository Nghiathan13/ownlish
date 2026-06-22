import { IsOptional, IsUUID } from 'class-validator';

export class ImportCollectionDto {
  @IsOptional()
  @IsUUID('4')
  targetCollectionId?: string;
}
