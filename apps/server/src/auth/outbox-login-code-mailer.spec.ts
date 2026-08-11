import { OutboxLoginCodeMailer } from './outbox-login-code-mailer';

describe('OutboxLoginCodeMailer', () => {
  let mailer: OutboxLoginCodeMailer;

  beforeEach(() => {
    mailer = new OutboxLoginCodeMailer();
  });

  it('stores login codes and returns the latest for an email', async () => {
    await mailer.sendLoginCode({
      email: ' User@Example.com ',
      code: '111111',
      idempotencyKey: 'email-otp:first',
    });
    await mailer.sendLoginCode({
      email: 'user@example.com',
      code: '222222',
      idempotencyKey: 'email-otp:second',
    });
    await mailer.sendLoginCode({
      email: 'other@example.com',
      code: '333333',
      idempotencyKey: 'email-otp:other',
    });

    expect(mailer.getLatestForEmail('USER@example.com')).toMatchObject({
      email: 'user@example.com',
      code: '222222',
      idempotencyKey: 'email-otp:second',
    });
    expect(mailer.getLatestForEmail('missing@example.com')).toBeNull();
  });

  it('clears stored codes', async () => {
    await mailer.sendLoginCode({
      email: 'user@example.com',
      code: '123456',
      idempotencyKey: 'email-otp:challenge',
    });

    mailer.clear();

    expect(mailer.getLatestForEmail('user@example.com')).toBeNull();
  });
});
