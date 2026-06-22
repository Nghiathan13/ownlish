import { parseAuthResponse } from "@/entities/auth/lib/parseAuthResponse";
import { apiRequest } from "@/shared/api/http";

export function refreshSession() {
  return apiRequest("/api/auth/refresh", {
    method: "POST",
    sameOrigin: true,
  }).then(parseAuthResponse);
}
