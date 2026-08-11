import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  initCodeClient: vi.fn(),
  isGoogleSignInConfigured: true,
  requestCode: vi.fn(),
}));

vi.mock("../config/googleSignIn", () => ({
  GOOGLE_CLIENT_ID: "google-client-id",
  get isGoogleSignInConfigured() {
    return mocks.isGoogleSignInConfigured;
  },
}));

import { useGoogleCodeClient } from "./useGoogleCodeClient";

type ClientConfig = {
  callback: (response: { code?: string }) => void;
  error_callback: () => void;
};

describe("useGoogleCodeClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isGoogleSignInConfigured = true;
    mocks.initCodeClient.mockReturnValue({ requestCode: mocks.requestCode });
    window.google = {
      accounts: {
        oauth2: {
          initCodeClient: mocks.initCodeClient,
        },
      },
    };
  });

  it("initializes the GIS client when the script is ready and forwards codes", () => {
    const onCode = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useGoogleCodeClient({
        errorMessage: "Google failed",
        onCode,
        onError,
      }),
    );

    expect(result.current.isConfigured).toBe(true);
    expect(result.current.isScriptReady).toBe(true);
    expect(mocks.initCodeClient).toHaveBeenCalledTimes(1);

    const config = mocks.initCodeClient.mock.calls[0]?.[0] as ClientConfig;
    act(() => {
      config.callback({ code: "auth-code" });
    });
    expect(onCode).toHaveBeenCalledWith("auth-code");

    act(() => {
      result.current.requestCode();
    });
    expect(mocks.requestCode).toHaveBeenCalled();
  });

  it("ignores empty codes and callbacks while disabled", () => {
    const onCode = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useGoogleCodeClient({
        disabled: true,
        errorMessage: "Google failed",
        onCode,
        onError,
      }),
    );

    const config = mocks.initCodeClient.mock.calls[0]?.[0] as ClientConfig;
    act(() => {
      config.callback({});
      config.callback({ code: "auth-code" });
      config.error_callback();
    });

    expect(onCode).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.isScriptReady).toBe(true);
  });

  it("forwards GIS errors when enabled", () => {
    const onError = vi.fn();

    renderHook(() =>
      useGoogleCodeClient({
        errorMessage: "Google failed",
        onCode: vi.fn(),
        onError,
      }),
    );

    const config = mocks.initCodeClient.mock.calls[0]?.[0] as ClientConfig;
    act(() => {
      config.error_callback();
    });

    expect(onError).toHaveBeenCalledWith("Google failed");
  });

  it("marks the script ready after GIS becomes available", () => {
    delete window.google;

    const { result } = renderHook(() =>
      useGoogleCodeClient({
        errorMessage: "Google failed",
        onCode: vi.fn(),
        onError: vi.fn(),
      }),
    );

    expect(result.current.isScriptReady).toBe(false);
    expect(mocks.initCodeClient).not.toHaveBeenCalled();

    window.google = {
      accounts: {
        oauth2: {
          initCodeClient: mocks.initCodeClient,
        },
      },
    };

    act(() => {
      result.current.markScriptReady();
    });

    expect(result.current.isScriptReady).toBe(true);
    expect(mocks.initCodeClient).toHaveBeenCalled();
  });
});
