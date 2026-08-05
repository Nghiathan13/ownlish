import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { getDifficultReviewWords } from "@/entities/review/api/difficultReviewWords";
import { mswServer } from "@/shared/lib/testing/mswServer";

describe("difficult review words API", () => {
  it("requests collection words by default", async () => {
    mswServer.use(
      http.get("http://localhost:3001/reviews/difficult-words", ({ request }) => {
        const source = new URL(request.url).searchParams.get("source");
        expect(source).toBe("collection");
        return HttpResponse.json([
          { word: "difficult", collectionName: "My Vocabulary", wrongCount: 6 },
        ]);
      }),
    );

    await expect(getDifficultReviewWords("token")).resolves.toEqual([
      { word: "difficult", collectionName: "My Vocabulary", wrongCount: 6 },
    ]);
  });

  it("requests Oxford words when source is oxford", async () => {
    mswServer.use(
      http.get("http://localhost:3001/reviews/difficult-words", ({ request }) => {
        const source = new URL(request.url).searchParams.get("source");
        expect(source).toBe("oxford");
        return HttpResponse.json([
          { word: "hard", collectionName: "Oxford", wrongCount: 4 },
        ]);
      }),
    );

    await expect(
      getDifficultReviewWords("token", { source: "oxford" }),
    ).resolves.toEqual([
      { word: "hard", collectionName: "Oxford", wrongCount: 4 },
    ]);
  });
});
