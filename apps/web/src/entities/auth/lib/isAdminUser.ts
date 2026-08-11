import type { AuthUser } from "@/entities/auth";

export function isAdminUser(user: AuthUser | null): boolean {
  return user?.role === "ADMIN";
}
