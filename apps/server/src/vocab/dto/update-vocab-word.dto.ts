import { PartialType } from '@nestjs/mapped-types';
import { CreateVocabWordDto } from './create-vocab-word.dto';

export class UpdateVocabWordDto extends PartialType(CreateVocabWordDto) {}
