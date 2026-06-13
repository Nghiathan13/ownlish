import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsUUID } from 'class-validator';
import { CreateVocabWordDto } from './create-vocab-word.dto';

export class UpdateVocabWordDto extends PartialType(CreateVocabWordDto) {
  @IsOptional()
  @IsUUID('4')
  definitionId?: string;
}
