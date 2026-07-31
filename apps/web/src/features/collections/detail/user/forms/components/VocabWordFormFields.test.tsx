import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EMPTY_VOCAB_WORD_FORM_VALUES } from "@/features/collections/detail/user/forms/lib/vocabWordForm";
import { LocaleProvider } from "@/shared/providers/LocaleProvider";
import { VocabWordFormFields } from "./VocabWordFormFields";

describe("VocabWordFormFields", () => {
  it("keeps word metadata visible and collapses the long-form fields by default", () => {
    const onChange = vi.fn();
    const { container } = render(
      <LocaleProvider>
        <VocabWordFormFields
          onChange={onChange}
          values={EMPTY_VOCAB_WORD_FORM_VALUES}
        />
      </LocaleProvider>,
    );

    const details = container.querySelector("details");

    expect(
      [...container.querySelectorAll("label")]
        .slice(0, 5)
        .map((label) => label.childNodes[0]?.textContent?.trim()),
    ).toEqual([
      "Word",
      "Vietnamese meaning",
      "Type",
      "IPA UK",
      "IPA US",
    ]);
    expect(screen.getByText("More details")).toBeInTheDocument();
    expect(details).not.toHaveAttribute("open");
    expect(details?.querySelector("summary svg")).toBeInTheDocument();
    expect(
      [...(details?.querySelectorAll("label") ?? [])].map((label) =>
        label.childNodes[0]?.textContent?.trim(),
      ),
    ).toEqual(["Definition", "Example", "Vietnamese example"]);
    expect(details?.querySelector('[role="group"]')).toHaveAttribute(
      "aria-label",
      "Band",
    );
    expect(details?.querySelectorAll('[role="group"] button')).toHaveLength(6);
    expect(screen.getByRole("button", { name: "C2" })).toHaveClass(
      "hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]",
    );

    fireEvent.click(screen.getByRole("button", { name: "C2" }));

    expect(onChange).toHaveBeenCalledWith("band", "C2");
  });
});
