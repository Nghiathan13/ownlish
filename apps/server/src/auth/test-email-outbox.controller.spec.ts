import { NotFoundException } from '@nestjs/common';
import { env } from '../config/env';
import { OutboxLoginCodeMailer } from './outbox-login-code-mailer';
import { TestEmailOutboxController } from './test-email-outbox.controller';

describe('TestEmailOutboxController', () => {
  const originalNodeEnv = env.nodeEnv;
  const originalMailer = env.emailOtp.mailer;
  let outbox: OutboxLoginCodeMailer;
  let controller: TestEmailOutboxController;

  beforeEach(() => {
    env.nodeEnv = 'test';
    env.emailOtp.mailer = 'outbox';
    outbox = new OutboxLoginCodeMailer();
    controller = new TestEmailOutboxController(outbox);
  });

  afterAll(() => {
    env.nodeEnv = originalNodeEnv;
    env.emailOtp.mailer = originalMailer;
  });

  it('returns the latest test-only OTP', async () => {
    await outbox.sendLoginCode({
      email: 'user@example.com',
      code: '123456',
      idempotencyKey: 'email-otp:challenge-id',
    });

    expect(controller.latest('USER@example.com')).toMatchObject({
      email: 'user@example.com',
      code: '123456',
      idempotencyKey: 'email-otp:challenge-id',
    });
  });

  it('does not expose an outbox outside test mode or without an entry', () => {
    expect(() => controller.latest(undefined)).toThrow(NotFoundException);
    expect(() => controller.latest('missing@example.com')).toThrow(
      NotFoundException,
    );

    env.nodeEnv = 'development';
    expect(() => controller.latest('user@example.com')).toThrow(
      NotFoundException,
    );
  });
});
