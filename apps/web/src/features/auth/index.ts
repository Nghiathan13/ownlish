/**
 * Public API for the auth feature slice.
 * Outside this folder, import only from `@/features/auth`.
 *
 * Note: `AuthProvider` is mounted from the App layer (`@/_app/providers`).
 */

export { Form as AuthForm } from "./ui/Form";
export { QueryReset as AuthQueryReset } from "./ui/QueryReset";
export { RequireAdmin } from "./ui/RequireAdmin";
export { RequireAuth } from "./ui/RequireAuth";

export {
  AuthSessionContext,
  useAuthSession,
  useAuthSessionContext,
  type AuthSessionContextValue,
} from "./model/authSessionContext";
export { useAuthSessionActions } from "./model/useAuthSessionActions";
export { useAuthSessionBootstrap } from "./model/useAuthSessionBootstrap";

export type { AuthStatus } from "./lib/authStatus";
export { isAuthenticatedStatus, isLoadingStatus } from "./lib/authStatus";

export { getSafeAuthRedirectPath } from "./lib/authRedirect";
export { isAdminUser } from "./lib/isAdminUser";

export { isGoogleSignInConfigured } from "./config/googleSignIn";
