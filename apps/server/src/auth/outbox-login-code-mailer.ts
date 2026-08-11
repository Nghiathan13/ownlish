import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { LoginCodeMailer, SendLoginCodeInput } from './login-code-mailer';

export type LoginCodeOutboxEntry = {
  id: string;
  email: string;
  code: string;
  idempotencyKey: string;
  sentAt: string;
};

@Injectable()
export class OutboxLoginCodeMailer implements LoginCodeMailer {
  private readonly entries: LoginCodeOutboxEntry[] = [];

  sendLoginCode({
    code,
    email,
    idempotencyKey,
  }: SendLoginCodeInput): Promise<void> {
    this.entries.push({
      id: randomUUID(),
      email: email.trim().toLowerCase(),
      code,
      idempotencyKey,
      sentAt: new Date().toISOString(),
    });

    return Promise.resolve();
  }

  getLatestForEmail(email: string): LoginCodeOutboxEntry | null {
    const normalizedEmail = email.trim().toLowerCase();

    for (let index = this.entries.length - 1; index >= 0; index -= 1) {
      const entry = this.entries[index];
      if (entry?.email === normalizedEmail) {
        return entry;
      }
    }

    return null;
  }

  clear(): void {
    this.entries.length = 0;
  }
}
