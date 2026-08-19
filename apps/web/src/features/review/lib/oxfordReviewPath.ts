import {
  DEFAULT_OXFORD_BAND,
  parseOxfordBand,
  parseOxfordGroup,
  parseOxfordGroupParam,
  type OxfordBand,
} from "@/entities/collection";

export const OXFORD_REVIEW_PATH = "/review/oxford";
export const DEFAULT_OXFORD_REVIEW_GROUP = 1;

export function getOxfordReviewPath(band: OxfordBand, group: number) {
  const params = new URLSearchParams({
    band,
    group: String(group),
  });

  return `${OXFORD_REVIEW_PATH}?${params.toString()}`;
}

export function getOxfordReviewPathRedirectTarget(searchParams: {
  get: (key: string) => string | null;
}) {
  const band = parseOxfordBand(searchParams.get("band"));
  const group = parseOxfordGroupParam(searchParams.get("group"));

  if (band == null || group == null) {
    return getOxfordReviewPath(
      band ?? DEFAULT_OXFORD_BAND,
      group ?? DEFAULT_OXFORD_REVIEW_GROUP,
    );
  }

  return null;
}

export function getOxfordReviewLegacyPathRedirect(
  band: string,
  part?: string,
) {
  return getOxfordReviewPath(
    parseOxfordBand(band) ?? DEFAULT_OXFORD_BAND,
    parseOxfordGroup(part ?? null) ?? DEFAULT_OXFORD_REVIEW_GROUP,
  );
}
