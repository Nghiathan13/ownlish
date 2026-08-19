import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { MockRunDecisionModal } from "./MockRunDecisionModal";

function renderModal(
  overrides: Partial<Parameters<typeof MockRunDecisionModal>[0]> = {},
) {
  const props = {
    isRestarting: false,
    parts: [1, 2],
    status: "open" as const,
    onClose: vi.fn(),
    onContinue: vi.fn(),
    onRestart: vi.fn(),
    ...overrides,
  };

  render(
    <LocaleProvider>
      <MockRunDecisionModal {...props} />
    </LocaleProvider>,
  );

  return props;
}

describe("MockRunDecisionModal", () => {
  it("continues or restarts an unfinished mock", async () => {
    const user = userEvent.setup();
    const props = renderModal();

    expect(screen.getByRole("dialog", { name: "Continue mock test?" })).toBeInTheDocument();
    expect(
      screen.getByText("An unfinished mock test for Part 1, 2 is available."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Restart" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(props.onRestart).toHaveBeenCalledTimes(1);
    expect(props.onContinue).toHaveBeenCalledTimes(1);
  });

  it("opens a pending result without a restart action", async () => {
    const user = userEvent.setup();
    const props = renderModal({ status: "pending" });

    expect(screen.getByRole("dialog", { name: "Finishing mock test" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Restart" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open result" }));
    expect(props.onContinue).toHaveBeenCalledTimes(1);
  });
});
