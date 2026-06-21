"use client";

export { useAuthSessionContext as useAuthSession } from "../providers/AuthProvider";
export {
  isAuthenticatedStatus,
  isLoadingStatus,
  type AuthStatus,
} from "../lib/authStatus";
