import { beforeEach, describe, expect, it } from "vitest";
import {
  getMockFinishOutboxStorageKey,
  readMockFinishCommand,
  removeMockFinishCommand,
  storeMockFinishCommand,
} from "@/features/tests/run/model/mock/mockFinishOutbox";

const SESSION_ID = "00000000-0000-4000-8000-000000000001";
const OTHER_SESSION_ID = "00000000-0000-4000-8000-000000000002";

describe("mockFinishOutbox", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores only the finish command for its session", () => {
    storeMockFinishCommand(SESSION_ID);

    expect(readMockFinishCommand(SESSION_ID)).toEqual({
      type: "finish_mock",
      sessionId: SESSION_ID,
    });
    expect(
      JSON.parse(
        window.localStorage.getItem(
          getMockFinishOutboxStorageKey(SESSION_ID),
        ) ?? "null",
      ),
    ).toEqual({
      type: "finish_mock",
      sessionId: SESSION_ID,
    });
  });

  it("removes only the acknowledged session command", () => {
    storeMockFinishCommand(SESSION_ID);
    storeMockFinishCommand(OTHER_SESSION_ID);

    removeMockFinishCommand(SESSION_ID);

    expect(readMockFinishCommand(SESSION_ID)).toBeNull();
    expect(readMockFinishCommand(OTHER_SESSION_ID)).toEqual({
      type: "finish_mock",
      sessionId: OTHER_SESSION_ID,
    });
  });

  it("ignores malformed or mismatched stored commands", () => {
    window.localStorage.setItem(
      getMockFinishOutboxStorageKey(SESSION_ID),
      JSON.stringify({ type: "finish_mock", sessionId: OTHER_SESSION_ID }),
    );

    expect(readMockFinishCommand(SESSION_ID)).toBeNull();

    window.localStorage.setItem(
      getMockFinishOutboxStorageKey(SESSION_ID),
      "not-json",
    );

    expect(readMockFinishCommand(SESSION_ID)).toBeNull();
  });
});
