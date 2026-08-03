import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "@/shared/providers/LocaleProvider";
import { SidebarLocaleToggle } from "./SidebarLocaleToggle";

describe("SidebarLocaleToggle", () => {
  beforeEach(() => {
    localStorage.removeItem("engvocab-locale");
    document.documentElement.lang = "en";
  });

  it("shows the Vietnamese action and switches to vi", () => {
    render(
      <LocaleProvider>
        <SidebarLocaleToggle collapsed={false} />
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
    localStorage.setItem("engvocab-locale", "vi");
    document.documentElement.lang = "vi";

    render(
      <LocaleProvider>
        <SidebarLocaleToggle collapsed />
      </LocaleProvider>,
    );

    expect(
      screen.getByRole("button", { name: "Chuyển sang tiếng Anh" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Chuyển sang tiếng Anh")).toBeInTheDocument();
    expect(screen.queryByText("Tiếng Anh")).not.toBeInTheDocument();
  });
});
