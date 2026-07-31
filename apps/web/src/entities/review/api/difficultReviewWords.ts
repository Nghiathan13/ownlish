import { apiRequest, invalidApiResponse } from "@/shared/api/http";
import { isNumber, isRecord, isString } from "@/shared/lib/parse";

export type DifficultReviewWord = {
  collectionName: string;
  word: string;
  wrongCount: number;
};

function parseDifficultReviewWord(body: unknown): DifficultReviewWord {
  if (!isRecord(body)) invalidApiResponse();

  const { collectionName, word, wrongCount } = body;
  if (!isString(collectionName) || !isString(word) || !isNumber(wrongCount)) {
    invalidApiResponse();
  }

  return { collectionName, word, wrongCount };
}

export function getDifficultReviewWords(
  token: string,
  options: { signal?: AbortSignal } = {},
) {
  return apiRequest("/reviews/difficult-words", {
    signal: options.signal,
    token,
  }).then((body) => {
    if (!Array.isArray(body)) invalidApiResponse();
    return body.map(parseDifficultReviewWord);
  });
}
