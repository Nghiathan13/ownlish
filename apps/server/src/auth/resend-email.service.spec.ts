import { ServiceUnavailableException } from '@nestjs/common';
import { Resend } from 'resend';
import { env } from '../config/env';
import { ResendEmailService } from './resend-email.service';

jest.mock('resend', () => ({
  Resend: jest.fn(),
}));

const ResendMock = jest.mocked(Resend);

describe('ResendEmailService', () => {
  const originalApiKey = env.emailOtp.resendApiKey;
  const originalFrom = env.emailOtp.from;
  const send = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    env.emailOtp.resendApiKey = 're_test_key';
    env.emailOtp.from = 'Ownlish <auth@ownlish.test>';
    send.mockResolvedValue({ data: { id: 'email-id' }, error: null });
    ResendMock.mockImplementation(
      () => ({ emails: { send } }) as unknown as Resend,
    );
  });

  afterAll(() => {
    env.emailOtp.resendApiKey = originalApiKey;
    env.emailOtp.from = originalFrom;
  });

  it('sends the code with the configured sender and idempotency key', async () => {
    await new ResendEmailService().sendLoginCode({
      email: 'user@example.com',
      code: '123456',
      idempotencyKey: 'email-otp:challenge-id',
    });

    expect(ResendMock).toHaveBeenCalledWith('re_test_key');
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Ownlish <auth@ownlish.test>',
        to: ['user@example.com'],
        headers: { 'Idempotency-Key': 'email-otp:challenge-id' },
      }),
    );
  });

  it('rejects sending when Resend is unavailable or rejects the request', async () => {
    env.emailOtp.resendApiKey = '';
    await expect(
      new ResendEmailService().sendLoginCode({
        email: 'user@example.com',
        code: '123456',
        idempotencyKey: 'email-otp:challenge-id',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    env.emailOtp.resendApiKey = 're_test_key';
    send.mockResolvedValue({ data: null, error: { message: 'Rejected' } });
    await expect(
      new ResendEmailService().sendLoginCode({
        email: 'user@example.com',
        code: '123456',
        idempotencyKey: 'email-otp:challenge-id',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
