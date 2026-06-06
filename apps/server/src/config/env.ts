import 'dotenv/config';

const requiredEnv = (key: string) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`${key} is not set`);
  }

  return value;
};

export const env = {
  databaseUrl: requiredEnv('DATABASE_URL'),
  jwtSecret: requiredEnv('JWT_SECRET'),
  port: process.env.PORT ?? '3001',
};
