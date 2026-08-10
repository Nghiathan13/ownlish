import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Resend } from 'resend';
import { env } from '../config/env';

type SendLoginCodeInput = {
  code: string;
  email: string;
  idempotencyKey: string;
};

@Injectable()
export class ResendEmailService {
  async sendLoginCode({
    code,
    email,
    idempotencyKey,
  }: SendLoginCodeInput): Promise<void> {
    if (!env.emailOtp.resendApiKey) {
      throw new ServiceUnavailableException('Email login is unavailable');
    }

    const resend = new Resend(env.emailOtp.resendApiKey);
    const result = await resend.emails.send({
      from: env.emailOtp.from,
      to: [email],
      subject: 'Your Ownlish sign-in code',
      text: `Your Ownlish sign-in code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your Ownlish sign-in code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`,
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });

    if (result.error) {
      throw new ServiceUnavailableException('Email login is unavailable');
    }
  }
}
