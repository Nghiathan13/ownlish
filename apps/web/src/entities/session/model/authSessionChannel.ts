export const AUTH_SESSION_CHANNEL_NAME = "ownlish-auth";

export type AuthSessionMessage =
  | { type: "session-changed" }
  | { type: "session-signed-out" };

export function isAuthSessionMessage(
  value: unknown,
): value is AuthSessionMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value.type === "session-changed" || value.type === "session-signed-out")
  );
}

export function createAuthSessionChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") {
    return null;
  }

  return new BroadcastChannel(AUTH_SESSION_CHANNEL_NAME);
}
