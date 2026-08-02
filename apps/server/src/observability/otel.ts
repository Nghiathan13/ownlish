import {
  defaultResource,
  resourceFromAttributes,
} from '@opentelemetry/resources';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-base';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { env } from '../config/env';

let sdk: NodeSDK | undefined;

function parseHeaders(value: string) {
  return Object.fromEntries(
    value.split(',').map((header) => {
      const [name, ...valueParts] = header.trim().split('=');
      const headerValue = valueParts.join('=');

      if (!name || !headerValue) {
        throw new Error('OTEL_EXPORTER_OTLP_HEADERS is invalid');
      }

      return [name, headerValue];
    }),
  );
}

function signalUrl(signal: 'metrics' | 'traces') {
  return `${env.otel.exporterEndpoint.replace(/\/+$/, '')}/v1/${signal}`;
}

export function startObservability() {
  if (!env.otel.enabled || sdk) {
    return;
  }

  if (!env.otel.exporterEndpoint || !env.otel.exporterHeaders) {
    throw new Error(
      'OTEL_EXPORTER_OTLP_ENDPOINT and OTEL_EXPORTER_OTLP_HEADERS are required when OTEL_ENABLED is true',
    );
  }

  const headers = parseHeaders(env.otel.exporterHeaders);
  const resource = defaultResource().merge(
    resourceFromAttributes({
      'service.name': env.otel.serviceName,
      'service.version': process.env.RAILWAY_DEPLOYMENT_ID ?? 'local',
      'service.instance.id':
        process.env.RAILWAY_REPLICA_ID ?? process.env.HOSTNAME ?? 'local',
      'deployment.environment.name':
        process.env.RAILWAY_ENVIRONMENT_NAME ?? env.nodeEnv,
    }),
  );

  sdk = new NodeSDK({
    resource,
    sampler: new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(0.1),
    }),
    traceExporter: new OTLPTraceExporter({
      url: signalUrl('traces'),
      headers,
    }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: signalUrl('metrics'),
        headers,
      }),
      exportIntervalMillis: 30_000,
    }),
    instrumentations: getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-dns': { enabled: false },
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-net': { enabled: false },
      '@opentelemetry/instrumentation-runtime-node': { enabled: false },
    }),
  });
  sdk.start();
}

export async function shutdownObservability() {
  await sdk?.shutdown();
}

startObservability();

process.once('SIGINT', () => void shutdownObservability());
process.once('SIGTERM', () => void shutdownObservability());
