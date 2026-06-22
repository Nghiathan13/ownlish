import type { NextResponse } from "next/server";
import {
  REFRESH_COOKIE_MAX_AGE_SECONDS,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
} from "@/server/auth/constants";

const refreshCookiePrefix = `${REFRESH_COOKIE_NAME}=`;

export function extractRefreshTokenFromResponse(
  response: Response,
): string | undefined {
  const setCookieHeaders =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];

  if (setCookieHeaders.length === 0) {
    const singleHeader = response.headers.get("set-cookie");

    if (singleHeader) {
      setCookieHeaders.push(singleHeader);
    }
  }

  for (const cookieHeader of setCookieHeaders) {
    const cookiePair = cookieHeader.split(";")[0]?.trim();

    if (!cookiePair?.startsWith(refreshCookiePrefix)) {
      continue;
    }

    return decodeURIComponent(cookiePair.slice(refreshCookiePrefix.length));
  }

  return undefined;
}

export function applyRefreshCookie(
  response: NextResponse,
  refreshToken: string,
): void {
  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: refreshToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
  });
}

export function clearRefreshCookie(response: NextResponse): void {
  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
    maxAge: 0,
  });
}
