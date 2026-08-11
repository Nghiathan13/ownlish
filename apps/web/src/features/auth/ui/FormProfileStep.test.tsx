import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/providers/LocaleProvider";
import { FormProfileStep } from "./FormProfileStep";

function renderProfileStep(
  overrides: Partial<Parameters<typeof FormProfileStep>[0]> = {},
) {
  const props = {
    error: null as string | null,
    isSubmitting: false,
    name: "",
    onNameChange: vi.fn(),
    onSubmit: vi.fn((event: { preventDefault: () => void }) => {
      event.preventDefault();
    }),
    ...overrides,
  };

  return {
    props,
    ...render(
      <LocaleProvider>
        <FormProfileStep {...props} />
      </LocaleProvider>,
    ),
  };
}

describe("FormProfileStep", () => {
  it("disables finish when the name is empty or whitespace-only", () => {
    const { rerender, props } = renderProfileStep({ name: "" });

    expect(screen.getByRole("button", { name: "Finish" })).toBeDisabled();

    rerender(
      <LocaleProvider>
        <FormProfileStep {...props} name="   " />
      </LocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "Finish" })).toBeDisabled();

    rerender(
      <LocaleProvider>
        <FormProfileStep {...props} name="Linh" />
      </LocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "Finish" })).toBeEnabled();
  });

  it("forwards name changes and form submit", async () => {
    const user = userEvent.setup();
    const { props } = renderProfileStep({ name: "Linh" });

    await user.type(screen.getByLabelText("Name"), "a");
    expect(props.onNameChange).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Finish" }));
    expect(props.onSubmit).toHaveBeenCalled();
  });

  it("shows an error alert and submitting label", () => {
    renderProfileStep({
      name: "Linh",
      error: "Name is required.",
      isSubmitting: true,
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Name is required.");
    expect(
      screen.getByRole("button", { name: "Please wait..." }),
    ).toBeDisabled();
  });

  it("shows the profile description copy", () => {
    renderProfileStep();

    expect(
      screen.getByText("Tell us what we should call you."),
    ).toBeInTheDocument();
  });
});
