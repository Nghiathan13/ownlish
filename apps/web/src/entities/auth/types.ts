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

export type EmailOtpRequestInput = {
  email: string;
};

export type EmailOtpRequestResponse = {
  challengeId: string;
  resendAvailableAt: string;
};

export type VerifyEmailOtpInput = {
  challengeId: string;
  code: string;
};

export type EmailOtpProfileRequired = {
  enrollmentToken: string;
  status: "profile_required";
};

export type EmailOtpVerification = AuthResponse | EmailOtpProfileRequired;

export type CompleteEmailOtpProfileInput = {
  enrollmentToken: string;
  name: string;
};

export type UpdateProfileInput = {
  avatar?: File;
  name: string;
};
