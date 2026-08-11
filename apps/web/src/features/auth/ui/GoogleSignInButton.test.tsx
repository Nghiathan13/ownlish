import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  initCodeClient: vi.fn(),
  requestCode: vi.fn(),
  scriptOnLoad: null as null | (() => void),
  scriptOnReady: null as null | (() => void),
}));

vi.mock("next/image", () => ({
  default: () => <span data-testid="google-logo" />,
}));

vi.mock("next/script", () => ({
  default: ({
    onLoad,
    onReady,
  }: {
    onLoad?: () => void;
    onReady?: () => void;
  }) => {
    mocks.scriptOnLoad = onLoad ?? null;
    mocks.scriptOnReady = onReady ?? null;
    return null;
  },
}));

type GoogleClientConfig = {
  callback: (response: { code?: string }) => void;
  error_callback: () => void;
  scope: string;
  ux_mode: string;
};

async function loadGoogleSignInButton() {
  const [{ GoogleSignInButton, isGoogleSignInConfigured }, { LocaleProvider }] =
    await Promise.all([
      import("./GoogleSignInButton"),
      import("@/shared/providers/LocaleProvider"),
    ]);

  return { GoogleSignInButton, isGoogleSignInConfigured, LocaleProvider };
}

function installGoogleIdentity() {
  window.google = {
    accounts: {
      oauth2: {
        initCodeClient: mocks.initCodeClient,
      },
    },
  };
}

function getClientConfig(): GoogleClientConfig {
  return mocks.initCodeClient.mock.calls[0]?.[0] as GoogleClientConfig;
}

describe("GoogleSignInButton", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "google-client-id");
    vi.clearAllMocks();
    mocks.scriptOnLoad = null;
    mocks.scriptOnReady = null;
    mocks.initCodeClient.mockReturnValue({ requestCode: mocks.requestCode });
    installGoogleIdentity();
  });

  it("uses a custom button to request and forward an authorization code", async () => {
    const user = userEvent.setup();
    const onCode = vi.fn();
    const onError = vi.fn();
    const { GoogleSignInButton, LocaleProvider } =
      await loadGoogleSignInButton();

    render(
      <LocaleProvider>
        <GoogleSignInButton onCode={onCode} onError={onError} />
      </LocaleProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    expect(mocks.requestCode).toHaveBeenCalledTimes(1);

    const config = getClientConfig();
    config.callback({ code: "authorization-code" });

    expect(onCode).toHaveBeenCalledWith("authorization-code");
    expect(config.scope).toBe("openid email profile");
    expect(config.ux_mode).toBe("popup");
  });

  it("renders nothing when Google sign-in is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "");
    const { GoogleSignInButton, isGoogleSignInConfigured, LocaleProvider } =
      await loadGoogleSignInButton();

    expect(isGoogleSignInConfigured).toBe(false);

    const { container } = render(
      <LocaleProvider>
        <GoogleSignInButton onCode={vi.fn()} onError={vi.fn()} />
      </LocaleProvider>,
    );

    expect(container).toBeEmptyDOMElement();
    expect(mocks.initCodeClient).not.toHaveBeenCalled();
  });

  it("stays disabled until the Google Identity script is ready", async () => {
    delete window.google;
    const { GoogleSignInButton, LocaleProvider } =
      await loadGoogleSignInButton();

    render(
      <LocaleProvider>
        <GoogleSignInButton onCode={vi.fn()} onError={vi.fn()} />
      </LocaleProvider>,
    );

    const loadingButton = screen.getByRole("button", {
      name: "Loading Google...",
    });
    expect(loadingButton).toBeDisabled();
    expect(mocks.initCodeClient).not.toHaveBeenCalled();

    installGoogleIdentity();
    mocks.scriptOnLoad?.();

    expect(
      await screen.findByRole("button", { name: "Continue with Google" }),
    ).toBeEnabled();
    await waitFor(() => {
      expect(mocks.initCodeClient).toHaveBeenCalledTimes(1);
    });
  });

  it("ignores GIS callbacks without an authorization code", async () => {
    const onCode = vi.fn();
    const { GoogleSignInButton, LocaleProvider } =
      await loadGoogleSignInButton();

    render(
      <LocaleProvider>
        <GoogleSignInButton onCode={onCode} onError={vi.fn()} />
      </LocaleProvider>,
    );

    getClientConfig().callback({});
    expect(onCode).not.toHaveBeenCalled();
  });

  it("ignores GIS success callbacks while the button is disabled", async () => {
    const onCode = vi.fn();
    const { GoogleSignInButton, LocaleProvider } =
      await loadGoogleSignInButton();

    render(
      <LocaleProvider>
        <GoogleSignInButton disabled onCode={onCode} onError={vi.fn()} />
      </LocaleProvider>,
    );

    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeDisabled();

    getClientConfig().callback({ code: "authorization-code" });
    expect(onCode).not.toHaveBeenCalled();
  });

  it("forwards GIS errors through onError", async () => {
    const onError = vi.fn();
    const { GoogleSignInButton, LocaleProvider } =
      await loadGoogleSignInButton();

    render(
      <LocaleProvider>
        <GoogleSignInButton onCode={vi.fn()} onError={onError} />
      </LocaleProvider>,
    );

    getClientConfig().error_callback();

    expect(onError).toHaveBeenCalledWith(
      "Google sign-in could not be completed. Please try again.",
    );
  });

  it("swallows GIS errors while the button is disabled", async () => {
    const onError = vi.fn();
    const { GoogleSignInButton, LocaleProvider } =
      await loadGoogleSignInButton();

    render(
      <LocaleProvider>
        <GoogleSignInButton disabled onCode={vi.fn()} onError={onError} />
      </LocaleProvider>,
    );

    getClientConfig().error_callback();
    expect(onError).not.toHaveBeenCalled();
  });

  it("marks the script ready from onReady as well as onLoad", async () => {
    delete window.google;
    const { GoogleSignInButton, LocaleProvider } =
      await loadGoogleSignInButton();

    render(
      <LocaleProvider>
        <GoogleSignInButton onCode={vi.fn()} onError={vi.fn()} />
      </LocaleProvider>,
    );

    expect(
      screen.getByRole("button", { name: "Loading Google..." }),
    ).toBeDisabled();

    installGoogleIdentity();
    mocks.scriptOnReady?.();

    expect(
      await screen.findByRole("button", { name: "Continue with Google" }),
    ).toBeEnabled();
  });
});
