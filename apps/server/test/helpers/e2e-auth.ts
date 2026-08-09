import request from 'supertest';
import type { PublicUser } from '../../src/auth/types/auth.types';
import { parseResponseBody } from './parse-response-body';

type SupertestServer = Parameters<typeof request>[0];

export type ClientAuthBody = {
  accessToken: string;
  user: PublicUser;
};

export type E2eAuthContext = {
  accessToken: string;
  userId: string;
};

export async function registerE2eUser(
  server: SupertestServer,
  payload: { email: string; password: string; name: string },
): Promise<E2eAuthContext> {
  const response = await request(server)
    .post('/auth/register')
    .send(payload)
    .expect(201);

  const body = parseResponseBody<ClientAuthBody>(response);

  return {
    accessToken: body.accessToken,
    userId: body.user.id,
  };
}

function getSetCookieValues(response: request.Response): string[] {
  const setCookie: unknown = response.headers['set-cookie'];
  if (!setCookie) {
    return [];
  }

  const rawCookies: unknown[] = Array.isArray(setCookie)
    ? setCookie
    : [setCookie];
  const cookies: string[] = [];

  for (const rawCookie of rawCookies) {
    if (typeof rawCookie === 'string') {
      cookies.push(rawCookie);
    }
  }

  return cookies;
}

export function getRefreshCookie(
  response: request.Response,
): string | undefined {
  return getSetCookieValues(response).find((cookie) =>
    cookie.startsWith('engvocab.refreshToken='),
  );
}
