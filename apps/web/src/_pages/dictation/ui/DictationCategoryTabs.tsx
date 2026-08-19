"use client";

import type { DictationCatalogIndexCategory } from "@/entities/dictation-library";
import { getDictationCategoryPath } from "@/entities/dictation-library";
import { useT } from "@/shared/lib/providers";
import { UnderlineTabs } from "@/shared/ui/UnderlineTabs";

type DictationCategoryTabsProps = {
  activeCategoryId: string;
  categories: DictationCatalogIndexCategory[];
};

export function DictationCategoryTabs({
  activeCategoryId,
  categories,
}: DictationCategoryTabsProps) {
  const t = useT();

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="my-3 px-4 lg:my-6 lg:px-16">
      <UnderlineTabs
        activeKey={activeCategoryId}
        ariaLabel={t("nav.dictation")}
        items={categories.map((category) => ({
          href: getDictationCategoryPath(category.id),
          key: category.id,
          label: category.label,
        }))}
      />
    </div>
  );
}
