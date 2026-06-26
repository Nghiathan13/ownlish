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

const optionalBooleanEnv = (key: string, fallback: boolean) => {
  const value = process.env[key];

  if (!value) {
    return fallback;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === 'true' || normalizedValue === '1') {
    return true;
  }

  if (normalizedValue === 'false' || normalizedValue === '0') {
    return false;
  }

  throw new Error(`${key} must be true, false, 1, or 0`);
};

const optionalCookieSameSiteEnv = (fallback: 'lax' | 'none' | 'strict') => {
  const value = process.env.REFRESH_TOKEN_COOKIE_SAME_SITE;

  if (!value) {
    return fallback;
  }

  if (value === 'lax' || value === 'none' || value === 'strict') {
    return value;
  }

  throw new Error(
    'REFRESH_TOKEN_COOKIE_SAME_SITE must be lax, none, or strict',
  );
};

const defaultSecureCookie = process.env.NODE_ENV === 'production';
const secureRefreshTokenCookie = optionalBooleanEnv(
  'REFRESH_TOKEN_COOKIE_SECURE',
  defaultSecureCookie,
);

export const env = {
  databaseUrl: requiredEnv('DATABASE_URL'),
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  jwtSecret: requiredSecretEnv('JWT_SECRET', 32),
  port: process.env.PORT ?? '3001',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  accessTokenTtlSeconds: optionalNumberEnv('ACCESS_TOKEN_TTL_SECONDS', 900),
  bcryptSaltRounds: optionalNumberEnv('BCRYPT_SALT_ROUNDS', 10),
  refreshTokenTtlDays: optionalNumberEnv('REFRESH_TOKEN_TTL_DAYS', 30),
  refreshTokenCookie: {
    name: process.env.REFRESH_TOKEN_COOKIE_NAME ?? 'engvocab.refreshToken',
    secure: secureRefreshTokenCookie,
    sameSite: optionalCookieSameSiteEnv(
      secureRefreshTokenCookie ? 'none' : 'lax',
    ),
  },
  authRateLimit: {
    limit: optionalNumberEnv('AUTH_RATE_LIMIT_LIMIT', 10),
    ttlMs: optionalNumberEnv('AUTH_RATE_LIMIT_TTL_SECONDS', 60) * 1000,
  },
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  toeicStorageBucket: process.env.TOEIC_STORAGE_BUCKET ?? 'toeic-media',
  toeicSignedUrlTtlSeconds: optionalNumberEnv(
    'TOEIC_SIGNED_URL_TTL_SECONDS',
    900,
  ),
};
