import type { Meter } from '@opentelemetry/api';
import {
  createHttpMetricRecorder,
  type HttpMetricAttributes,
} from './http-metrics';
import {
  requestMetricAttributes,
  requestMetricsMiddleware,
} from './request-metrics.middleware';

describe('requestMetricAttributes', () => {
  it('uses the route template and never the query string', () => {
    expect(
      requestMetricAttributes(
        {
          baseUrl: '/vocab',
          method: 'GET',
          route: { path: '/:id' },
        },
        200,
      ),
    ).toEqual({
      'http.request.method': 'GET',
      'http.response.status_class': '2xx',
      'http.route': '/vocab/:id',
    });
  });

  it('records unmatched and server-error responses with bounded labels', () => {
    expect(
      requestMetricAttributes(
        { baseUrl: '', method: 'POST', route: undefined },
        500,
      ),
    ).toEqual({
      'http.request.method': 'POST',
      'http.response.status_class': '5xx',
      'http.route': 'unmatched',
    });
  });

  it.each([
    [99, 'other'],
    [100, '1xx'],
    [404, '4xx'],
    [503, '5xx'],
    [600, 'other'],
  ])('classifies status %i as %s', (statusCode, expected) => {
    expect(
      requestMetricAttributes(
        { baseUrl: '', method: 'GET', route: { path: '/' } },
        statusCode,
      ),
    ).toMatchObject({ 'http.response.status_class': expected });
  });
});

describe('requestMetricsMiddleware', () => {
  it('records the completed response after continuing the request chain', () => {
    const finish = jest.fn();
    const once = jest.fn((event: string, handler: () => void) => {
      if (event === 'finish') {
        finish.mockImplementation(handler);
      }
    });
    const next = jest.fn();
    requestMetricsMiddleware(
      { baseUrl: '/vocab', method: 'GET', route: { path: '/:id' } } as never,
      { once, statusCode: 200 } as never,
      next,
    );
    finish();

    expect(next).toHaveBeenCalledTimes(1);
    expect(once).toHaveBeenCalledWith('finish', expect.any(Function));
  });
});

describe('createHttpMetricRecorder', () => {
  it('records a counter and histogram with the same attributes', () => {
    const add = jest.fn();
    const record = jest.fn();
    const meter = {
      createCounter: jest.fn(() => ({ add })),
      createHistogram: jest.fn(() => ({ record })),
    } as unknown as Meter;
    const attributes: HttpMetricAttributes = {
      'http.request.method': 'GET',
      'http.response.status_class': '2xx',
      'http.route': '/health',
    };

    createHttpMetricRecorder(meter)(0.125, attributes);

    expect(add).toHaveBeenCalledWith(1, attributes);
    expect(record).toHaveBeenCalledWith(0.125, attributes);
  });
});
