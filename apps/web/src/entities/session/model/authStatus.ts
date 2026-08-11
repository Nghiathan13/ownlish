export type AuthStatus = "loading" | "authenticated" | "guest";

export function isAuthenticatedStatus(status: AuthStatus): boolean {
  return status === "authenticated";
}

export function isLoadingStatus(status: AuthStatus): boolean {
  return status === "loading";
}
