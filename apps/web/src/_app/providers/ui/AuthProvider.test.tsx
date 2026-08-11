import { render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@/entities/auth";
import { useAuthSessionContext } from "@/entities/session";
import { AuthProvider } from "./AuthProvider";

const mocks = vi.hoisted(() => ({
  useAuthSessionActions: vi.fn(),
  useAuthSessionBootstrap: vi.fn(),
}));

vi.mock("@/entities/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/session")>()),
  useAuthSessionBootstrap: mocks.useAuthSessionBootstrap,
}));

vi.mock("@/features/auth", () => ({
  useAuthSessionActions: mocks.useAuthSessionActions,
}));

const user: AuthUser = {
  avatarUrl: null,
  email: "linh@example.com",
  id: "user-1",
  name: "Linh Nguyen",
  role: "USER",
};

const actions = {
  completeEmailOtpProfile: vi.fn(),
  googleLogin: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  updateProfile: vi.fn(),
  verifyEmailOtp: vi.fn(),
};

function SessionState() {
  const { logout, status, user: sessionUser } = useAuthSessionContext();

  return (
    <>
      <p>{`${status}:${sessionUser?.id ?? "none"}`}</p>
      <button type="button" onClick={() => void logout()}>
        Logout
      </button>
    </>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuthSessionActions.mockReturnValue(actions);
    mocks.useAuthSessionBootstrap.mockImplementation(({ setStatus, setUser }) => {
      useEffect(() => {
        setStatus("authenticated");
        setUser(user);
      }, [setStatus, setUser]);
    });
  });

  it("combines the public auth hooks into the session context", () => {
    render(
      <AuthProvider>
        <SessionState />
      </AuthProvider>,
    );

    expect(screen.getByText("authenticated:user-1")).toBeInTheDocument();
    expect(mocks.useAuthSessionBootstrap).toHaveBeenCalled();
    expect(mocks.useAuthSessionActions).toHaveBeenCalled();
    expect(
      mocks.useAuthSessionBootstrap.mock.calls[0]?.[0].sessionChannelRef,
    ).toBe(mocks.useAuthSessionActions.mock.calls[0]?.[0].sessionChannelRef);
  });

  it("exposes actions supplied by the auth feature", () => {
    render(
      <AuthProvider>
        <SessionState />
      </AuthProvider>,
    );

    screen.getByRole("button", { name: "Logout" }).click();

    expect(actions.logout).toHaveBeenCalledTimes(1);
  });
});
