import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Field } from "./Field";
import { PageShell } from "./PageShell";
import { Panel } from "./Panel";
import { SelectCheckbox } from "./SelectCheckbox";
import { Skeleton } from "./Skeleton";
import { Textarea } from "./Textarea";
import { TextInput } from "./TextInput";
import { TopRightCountBadge } from "./TopRightCountBadge";

describe("shared primitive UI", () => {
  it("forwards input and textarea attributes with custom classes", () => {
    render(
      <>
        <TextInput aria-label="Name" className="custom-input" name="name" />
        <Textarea aria-label="Note" className="custom-textarea" name="note" />
      </>,
    );

    expect(screen.getByRole("textbox", { name: "Name" })).toHaveAttribute(
      "name",
      "name",
    );
    expect(screen.getByRole("textbox", { name: "Note" })).toHaveClass(
      "custom-textarea",
    );
  });

  it("renders label and div field variants", () => {
    const { rerender } = render(
      <Field label="Email">
        <input />
      </Field>,
    );
    expect(screen.getByText("Email").closest("label")).not.toBeNull();

    rerender(
      <Field as="div" label="Email">
        <input />
      </Field>,
    );
    expect(screen.getByText("Email").closest("div")).not.toBeNull();
  });

  it("renders shell, panel, skeleton and count badge classes", () => {
    const { container } = render(
      <PageShell centered fillViewport className="shell">
        <Panel className="panel">Panel</Panel>
        <Skeleton className="skeleton" />
        <TopRightCountBadge count={3} />
      </PageShell>,
    );

    expect(container.querySelector("main")).toHaveClass("shell", "place-items-center");
    expect(screen.getByText("Panel").closest("section")).toHaveClass("panel");
    expect(container.querySelector(".skeleton")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("3")).toHaveAttribute("aria-hidden", "true");
  });

  it("updates checked and indeterminate checkbox states", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <SelectCheckbox checked={false} indeterminate label="Select all" onChange={onChange} />,
    );
    const checkbox = screen.getByRole("checkbox", { name: "Select all" });
    expect(checkbox).toHaveProperty("indeterminate", true);
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledOnce();

    rerender(<SelectCheckbox checked indeterminate={false} label="Select all" onChange={onChange} />);
    expect(checkbox).toBeChecked();
    expect(checkbox).toHaveProperty("indeterminate", false);
  });
});
