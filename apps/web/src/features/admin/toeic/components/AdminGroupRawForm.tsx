import type { AdminToeicGroupDraft } from "@/features/admin/toeic/lib/adminGroupEditorState";
import type { AdminToeicAnswerKey } from "@/features/admin/toeic/api/types";

type AdminGroupRawFormProps = {
  draft: AdminToeicGroupDraft;
  onChange: (draft: AdminToeicGroupDraft) => void;
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

function ReadOnlyValue({ value }: { value: string | null }) {
  return (
    <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
      {value ?? "—"}
    </p>
  );
}

export function AdminGroupRawForm({ draft, onChange }: AdminGroupRawFormProps) {
  const updateGroup = (patch: Partial<AdminToeicGroupDraft>) => {
    onChange({ ...draft, ...patch });
  };

  const updateQuestion = (
    questionId: number,
    patch: Partial<AdminToeicGroupDraft["questions"][number]>,
  ) => {
    onChange({
      ...draft,
      questions: draft.questions.map((question) =>
        question.id === questionId ? { ...question, ...patch } : question,
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
              value={draft.groupType}
            />
          </div>
          <div>
            <FieldLabel>Accent</FieldLabel>
            <TextInput
              onChange={(value) => updateGroup({ accent: value })}
              value={draft.accent}
            />
          </div>
        </div>
        <div>
          <FieldLabel>Content</FieldLabel>
          <TextArea
            onChange={(value) => updateGroup({ content: value })}
            rows={4}
            value={draft.content}
          />
        </div>
        <div>
          <FieldLabel>Content (VI)</FieldLabel>
          <TextArea
            onChange={(value) => updateGroup({ contentVi: value })}
            rows={4}
            value={draft.contentVi}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Audio storage path</FieldLabel>
            <ReadOnlyValue value={draft.audioStoragePath} />
          </div>
          <div>
            <FieldLabel>Image storage path</FieldLabel>
            <ReadOnlyValue value={draft.imageStoragePath} />
          </div>
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
                  value={question.questionType}
                />
              </div>
              <div>
                <FieldLabel>Question</FieldLabel>
                <TextArea
                  onChange={(value) =>
                    updateQuestion(question.id, { question: value })
                  }
                  value={question.question}
                />
              </div>
              <div>
                <FieldLabel>Question (VI)</FieldLabel>
                <TextArea
                  onChange={(value) =>
                    updateQuestion(question.id, { questionVi: value })
                  }
                  value={question.questionVi}
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
                        } as Partial<AdminToeicGroupDraft["questions"][number]>)
                      }
                      value={question[`option${optionKey}`]}
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
                        } as Partial<AdminToeicGroupDraft["questions"][number]>)
                      }
                      value={question[`option${optionKey}Vi`]}
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
                  value={question.answerKey ?? ""}
                >
                  {ANSWER_KEY_OPTIONS.map((option) => (
                    <option
                      key={option.label}
                      value={option.value ?? ""}
                    >
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
                  value={question.explanationVi}
                />
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
