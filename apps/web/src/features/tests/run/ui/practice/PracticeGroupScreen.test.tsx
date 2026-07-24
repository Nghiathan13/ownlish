import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ToeicQuestion } from "@/entities/toeic/api/types";
import type { PracticeSessionController } from "@/features/tests/run/model/practice/practiceSessionController";
import type { PracticeGroup } from "@/features/tests/run/lib/practiceGroups";
import { PracticeGroupScreen } from "@/features/tests/run/ui/practice/PracticeGroupScreen";
import { LocaleProvider } from "@/shared/providers/LocaleProvider";

vi.mock("@/features/tests/run/hooks/useSignedMedia", () => ({
  useSignedMedia: () => ({
    audioUrl: null,
    imageUrl: null,
    mediaError: null,
    handleMediaError: vi.fn(),
  }),
}));

vi.mock("@/features/shell/providers/ImmersiveToolbarProvider", () => ({
  useImmersiveBilingual: () => null,
}));

vi.mock("@/features/tests/run/components/PracticeLeftPanel", () => ({
  PracticeLeftPanel: () => <div>Practice context</div>,
}));

function createQuestion(id: number, selectedKey: "A" | "B"): ToeicQuestion {
  return {
    id,
    questionNumber: id,
    sessionQuestionNumber: id,
    question: `Question ${id}`,
    questionVi: null,
    options: {
      A: "Alpha",
      B: "Beta",
      C: null,
      D: null,
      A_vi: null,
      B_vi: null,
      C_vi: null,
      D_vi: null,
    },
    optionCount: 2,
    answerKey: "A",
    selectedKey,
    status: "selected",
    isCorrect: null,
  };
}

describe("PracticeGroupScreen", () => {
  it("keeps a fully selected group revealed when sync fails and wires retry", async () => {
    const user = userEvent.setup();
    const questions = [createQuestion(101, "A"), createQuestion(102, "B")];
    const answers = new Map(questions.map((question) => [question.id, question]));
    const retryFailedAnswers = vi.fn();
    const practice = {
      getAnswer: (questionId: number) => answers.get(questionId),
      hasSyncFailures: true,
      isQuestionPending: () => true,
      isSubmitting: false,
      retryFailedAnswers,
      selectAnswer: vi.fn(),
    } as unknown as PracticeSessionController;
    const practiceGroup: PracticeGroup = {
      group: {
        id: 10,
        partNumber: 3,
        questionStart: 101,
        questionEnd: 102,
        groupStatus: null,
        groupType: null,
        accent: null,
        content: "Listen and answer.",
        contentVi: null,
        audioUrl: null,
        audioUrlExpiresAt: null,
        imageUrl: null,
        imageUrlExpiresAt: null,
        questions,
      },
      questions,
    };

    render(
      <LocaleProvider>
        <PracticeGroupScreen
          partNumber={3}
          practice={practice}
          practiceGroup={practiceGroup}
          testId={1}
        />
      </LocaleProvider>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Some answers could not be saved.",
    );
    expect(screen.getAllByText("(A) Alpha")).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: /Alpha/ }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Retry saving answers" }),
    );

    expect(retryFailedAnswers).toHaveBeenCalledTimes(1);
  });
});
