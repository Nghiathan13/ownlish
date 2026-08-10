import { IsString, MaxLength, MinLength } from 'class-validator';

export class CompleteEmailOtpProfileDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  enrollmentToken!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;
}
