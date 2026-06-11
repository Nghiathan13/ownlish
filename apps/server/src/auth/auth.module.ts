import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { env } from '../config/env';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    UsersModule,
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
  providers: [AuthService, JwtAuthGuard],
  exports: [JwtModule],
})
export class AuthModule {}
