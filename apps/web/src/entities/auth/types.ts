export type UserRole = "USER" | "ADMIN";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  name?: string;
};

export type GoogleLoginInput = {
  code: string;
};

export type UpdateProfileInput = {
  avatar?: File;
  name: string;
};
