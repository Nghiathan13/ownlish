import { afterEach, describe, expect, it, vi } from "vitest";
import { isGoogleIdentityReady } from "./googleIdentity";

describe("isGoogleIdentityReady", () => {
  afterEach(() => {
    delete window.google;
  });

  it("returns false when the GIS client is missing", () => {
    expect(isGoogleIdentityReady()).toBe(false);
  });

  it("returns true when initCodeClient is available", () => {
    window.google = {
      accounts: {
        oauth2: {
          initCodeClient: vi.fn(),
        },
      },
    };

    expect(isGoogleIdentityReady()).toBe(true);
  });
});
