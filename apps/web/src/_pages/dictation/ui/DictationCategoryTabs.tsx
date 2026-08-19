"use client";

import {
  DICTATION_CATEGORIES,
  getDictationCategoryPath,
} from "@/entities/dictation-library";
import { useT } from "@/shared/lib/providers";
import { PageHeader, PageHeaderTabs } from "@/shared/ui/page-header";

type DictationCategoryTabsProps = {
  activeCategoryId: string;
};

export function DictationCategoryTabs({
  activeCategoryId,
}: DictationCategoryTabsProps) {
  const t = useT();

  return (
    <PageHeader className="my-3 lg:my-6">
      <PageHeaderTabs
        activeKey={activeCategoryId}
        ariaLabel={t("nav.dictation")}
        items={DICTATION_CATEGORIES.map((category) => ({
          href: getDictationCategoryPath(category.id),
          key: category.id,
          label: category.label,
        }))}
      />
    </PageHeader>
  );
}
