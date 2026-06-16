import { IsArray, IsInt, IsOptional, IsPositive } from 'class-validator';

export class RefreshMediaDto {
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  groupIds?: number[];
}
