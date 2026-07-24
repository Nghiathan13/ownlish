import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PracticeSubmissionAlert } from "@/features/tests/run/ui/practice/PracticeSubmissionAlert";
import { LocaleProvider } from "@/shared/providers/LocaleProvider";

describe("PracticeSubmissionAlert", () => {
  it("shows the save failure and retries it", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <LocaleProvider>
        <PracticeSubmissionAlert isSubmitting={false} onRetry={onRetry} />
      </LocaleProvider>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Some answers could not be saved.",
    );

    await user.click(
      screen.getByRole("button", { name: "Retry saving answers" }),
    );

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("is busy and prevents another retry while submitting", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <LocaleProvider>
        <PracticeSubmissionAlert isSubmitting onRetry={onRetry} />
      </LocaleProvider>,
    );

    const alert = screen.getByRole("alert");
    const retryButton = screen.getByRole("button", {
      name: "Retry saving answers",
    });

    expect(alert).toHaveAttribute("aria-busy", "true");
    expect(retryButton).toBeDisabled();
    expect(retryButton).toHaveAttribute("aria-busy", "true");

    await user.click(retryButton);

    expect(onRetry).not.toHaveBeenCalled();
  });
});
