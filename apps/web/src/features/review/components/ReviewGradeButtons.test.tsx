import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/providers/LocaleProvider";
import { ReviewGradeButtons } from "./ReviewGradeButtons";

describe("ReviewGradeButtons", () => {
  it("keeps all four shared ratings available", () => {
    const onAgain = vi.fn();
    const onEasy = vi.fn();

    render(
      <LocaleProvider>
        <ReviewGradeButtons
          disabled={false}
          level={0}
          onAgain={onAgain}
          onEasy={onEasy}
          onGood={() => {}}
          onHard={() => {}}
        />
      </LocaleProvider>,
    );

    expect(screen.getByRole("button", { name: /^Hard/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /^Good/ })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: /^Forget/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Easy/ }));

    expect(onAgain).toHaveBeenCalledOnce();
    expect(onEasy).toHaveBeenCalledOnce();
  });
});
