import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/providers/LocaleProvider";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParamsGet: vi.fn(),
  useAuthSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => ({ get: mocks.searchParamsGet }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/features/auth", () => ({
  AuthForm: ({ redirectTo }: { redirectTo?: string }) => (
    <div data-testid="auth-form">{redirectTo}</div>
  ),
  getSafeAuthRedirectPath: (value: string | null) => {
    if (!value || !value.startsWith("/") || value.startsWith("//")) {
      return "/dashboard/my-activity";
    }
    if (value === "/login" || value.startsWith("/login?")) {
      return "/dashboard/my-activity";
    }
    return value;
  },
  isAuthenticatedStatus: (status: string) => status === "authenticated",
  isLoadingStatus: (status: string) => status === "loading",
  useAuthSession: mocks.useAuthSession,
}));

vi.mock("@/shared/skeletons", () => ({
  SessionLoadingSkeleton: ({ centered }: { centered?: boolean }) => (
    <div data-testid="session-loading">
      {centered ? "centered" : "default"}
    </div>
  ),
}));
import { LoginPage } from "./LoginPage";

function renderLoginPage() {
  return render(
    <LocaleProvider>
      <LoginPage />
    </LocaleProvider>,
  );
}

describe("login page", () => {
  beforeEach(() => {
    mocks.replace.mockReset();
    mocks.searchParamsGet.mockReset();
    mocks.useAuthSession.mockReset();
    mocks.searchParamsGet.mockReturnValue(null);
  });

  it("shows a centered loading skeleton while the session is restoring", () => {
    mocks.useAuthSession.mockReturnValue({ status: "loading" });

    renderLoginPage();

    expect(screen.getByTestId("session-loading")).toHaveTextContent("centered");
    expect(screen.queryByTestId("auth-form")).not.toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("redirects authenticated users to the default dashboard path", async () => {
    mocks.useAuthSession.mockReturnValue({ status: "authenticated" });

    renderLoginPage();

    expect(screen.getByTestId("session-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("auth-form")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith("/dashboard/my-activity");
    });
  });

  it("redirects authenticated users to a safe redirect query target", async () => {
    mocks.useAuthSession.mockReturnValue({ status: "authenticated" });
    mocks.searchParamsGet.mockReturnValue("/review?part=1");

    renderLoginPage();

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith("/review?part=1");
    });
  });

  it("renders the guest login shell with the auth form", () => {
    mocks.useAuthSession.mockReturnValue({ status: "guest" });
    mocks.searchParamsGet.mockReturnValue("/collections/user");

    renderLoginPage();

    expect(screen.getByRole("link", { name: /Back to home/i })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByTestId("auth-form")).toHaveTextContent(
      "/collections/user",
    );
    expect(screen.queryByTestId("session-loading")).not.toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("falls back to the dashboard when the redirect query is unsafe", () => {
    mocks.useAuthSession.mockReturnValue({ status: "guest" });
    mocks.searchParamsGet.mockReturnValue("//evil.example");

    renderLoginPage();

    expect(screen.getByTestId("auth-form")).toHaveTextContent(
      "/dashboard/my-activity",
    );
  });
});
