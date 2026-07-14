import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MockFinishFailureModal } from "@/features/tests/run/ui/mock/MockFinishFailureModal";

describe("MockFinishFailureModal", () => {
  it("keeps Finish retry actionable while explaining local-only edits", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onRetry = vi.fn();

    render(
      <MockFinishFailureModal
        error="Cannot connect to server."
        isRetrying={false}
        onClose={onClose}
        onRetry={onRetry}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: "Could not finish mock test" }),
    ).toHaveTextContent("Cannot connect to server.");
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Changes made after Finish stay only on this screen",
    );

    await user.click(screen.getByRole("button", { name: "Retry Finish" }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
