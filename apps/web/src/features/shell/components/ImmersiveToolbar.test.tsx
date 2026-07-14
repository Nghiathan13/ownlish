import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImmersiveToolbar } from "@/features/shell/components/ImmersiveToolbar";
import {
  ImmersiveToolbarProvider,
  useRegisterImmersiveFinish,
} from "@/features/shell/providers/ImmersiveToolbarProvider";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

type FinishRegistrationProps = {
  disabled: boolean;
  finish: Mock<() => Promise<void>>;
  isPending: boolean;
};

function FinishRegistration({
  disabled,
  finish,
  isPending,
}: FinishRegistrationProps) {
  useRegisterImmersiveFinish(finish, "Test 1", { disabled, isPending });
  return null;
}

describe("ImmersiveToolbar finish action", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("runs when enabled and exposes the finishing state accessibly", async () => {
    const user = userEvent.setup();
    const finish = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const { rerender } = render(
      <ImmersiveToolbarProvider>
        <FinishRegistration disabled={false} finish={finish} isPending={false} />
        <ImmersiveToolbar />
      </ImmersiveToolbarProvider>,
    );

    const finishButton = await screen.findByRole("button", { name: "Finish" });
    expect(finishButton).toBeEnabled();
    await user.click(finishButton);
    expect(finish).toHaveBeenCalledTimes(1);

    rerender(
      <ImmersiveToolbarProvider>
        <FinishRegistration disabled finish={finish} isPending />
        <ImmersiveToolbar />
      </ImmersiveToolbarProvider>,
    );

    const pendingButton = await screen.findByRole("button", {
      name: "Finishing...",
    });
    expect(pendingButton).toBeDisabled();
    expect(pendingButton).toHaveAttribute("aria-busy", "true");
  });
});
