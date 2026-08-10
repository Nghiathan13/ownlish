import { beforeEach, describe, expect, it, vi } from "vitest";

const apiRequest = vi.hoisted(() => vi.fn());
const invalidApiResponse = vi.hoisted(() => vi.fn(() => { throw new Error("invalid"); }));
vi.mock("@/shared/api/http", () => ({ apiRequest, invalidApiResponse }));

import { getLearningActivityCalendar, submitLearningActivityCheckpoint } from "./learningActivity";

describe("learning activity API", () => {
  beforeEach(() => vi.resetAllMocks());

  it("parses calendar entries and sends the checkpoint payload", async () => {
    apiRequest
      .mockResolvedValueOnce({ days: [{ activityType: "VOCABULARY_REVIEW", learnedOn: "2026-01-01", seconds: 60 }] })
      .mockResolvedValueOnce({ acceptedSeconds: 60 });

    await expect(getLearningActivityCalendar("token")).resolves.toEqual({
      days: [{ activityType: "VOCABULARY_REVIEW", learnedOn: "2026-01-01", seconds: 60 }],
    });
    await expect(submitLearningActivityCheckpoint("token", { activityType: "VOCABULARY_REVIEW", elapsedSeconds: 60, kind: "heartbeat" })).resolves.toEqual({ acceptedSeconds: 60 });
    expect(apiRequest).toHaveBeenLastCalledWith("/learning-activity/checkpoints", {
      method: "POST", token: "token", body: JSON.stringify({ activityType: "VOCABULARY_REVIEW", elapsedSeconds: 60, kind: "heartbeat" }),
    });
  });

  it("rejects malformed calendar values", async () => {
    apiRequest.mockResolvedValue({ days: [{ activityType: "VOCABULARY_REVIEW", learnedOn: "2026-01-01", seconds: "60" }] });
    await expect(getLearningActivityCalendar("token")).rejects.toThrow("invalid");
    expect(invalidApiResponse).toHaveBeenCalled();
  });
});
