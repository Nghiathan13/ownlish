import type { ToeicCatalogTest } from "@/entities/toeic-catalog/model/types";
import type { ToeicRuntimeTestPracticeSummary } from "@/entities/toeic-runtime/model/types";

export type CatalogTestPartProgress = {
  partNumber: number;
  partCorrectCount: number;
  partWrongCount: number;
};

export type CatalogTestSummary = {
  catalog: ToeicCatalogTest;
  totalQuestions: number;
  parts: CatalogTestPartProgress[];
};

export function formatCatalogTestLabel(test: CatalogTestSummary) {
  const provider = test.catalog.series.match(/[A-Za-z]+/)?.[0]?.toUpperCase() ?? "TOEIC";
  return `${provider} ${test.catalog.year} · Test ${test.catalog.testNumber}`;
}

export function materializeCatalogTestSummary(
  catalog: ToeicCatalogTest,
  progress: ToeicRuntimeTestPracticeSummary | undefined,
): CatalogTestSummary {
  const progressByPart = new Map(
    progress?.parts.map((part) => [part.partNumber, part]) ?? [],
  );

  return {
    catalog,
    totalQuestions: catalog.parts.reduce(
      (total, part) => total + part.questionCount,
      0,
    ),
    parts: catalog.parts.map((part) => {
      const summary = progressByPart.get(part.number);
      return {
        partNumber: part.number,
        partCorrectCount: summary?.correctCount ?? 0,
        partWrongCount: summary?.wrongCount ?? 0,
      };
    }),
  };
}
