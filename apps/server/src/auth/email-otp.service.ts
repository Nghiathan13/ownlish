import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHmac, randomBytes, randomInt } from 'node:crypto';
import { env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { LOGIN_CODE_MAILER, type LoginCodeMailer } from './login-code-mailer';

const OTP_TTL_MS = 10 * 60 * 1000;
const ENROLLMENT_TTL_MS = 10 * 60 * 1000;
const SEND_WINDOW_MS = 15 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 3;
const MAX_ATTEMPTS = 5;

type OtpRequestResult = {
  challengeId: string;
  resendAvailableAt: string;
};

type OtpVerificationResult =
  | { kind: 'authenticated'; email: string }
  | { enrollmentToken: string; kind: 'profile_required' };

@Injectable()
export class EmailOtpService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(LOGIN_CODE_MAILER)
    private readonly loginCodeMailer: LoginCodeMailer,
  ) {}

  private resendCooldownMs(): number {
    return env.emailOtp.resendCooldownSeconds * 1000;
  }

  async request(emailInput: string): Promise<OtpRequestResult> {
    this.requirePepper();

    const email = this.normalizeEmail(emailInput);
    const now = new Date();
    const code = this.createCode();
    const codeHash = this.hashSecret(code);
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS);
    const resendCooldownMs = this.resendCooldownMs();

    const challenge = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${`email-otp:${email}`}))`,
      );

      const recentSends = await tx.emailOtpChallenge.count({
        where: {
          email,
          lastSentAt: { gte: new Date(now.getTime() - SEND_WINDOW_MS) },
        },
      });

      if (recentSends >= MAX_SENDS_PER_WINDOW) {
        return null;
      }

      const latest = await tx.emailOtpChallenge.findFirst({
        where: { email },
        orderBy: { lastSentAt: 'desc' },
      });

      if (
        latest &&
        resendCooldownMs > 0 &&
        now.getTime() - latest.lastSentAt.getTime() < resendCooldownMs
      ) {
        return undefined;
      }

      await tx.emailOtpChallenge.updateMany({
        where: { email, consumedAt: null, verifiedAt: null },
        data: { consumedAt: now },
      });

      return tx.emailOtpChallenge.create({
        data: {
          email,
          codeHash,
          expiresAt,
          lastSentAt: now,
        },
      });
    });

    if (challenge === null) {
      throw new HttpException(
        'Please try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!challenge) {
      throw new HttpException(
        'Please wait before requesting a new code',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    try {
      await this.loginCodeMailer.sendLoginCode({
        email,
        code,
        idempotencyKey: `email-otp:${challenge.id}`,
      });
    } catch (error) {
      await this.prisma.emailOtpChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      });
      throw error;
    }

    return {
      challengeId: challenge.id,
      resendAvailableAt: new Date(
        now.getTime() + resendCooldownMs,
      ).toISOString(),
    };
  }

  async verify(
    challengeId: string,
    code: string,
  ): Promise<OtpVerificationResult> {
    this.requirePepper();

    const now = new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${`email-otp-challenge:${challengeId}`}))`,
      );

      const challenge = await tx.emailOtpChallenge.findUnique({
        where: { id: challengeId },
      });

      if (
        !challenge ||
        challenge.consumedAt ||
        challenge.verifiedAt ||
        challenge.expiresAt.getTime() <= now.getTime()
      ) {
        return { kind: 'invalid' as const };
      }

      if (this.hashSecret(code) !== challenge.codeHash) {
        const attempts = challenge.attempts + 1;
        await tx.emailOtpChallenge.update({
          where: { id: challenge.id },
          data: {
            attempts,
            ...(attempts >= MAX_ATTEMPTS ? { consumedAt: now } : {}),
          },
        });
        return { kind: 'invalid' as const };
      }

      const user = await tx.user.findUnique({
        where: { email: challenge.email },
      });

      if (user) {
        await tx.emailOtpChallenge.update({
          where: { id: challenge.id },
          data: {
            consumedAt: now,
            userId: user.id,
            verifiedAt: now,
          },
        });
        return { email: challenge.email, kind: 'authenticated' as const };
      }

      const enrollmentToken = randomBytes(32).toString('base64url');
      await tx.emailOtpChallenge.update({
        where: { id: challenge.id },
        data: {
          enrollmentExpiresAt: new Date(now.getTime() + ENROLLMENT_TTL_MS),
          enrollmentTokenHash: this.hashSecret(enrollmentToken),
          verifiedAt: now,
        },
      });

      return {
        enrollmentToken,
        kind: 'profile_required' as const,
      };
    });

    if (result.kind === 'invalid') {
      throw new UnauthorizedException('Invalid or expired code');
    }

    return result;
  }

  async consumeEnrollmentToken(enrollmentToken: string): Promise<string> {
    this.requirePepper();

    const now = new Date();
    const tokenHash = this.hashSecret(enrollmentToken);
    const challenge = await this.prisma.emailOtpChallenge.findFirst({
      where: { enrollmentTokenHash: tokenHash },
      select: { id: true },
    });

    if (!challenge) {
      throw new UnauthorizedException('Invalid or expired enrollment');
    }

    const email = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${`email-otp-challenge:${challenge.id}`}))`,
      );

      const activeChallenge = await tx.emailOtpChallenge.findUnique({
        where: { id: challenge.id },
      });

      if (
        !activeChallenge ||
        activeChallenge.consumedAt ||
        !activeChallenge.verifiedAt ||
        activeChallenge.enrollmentTokenHash !== tokenHash ||
        !activeChallenge.enrollmentExpiresAt ||
        activeChallenge.enrollmentExpiresAt.getTime() <= now.getTime()
      ) {
        return null;
      }

      await tx.emailOtpChallenge.update({
        where: { id: activeChallenge.id },
        data: { consumedAt: now },
      });

      return activeChallenge.email;
    });

    if (!email) {
      throw new UnauthorizedException('Invalid or expired enrollment');
    }

    return email;
  }

  private createCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private hashSecret(value: string): string {
    return createHmac('sha256', env.emailOtp.pepper)
      .update(value)
      .digest('hex');
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private requirePepper(): void {
    if (env.emailOtp.pepper.length < 32) {
      throw new ServiceUnavailableException('Email login is unavailable');
    }
  }
}
