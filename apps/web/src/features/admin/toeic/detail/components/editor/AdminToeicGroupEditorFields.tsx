import type { AdminToeicAnswerKey } from "@/features/admin/toeic/api/types";
import type { AdminGroupEditorState } from "@/features/admin/toeic/detail/lib/adminGroupEditorState";

type AdminToeicGroupEditorFieldsProps = {
  draft: AdminGroupEditorState;
  onChange: (draft: AdminGroupEditorState) => void;
};

const ANSWER_KEY_OPTIONS: Array<{ value: AdminToeicAnswerKey; label: string }> =
  [
    { value: null, label: "—" },
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "C", label: "C" },
    { value: "D", label: "D" },
  ];

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

export function AdminToeicGroupEditorFields({
  draft,
  onChange,
}: AdminToeicGroupEditorFieldsProps) {
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

  const updateQuestion = (
    questionId: number,
    patch: Partial<AdminGroupEditorState["questions"][number]["draft"]>,
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
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">Group</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Group type</FieldLabel>
            <TextInput
              onChange={(value) => updateGroup({ groupType: value })}
              value={draft.draftGroup.groupType}
            />
          </div>
          <div>
            <FieldLabel>Accent</FieldLabel>
            <TextInput
              onChange={(value) => updateGroup({ accent: value })}
              value={draft.draftGroup.accent}
            />
          </div>
        </div>
        <div>
          <FieldLabel>Content</FieldLabel>
          <TextArea
            onChange={(value) => updateGroup({ content: value })}
            rows={4}
            value={draft.draftGroup.content}
          />
        </div>
        <div>
          <FieldLabel>Content (VI)</FieldLabel>
          <TextArea
            onChange={(value) => updateGroup({ contentVi: value })}
            rows={4}
            value={draft.draftGroup.contentVi}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">Questions</h3>
        {draft.questions.map((question) => (
          <div
            className="rounded-xl border border-border p-4"
            key={question.id}
          >
            <p className="mb-4 text-sm font-semibold text-foreground">
              Question {question.questionNumber}
            </p>
            <div className="grid gap-4">
              <div>
                <FieldLabel>Question type</FieldLabel>
                <TextInput
                  onChange={(value) =>
                    updateQuestion(question.id, { questionType: value })
                  }
                  value={question.draft.questionType}
                />
              </div>
              <div>
                <FieldLabel>Question</FieldLabel>
                <TextArea
                  onChange={(value) =>
                    updateQuestion(question.id, { question: value })
                  }
                  value={question.draft.question}
                />
              </div>
              <div>
                <FieldLabel>Question (VI)</FieldLabel>
                <TextArea
                  onChange={(value) =>
                    updateQuestion(question.id, { questionVi: value })
                  }
                  value={question.draft.questionVi}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {(["A", "B", "C", "D"] as const).map((optionKey) => (
                  <div key={optionKey}>
                    <FieldLabel>{`Option ${optionKey}`}</FieldLabel>
                    <TextInput
                      onChange={(value) =>
                        updateQuestion(question.id, {
                          [`option${optionKey}`]: value,
                        } as Partial<
                          AdminGroupEditorState["questions"][number]["draft"]
                        >)
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
                        } as Partial<
                          AdminGroupEditorState["questions"][number]["draft"]
                        >)
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
              <div>
                <FieldLabel>Explanation (VI)</FieldLabel>
                <TextArea
                  onChange={(value) =>
                    updateQuestion(question.id, { explanationVi: value })
                  }
                  value={question.draft.explanationVi}
                />
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
