import type { DictationSegment } from "@/entities/dictation/model/types";

export type DictationBadgeState = "idle" | "red" | "yellow" | "green";

export type DictationExpectedWord = {
  normalized: string;
  raw: string;
};

type InputToken = {
  normalized: string;
  raw: string;
};

export function normalizeDictationToken(value: string) {
  return Array.from(value.toLowerCase())
    .filter((character) => /[\p{L}\p{N}]/u.test(character))
    .join("");
}

export function getRawLetterPrefix(raw: string, letterCount: number) {
  if (letterCount <= 0) return "";

  let seen = 0;
  let result = "";

  for (const character of Array.from(raw)) {
    if (/[\p{L}\p{N}]/u.test(character)) {
      if (seen >= letterCount) break;
      seen += 1;
      result += character;
    } else if (seen > 0 && seen < letterCount) {
      result += character;
    }
  }

  return result;
}

export function getSegmentWords(segment: DictationSegment): DictationExpectedWord[] {
  return segment.text
    .trim()
    .split(/\s+/u)
    .filter(Boolean)
    .map((raw) => ({
      raw,
      normalized: normalizeDictationToken(raw),
    }))
    .filter((word) => word.normalized.length > 0);
}

function getInputTokens(input: string): InputToken[] {
  return input
    .trimStart()
    .split(/\s+/u)
    .filter(Boolean)
    .map((raw) => ({
      raw,
      normalized: normalizeDictationToken(raw),
    }))
    .filter((token) => token.normalized.length > 0);
}

/** Exclusive bounds: searchable badge indices are lo+1 .. hi-1. */
function getSearchWindow(
  tokenIndex: number,
  tokenToBadge: ReadonlyMap<number, number>,
  badgeCount: number,
) {
  let lo = -1;
  let hi = badgeCount;

  for (const [matchedTokenIndex, badgeIndex] of tokenToBadge) {
    if (matchedTokenIndex < tokenIndex) {
      lo = Math.max(lo, badgeIndex);
    }
    if (matchedTokenIndex > tokenIndex) {
      hi = Math.min(hi, badgeIndex);
    }
  }

  return { hi, lo };
}

function findExactInWindow(
  expectedWords: DictationExpectedWord[],
  normalized: string,
  lo: number,
  hi: number,
  usedBadges: ReadonlySet<number>,
) {
  for (let index = lo + 1; index < hi; index += 1) {
    if (usedBadges.has(index)) continue;
    if (expectedWords[index]?.normalized === normalized) {
      return index;
    }
  }
  return null;
}

function findPrefixInWindow(
  expectedWords: DictationExpectedWord[],
  normalized: string,
  lo: number,
  hi: number,
  usedBadges: ReadonlySet<number>,
) {
  for (let index = lo + 1; index < hi; index += 1) {
    if (usedBadges.has(index)) continue;
    if (expectedWords[index]?.normalized.startsWith(normalized)) {
      return index;
    }
  }
  return null;
}

function findFirstOpenInWindow(
  lo: number,
  hi: number,
  usedBadges: ReadonlySet<number>,
) {
  for (let index = lo + 1; index < hi; index += 1) {
    if (!usedBadges.has(index)) {
      return index;
    }
  }
  return null;
}

function matchExactTokens(
  expectedWords: DictationExpectedWord[],
  tokens: InputToken[],
) {
  const tokenToBadge = new Map<number, number>();
  const usedBadges = new Set<number>();

  let progress = true;
  while (progress) {
    progress = false;

    for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex += 1) {
      if (tokenToBadge.has(tokenIndex)) continue;

      const { hi, lo } = getSearchWindow(
        tokenIndex,
        tokenToBadge,
        expectedWords.length,
      );
      const matchIndex = findExactInWindow(
        expectedWords,
        tokens[tokenIndex]!.normalized,
        lo,
        hi,
        usedBadges,
      );

      if (matchIndex != null) {
        tokenToBadge.set(tokenIndex, matchIndex);
        usedBadges.add(matchIndex);
        progress = true;
      }
    }
  }

  return { tokenToBadge, usedBadges };
}

export function evaluateDictationTyping(
  expectedWords: DictationExpectedWord[],
  input: string,
) {
  const badgeStates: DictationBadgeState[] = expectedWords.map(() => "idle");
  const tokens = getInputTokens(input);
  const { tokenToBadge, usedBadges } = matchExactTokens(expectedWords, tokens);

  for (const badgeIndex of tokenToBadge.values()) {
    badgeStates[badgeIndex] = "green";
  }

  const yellowDrafts: {
    index: number;
    matchedLength: number;
    prefix: string;
  }[] = [];
  const wrongDrafts: { index: number; text: string }[] = [];
  const extraWrongDrafts: { afterBadgeIndex: number; text: string }[] = [];
  const claimedBadges = new Set(usedBadges);

  for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex += 1) {
    if (tokenToBadge.has(tokenIndex)) continue;

    const token = tokens[tokenIndex]!;
    const { hi, lo } = getSearchWindow(
      tokenIndex,
      tokenToBadge,
      expectedWords.length,
    );

    const prefixIndex = findPrefixInWindow(
      expectedWords,
      token.normalized,
      lo,
      hi,
      claimedBadges,
    );

    if (prefixIndex != null) {
      const expectedWord = expectedWords[prefixIndex]!;
      badgeStates[prefixIndex] = "yellow";
      claimedBadges.add(prefixIndex);
      yellowDrafts.push({
        index: prefixIndex,
        matchedLength: token.normalized.length,
        prefix: getRawLetterPrefix(expectedWord.raw, token.normalized.length),
      });
      continue;
    }

    if (hi <= lo + 1) {
      extraWrongDrafts.push({ afterBadgeIndex: lo, text: token.raw });
      continue;
    }

    const redIndex = findFirstOpenInWindow(lo, hi, claimedBadges);
    if (redIndex != null) {
      badgeStates[redIndex] = "red";
      claimedBadges.add(redIndex);
      wrongDrafts.push({ index: redIndex, text: token.raw });
    }
  }

  const allMatched =
    expectedWords.length > 0 && usedBadges.size === expectedWords.length;

  return { allMatched, badgeStates, extraWrongDrafts, wrongDrafts, yellowDrafts };
}
