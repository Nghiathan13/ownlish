import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  LEARNING_ACTIVITY_TYPES,
  type LearningActivityCheckpointKind,
  type LearningActivityType,
} from "@/entities/learning-activity";
import { useLearningActivityTracker } from "./useLearningActivityTracker";

const mocks = vi.hoisted(() => ({
  keepalive: vi.fn(),
  submit: vi.fn(),
}));

vi.mock("@/entities/learning-activity", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/learning-activity")>()),
  submitLearningActivityCheckpoint: mocks.submit,
  submitLearningActivityCheckpointKeepalive: mocks.keepalive,
}));

vi.mock("@/entities/session/model/accessTokenStore", () => ({
  getStoredAccessToken: () => "token",
}));

vi.mock("@/entities/session/model/authenticatedRequest", () => ({
  runAuthenticatedRequest: ({
    request,
  }: {
    request: (token: string) => Promise<unknown>;
  }) => request("token"),
}));

function renderTracker(
  activityType: LearningActivityType = LEARNING_ACTIVITY_TYPES.TEST_PRACTICE,
  enabled = true,
) {
  return renderHook((props: { activityType: LearningActivityType; enabled: boolean }) => {
    useLearningActivityTracker(props);
  }, { initialProps: { activityType, enabled } });
}

describe("useLearningActivityTracker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-30T10:00:00.000Z"));
    vi.spyOn(document, "hasFocus").mockReturnValue(true);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    mocks.keepalive.mockReset();
    mocks.submit.mockReset();
    mocks.submit.mockResolvedValue({ acceptedSeconds: 60 });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("sends a heartbeat after 60 active seconds", async () => {
    renderTracker();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(mocks.submit).toHaveBeenCalledWith("token", {
      activityType: LEARNING_ACTIVITY_TYPES.TEST_PRACTICE,
      elapsedSeconds: 60,
      kind: "heartbeat" satisfies LearningActivityCheckpointKind,
    });
  });

  it("flushes the active interval and stops when the window loses focus", async () => {
    renderTracker(LEARNING_ACTIVITY_TYPES.TEST_REVIEW_WRONG);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(12_000);
      window.dispatchEvent(new Event("blur"));
    });

    expect(mocks.keepalive).toHaveBeenCalledWith("token", {
      activityType: LEARNING_ACTIVITY_TYPES.TEST_REVIEW_WRONG,
      elapsedSeconds: 12,
      kind: "flush" satisfies LearningActivityCheckpointKind,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it("does not start until the practice material is ready", async () => {
    const tracker = renderTracker(LEARNING_ACTIVITY_TYPES.TEST_PRACTICE, false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(mocks.submit).not.toHaveBeenCalled();

    tracker.rerender({
      activityType: LEARNING_ACTIVITY_TYPES.TEST_PRACTICE,
      enabled: true,
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(mocks.submit).toHaveBeenCalledTimes(1);
  });
});
