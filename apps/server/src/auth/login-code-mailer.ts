export const LOGIN_CODE_MAILER = Symbol('LOGIN_CODE_MAILER');

export type SendLoginCodeInput = {
  code: string;
  email: string;
  idempotencyKey: string;
};

export type LoginCodeMailer = {
  sendLoginCode(input: SendLoginCodeInput): Promise<void>;
};
