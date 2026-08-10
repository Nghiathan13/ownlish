import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuthForm } from "@/features/auth/components/AuthForm";
import { LocaleProvider } from "@/shared/providers/LocaleProvider";

const mocks = vi.hoisted(() => ({
  completeEmailOtpProfile: vi.fn(),
  googleLogin: vi.fn(),
  replace: vi.fn(),
  requestEmailOtp: vi.fn(),
  verifyEmailOtp: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("@/entities/auth/api/auth", () => ({
  requestEmailOtp: mocks.requestEmailOtp,
}));

vi.mock("@/features/auth/components/GoogleSignInButton", () => ({
  GoogleSignInButton: () => <button type="button">Continue with Google</button>,
  isGoogleSignInConfigured: true,
}));

vi.mock("@/features/auth/hooks/useAuthSession", () => ({
  useAuthSession: () => ({
    completeEmailOtpProfile: mocks.completeEmailOtpProfile,
    googleLogin: mocks.googleLogin,
    verifyEmailOtp: mocks.verifyEmailOtp,
  }),
}));

function renderAuthForm() {
  return render(
    <LocaleProvider>
      <AuthForm />
    </LocaleProvider>,
  );
}

describe("AuthForm", () => {
  it("starts with email only and requests a one-time code", async () => {
    const user = userEvent.setup();
    mocks.requestEmailOtp.mockResolvedValue({
      challengeId: "f1bb6a0d-5e47-4a4d-93bf-6d3aebfae35a",
      resendAvailableAt: new Date(Date.now() + 60_000).toISOString(),
    });

    renderAuthForm();

    expect(screen.queryByPlaceholderText("Password")).not.toBeInTheDocument();
    expect(screen.queryByText("New to Ownlish?")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

    await user.type(screen.getByPlaceholderText("Email"), "linh@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(mocks.requestEmailOtp).toHaveBeenCalledWith({ email: "linh@example.com" });
    expect(screen.getByRole("heading", { name: "Check your email" })).toBeInTheDocument();
    expect(screen.getByLabelText("Verification code")).toHaveAttribute(
      "autocomplete",
      "one-time-code",
    );
  });

  it("verifies an existing account then redirects", async () => {
    const user = userEvent.setup();
    mocks.requestEmailOtp.mockResolvedValue({
      challengeId: "f1bb6a0d-5e47-4a4d-93bf-6d3aebfae35a",
      resendAvailableAt: new Date(Date.now() - 1).toISOString(),
    });
    mocks.verifyEmailOtp.mockResolvedValue({ accessToken: "token", user: {} });

    renderAuthForm();
    await user.type(screen.getByPlaceholderText("Email"), "linh@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByLabelText("Verification code"), "123456");
    await user.click(screen.getByRole("button", { name: "Verify code" }));

    expect(mocks.verifyEmailOtp).toHaveBeenCalledWith({
      challengeId: "f1bb6a0d-5e47-4a4d-93bf-6d3aebfae35a",
      code: "123456",
    });
    expect(mocks.replace).toHaveBeenCalledWith("/dashboard/my-activity");
  });

  it("collects a name only after a valid code for a new account", async () => {
    const user = userEvent.setup();
    mocks.requestEmailOtp.mockResolvedValue({
      challengeId: "f1bb6a0d-5e47-4a4d-93bf-6d3aebfae35a",
      resendAvailableAt: new Date(Date.now() - 1).toISOString(),
    });
    mocks.verifyEmailOtp.mockResolvedValue({
      enrollmentToken: "enrollment-token",
      status: "profile_required",
    });
    mocks.completeEmailOtpProfile.mockResolvedValue(undefined);

    renderAuthForm();
    await user.type(screen.getByPlaceholderText("Email"), "new@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByLabelText("Verification code"), "123456");
    await user.click(screen.getByRole("button", { name: "Verify code" }));
    await user.type(screen.getByLabelText("Name"), "Linh");
    await user.click(screen.getByRole("button", { name: "Finish" }));

    expect(mocks.completeEmailOtpProfile).toHaveBeenCalledWith({
      enrollmentToken: "enrollment-token",
      name: "Linh",
    });
  });
});
