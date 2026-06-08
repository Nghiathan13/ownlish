import { API_BASE_URL } from "@/shared/config/env";

type ApiRequestOptions = RequestInit & {
  token?: string | null;
};

type ApiErrorBody = {
  error?: unknown;
  message?: unknown;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export function isUnauthorizedError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

function getApiErrorMessage(body: ApiErrorBody | null) {
  if (Array.isArray(body?.message)) {
    return body.message.filter(Boolean).join(" ");
  }

  if (typeof body?.message === "string") {
    return body.message;
  }

  if (typeof body?.error === "string") {
    return body.error;
  }

  return "Request failed. Please try again.";
}

async function readJsonBody(response: Response) {
  return response.json().catch(() => null) as Promise<ApiErrorBody | null>;
}

export async function apiRequest<T>(
  path: string,
  { token, headers, ...options }: ApiRequestOptions = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiError("Cannot connect to server.", 0);
  }

  const body = await readJsonBody(response);

  if (!response.ok) {
    throw new ApiError(getApiErrorMessage(body), response.status);
  }

  return body as T;
}
