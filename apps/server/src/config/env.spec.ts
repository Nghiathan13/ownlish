const originalEnv = process.env;

function setRequiredEnv(overrides: NodeJS.ProcessEnv = {}) {
  process.env = {
    ...originalEnv,
    DATABASE_URL: 'postgresql://user:password@localhost:5432/ownlish',
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

  it('uses the secure cookie defaults in production', () => {
    jest.resetModules();
    setRequiredEnv({ NODE_ENV: 'production' });

    jest.isolateModules(() => {
      const { env } = jest.requireActual<typeof import('./env')>('./env');

      expect(env.refreshTokenCookie).toMatchObject({
        secure: true,
        sameSite: 'none',
      });
    });
  });

  it.each([
    ['ACCESS_TOKEN_TTL_SECONDS', '0'],
    ['BCRYPT_SALT_ROUNDS', 'not-a-number'],
    ['REFRESH_TOKEN_COOKIE_SECURE', 'yes'],
  ])('rejects invalid %s', (key, value) => {
    jest.resetModules();
    setRequiredEnv({ [key]: value });

    expect(() => jest.requireActual<typeof import('./env')>('./env')).toThrow();
  });
});
