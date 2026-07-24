import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ToeicQuestionGroup } from "@/entities/toeic/api/types";
import { MockGroupScreen } from "@/features/tests/run/ui/mock/MockGroupScreen";
import { LocaleProvider } from "@/shared/providers/LocaleProvider";

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
  it("allows answer changes, then locks when completed", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const props = {
      group,
      isFinished: false,
      isReviewingResults: false,
      mediaError: null,
      onSelect,
      partNumber: 5,
    };
    const { rerender } = render(
      <LocaleProvider>
        <MockGroupScreen {...props} />
      </LocaleProvider>,
    );
    const optionA = screen.getByRole("button", { name: /A.*Alpha/i });
    const optionB = screen.getByRole("button", { name: /B.*Beta/i });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(optionA).toBeEnabled();
    expect(optionB).toBeEnabled();

    await user.click(optionB);
    expect(onSelect).toHaveBeenCalledWith(101, "B");

    rerender(
      <LocaleProvider>
        <MockGroupScreen {...props} isReviewingResults />
      </LocaleProvider>,
    );

    expect(screen.queryByRole("button", { name: /A.*Alpha/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /B.*Beta/i })).not.toBeInTheDocument();
  });

  it("keeps the mock media subtree after Finish is accepted", () => {
    const listeningGroup: ToeicQuestionGroup = {
      ...group,
      partNumber: 1,
      audioUrl: "https://example.com/audio.mp3",
      imageUrl: "https://example.com/image.png",
      questions: [
        {
          ...group.questions[0],
          answerKey: "B",
        },
      ],
    };
    const props = {
      group: listeningGroup,
      isFinished: false,
      isReviewingResults: false,
      mediaError: null,
      onSelect: vi.fn(),
      partNumber: 1,
    };
    const { container, rerender } = render(
      <LocaleProvider>
        <MockGroupScreen {...props} />
      </LocaleProvider>,
    );
    const mockImage = screen.getByRole("img", { name: "Question 1" });

    expect(container.querySelector("audio")).not.toBeInTheDocument();

    rerender(
      <LocaleProvider>
        <MockGroupScreen {...props} isReviewingResults />
      </LocaleProvider>,
    );

    expect(screen.getByRole("img", { name: "Question 1" })).toBe(mockImage);
    expect(container.querySelector("audio")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /A.*Alpha/i })).not.toBeInTheDocument();

    rerender(
      <LocaleProvider>
        <MockGroupScreen {...props} isFinished isReviewingResults />
      </LocaleProvider>,
    );

    expect(container.querySelector("audio")).toHaveAttribute(
      "src",
      "https://example.com/audio.mp3",
    );
  });
});
