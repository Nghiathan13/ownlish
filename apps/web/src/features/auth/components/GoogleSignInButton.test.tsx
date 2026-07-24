import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  initCodeClient: vi.fn(),
  requestCode: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: () => <span data-testid="google-logo" />,
}));

vi.mock("next/script", () => ({
  default: () => null,
}));

describe("GoogleSignInButton", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "google-client-id");
    vi.clearAllMocks();
    mocks.initCodeClient.mockReturnValue({ requestCode: mocks.requestCode });
    window.google = {
      accounts: {
        oauth2: {
          initCodeClient: mocks.initCodeClient,
        },
      },
    };
  });

  it("uses a custom button to request and forward an authorization code", async () => {
    const user = userEvent.setup();
    const onCode = vi.fn();
    const onError = vi.fn();
    const [{ GoogleSignInButton }, { LocaleProvider }] = await Promise.all([
      import("@/features/auth/components/GoogleSignInButton"),
      import("@/shared/providers/LocaleProvider"),
    ]);

    render(
      <LocaleProvider>
        <GoogleSignInButton onCode={onCode} onError={onError} />
      </LocaleProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    expect(mocks.requestCode).toHaveBeenCalledTimes(1);

    const config = mocks.initCodeClient.mock.calls[0]?.[0] as {
      callback: (response: { code?: string }) => void;
      scope: string;
      ux_mode: string;
    };
    config.callback({ code: "authorization-code" });

    expect(onCode).toHaveBeenCalledWith("authorization-code");
    expect(config.scope).toBe("openid email profile");
    expect(config.ux_mode).toBe("popup");
  });
});
