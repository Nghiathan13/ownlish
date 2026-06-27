import type { AdminToeicRunStep } from "@/features/admin/toeic/detail/lib/adminToeicRunSteps";
import {
  getAdminStepGroup,
  getAdminStepQuestions,
} from "@/features/admin/toeic/detail/lib/adminToeicRunSteps";
import { AdminToeicGroupRawPanel } from "@/features/admin/toeic/detail/components/AdminToeicGroupRawPanel";
import { AdminToeicQuestionRawPanel } from "@/features/admin/toeic/detail/components/AdminToeicQuestionRawPanel";
import { AdminToeicSplitLayout } from "@/features/admin/toeic/detail/components/AdminToeicSplitLayout";

type AdminToeicStepViewProps = {
  step: AdminToeicRunStep;
};

export function AdminToeicStepView({ step }: AdminToeicStepViewProps) {
  const group = getAdminStepGroup(step);
  const questions = getAdminStepQuestions(step);

  return (
    <AdminToeicSplitLayout
      left={<AdminToeicGroupRawPanel group={group} />}
      right={<AdminToeicQuestionRawPanel questions={questions} />}
    />
  );
}
