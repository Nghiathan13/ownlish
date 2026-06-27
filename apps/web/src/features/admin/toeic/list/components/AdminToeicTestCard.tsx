import Link from "next/link";
import type { AdminToeicTestListItem } from "@/features/admin/toeic/api/types";
import { iconTextButtonClassName } from "@/shared/ui/button";

type AdminToeicTestCardProps = {
  test: AdminToeicTestListItem;
};

function getTotalQuestionCount(test: AdminToeicTestListItem): number {
  return test.parts.reduce((total, part) => total + part.questionCount, 0);
}

export function AdminToeicTestCard({ test }: AdminToeicTestCardProps) {
  const partsCount = test.parts.length;
  const questionsCount = getTotalQuestionCount(test);

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border p-4">
      <div>
        <h2 className="text-lg font-semibold">Test {test.testNumber}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {partsCount} parts · {questionsCount} questions
        </p>
      </div>
      <div className="flex w-full gap-2">
        <Link
          className={iconTextButtonClassName(
            "flex-1 border-foreground bg-foreground text-background",
          )}
          href={`/admin/toeic/${test.id}`}
        >
          View
        </Link>
      </div>
    </article>
  );
}
