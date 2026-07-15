import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';

export type VerifiedGoogleToken = {
  sub: string;
  email: string;
  name: string | null;
};

@Injectable()
export class GoogleTokenService {
  private readonly verificationClient = new OAuth2Client();

  async verifyAuthorizationCode(code: string): Promise<VerifiedGoogleToken> {
    if (
      !env.googleClientId ||
      !env.googleClientSecret ||
      !env.googleRedirectUri
    ) {
      throw new UnauthorizedException('Google login is not configured');
    }

    try {
      const client = new OAuth2Client(
        env.googleClientId,
        env.googleClientSecret,
        env.googleRedirectUri,
      );
      const { tokens } = await client.getToken({
        code,
        redirect_uri: env.googleRedirectUri,
      });

      if (!tokens.id_token) {
        throw new UnauthorizedException('Invalid Google authorization code');
      }

      return this.verifyIdToken(tokens.id_token);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid Google authorization code');
    }
  }

  async verifyIdToken(idToken: string): Promise<VerifiedGoogleToken> {
    if (!env.googleClientId) {
      throw new UnauthorizedException('Google login is not configured');
    }

    try {
      const ticket = await this.verificationClient.verifyIdToken({
        idToken,
        audience: env.googleClientId,
      });
      const payload = ticket.getPayload();

      if (!payload?.sub || !payload.email) {
        throw new UnauthorizedException('Invalid Google token');
      }

      if (payload.email_verified !== true) {
        throw new UnauthorizedException('Google email is not verified');
      }

      return {
        sub: payload.sub,
        email: payload.email,
        name: payload.name?.trim() || null,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid Google token');
    }
  }
}
