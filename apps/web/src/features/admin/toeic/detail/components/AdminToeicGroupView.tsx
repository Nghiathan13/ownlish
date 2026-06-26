import type { AdminToeicTestRawGroup } from "@/features/admin/toeic/api/types";
import { AdminToeicMediaPreview } from "@/features/admin/toeic/detail/components/AdminToeicMediaPreview";
import { AdminToeicQuestionView } from "@/features/admin/toeic/detail/components/AdminToeicQuestionView";

type AdminToeicGroupViewProps = {
  group: AdminToeicTestRawGroup;
};

export function AdminToeicGroupView({ group }: AdminToeicGroupViewProps) {
  return (
    <>
      {group.content ? (
        <p className="mb-3 whitespace-pre-wrap text-sm text-foreground">
          {group.content}
        </p>
      ) : null}
      {group.contentVi ? (
        <p className="mb-3 whitespace-pre-wrap text-sm text-muted-foreground">
          {group.contentVi}
        </p>
      ) : null}

      <AdminToeicMediaPreview
        audioUrl={group.audioUrl}
        imageUrl={group.imageUrl}
      />

      <div className="mt-4 space-y-3">
        {group.questions.map((question) => (
          <AdminToeicQuestionView key={question.id} question={question} />
        ))}
      </div>
    </>
  );
}
