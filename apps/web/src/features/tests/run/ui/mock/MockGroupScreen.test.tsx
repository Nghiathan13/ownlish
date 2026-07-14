import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ToeicQuestionGroup } from "@/entities/toeic/api/types";
import { MockGroupScreen } from "@/features/tests/run/ui/mock/MockGroupScreen";

const group: ToeicQuestionGroup = {
  id: 11,
  partNumber: 5,
  questionStart: 1,
  questionEnd: 1,
  groupStatus: null,
  groupType: null,
  accent: null,
  content: "A short passage.",
  contentVi: null,
  audioUrl: null,
  audioUrlExpiresAt: null,
  imageUrl: null,
  imageUrlExpiresAt: null,
  questions: [
    {
      id: 101,
      questionNumber: 1,
      sessionQuestionNumber: 1,
      question: "Choose an answer.",
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
      answerKey: null,
      selectedKey: "A",
      status: "selected",
      isCorrect: null,
    },
  ],
};

describe("MockGroupScreen", () => {
  it("announces autosave without blocking answer changes, then locks when completed", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const props = {
      group,
      isFinished: false,
      isQuestionPending: (questionId: number) => questionId === 101,
      mediaError: null,
      onSelect,
      partNumber: 5,
    };
    const { rerender } = render(<MockGroupScreen {...props} />);
    const optionA = screen.getByRole("button", { name: /A.*Alpha/i });
    const optionB = screen.getByRole("button", { name: /B.*Beta/i });

    expect(screen.getByRole("status")).toHaveTextContent("Saving answer...");
    expect(optionA).toBeEnabled();
    expect(optionB).toBeEnabled();

    await user.click(optionB);
    expect(onSelect).toHaveBeenCalledWith(101, "B");

    rerender(<MockGroupScreen {...props} isFinished />);

    expect(screen.queryByRole("button", { name: /A.*Alpha/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /B.*Beta/i })).not.toBeInTheDocument();
  });
});
