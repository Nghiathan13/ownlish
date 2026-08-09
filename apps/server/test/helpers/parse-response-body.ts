import type { Response } from 'supertest';

export function getResponseBody(response: Response): unknown {
  return response.body as unknown;
}

export function parseResponseBody<T>(response: Response): T {
  return getResponseBody(response) as T;
}
