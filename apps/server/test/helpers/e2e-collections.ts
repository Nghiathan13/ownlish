import request from 'supertest';
import type { CollectionSummaryBody } from './e2e-collection-types';
import { parseResponseBody } from './parse-response-body';

type SupertestServer = Parameters<typeof request>[0];

export async function getDefaultCollectionId(
  server: SupertestServer,
  accessToken: string,
): Promise<string> {
  const response = await request(server)
    .get('/collections')
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(200);

  const collections = parseResponseBody<CollectionSummaryBody[]>(response);
  const defaultCollection = collections.find(
    (collection) => collection.isDefault,
  );

  if (!defaultCollection) {
    throw new Error('Default collection not found');
  }

  return defaultCollection.id;
}

export function buildVocabListPath(
  collectionId: string,
  params: { search?: string; limit?: number; offset?: number } = {},
) {
  const searchParams = new URLSearchParams({
    collectionId,
  });

  if (params.search) {
    searchParams.set('search', params.search);
  }

  if (params.limit !== undefined) {
    searchParams.set('limit', String(params.limit));
  }

  if (params.offset !== undefined) {
    searchParams.set('offset', String(params.offset));
  }

  return `/vocab?${searchParams.toString()}`;
}

export function buildVocabStatsPath(collectionId: string) {
  return `/vocab/stats?collectionId=${collectionId}`;
}

export function withDefaultCollection<T extends Record<string, unknown>>(
  collectionId: string,
  payload: T,
) {
  return {
    collectionId,
    ...payload,
  };
}
