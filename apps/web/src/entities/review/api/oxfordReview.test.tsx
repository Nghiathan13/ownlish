import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import {
  getOxfordPartReview,
  gradeOxfordReviewDefinition,
} from "@/entities/review/api/oxfordReview";
import { mswServer } from "@/shared/lib/testing/mswServer";

const URL = "http://localhost:3001/reviews/oxford/A1/parts/1";
const DEFINITION_ID = "00000000-0000-4000-8000-000000000001";

describe("Oxford part review API", () => {
  it("parses the review deck with optional progress", async () => {
    mswServer.use(
      http.get(URL, () =>
        HttpResponse.json({
          items: [
            {
              id: DEFINITION_ID,
              word: "about",
              normalizedWord: "about",
              definition: {
                id: DEFINITION_ID,
                type: "adverb",
                meaningVi: "khoảng",
                definition: null,
                example: null,
                exampleVi: null,
                ipaUk: null,
                ipaUs: null,
                band: "A1",
                source: "oxford_3000",
              },
              progress: null,
            },
          ],
          offset: 0,
          limit: 20,
        }),
      ),
    );

    await expect(getOxfordPartReview("token", "A1", 1)).resolves.toMatchObject({
      items: [{ id: DEFINITION_ID, progress: null }],
      offset: 0,
      limit: 20,
    });
  });

  it("sends only the Oxford review rating when grading", async () => {
    mswServer.use(
      http.post(`${URL}/definitions/${DEFINITION_ID}/grade`, async ({ request }) => {
        await expect(request.json()).resolves.toEqual({ rating: "EASY" });
        return HttpResponse.json({
          level: 1,
          nextReviewAt: "2026-07-26T10:00:00.000Z",
        });
      }),
    );

    await expect(
      gradeOxfordReviewDefinition("token", {
        band: "A1",
        part: 1,
        definitionId: DEFINITION_ID,
        rating: "EASY",
      }),
    ).resolves.toEqual({
      level: 1,
      nextReviewAt: "2026-07-26T10:00:00.000Z",
    });
  });
});
