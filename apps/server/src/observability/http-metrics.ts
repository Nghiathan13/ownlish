import { metrics, type Meter } from '@opentelemetry/api';

export type HttpMetricAttributes = {
  'http.request.method': string;
  'http.response.status_class': string;
  'http.route': string;
};

export function createHttpMetricRecorder(meter: Meter) {
  const requests = meter.createCounter('engvocab.http.server.requests', {
    description: 'Completed HTTP requests handled by the EngVocab API.',
  });
  const duration = meter.createHistogram(
    'engvocab.http.server.request.duration',
    {
      description:
        'Completed HTTP request duration handled by the EngVocab API.',
      unit: 's',
    },
  );

  return (durationSeconds: number, attributes: HttpMetricAttributes) => {
    requests.add(1, attributes);
    duration.record(durationSeconds, attributes);
  };
}

export const recordHttpMetrics = createHttpMetricRecorder(
  metrics.getMeter('engvocab-server'),
);
