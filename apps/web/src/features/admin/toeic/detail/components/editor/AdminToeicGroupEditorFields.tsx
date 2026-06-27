import type { AdminToeicAnswerKey } from "@/features/admin/toeic/api/types";
import type {
  AdminGroupEditorState,
  AdminQuestionEditorEntry,
} from "@/features/admin/toeic/detail/lib/adminGroupEditorState";
import {
  isAdminToeicGroupEditorFieldVisible,
  isAdminToeicQuestionEditorFieldVisible,
} from "@/features/admin/toeic/detail/lib/adminToeicEditorVisibility";

function FieldLabel({ children }: { children: string }) {
  return (
    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <input
      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      onChange={(event) => {
        onChange(event.target.value);
      }}
      type="text"
      value={value ?? ""}
    />
  );
}

function TextArea({
  value,
  onChange,
  rows = 3,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  rows?: number;
}) {
  return (
    <textarea
      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      onChange={(event) => {
        onChange(event.target.value);
      }}
      rows={rows}
      value={value ?? ""}
    />
  );
}

const ANSWER_KEY_OPTIONS: Array<{ value: AdminToeicAnswerKey; label: string }> =
  [
    { value: null, label: "—" },
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "C", label: "C" },
    { value: "D", label: "D" },
  ];

type AdminToeicGroupFieldsSectionProps = {
  draft: AdminGroupEditorState;
  onChange: (draft: AdminGroupEditorState) => void;
  partNumber: number;
};

export function AdminToeicGroupFieldsSection({
  draft,
  onChange,
  partNumber,
}: AdminToeicGroupFieldsSectionProps) {
  const updateGroup = (
    patch: Partial<AdminGroupEditorState["draftGroup"]>,
  ) => {
    onChange({
      ...draft,
      draftGroup: {
        ...draft.draftGroup,
        ...patch,
      },
    });
  };
  const showGroupType = isAdminToeicGroupEditorFieldVisible(
    partNumber,
    "groupType",
  );
  const showAccent = isAdminToeicGroupEditorFieldVisible(partNumber, "accent");
  const showContent = isAdminToeicGroupEditorFieldVisible(partNumber, "content");
  const showContentVi = isAdminToeicGroupEditorFieldVisible(
    partNumber,
    "contentVi",
  );

  if (!showGroupType && !showAccent && !showContent && !showContentVi) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {showGroupType || showAccent ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {showGroupType ? (
            <div>
              <FieldLabel>Group type</FieldLabel>
              <TextInput
                onChange={(value) => updateGroup({ groupType: value })}
                value={draft.draftGroup.groupType}
              />
            </div>
          ) : null}
          {showAccent ? (
            <div>
              <FieldLabel>Accent</FieldLabel>
              <TextInput
                onChange={(value) => updateGroup({ accent: value })}
                value={draft.draftGroup.accent}
              />
            </div>
          ) : null}
        </div>
      ) : null}
      {showContent ? (
        <div>
          <FieldLabel>Content</FieldLabel>
          <TextArea
            onChange={(value) => updateGroup({ content: value })}
            rows={4}
            value={draft.draftGroup.content}
          />
        </div>
      ) : null}
      {showContentVi ? (
        <div>
          <FieldLabel>Content (VI)</FieldLabel>
          <TextArea
            onChange={(value) => updateGroup({ contentVi: value })}
            rows={4}
            value={draft.draftGroup.contentVi}
          />
        </div>
      ) : null}
    </div>
  );
}

type AdminToeicQuestionFieldsSectionProps = {
  draft: AdminGroupEditorState;
  onChange: (draft: AdminGroupEditorState) => void;
  partNumber: number;
  questions: AdminQuestionEditorEntry[];
};

export function AdminToeicQuestionFieldsSection({
  draft,
  onChange,
  partNumber,
  questions,
}: AdminToeicQuestionFieldsSectionProps) {
  const updateQuestion = (
    questionId: number,
    patch: Partial<AdminQuestionEditorEntry["draft"]>,
  ) => {
    onChange({
      ...draft,
      questions: draft.questions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              draft: {
                ...question.draft,
                ...patch,
              },
            }
          : question,
      ),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {questions.map((question) => (
        <section className="flex flex-col gap-4" key={question.id}>
          <p className="text-sm font-semibold text-foreground">
            Question {question.questionNumber}
          </p>
          <div className="grid gap-4">
            {isAdminToeicQuestionEditorFieldVisible(
              partNumber,
              "questionType",
            ) ? (
              <div>
                <FieldLabel>Question type</FieldLabel>
                <TextInput
                  onChange={(value) =>
                    updateQuestion(question.id, { questionType: value })
                  }
                  value={question.draft.questionType}
                />
              </div>
            ) : null}
            {isAdminToeicQuestionEditorFieldVisible(partNumber, "question") ? (
              <div>
                <FieldLabel>Question</FieldLabel>
                <TextArea
                  onChange={(value) =>
                    updateQuestion(question.id, { question: value })
                  }
                  value={question.draft.question}
                />
              </div>
            ) : null}
            {isAdminToeicQuestionEditorFieldVisible(partNumber, "questionVi") ? (
              <div>
                <FieldLabel>Question (VI)</FieldLabel>
                <TextArea
                  onChange={(value) =>
                    updateQuestion(question.id, { questionVi: value })
                  }
                  value={question.draft.questionVi}
                />
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              {(["A", "B", "C", "D"] as const).map((optionKey) => (
                <div key={optionKey}>
                  <FieldLabel>{`Option ${optionKey}`}</FieldLabel>
                  <TextInput
                    onChange={(value) =>
                      updateQuestion(question.id, {
                        [`option${optionKey}`]: value,
                      } as Partial<AdminQuestionEditorEntry["draft"]>)
                    }
                    value={question.draft[`option${optionKey}`]}
                  />
                </div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["A", "B", "C", "D"] as const).map((optionKey) => (
                <div key={`${optionKey}-vi`}>
                  <FieldLabel>{`Option ${optionKey} (VI)`}</FieldLabel>
                  <TextInput
                    onChange={(value) =>
                      updateQuestion(question.id, {
                        [`option${optionKey}Vi`]: value,
                      } as Partial<AdminQuestionEditorEntry["draft"]>)
                    }
                    value={question.draft[`option${optionKey}Vi`]}
                  />
                </div>
              ))}
            </div>
            <div>
              <FieldLabel>Answer key</FieldLabel>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                onChange={(event) => {
                  const value = event.target.value;
                  updateQuestion(question.id, {
                    answerKey:
                      value === "" ? null : (value as AdminToeicAnswerKey),
                  });
                }}
                value={question.draft.answerKey ?? ""}
              >
                {ANSWER_KEY_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value ?? ""}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {isAdminToeicQuestionEditorFieldVisible(
              partNumber,
              "explanationVi",
            ) ? (
              <div>
                <FieldLabel>Explanation (VI)</FieldLabel>
                <TextArea
                  onChange={(value) =>
                    updateQuestion(question.id, { explanationVi: value })
                  }
                  value={question.draft.explanationVi}
                />
              </div>
            ) : null}
          </div>
        </section>
      ))}
    </div>
  );
}
