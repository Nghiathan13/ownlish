import { parseAuthResponse } from "@/entities/auth/lib/parseAuthResponse";
import { apiRequest } from "@/shared/api/http";

export function refreshSession() {
  return apiRequest("/auth/refresh", {
    method: "POST",
  }).then(parseAuthResponse);
}
