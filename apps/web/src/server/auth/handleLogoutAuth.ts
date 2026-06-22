import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { REFRESH_COOKIE_NAME } from "@/server/auth/constants";
import { clearRefreshCookie } from "@/server/auth/refreshCookie";
import { postUpstreamAuth } from "@/server/auth/upstreamAuth";

export async function handleLogoutAuth(): Promise<NextResponse> {
  const refreshToken = (await cookies()).get(REFRESH_COOKIE_NAME)?.value;
  const body = refreshToken
    ? JSON.stringify({ refreshToken })
    : JSON.stringify({});

  const { json, upstream } = await postUpstreamAuth("/auth/logout", body);
  const response = NextResponse.json(json, { status: upstream.status });

  clearRefreshCookie(response);

  return response;
}
