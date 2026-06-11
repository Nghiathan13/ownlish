import { apiRequest } from "@/shared/api/http";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  name?: string;
};

export type RefreshTokenInput = {
  refreshToken: string;
};

export function login(input: LoginInput) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function register(input: RegisterInput) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getCurrentUser(token: string) {
  return apiRequest<AuthUser>("/auth/me", {
    token,
  });
}

export function refreshSession(input: RefreshTokenInput) {
  return apiRequest<AuthResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logoutSession(input: RefreshTokenInput) {
  return apiRequest<{ success: true }>("/auth/logout", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
