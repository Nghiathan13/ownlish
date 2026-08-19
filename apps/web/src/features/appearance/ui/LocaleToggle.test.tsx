import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { LocaleToggle } from "./LocaleToggle";

describe("LocaleToggle", () => {
  beforeEach(() => {
    localStorage.removeItem("ownlish-locale");
    document.documentElement.lang = "en";
  });

  it("shows the Vietnamese action and switches to vi", () => {
    render(
      <LocaleProvider>
        <LocaleToggle collapsed={false} variant="sidebar" />
      </LocaleProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Vietnamese: Switch to Vietnamese",
      }),
    );

    expect(screen.getByText("Tiếng Anh")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("vi");
  });

  it("shows the English tooltip when collapsed in Vietnamese", () => {
    localStorage.setItem("ownlish-locale", "vi");
    document.documentElement.lang = "vi";

    render(
      <LocaleProvider>
        <LocaleToggle collapsed variant="sidebar" />
      </LocaleProvider>,
    );

    expect(
      screen.getByRole("button", { name: "Chuyển sang tiếng Anh" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Chuyển sang tiếng Anh")).toBeInTheDocument();
    expect(screen.queryByText("Tiếng Anh")).not.toBeInTheDocument();
  });

  it("switches locale from the compact control", () => {
    render(
      <LocaleProvider>
        <LocaleToggle variant="compact" />
      </LocaleProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Switch to Vietnamese" }),
    );

    expect(document.documentElement.lang).toBe("vi");
    expect(screen.getByRole("button", { name: "Chuyển sang tiếng Anh" })).toHaveTextContent(
      "EN",
    );
  });
});
