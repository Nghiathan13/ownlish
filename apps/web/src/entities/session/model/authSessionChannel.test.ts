import { describe, expect, it } from "vitest";
import {
  createAuthSessionChannel,
  isAuthSessionMessage,
} from "./authSessionChannel";

describe("isAuthSessionMessage", () => {
  it("accepts known session messages", () => {
    expect(isAuthSessionMessage({ type: "session-changed" })).toBe(true);
    expect(isAuthSessionMessage({ type: "session-signed-out" })).toBe(true);
  });

  it("rejects malformed payloads", () => {
    expect(isAuthSessionMessage(null)).toBe(false);
    expect(isAuthSessionMessage("session-changed")).toBe(false);
    expect(isAuthSessionMessage({ type: "session-refreshed" })).toBe(false);
  });
});

describe("createAuthSessionChannel", () => {
  it("returns null when BroadcastChannel is unavailable", () => {
    const original = globalThis.BroadcastChannel;
    // @ts-expect-error intentional for test
    delete globalThis.BroadcastChannel;

    expect(createAuthSessionChannel()).toBeNull();

    globalThis.BroadcastChannel = original;
  });
});
