import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { env } from '../config/env';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthRequest, AuthResponse } from './types/auth.types';

type ClientAuthResponse = Omit<AuthResponse, 'refreshToken'>;

const REFRESH_TOKEN_COOKIE_PATH = '/auth';

function getCookieValue(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) {
    return undefined;
  }

  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!cookie) {
    return undefined;
  }

  return decodeURIComponent(cookie.slice(name.length + 1));
}

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({
    default: {
      limit: env.authRateLimit.limit,
      ttl: env.authRateLimit.ttlMs,
    },
  })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ClientAuthResponse> {
    const authResponse = await this.authService.register(dto);

    return this.setRefreshCookie(response, authResponse);
  }

  @Post('login')
  @Throttle({
    default: {
      limit: env.authRateLimit.limit,
      ttl: env.authRateLimit.ttlMs,
    },
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ClientAuthResponse> {
    const authResponse = await this.authService.login(dto);

    return this.setRefreshCookie(response, authResponse);
  }

  @Post('refresh')
  @Throttle({
    default: {
      limit: env.authRateLimit.limit,
      ttl: env.authRateLimit.ttlMs,
    },
  })
  async refresh(
    @Req() request: Request,
    @Body() dto: RefreshTokenDto | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ClientAuthResponse> {
    const authResponse = await this.authService.refresh({
      refreshToken: this.getRefreshToken(request, dto),
    });

    return this.setRefreshCookie(response, authResponse);
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Body() dto: RefreshTokenDto | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = this.getOptionalRefreshToken(request, dto);

    this.clearRefreshCookie(response);

    return this.authService.logout({ refreshToken });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthRequest) {
    return this.authService.me(request.user.id);
  }

  private getRefreshToken(
    request: Request,
    dto: RefreshTokenDto | undefined,
  ): string {
    const refreshToken = this.getOptionalRefreshToken(request, dto);

    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return refreshToken;
  }

  private getOptionalRefreshToken(
    request: Request,
    dto: RefreshTokenDto | undefined,
  ): string | undefined {
    return (
      dto?.refreshToken ?? getCookieValue(request, env.refreshTokenCookie.name)
    );
  }

  private setRefreshCookie(
    response: Response,
    authResponse: AuthResponse,
  ): ClientAuthResponse {
    response.cookie(env.refreshTokenCookie.name, authResponse.refreshToken, {
      httpOnly: true,
      maxAge: env.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
      path: REFRESH_TOKEN_COOKIE_PATH,
      sameSite: env.refreshTokenCookie.sameSite,
      secure: env.refreshTokenCookie.secure,
    });

    return {
      accessToken: authResponse.accessToken,
      user: authResponse.user,
    };
  }

  private clearRefreshCookie(response: Response): void {
    response.clearCookie(env.refreshTokenCookie.name, {
      path: REFRESH_TOKEN_COOKIE_PATH,
      sameSite: env.refreshTokenCookie.sameSite,
      secure: env.refreshTokenCookie.secure,
    });
  }
}
