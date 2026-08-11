import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequireAdmin } from "./RequireAdmin";
import { RequireAuth } from "./RequireAuth";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  useAuthSession: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mocks.usePathname,
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("@/entities/session", () => ({
  isLoadingStatus: (status: string) => status === "loading",
  useAuthSession: mocks.useAuthSession,
  useAuthSessionContext: mocks.useAuthSession,
}));

describe("auth route guards", () => {
  beforeEach(() => {
    mocks.replace.mockReset();
    mocks.usePathname.mockReturnValue("/review");
    window.history.replaceState({}, "", "/review?part=1");
  });

  it("shows a loading skeleton while an auth session is loading", () => {
    mocks.useAuthSession.mockReturnValue({ status: "loading" });

    render(<RequireAuth><div>Protected content</div></RequireAuth>);

    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
    expect(document.querySelectorAll("[class*='animate-pulse']").length).toBeGreaterThan(0);
  });

  it("redirects a guest to login with the current path and query", async () => {
    mocks.useAuthSession.mockReturnValue({ status: "guest" });

    render(<RequireAuth><div>Protected content</div></RequireAuth>);

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith("/login?redirect=%2Freview%3Fpart%3D1");
    });
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders protected children for an authenticated user", () => {
    mocks.useAuthSession.mockReturnValue({ status: "authenticated" });

    render(<RequireAuth><div>Protected content</div></RequireAuth>);

    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("renders an access-denied state for an authenticated non-admin", () => {
    mocks.useAuthSession.mockReturnValue({
      status: "authenticated",
      user: { role: "USER" },
    });

    render(<RequireAdmin><div>Admin content</div></RequireAdmin>);

    expect(screen.getByRole("heading", { name: "Access denied" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to dashboard" })).toHaveAttribute("href", "/dashboard/my-activity");
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });

  it("renders admin children and redirects admin guests", async () => {
    mocks.useAuthSession.mockReturnValue({
      status: "authenticated",
      user: { role: "ADMIN" },
    });
    const { rerender } = render(<RequireAdmin><div>Admin content</div></RequireAdmin>);
    expect(screen.getByText("Admin content")).toBeInTheDocument();

    mocks.useAuthSession.mockReturnValue({ status: "guest" });
    rerender(<RequireAdmin><div>Admin content</div></RequireAdmin>);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalled());
  });
});
