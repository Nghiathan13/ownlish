import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { ReviewModeToggle } from "./ReviewModeToggle";
import { ReviewProgress } from "./ReviewProgress";
import { ReviewStateBlock } from "./ReviewStateBlock";

describe("review states and controls", () => {
  it("renders a loading skeleton before the review queue is available", () => {
    const { container } = render(
      <ReviewStateBlock error={null} isEmpty={false} isLoading onRetry={() => {}} />,
    );

    expect(container.querySelectorAll('[aria-hidden="true"]')).not.toHaveLength(0);
  });

  it("renders an actionable error and lets the learner retry", () => {
    const onRetry = vi.fn();

    render(
      <ReviewStateBlock
        error="The queue request failed."
        isEmpty={false}
        isLoading={false}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText("Review could not load")).toBeVisible();
    expect(screen.getByText("The queue request failed.")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("explains when the queue is empty", () => {
    render(
      <ReviewStateBlock error={null} isEmpty isLoading={false} onRetry={() => {}} />,
    );

    expect(screen.getByText("Queue clear")).toBeVisible();
    expect(screen.getByText("No words to review today.")).toBeVisible();
  });

  it("renders nothing after state has been resolved", () => {
    const { container } = render(
      <ReviewStateBlock error={null} isEmpty={false} isLoading={false} onRetry={() => {}} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("reports progress and guards an empty total", () => {
    const { rerender } = render(<ReviewProgress reviewedCount={3} totalWords={4} />);
    const progressbar = screen.getByRole("progressbar");

    expect(progressbar).toHaveAttribute("aria-valuenow", "3");
    expect(progressbar.firstElementChild).toHaveStyle({ width: "75%" });

    rerender(<ReviewProgress reviewedCount={0} totalWords={0} />);
    expect(screen.getByRole("progressbar").firstElementChild).toHaveStyle({ width: "0%" });
  });

  it("changes review mode through either tab", () => {
    const onModeChange = vi.fn();

    render(
      <LocaleProvider>
        <ReviewModeToggle mode="flashcard" onModeChange={onModeChange} />
      </LocaleProvider>,
    );

    const flashcard = screen.getByRole("tab", { name: /flashcard/i });
    const typing = screen.getByRole("tab", { name: /typing/i });
    expect(flashcard).toHaveAttribute("aria-selected", "true");
    expect(typing).toHaveAttribute("aria-selected", "false");

    fireEvent.click(typing);
    expect(onModeChange).toHaveBeenCalledWith("typing");
  });
});
