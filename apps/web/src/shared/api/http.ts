import { API_BASE_URL } from "@/shared/config/env";
import { isRecord } from "@/shared/lib/parse";

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

export function invalidApiResponse(): never {
  throw new ApiError("Invalid server response.", 0);
}

export function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function getApiErrorMessage(body: unknown) {
  if (!isRecord(body)) {
    return "Request failed. Please try again.";
  }

  const errorBody = body as ApiErrorBody;

  if (Array.isArray(errorBody.message)) {
    return errorBody.message.filter(Boolean).join(" ");
  }

  if (typeof errorBody.message === "string") {
    return errorBody.message;
  }

  if (typeof errorBody.error === "string") {
    return errorBody.error;
  }

  return "Request failed. Please try again.";
}

async function readJsonBody(response: Response) {
  return response.json().catch(() => null) as Promise<unknown>;
}

export async function apiRequest(
  path: string,
  { token, headers, ...options }: ApiRequestOptions = {},
): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    throw new ApiError("Cannot connect to server.", 0);
  }

  const body = await readJsonBody(response);

  if (!response.ok) {
    throw new ApiError(getApiErrorMessage(body), response.status);
  }

  return body;
}
