import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class ImportOxfordPartDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  catalogDefinitionIds!: string[];
}
