import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/providers/LocaleProvider";
import { ReviewStudySession } from "./ReviewStudySession";

const word = {
  band: "A1",
  definitions: [
    {
      id: "definition-id",
      definition: null,
      example: null,
      exampleVi: null,
      meaningVi: "khoảng",
      type: "adverb",
    },
  ],
  id: "word-id",
  ipa: null,
  types: ["adverb"],
  word: "about",
};

describe("ReviewStudySession", () => {
  it("uses Keyboard mode to show correctness without grading until a rating is selected", () => {
    const onEasy = vi.fn();

    const { rerender } = render(
      <LocaleProvider>
        <ReviewStudySession
          isSubmitting={false}
          mode="flashcard"
          onAgain={() => {}}
          onEasy={onEasy}
          onGood={() => {}}
          onHard={() => {}}
          reviewedCount={0}
          totalWords={20}
          word={word}
        />
      </LocaleProvider>,
    );

    rerender(
      <LocaleProvider>
        <ReviewStudySession
          isSubmitting={false}
          mode="typing"
          onAgain={() => {}}
          onEasy={onEasy}
          onGood={() => {}}
          onHard={() => {}}
          reviewedCount={0}
          totalWords={20}
          word={word}
        />
      </LocaleProvider>,
    );

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "wrong" } });
    fireEvent.keyDown(window, { key: "Enter" });

    expect(screen.getByText("Incorrect")).toBeInTheDocument();
    expect(onEasy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Easy/ }));

    expect(onEasy).toHaveBeenCalledOnce();
  });
});
