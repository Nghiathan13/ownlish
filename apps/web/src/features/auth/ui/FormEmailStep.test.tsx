import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { FormEmailStep } from "./FormEmailStep";

vi.mock("./GoogleSignInButton", () => ({
  GoogleSignInButton: ({
    disabled,
    onCode,
    onError,
  }: {
    disabled?: boolean;
    onCode: (code: string) => void;
    onError: (message: string) => void;
  }) => (
    <>
      <button
        disabled={disabled}
        onClick={() => onCode("google-code")}
        type="button"
      >
        Continue with Google
      </button>
      <button
        disabled={disabled}
        onClick={() => onError("Google failed")}
        type="button"
      >
        Trigger Google error
      </button>
    </>
  ),
  isGoogleSignInConfigured: true,
}));

function renderEmailStep(
  overrides: Partial<Parameters<typeof FormEmailStep>[0]> = {},
) {
  const props = {
    email: "",
    error: null as string | null,
    isSubmitting: false,
    onEmailChange: vi.fn(),
    onGoogleCode: vi.fn(),
    onGoogleError: vi.fn(),
    onSubmit: vi.fn((event: { preventDefault: () => void }) => {
      event.preventDefault();
    }),
    ...overrides,
  };

  return {
    props,
    ...render(
      <LocaleProvider>
        <FormEmailStep {...props} />
      </LocaleProvider>,
    ),
  };
}

describe("FormEmailStep", () => {
  it("disables continue when the email is empty and enables it when filled", () => {
    const { rerender, props } = renderEmailStep({ email: "" });

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

    rerender(
      <LocaleProvider>
        <FormEmailStep {...props} email="linh@example.com" />
      </LocaleProvider>,
    );

    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("forwards email changes and form submit", async () => {
    const user = userEvent.setup();
    const { props } = renderEmailStep({ email: "linh@example.com" });

    await user.type(screen.getByPlaceholderText("Email"), "x");
    expect(props.onEmailChange).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(props.onSubmit).toHaveBeenCalled();
  });

  it("shows an error alert and submitting label", () => {
    renderEmailStep({
      email: "linh@example.com",
      error: "Too many requests",
      isSubmitting: true,
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Too many requests");
    expect(
      screen.getByRole("button", { name: "Please wait..." }),
    ).toBeDisabled();
  });

  it("renders Google actions and forwards callbacks", async () => {
    const user = userEvent.setup();
    const { props } = renderEmailStep();

    expect(screen.getByText("OR")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continue with Google" }));
    expect(props.onGoogleCode).toHaveBeenCalledWith("google-code");

    await user.click(screen.getByRole("button", { name: "Trigger Google error" }));
    expect(props.onGoogleError).toHaveBeenCalledWith("Google failed");
  });
});
