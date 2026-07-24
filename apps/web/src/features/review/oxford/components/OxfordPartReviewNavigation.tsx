import {
  OXFORD_GROUP_SIZE,
  type OxfordBand,
} from "@/features/collections/oxford/lib/oxfordNavigation";
import { ReviewSideNavigation } from "@/features/review/components/ReviewSideNavigation";

type OxfordPartReviewNavigationProps = {
  activeBand: OxfordBand;
  activePart: number;
  itemCount: number | null;
  loading?: boolean;
};

function getReviewPath(band: OxfordBand, part: number) {
  return `/review/oxford/${band}/part-${part}`;
}

export function OxfordPartReviewNavigation({
  activeBand,
  activePart,
  itemCount,
  loading = false,
}: OxfordPartReviewNavigationProps) {
  const partCount = itemCount === null ? 0 : Math.ceil(itemCount / OXFORD_GROUP_SIZE);

  return (
    <ReviewSideNavigation
      ariaLabel="Oxford review parts"
      emptyLabel="No parts"
      items={Array.from({ length: partCount }, (_, index) => {
        const part = index + 1;

        return {
          id: String(part),
          href: getReviewPath(activeBand, part),
          isActive: part === activePart,
          label: `Part ${part}`,
        };
      })}
      loading={loading}
      scrollKey={activeBand}
    />
  );
}
