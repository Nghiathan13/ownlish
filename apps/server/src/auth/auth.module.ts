import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { env } from '../config/env';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { AdminGuard } from './admin.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleTokenService } from './google-token.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RefreshSessionsService } from './refresh-sessions.service';
import { EmailOtpService } from './email-otp.service';
import { LOGIN_CODE_MAILER } from './login-code-mailer';
import { OutboxLoginCodeMailer } from './outbox-login-code-mailer';
import { ResendEmailService } from './resend-email.service';
import { TestEmailOutboxController } from './test-email-outbox.controller';

const isTestOutboxMailerEnabled =
  env.emailOtp.mailer === 'outbox' && env.nodeEnv === 'test';

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    ThrottlerModule.forRoot([
      {
        ttl: env.authRateLimit.ttlMs,
        limit: env.authRateLimit.limit,
      },
    ]),
    JwtModule.register({
      secret: env.jwtSecret,
      signOptions: {
        expiresIn: env.accessTokenTtlSeconds,
      },
    }),
  ],
  controllers: [
    AuthController,
    ...(isTestOutboxMailerEnabled ? [TestEmailOutboxController] : []),
  ],
  providers: [
    AuthService,
    GoogleTokenService,
    AdminGuard,
    JwtAuthGuard,
    RefreshSessionsService,
    EmailOtpService,
    ResendEmailService,
    OutboxLoginCodeMailer,
    {
      provide: LOGIN_CODE_MAILER,
      useExisting: isTestOutboxMailerEnabled
        ? OutboxLoginCodeMailer
        : ResendEmailService,
    },
  ],
  exports: [JwtModule, AdminGuard, JwtAuthGuard],
})
export class AuthModule {}
