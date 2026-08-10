import { IsUUID, Matches } from 'class-validator';

export class VerifyEmailOtpDto {
  @IsUUID()
  challengeId!: string;

  @Matches(/^\d{6}$/)
  code!: string;
}
