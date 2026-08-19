import { describe, expect, it } from "vitest";
import {
  getDictationProgressQueryKey,
  getDictationVideoQueryKey,
} from "./queries";

describe("dictation study query helpers", () => {
  it("builds stable video and progress query keys", () => {
    expect(getDictationVideoQueryKey("video-1")).toEqual(["dictation", "video", "video-1"]);
    expect(getDictationProgressQueryKey("user-1", "video-1")).toEqual([
      "dictation",
      "progress",
      "user-1",
      "video-1",
    ]);
  });
});
