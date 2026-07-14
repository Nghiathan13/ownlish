import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { finishToeicRun } from "@/entities/toeic/api/toeic";
import { mswServer } from "@/shared/lib/testing/mswServer";

const SESSION_ID = "00000000-0000-4000-8000-000000000001";
const FINISH_URL = `http://localhost:3001/tests/runs/${SESSION_ID}/finish`;

describe("finishToeicRun", () => {
  it.each(["accepted", "completed"] as const)(
    "parses the %s acknowledgement",
    async (status) => {
      mswServer.use(
        http.patch(FINISH_URL, () => HttpResponse.json({ status })),
      );

      await expect(finishToeicRun("token", SESSION_ID)).resolves.toEqual({
        status,
      });
    },
  );

  it("rejects an unknown acknowledgement", async () => {
    mswServer.use(
      http.patch(FINISH_URL, () =>
        HttpResponse.json({ status: "finished" }),
      ),
    );

    await expect(finishToeicRun("token", SESSION_ID)).rejects.toThrow(
      "Invalid server response.",
    );
  });
});
