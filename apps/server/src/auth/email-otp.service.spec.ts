import { HttpStatus, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { EmailOtpService } from './email-otp.service';

describe('EmailOtpService', () => {
  const transactionClient = {
    $executeRaw: jest.fn(),
    emailOtpChallenge: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    user: { findUnique: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn(
      (callback: (client: typeof transactionClient) => unknown) =>
        callback(transactionClient),
    ),
    emailOtpChallenge: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  const emailSender = { sendLoginCode: jest.fn() };
  let service: EmailOtpService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EmailOtpService(
      prisma as unknown as PrismaService,
      emailSender,
    );
  });

  it('creates a hashed challenge and sends one six-digit code', async () => {
    transactionClient.emailOtpChallenge.count.mockResolvedValue(0);
    transactionClient.emailOtpChallenge.findFirst.mockResolvedValue(null);
    transactionClient.emailOtpChallenge.updateMany.mockResolvedValue({
      count: 0,
    });
    transactionClient.emailOtpChallenge.create.mockResolvedValue({
      id: 'challenge-id',
    });
    emailSender.sendLoginCode.mockResolvedValue(undefined);

    const result = await service.request(' Test@Example.com ');

    expect(transactionClient.emailOtpChallenge.create).toHaveBeenCalledTimes(1);
    expect(emailSender.sendLoginCode).toHaveBeenCalledTimes(1);
    expect(result.challengeId).toBe('challenge-id');
  });

  it('rejects a request still inside the resend cooldown', async () => {
    transactionClient.emailOtpChallenge.count.mockResolvedValue(0);
    transactionClient.emailOtpChallenge.findFirst.mockResolvedValue({
      lastSentAt: new Date(),
    });

    await expect(service.request('test@example.com')).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
    expect(emailSender.sendLoginCode).not.toHaveBeenCalled();
  });

  it('records an incorrect code attempt without exposing the challenge', async () => {
    transactionClient.emailOtpChallenge.findUnique.mockResolvedValue({
      attempts: 0,
      codeHash: 'different-hash',
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      id: 'challenge-id',
      verifiedAt: null,
    });

    await expect(
      service.verify('challenge-id', '123456'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(transactionClient.emailOtpChallenge.update).toHaveBeenCalledWith({
      where: { id: 'challenge-id' },
      data: { attempts: 1 },
    });
  });

  it('returns authenticated only after a matching code for an existing user', async () => {
    const code = '123456';
    const codeHash = createHmac('sha256', env.emailOtp.pepper)
      .update(code)
      .digest('hex');
    transactionClient.emailOtpChallenge.findUnique.mockResolvedValue({
      attempts: 0,
      codeHash,
      consumedAt: null,
      email: 'test@example.com',
      expiresAt: new Date(Date.now() + 60_000),
      id: 'challenge-id',
      verifiedAt: null,
    });
    transactionClient.user.findUnique.mockResolvedValue({ id: 'user-id' });

    await expect(service.verify('challenge-id', code)).resolves.toEqual({
      email: 'test@example.com',
      kind: 'authenticated',
    });
    expect(transactionClient.emailOtpChallenge.update).toHaveBeenCalledTimes(1);
  });
});
