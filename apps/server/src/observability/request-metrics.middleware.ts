import type { NextFunction, Request, Response } from 'express';
import { recordHttpMetrics, type HttpMetricAttributes } from './http-metrics';

type MetricRequest = {
  baseUrl: string;
  method: string;
  route?: { path?: unknown };
};

function statusClass(statusCode: number) {
  const statusFamily = Math.floor(statusCode / 100);

  return statusFamily >= 1 && statusFamily <= 5 ? `${statusFamily}xx` : 'other';
}

export function requestMetricAttributes(
  request: MetricRequest,
  statusCode: number,
): HttpMetricAttributes {
  const routePath = request.route?.path;
  const route =
    typeof routePath === 'string'
      ? `${request.baseUrl}${routePath}`.replace(/\/+/g, '/') || '/'
      : 'unmatched';

  return {
    'http.request.method': request.method,
    'http.response.status_class': statusClass(statusCode),
    'http.route': route,
  };
}

export function requestMetricsMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const startedAt = process.hrtime.bigint();

  response.once('finish', () => {
    const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
    recordHttpMetrics(
      durationSeconds,
      requestMetricAttributes(request, response.statusCode),
    );
  });

  next();
}
