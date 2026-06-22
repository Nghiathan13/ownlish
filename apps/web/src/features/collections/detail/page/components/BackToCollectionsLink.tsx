import Link from "next/link";
import { iconTextButtonClassName } from "@/shared/ui/button";
import { ArrowBackIcon } from "@/shared/ui/icons/ArrowBackIcon";

export function BackToCollectionsLink() {
  return (
    <div className="mb-4 shrink-0 px-4">
      <Link
        className={iconTextButtonClassName(
          "w-fit shrink-0",
          "border-foreground bg-foreground text-background",
        )}
        href="/collections"
      >
        <ArrowBackIcon />
        Back to collections
      </Link>
    </div>
  );
}
