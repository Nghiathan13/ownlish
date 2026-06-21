let accessToken: string | null = null;

export function getStoredAccessToken(): string | null {
  return accessToken;
}

export function setStoredAccessToken(token: string): void {
  accessToken = token;
}

export function clearStoredAccessToken(): void {
  accessToken = null;
}
