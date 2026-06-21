import { isUnauthorizedError } from "@/shared/api/http";
import {
  clearClientSession,
  getValidAccessToken,
} from "@/entities/session/model/accessTokenManager";

type AuthenticatedRequestParams<T> = {
  request: (accessToken: string) => Promise<T>;
};

export async function runAuthenticatedRequest<T>({
  request,
}: AuthenticatedRequestParams<T>): Promise<T> {
  const accessToken = await getValidAccessToken();

  try {
    return await request(accessToken);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      clearClientSession();
    }

    throw error;
  }
}
