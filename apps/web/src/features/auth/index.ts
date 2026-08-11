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

export { useAuthSessionActions } from "./model/useAuthSessionActions";

export { getSafeAuthRedirectPath } from "./lib/authRedirect";
export { isGoogleSignInConfigured } from "./config/googleSignIn";
