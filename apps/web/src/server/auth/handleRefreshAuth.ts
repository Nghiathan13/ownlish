import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { REFRESH_COOKIE_NAME } from "@/server/auth/constants";
import {
  applyRefreshCookie,
  clearRefreshCookie,
  extractRefreshTokenFromResponse,
} from "@/server/auth/refreshCookie";
import { postUpstreamAuth } from "@/server/auth/upstreamAuth";

function invalidRefreshTokenResponse(): NextResponse {
  return NextResponse.json(
    {
      error: "Unauthorized",
      message: "Invalid refresh token",
      statusCode: 401,
    },
    { status: 401 },
  );
}

export async function handleRefreshAuth(): Promise<NextResponse> {
  const refreshToken = (await cookies()).get(REFRESH_COOKIE_NAME)?.value;

  if (!refreshToken) {
    return invalidRefreshTokenResponse();
  }

  const { json, upstream } = await postUpstreamAuth(
    "/auth/refresh",
    JSON.stringify({ refreshToken }),
  );

  if (!upstream.ok) {
    const response = NextResponse.json(json, { status: upstream.status });

    if (upstream.status === 401) {
      clearRefreshCookie(response);
    }

    return response;
  }

  const response = NextResponse.json(json, { status: upstream.status });
  const rotatedRefreshToken = extractRefreshTokenFromResponse(upstream);

  if (rotatedRefreshToken) {
    applyRefreshCookie(response, rotatedRefreshToken);
  }

  return response;
}
