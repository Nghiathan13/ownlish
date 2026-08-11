import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/providers/LocaleProvider";
import { Form } from "./Form";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const formMocks = vi.hoisted(() => ({
  completeEmailOtpProfile: vi.fn(),
  googleLogin: vi.fn(),
  replace: vi.fn(),
  requestEmailOtp: vi.fn(),
  verifyEmailOtp: vi.fn(),
}));

function sessionAuthMock() {
  return {
    completeEmailOtpProfile: formMocks.completeEmailOtpProfile,
    googleLogin: formMocks.googleLogin,
    verifyEmailOtp: formMocks.verifyEmailOtp,
  };
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: formMocks.replace }),
}));

vi.mock("@/entities/auth/api/auth", () => ({
  requestEmailOtp: (...args: unknown[]) => formMocks.requestEmailOtp(...args),
}));

vi.mock("./GoogleSignInButton", () => ({
  isGoogleSignInConfigured: true,
  GoogleSignInButton: ({
    disabled,
    onCode,
  }: {
    disabled?: boolean;
    onCode: (code: string) => void | Promise<void>;
  }) => (
    <button
      disabled={disabled}
      onClick={() => void onCode("google-auth-code")}
      type="button"
    >
      Continue with Google
    </button>
  ),
}));

vi.mock("@/entities/session", () => ({
  useAuthSession: sessionAuthMock,
  useAuthSessionContext: sessionAuthMock,
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const CHALLENGE_ID = "f1bb6a0d-5e47-4a4d-93bf-6d3aebfae35a";

function resetFormMocks() {
  vi.clearAllMocks();
  formMocks.requestEmailOtp.mockResolvedValue({
    challengeId: CHALLENGE_ID,
    resendAvailableAt: new Date(Date.now() - 1).toISOString(),
  });
  formMocks.verifyEmailOtp.mockResolvedValue({
    accessToken: "token",
    user: {},
  });
  formMocks.completeEmailOtpProfile.mockResolvedValue(undefined);
  formMocks.googleLogin.mockResolvedValue(undefined);
}

function renderForm(redirectTo?: string) {
  return render(
    <LocaleProvider>
      <Form redirectTo={redirectTo} />
    </LocaleProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Form", () => {
  beforeEach(() => {
    resetFormMocks();
  });

  it("composes the email step shell", () => {
    renderForm();

    expect(
      screen.getByRole("heading", { name: "Get started with Ownlish" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeInTheDocument();
    expect(screen.getByText("OR")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("wires email submit into the otp step UI", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByPlaceholderText("Email"), "linh@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      await screen.findByRole("heading", { name: "Verify your email" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("auth-otp-code")).toBeInTheDocument();
  });

  it("wires otp verification into the profile step UI for new accounts", async () => {
    const user = userEvent.setup();
    formMocks.verifyEmailOtp.mockResolvedValue({
      enrollmentToken: "enrollment-token",
      status: "profile_required",
    });

    renderForm();

    await user.type(screen.getByPlaceholderText("Email"), "new@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByTestId("auth-otp-code"), "123456");
    await user.click(screen.getByRole("button", { name: "Verify code" }));

    expect(
      await screen.findByRole("heading", { name: "Finish your profile" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });
});
