const create = jest.fn();
const log = jest.fn();
const helmetMiddleware = jest.fn();
const requestMetricsMiddleware = jest.fn();
const app = {
  enableShutdownHooks: jest.fn(),
  use: jest.fn(),
  enableCors: jest.fn(),
  useGlobalPipes: jest.fn(),
  listen: jest.fn().mockResolvedValue(undefined),
};

jest.mock('./observability/otel', () => ({}));
jest.mock('@nestjs/core', () => ({ NestFactory: { create } }));
jest.mock('helmet', () => jest.fn(() => helmetMiddleware));
jest.mock('./app/app.module', () => ({ AppModule: class AppModule {} }));
jest.mock('./config/env', () => ({
  env: { corsOrigin: 'http://localhost:3000', port: '3101' },
}));
jest.mock('./observability/request-metrics.middleware', () => ({
  requestMetricsMiddleware,
}));
jest.mock('@nestjs/common', () => {
  const actual =
    jest.requireActual<typeof import('@nestjs/common')>('@nestjs/common');
  return { ...actual, Logger: jest.fn(() => ({ log })) };
});

describe('bootstrap', () => {
  it('configures security, CORS, validation, metrics, and the configured port', async () => {
    create.mockResolvedValue(app);

    jest.isolateModules(() => {
      jest.requireActual('./main');
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(app.enableShutdownHooks).toHaveBeenCalledTimes(1);
    expect(app.use).toHaveBeenNthCalledWith(1, requestMetricsMiddleware);
    expect(app.use).toHaveBeenNthCalledWith(2, helmetMiddleware);
    expect(app.enableCors).toHaveBeenCalledWith({
      credentials: true,
      origin: 'http://localhost:3000',
    });
    expect(app.useGlobalPipes).toHaveBeenCalledTimes(1);
    expect(app.listen).toHaveBeenCalledWith('3101');
    expect(log).toHaveBeenCalledWith('Server is running on port 3101');
  });
});
