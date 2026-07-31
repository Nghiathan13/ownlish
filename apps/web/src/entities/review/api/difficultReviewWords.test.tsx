import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { getDifficultReviewWords } from "@/entities/review/api/difficultReviewWords";
import { mswServer } from "@/shared/lib/testing/mswServer";

describe("difficult review words API", () => {
  it("parses words from user collections and Oxford", async () => {
    mswServer.use(
      http.get("http://localhost:3001/reviews/difficult-words", () =>
        HttpResponse.json([
          { word: "difficult", collectionName: "My Vocabulary", wrongCount: 6 },
          { word: "hard", collectionName: "Oxford", wrongCount: 4 },
        ]),
      ),
    );

    await expect(getDifficultReviewWords("token")).resolves.toEqual([
      { word: "difficult", collectionName: "My Vocabulary", wrongCount: 6 },
      { word: "hard", collectionName: "Oxford", wrongCount: 4 },
    ]);
  });
});
