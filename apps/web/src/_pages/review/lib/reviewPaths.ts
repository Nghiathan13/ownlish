import type { CollectionCategory } from "@/entities/collection";

export type ReviewLocation = {
  band: string;
  category: CollectionCategory;
  part: string;
};

export function getReviewLocation(pathname: string): ReviewLocation {
  const match = pathname.match(/^\/review\/oxford\/([^/]+)\/([^/]+)$/);

  if (match) {
    return { band: match[1], category: "oxford", part: match[2] };
  }

  return { band: "A1", category: "user", part: "part-1" };
}

export function getReviewLocationPath(location: ReviewLocation) {
  return location.category === "oxford"
    ? `/review/oxford/${location.band}/${location.part}`
    : "/review";
}

export function getReviewCategoryPath(category: CollectionCategory) {
  return category === "oxford" ? "/review/oxford/A1/part-1" : "/review";
}
