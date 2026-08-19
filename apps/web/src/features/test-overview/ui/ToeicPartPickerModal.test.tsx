import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import type { CatalogTestSummary } from "../model/catalogTestSummary";
import { ToeicPartPickerModal } from "./ToeicPartPickerModal";

const test: CatalogTestSummary = {
  catalog: {
    id: "ets-2023-1",
    series: "ETS",
    year: 2023,
    testNumber: 1,
    complete: true,
    parts: [],
  },
  totalQuestions: 10,
  parts: [
    { partNumber: 1, partCorrectCount: 1, partWrongCount: 2 },
    { partNumber: 5, partCorrectCount: 0, partWrongCount: 0 },
  ],
};

function renderModal(
  overrides: Partial<Parameters<typeof ToeicPartPickerModal>[0]> = {},
) {
  const props = {
    testLabel: "ETS 2023 · Test 1",
    test,
    onClose: vi.fn(),
    onStart: vi.fn(),
    onStartMock: vi.fn(),
    ...overrides,
  };

  render(
    <LocaleProvider>
      <ToeicPartPickerModal {...props} />
    </LocaleProvider>,
  );

  return props;
}

describe("ToeicPartPickerModal", () => {
  it("starts practice for the selected parts", async () => {
    const user = userEvent.setup();
    const props = renderModal();

    expect(
      screen.getByRole("dialog", { name: "Practice ETS 2023 · Test 1" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Part 1/ }));
    await user.click(screen.getByRole("button", { name: "Start" }));

    expect(props.onStart).toHaveBeenCalledWith([1], "practice");
  });

  it("starts a mock with the entered time limit", async () => {
    const user = userEvent.setup();
    const props = renderModal({ intent: "mock" });

    expect(
      screen.getByRole("dialog", { name: "Mock ETS 2023 · Test 1" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Part 1/ }));
    await user.click(screen.getByRole("button", { name: /Start/ }));

    expect(props.onStartMock).toHaveBeenCalledWith([1], expect.any(Number));
  });
});
