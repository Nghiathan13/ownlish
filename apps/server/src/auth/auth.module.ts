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
import { ResendEmailService } from './resend-email.service';

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
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleTokenService,
    AdminGuard,
    JwtAuthGuard,
    RefreshSessionsService,
    EmailOtpService,
    ResendEmailService,
  ],
  exports: [JwtModule, AdminGuard, JwtAuthGuard],
})
export class AuthModule {}
