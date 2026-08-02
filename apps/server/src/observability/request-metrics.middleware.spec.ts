import type { Meter } from '@opentelemetry/api';
import {
  createHttpMetricRecorder,
  type HttpMetricAttributes,
} from './http-metrics';
import { requestMetricAttributes } from './request-metrics.middleware';

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
