import type { CollectionCategory, OxfordBand } from "@/entities/collection";
import {
  DEFAULT_OXFORD_BAND,
  parseOxfordBand,
  parseOxfordGroupParam,
} from "@/entities/collection";
import {
  DEFAULT_OXFORD_REVIEW_GROUP,
  getOxfordReviewPath,
  OXFORD_REVIEW_PATH,
} from "@/features/review";

export type ReviewLocation = {
  band: OxfordBand;
  category: CollectionCategory;
  group: number;
};

export function getReviewLocation(
  pathname: string,
  searchParams: Pick<URLSearchParams, "get"> = new URLSearchParams(),
): ReviewLocation {
  if (pathname === OXFORD_REVIEW_PATH) {
    return {
      band: parseOxfordBand(searchParams.get("band")) ?? DEFAULT_OXFORD_BAND,
      category: "oxford",
      group:
        parseOxfordGroupParam(searchParams.get("group")) ??
        DEFAULT_OXFORD_REVIEW_GROUP,
    };
  }

  return {
    band: DEFAULT_OXFORD_BAND,
    category: "user",
    group: DEFAULT_OXFORD_REVIEW_GROUP,
  };
}

export function getReviewLocationPath(location: ReviewLocation) {
  return location.category === "oxford"
    ? getOxfordReviewPath(location.band, location.group)
    : "/review";
}

export function getReviewCategoryPath(category: CollectionCategory) {
  return category === "oxford"
    ? getOxfordReviewPath(DEFAULT_OXFORD_BAND, DEFAULT_OXFORD_REVIEW_GROUP)
    : "/review";
}
