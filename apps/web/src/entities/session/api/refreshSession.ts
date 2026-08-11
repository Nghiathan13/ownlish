import { parseAuthResponse } from "@/entities/auth/@x/session";
import { apiRequest } from "@/shared/api";

export function refreshSession() {
  return apiRequest("/api/auth/refresh", {
    method: "POST",
    sameOrigin: true,
  }).then(parseAuthResponse);
}
