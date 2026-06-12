const originalEnv = process.env;

function setRequiredEnv(overrides: NodeJS.ProcessEnv = {}) {
  process.env = {
    ...originalEnv,
    DATABASE_URL: 'postgresql://user:password@localhost:5432/engvocab',
    JWT_SECRET: 'a'.repeat(32),
    ...overrides,
  };
}

describe('env', () => {
  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  it.each([
    ['TRUE', true],
    ['True', true],
    ['1', true],
    ['FALSE', false],
    ['False', false],
    ['0', false],
  ])('parses REFRESH_TOKEN_COOKIE_SECURE=%s', (value, expected) => {
    jest.resetModules();
    setRequiredEnv({
      REFRESH_TOKEN_COOKIE_SECURE: value,
    });

    jest.isolateModules(() => {
      const { env } = jest.requireActual<typeof import('./env')>('./env');

      expect(env.refreshTokenCookie.secure).toBe(expected);
    });
  });
});
