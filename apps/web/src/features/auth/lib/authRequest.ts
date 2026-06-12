import { isUnauthorizedError } from "@/shared/api/http";

type AuthenticatedRequestParams<T> = {
  accessToken: string | null;
  clearSession: () => void;
  request: (accessToken: string) => Promise<T>;
};

export async function runAuthenticatedRequest<T>({
  accessToken,
  clearSession,
  request,
}: AuthenticatedRequestParams<T>) {
  if (!accessToken) throw new Error("No access token");

  try {
    return await request(accessToken);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      clearSession();
    }

    throw error;
  }
}
