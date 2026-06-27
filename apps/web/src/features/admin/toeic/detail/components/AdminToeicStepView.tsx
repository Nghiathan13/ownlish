import type { AdminToeicRunStep } from "@/features/admin/toeic/detail/lib/adminToeicRunSteps";
import { AdminToeicGroupView } from "@/features/admin/toeic/detail/components/AdminToeicGroupView";

type AdminToeicStepViewProps = {
  step: AdminToeicRunStep;
};

export function AdminToeicStepView({ step }: AdminToeicStepViewProps) {
  if (step.kind === "question") {
    return (
      <AdminToeicGroupView
        activeQuestionId={step.question.id}
        group={step.group}
      />
    );
  }

  return <AdminToeicGroupView group={step.group} />;
}
