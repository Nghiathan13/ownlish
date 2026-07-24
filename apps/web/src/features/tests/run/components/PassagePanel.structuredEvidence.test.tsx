import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PassagePanel } from "@/features/tests/run/components/PassagePanel";
import { LocaleProvider } from "@/shared/providers/LocaleProvider";

const storageMocks = vi.hoisted(() => ({
  readEvidenceHighlightEnabled: vi.fn(() => true),
  writeEvidenceHighlightEnabled: vi.fn(),
}));

vi.mock("@/features/tests/run/lib/evidenceHighlightStorage", () => ({
  readEvidenceHighlightEnabled: storageMocks.readEvidenceHighlightEnabled,
  writeEvidenceHighlightEnabled: storageMocks.writeEvidenceHighlightEnabled,
}));

describe("PassagePanel structured evidence", () => {
  beforeEach(() => {
    storageMocks.readEvidenceHighlightEnabled.mockReturnValue(true);
    storageMocks.writeEvidenceHighlightEnabled.mockClear();
  });

  it("shows the evidence toggle for structured transcript segments", async () => {
    const user = userEvent.setup();

    render(
      <LocaleProvider>
        <PassagePanel
          content="Intro. Shared evidence. Outro."
          contentSegments={[
            { type: "text", value: "Intro. " },
            {
              type: "evidence",
              questionNumbers: [89, 90],
              value: "Shared evidence.",
            },
            { type: "text", value: " Outro." },
          ]}
          showEvidenceToggle
          showTranslation={false}
          title="Transcript"
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("89")).toBeInTheDocument();
    expect(screen.getByText("90")).toBeInTheDocument();
    expect(screen.getByText("Shared evidence.")).toBeInTheDocument();

    const toggle = screen.getByRole("switch", { name: "Highlight evidence" });
    expect(toggle).toHaveAttribute("aria-checked", "true");

    await user.click(toggle);
    expect(storageMocks.writeEvidenceHighlightEnabled).toHaveBeenCalledWith(
      false,
    );
  });
});
