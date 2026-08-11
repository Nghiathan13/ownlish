import { beforeEach, describe, expect, it, vi } from "vitest";

const apiRequest = vi.hoisted(() => vi.fn());
const invalidApiResponse = vi.hoisted(() => vi.fn(() => { throw new Error("invalid"); }));
vi.mock("@/shared/api/http", () => ({ apiRequest, invalidApiResponse }));

import { getDictationProgress, resetDictationProgress, submitDictationAnswer } from "./progress";

const progress = {
  videoId: "video-1", answeredSegmentIds: ["s001"], correctCount: 1,
  completedAt: null, updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("dictation progress API", () => {
  beforeEach(() => vi.resetAllMocks());

  it("parses a nullable progress response", async () => {
    apiRequest.mockResolvedValue(null);
    await expect(getDictationProgress("token", "video-1")).resolves.toBeNull();
    expect(apiRequest).toHaveBeenCalledWith("/dictation/videos/video-1/progress", { token: "token" });
  });

  it("submits segment completion and returns progress", async () => {
    apiRequest.mockResolvedValue(progress);
    await expect(submitDictationAnswer("token", { videoId: "video-1", segmentId: "s001", isCompleted: true })).resolves.toEqual(progress);
    expect(apiRequest).toHaveBeenCalledWith("/dictation/videos/video-1/answers", {
      method: "POST", token: "token", body: JSON.stringify({ segmentId: "s001", isCompleted: true }),
    });
  });

  it("resets progress and rejects an invalid answer response", async () => {
    apiRequest.mockResolvedValueOnce(undefined).mockResolvedValueOnce({ ...progress, answeredSegmentIds: [1] });
    await expect(resetDictationProgress("token", "video-1")).resolves.toBeUndefined();
    await expect(submitDictationAnswer("token", { videoId: "video-1", segmentId: "s001", isCompleted: false })).rejects.toThrow("invalid");
    expect(invalidApiResponse).toHaveBeenCalled();
  });
});
