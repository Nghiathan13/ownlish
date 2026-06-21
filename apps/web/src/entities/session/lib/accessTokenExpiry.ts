export type AccessTokenPayload = {
  sub?: string;
  email?: string;
  exp?: number;
  iat?: number;
};

function decodeBase64Url(value: string): string {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");

  return atob(base64);
}

export function parseAccessTokenPayload(token: string): AccessTokenPayload | null {
  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  try {
    const json = decodeBase64Url(parts[1]);
    const parsed: unknown = JSON.parse(json);

    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    return parsed as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function isAccessTokenExpired(
  token: string,
  { skewSeconds = 60 }: { skewSeconds?: number } = {},
): boolean {
  const payload = parseAccessTokenPayload(token);

  if (!payload || typeof payload.exp !== "number") {
    return true;
  }

  return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
}
