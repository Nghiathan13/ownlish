import { NextResponse } from "next/server";
import {
  applyRefreshCookie,
  extractRefreshTokenFromResponse,
} from "@/_app/api-routes/auth/refreshCookie";
import { postUpstreamAuth } from "@/_app/api-routes/auth/upstreamAuth";

export async function handleCredentialAuth(
  upstreamPath: string,
  body: string,
  extraHeaders?: HeadersInit,
): Promise<NextResponse> {
  const { json, upstream } = await (extraHeaders
    ? postUpstreamAuth(upstreamPath, body, extraHeaders)
    : postUpstreamAuth(upstreamPath, body));

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

export async function handlePublicAuth(
  upstreamPath: string,
  body: string,
): Promise<NextResponse> {
  const { json, upstream } = await postUpstreamAuth(upstreamPath, body);

  return NextResponse.json(json, { status: upstream.status });
}
