export type AuthMode = "login" | "register";

type AuthValidationInput = {
  email: string;
  mode: AuthMode;
  name: string;
  password: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 80;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

export function getAuthValidationError({
  email,
  mode,
  name,
  password,
}: AuthValidationInput) {
  const normalizedEmail = email.trim();
  const normalizedName = name.trim();

  if (!normalizedEmail) {
    return "Email is required.";
  }

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return "Enter a valid email address.";
  }

  if (!password) {
    return "Password is required.";
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`;
  }

  if (mode === "register" && password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (mode === "register" && normalizedName.length > MAX_NAME_LENGTH) {
    return `Name must be at most ${MAX_NAME_LENGTH} characters.`;
  }

  return null;
}
