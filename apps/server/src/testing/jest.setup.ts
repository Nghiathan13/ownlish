import 'reflect-metadata';

process.env.DATABASE_URL ??=
  'postgresql://ownlish:ownlish@localhost:5432/ownlish_test';
process.env.JWT_SECRET ??= 'test-jwt-secret-at-least-32-characters';
process.env.PORT ??= '3001';
process.env.CORS_ORIGIN ??= 'http://localhost:3000';
process.env.BCRYPT_SALT_ROUNDS ??= '10';
process.env.EMAIL_OTP_PEPPER ??= 'test-email-otp-pepper-at-least-32-chars';
