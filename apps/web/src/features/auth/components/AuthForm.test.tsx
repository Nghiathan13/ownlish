import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuthForm } from "@/features/auth/components/AuthForm";

const mocks = vi.hoisted(() => ({
  googleLogin: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("@/features/auth/components/GoogleSignInButton", () => ({
  GoogleSignInButton: () => <button type="button">Continue with Google</button>,
  isGoogleSignInConfigured: true,
}));

vi.mock("@/features/auth/hooks/useAuthSession", () => ({
  useAuthSession: () => ({
    googleLogin: mocks.googleLogin,
    login: mocks.login,
    register: mocks.register,
  }),
}));

describe("AuthForm", () => {
  it("signs in with email and password, with a link to create an account", async () => {
    const user = userEvent.setup();
    mocks.login.mockResolvedValue(undefined);

    render(<AuthForm />);

    expect(
      screen.getByRole("heading", { name: "Get started with Engvocab" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeInTheDocument();
    expect(screen.getByText("or")).toBeInTheDocument();
    expect(screen.getByTestId("email-icon")).toBeInTheDocument();
    expect(screen.getByTestId("password-icon")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument();
    const submitButton = screen.getByRole("button", { name: "Continue" });
    expect(submitButton).toBeDisabled();

    const email = screen.getByPlaceholderText("Email");
    const password = screen.getByPlaceholderText("Password");
    await user.type(email, "linh@example.com");
    expect(submitButton).toBeDisabled();
    await user.type(password, "test123456");
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);

    expect(email).toHaveValue("linh@example.com");
    expect(mocks.login).toHaveBeenCalledWith({
      email: "linh@example.com",
      password: "test123456",
    });
    expect(mocks.replace).toHaveBeenCalledWith("/");
  });

  it("switches to account creation without asking for a username", async () => {
    const user = userEvent.setup();
    mocks.register.mockResolvedValue(undefined);

    render(<AuthForm />);

    await user.click(screen.getByRole("button", { name: "Create account" }));
    await user.type(screen.getByPlaceholderText("Email"), "linh@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "test123456");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(mocks.register).toHaveBeenCalledWith({
      email: "linh@example.com",
      password: "test123456",
    });
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });
});
