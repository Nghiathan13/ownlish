import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MockSubmissionAlert } from "@/features/tests/run/ui/mock/MockSubmissionAlert";

describe("MockSubmissionAlert", () => {
  it("offers an actionable retry when answers are not saved", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <MockSubmissionAlert
        hasSyncFailures
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Some answers could not be saved.",
    );

    await user.click(
      screen.getByRole("button", { name: "Retry saving answers" }),
    );

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
