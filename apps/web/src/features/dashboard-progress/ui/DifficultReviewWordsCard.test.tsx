import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { DifficultReviewWordsCard } from "./DifficultReviewWordsCard";

function renderCard(
  props: Partial<React.ComponentProps<typeof DifficultReviewWordsCard>> = {},
) {
  return render(
    <LocaleProvider>
      <DifficultReviewWordsCard
        error={null}
        isLoading={false}
        onRetry={vi.fn()}
        words={[]}
        {...props}
      />
    </LocaleProvider>,
  );
}

describe("DifficultReviewWordsCard", () => {
  it("shows an empty state", () => {
    renderCard();

    expect(screen.getByText("Difficult words")).toBeInTheDocument();
    expect(screen.getByText("No difficult words yet.")).toBeInTheDocument();
    expect(screen.getByText("Word")).toBeInTheDocument();
  });

  it("shows a loading skeleton", () => {
    const { container } = renderCard({ isLoading: true });

    expect(container.querySelectorAll(".animate-pulse").length).toBe(6);
    expect(screen.queryByText("No difficult words yet.")).not.toBeInTheDocument();
  });

  it("renders words and supports retry on error", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { rerender } = render(
      <LocaleProvider>
        <DifficultReviewWordsCard
          error={null}
          isLoading={false}
          onRetry={onRetry}
          words={[
            {
              word: "scarce",
              collectionName: "Daily",
              wrongCount: 5,
            },
          ]}
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("scarce")).toBeInTheDocument();
    expect(screen.getByText("Daily")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();

    rerender(
      <LocaleProvider>
        <DifficultReviewWordsCard
          error="Network failed"
          isLoading={false}
          onRetry={onRetry}
          words={[]}
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("Network failed")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
