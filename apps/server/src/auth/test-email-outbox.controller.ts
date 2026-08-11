import {
  Controller,
  Get,
  NotFoundException,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { env } from '../config/env';
import { OutboxLoginCodeMailer } from './outbox-login-code-mailer';

/**
 * Test-only outbox reader for E2E. Registered only when EMAIL_MAILER=outbox
 * and NODE_ENV=test.
 */
@Controller('auth/test/email-outbox')
@UseGuards(ThrottlerGuard)
export class TestEmailOutboxController {
  constructor(private readonly outbox: OutboxLoginCodeMailer) {}

  @Get('latest')
  latest(@Query('email') email: string | undefined) {
    if (
      env.nodeEnv !== 'test' ||
      env.emailOtp.mailer !== 'outbox' ||
      !email?.trim()
    ) {
      throw new NotFoundException();
    }

    const entry = this.outbox.getLatestForEmail(email);
    if (!entry) {
      throw new NotFoundException();
    }

    return {
      email: entry.email,
      code: entry.code,
      idempotencyKey: entry.idempotencyKey,
      sentAt: entry.sentAt,
    };
  }
}
