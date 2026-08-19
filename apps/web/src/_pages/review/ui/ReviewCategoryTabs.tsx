"use client";

import { usePathname } from "next/navigation";
import { OXFORD_REVIEW_PATH } from "@/features/review";
import { useT } from "@/shared/lib/providers";
import { PageHeader, PageHeaderTabs } from "@/shared/ui/page-header";
import { getReviewCategoryPath } from "../lib/reviewPaths";

export function ReviewCategoryTabs() {
  const t = useT();
  const pathname = usePathname();
  const activeCategory =
    pathname === OXFORD_REVIEW_PATH || pathname.startsWith(`${OXFORD_REVIEW_PATH}/`)
      ? "oxford"
      : "user";

  return (
    <PageHeader>
      <PageHeaderTabs
        activeKey={activeCategory}
        ariaLabel={t("collections.categoryAria")}
        items={[
          {
            href: getReviewCategoryPath("user"),
            key: "user",
            label: t("collections.myCollections"),
          },
          {
            href: getReviewCategoryPath("oxford"),
            key: "oxford",
            label: t("collections.oxford"),
          },
        ]}
      />
    </PageHeader>
  );
}
