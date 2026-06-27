import type { AdminToeicTestRawQuestion } from "@/features/admin/toeic/api/types";
import { AdminToeicQuestionView } from "@/features/admin/toeic/detail/components/AdminToeicQuestionView";

type AdminToeicQuestionRawPanelProps = {
  questions: AdminToeicTestRawQuestion[];
};

export function AdminToeicQuestionRawPanel({
  questions,
}: AdminToeicQuestionRawPanelProps) {
  return (
    <div className="flex flex-col gap-6">
      {questions.map((question) => (
        <AdminToeicQuestionView key={question.id} question={question} />
      ))}
    </div>
  );
}
