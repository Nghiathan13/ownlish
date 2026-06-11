import 'dotenv/config';

const requiredEnv = (key: string) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`${key} is not set`);
  }

  return value;
};

const requiredSecretEnv = (key: string, minLength: number) => {
  const value = requiredEnv(key);

  if (value.length < minLength) {
    throw new Error(`${key} must be at least ${minLength} characters`);
  }

  return value;
};

const optionalNumberEnv = (key: string, fallback: number) => {
  const value = process.env[key];

  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${key} must be a positive integer`);
  }

  return parsedValue;
};

export const env = {
  databaseUrl: requiredEnv('DATABASE_URL'),
  jwtSecret: requiredSecretEnv('JWT_SECRET', 32),
  port: process.env.PORT ?? '3001',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  accessTokenTtlSeconds: optionalNumberEnv('ACCESS_TOKEN_TTL_SECONDS', 900),
  bcryptSaltRounds: optionalNumberEnv('BCRYPT_SALT_ROUNDS', 10),
  refreshTokenTtlDays: optionalNumberEnv('REFRESH_TOKEN_TTL_DAYS', 30),
  authRateLimit: {
    limit: optionalNumberEnv('AUTH_RATE_LIMIT_LIMIT', 10),
    ttlMs: optionalNumberEnv('AUTH_RATE_LIMIT_TTL_SECONDS', 60) * 1000,
  },
};
