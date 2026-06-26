import type { AdminToeicTestRawQuestion } from "@/features/admin/toeic/api/types";

type AdminToeicQuestionViewProps = {
  question: AdminToeicTestRawQuestion;
};

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

function getOptionValue(
  question: AdminToeicTestRawQuestion,
  key: (typeof OPTION_KEYS)[number],
): string | null {
  switch (key) {
    case "A":
      return question.optionA;
    case "B":
      return question.optionB;
    case "C":
      return question.optionC;
    case "D":
      return question.optionD;
  }
}

function getOptionViValue(
  question: AdminToeicTestRawQuestion,
  key: (typeof OPTION_KEYS)[number],
): string | null {
  switch (key) {
    case "A":
      return question.optionAVi;
    case "B":
      return question.optionBVi;
    case "C":
      return question.optionCVi;
    case "D":
      return question.optionDVi;
  }
}

export function AdminToeicQuestionView({ question }: AdminToeicQuestionViewProps) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-sm font-semibold text-foreground">
        Q{question.questionNumber}
        {question.questionType ? ` · ${question.questionType}` : ""}
      </p>
      {question.question ? (
        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
          {question.question}
        </p>
      ) : null}
      {question.questionVi ? (
        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
          {question.questionVi}
        </p>
      ) : null}

      <ul className="mt-3 space-y-2">
        {OPTION_KEYS.map((key) => {
          const option = getOptionValue(question, key);
          const optionVi = getOptionViValue(question, key);
          const isAnswer = question.answerKey === key;

          if (!option && !optionVi) {
            return null;
          }

          return (
            <li
              className={
                isAnswer
                  ? "rounded-md border border-foreground bg-muted/50 px-3 py-2 text-sm"
                  : "rounded-md border border-border px-3 py-2 text-sm"
              }
              key={key}
            >
              <span className="font-semibold">{key}.</span> {option ?? "—"}
              {optionVi ? (
                <p className="mt-1 text-muted-foreground">{optionVi}</p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-sm text-foreground">
        Answer key:{" "}
        <span className="font-semibold">{question.answerKey ?? "—"}</span>
      </p>
      {question.explanationVi ? (
        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
          {question.explanationVi}
        </p>
      ) : null}
    </div>
  );
}
