import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  MAX_COLLECTION_DESCRIPTION_LENGTH,
  MAX_COLLECTION_NAME_LENGTH,
} from '../collections.constants';

export class UpdateUserCollectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_COLLECTION_NAME_LENGTH)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_COLLECTION_DESCRIPTION_LENGTH)
  description?: string;
}
