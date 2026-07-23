import Link from "next/link";
import { getCollectionsListPath } from "@/entities/collection/lib/collectionDisplay";
import { iconTextButtonClassName } from "@/shared/ui/button";
import { ArrowBackIcon } from "@/shared/ui/icons/ArrowBackIcon";

export function BackToCollectionsLink() {
  return (
    <Link
      aria-label="Back to My Collections"
      className={iconTextButtonClassName(
        "w-fit shrink-0",
        "border-foreground bg-foreground text-background",
      )}
      href={getCollectionsListPath("user")}
    >
      <ArrowBackIcon />
      Back
    </Link>
  );
}
