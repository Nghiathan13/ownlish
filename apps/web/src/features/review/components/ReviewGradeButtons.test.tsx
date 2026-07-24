import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReviewGradeButtons } from "./ReviewGradeButtons";

describe("ReviewGradeButtons", () => {
  it("disables unavailable ratings without blocking Again and Easy", () => {
    const onAgain = vi.fn();
    const onEasy = vi.fn();

    render(
      <ReviewGradeButtons
        disableGood
        disableHard
        disabled={false}
        onAgain={onAgain}
        onEasy={onEasy}
        onGood={() => {}}
        onHard={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: /^Hard/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Good/ })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /^Again/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Easy/ }));

    expect(onAgain).toHaveBeenCalledOnce();
    expect(onEasy).toHaveBeenCalledOnce();
  });
});
