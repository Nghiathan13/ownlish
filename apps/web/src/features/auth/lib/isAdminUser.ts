import type { AuthUser } from "@/entities/auth/types";

export function isAdminUser(user: AuthUser | null): boolean {
  return user?.role === "ADMIN";
}
