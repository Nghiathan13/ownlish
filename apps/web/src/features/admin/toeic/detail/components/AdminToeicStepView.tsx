import type { AdminToeicRunStep } from "@/features/admin/toeic/detail/lib/adminToeicRunSteps";
import {
  getAdminStepGroup,
  getAdminStepQuestions,
} from "@/features/admin/toeic/detail/lib/adminToeicRunSteps";
import { AdminToeicPracticeLeftPanel } from "@/features/admin/toeic/detail/components/AdminToeicPracticeLeftPanel";
import { AdminToeicPracticeQuestionPanel } from "@/features/admin/toeic/detail/components/AdminToeicPracticeQuestionPanel";
import { AdminToeicSplitLayout } from "@/features/admin/toeic/detail/components/AdminToeicSplitLayout";

type AdminToeicStepViewProps = {
  step: AdminToeicRunStep;
};

export function AdminToeicStepView({ step }: AdminToeicStepViewProps) {
  const group = getAdminStepGroup(step);
  const questions = getAdminStepQuestions(step);
  const questionNumber =
    questions[0]?.questionNumber ?? group.questionStart;

  return (
    <AdminToeicSplitLayout
      left={
        <AdminToeicPracticeLeftPanel
          group={group}
          partNumber={step.partNumber}
          questionNumber={questionNumber}
        />
      }
      right={
        <AdminToeicPracticeQuestionPanel
          partNumber={step.partNumber}
          questions={questions}
        />
      }
    />
  );
}
