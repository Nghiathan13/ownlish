process.env.REFRESH_TOKEN_COOKIE_SECURE = 'false';
process.env.REFRESH_TOKEN_COOKIE_SAME_SITE = 'lax';
process.env.NODE_ENV = 'test';
process.env.EMAIL_MAILER ??= 'outbox';
process.env.EMAIL_OTP_PEPPER ??= 'test-email-otp-pepper-at-least-32-characters';
process.env.EMAIL_FROM ??= 'Ownlish E2E <auth@ownlish.test>';
