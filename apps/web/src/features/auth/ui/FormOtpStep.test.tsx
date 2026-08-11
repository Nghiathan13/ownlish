import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { FormOtpStep } from "./FormOtpStep";

function renderOtpStep(
  overrides: Partial<Parameters<typeof FormOtpStep>[0]> = {},
) {
  const props = {
    code: "",
    email: "linh@example.com",
    error: null as string | null,
    isSubmitting: false,
    resendRemainingSeconds: 0,
    onCodeChange: vi.fn(),
    onResend: vi.fn(),
    onSubmit: vi.fn((event: { preventDefault: () => void }) => {
      event.preventDefault();
    }),
    ...overrides,
  };

  return {
    props,
    ...render(
      <LocaleProvider>
        <FormOtpStep {...props} />
      </LocaleProvider>,
    ),
  };
}

describe("FormOtpStep", () => {
  it("shows the instruction, email, and disables verify until complete", () => {
    const { rerender, props } = renderOtpStep({ code: "123" });

    expect(
      screen.getByText("Please enter the 6-digit verification code sent to"),
    ).toBeInTheDocument();
    expect(screen.getByText("linh@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verify code" })).toBeDisabled();

    rerender(
      <LocaleProvider>
        <FormOtpStep {...props} code="123456" />
      </LocaleProvider>,
    );

    expect(screen.getByRole("button", { name: "Verify code" })).toBeEnabled();
  });

  it("forwards code changes, resend, and submit", async () => {
    const user = userEvent.setup();
    const { props, rerender } = renderOtpStep({ code: "" });

    await user.type(screen.getByRole("textbox", { name: "1 / 6" }), "1");
    expect(props.onCodeChange).toHaveBeenCalledWith("1");

    rerender(
      <LocaleProvider>
        <FormOtpStep {...props} code="123456" />
      </LocaleProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Resend code" }));
    expect(props.onResend).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Verify code" }));
    expect(props.onSubmit).toHaveBeenCalled();
  });

  it("renders digit slots from the code prop", () => {
    renderOtpStep({ code: "12" });

    expect(screen.getByText("Didn't receive the code?")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "1 / 6" })).toHaveValue("1");
    expect(screen.getByRole("textbox", { name: "2 / 6" })).toHaveValue("2");
  });

  it("ignores extra digits once the code is already complete", async () => {
    const user = userEvent.setup();
    const { props } = renderOtpStep({ code: "123456" });

    await user.type(screen.getByRole("textbox", { name: "6 / 6" }), "9");

    // Must not wipe or replace the completed code with a single new digit.
    expect(props.onCodeChange).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: "1 / 6" })).toHaveValue("1");
    expect(screen.getByRole("textbox", { name: "6 / 6" })).toHaveValue("6");
  });

  it("shows resend cooldown and disables resend while waiting", () => {
    renderOtpStep({
      code: "123456",
      resendRemainingSeconds: 42,
    });

    const resendButton = screen.getByRole("button", { name: /Resend in 42/ });
    expect(resendButton).toBeDisabled();
  });

  it("shows an error alert and submitting label", () => {
    renderOtpStep({
      code: "123456",
      error: "Invalid code.",
      isSubmitting: true,
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Invalid code.");
    expect(
      screen.getByRole("button", { name: "Please wait..." }),
    ).toBeDisabled();
  });
});
