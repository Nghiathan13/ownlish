import { NextResponse } from "next/server";
import {
  applyRefreshCookie,
  extractRefreshTokenFromResponse,
} from "@/server/auth/refreshCookie";
import { postUpstreamAuth } from "@/server/auth/upstreamAuth";

export async function handleCredentialAuth(
  upstreamPath: string,
  body: string,
): Promise<NextResponse> {
  const { json, upstream } = await postUpstreamAuth(upstreamPath, body);

  if (!upstream.ok) {
    return NextResponse.json(json, { status: upstream.status });
  }

  const response = NextResponse.json(json, { status: upstream.status });
  const refreshToken = extractRefreshTokenFromResponse(upstream);

  if (refreshToken) {
    applyRefreshCookie(response, refreshToken);
  }

  return response;
}
