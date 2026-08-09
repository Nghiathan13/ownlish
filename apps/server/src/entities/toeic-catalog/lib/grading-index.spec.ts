import { env } from '../../../config/env';
import { ToeicCatalogGradingIndex } from './grading-index';

describe('ToeicCatalogGradingIndex', () => {
  const originalUrl = env.toeicGradingIndexUrl;

  afterEach(() => {
    env.toeicGradingIndexUrl = originalUrl;
    jest.restoreAllMocks();
  });

  it('maps stable question and group keys from the active grading index', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          schemaVersion: 1,
          tests: {
            'ets26-t01': {
              parts: {
                1: {
                  groups: {
                    'ets26-t01-p1-q001': {
                      'ets26-t01-p1-q001': 'A',
                    },
                  },
                },
              },
            },
          },
        }),
      ),
    );
    env.toeicGradingIndexUrl = 'https://example.com/grading-index.json';

    const index = new ToeicCatalogGradingIndex();

    await expect(index.hasTestParts('ets26-t01', [1])).resolves.toBe(true);
    await expect(index.hasPart(1)).resolves.toBe(true);
    await expect(index.getQuestion('ets26-t01-p1-q001')).resolves.toEqual({
      testKey: 'ets26-t01',
      partNumber: 1,
      groupKey: 'ets26-t01-p1-q001',
      questionKey: 'ets26-t01-p1-q001',
      answerKey: 'A',
    });
  });
});
