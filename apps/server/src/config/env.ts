import 'dotenv/config';

const requiredEnv = (key: string) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`${key} is not set`);
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
  jwtSecret: requiredEnv('JWT_SECRET'),
  port: process.env.PORT ?? '3001',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  bcryptSaltRounds: optionalNumberEnv('BCRYPT_SALT_ROUNDS', 10),
};
