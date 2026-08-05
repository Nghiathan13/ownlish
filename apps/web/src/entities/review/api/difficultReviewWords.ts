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

export type DifficultReviewWordsSource = "collection" | "oxford";

export function getDifficultReviewWords(
  token: string,
  options: {
    signal?: AbortSignal;
    source?: DifficultReviewWordsSource;
  } = {},
) {
  const source = options.source ?? "collection";
  const search = new URLSearchParams({ source });

  return apiRequest(`/reviews/difficult-words?${search.toString()}`, {
    signal: options.signal,
    token,
  }).then((body) => {
    if (!Array.isArray(body)) invalidApiResponse();
    return body.map(parseDifficultReviewWord);
  });
}
