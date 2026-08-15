import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DictionaryEntry } from "@/entities/dictionary";
import { LocaleProvider } from "@/shared/lib/providers";

const mocks = vi.hoisted(() => ({
  setFloatingElement: vi.fn(),
  useDictionaryPopoverPositioning: vi.fn(() => ({
    floatingProps: { "data-floating": "true" },
    floatingStyles: { left: 16, position: "fixed", top: 24 },
    setFloatingElement: mocks.setFloatingElement,
  })),
}));

vi.mock("../model/useDictionaryPopoverPositioning", () => ({
  useDictionaryPopoverPositioning: mocks.useDictionaryPopoverPositioning,
}));

import { DictionaryLookupPopover } from "./DictionaryLookupPopover";

const entry: DictionaryEntry = {
  word: "a",
  etymologies: [
    {
      etymology: "",
      phonetics: {},
      homophones: [],
      parts_of_speech: [],
    },
  ],
};

function renderPopover(
  props: Partial<React.ComponentProps<typeof DictionaryLookupPopover>> = {},
) {
  const onClose = vi.fn();
  const onPointerDownInside = vi.fn();
  const onRetry = vi.fn();
  render(
    <LocaleProvider>
      <DictionaryLookupPopover
        entry={undefined}
        error={null}
        isLoading={false}
        onClose={onClose}
        onPointerDownInside={onPointerDownInside}
        onRetry={onRetry}
        range={{} as Range}
        rootElement={document.createElement("div")}
        word="a"
        {...props}
      />
    </LocaleProvider>,
  );
  return { onClose, onPointerDownInside, onRetry };
}

describe("DictionaryLookupPopover", () => {
  it("renders a loading status while an entry is pending", () => {
    renderPopover({ isLoading: true });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Dictionary" })).toHaveAttribute(
      "data-floating",
      "true",
    );
  });

  it("renders a friendly not-found message without retry", () => {
    renderPopover({ entry: null, word: "b" });

    expect(screen.getByText("We couldn't find “b” in the dictionary.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });

  it("renders retryable errors and calls retry", () => {
    const { onRetry } = renderPopover({ error: new Error("R2 unavailable") });

    expect(
      screen.getByText("We couldn't load this definition right now. Please try again."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders an entry header and its scrollable content", () => {
    renderPopover({ entry });

    expect(screen.getByRole("heading", { level: 2, name: "a" })).toBeInTheDocument();
    expect(screen.getByText("Etymology 1")).toBeInTheDocument();
    expect(document.querySelector(".overlay-scroll-hide")).toBeInTheDocument();
  });
});
