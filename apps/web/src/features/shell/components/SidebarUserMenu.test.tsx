import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/providers/LocaleProvider";
import { SidebarUserMenu } from "./SidebarUserMenu";

describe("SidebarUserMenu", () => {
  it("shows a Google avatar and falls back to the account icon when it fails", () => {
    render(
      <LocaleProvider>
        <SidebarUserMenu
          collapsed={false}
          onLogout={vi.fn()}
          onUpdateProfile={vi.fn()}
          user={{
            id: "user-1",
            email: "user@example.com",
            name: "Google User",
            avatarUrl: "https://lh3.googleusercontent.com/avatar",
            role: "USER",
          }}
        />
      </LocaleProvider>,
    );

    const avatar = document.querySelector("img");
    if (!avatar) {
      throw new Error("Expected Google avatar");
    }
    expect(avatar).toHaveAttribute(
      "src",
      "https://lh3.googleusercontent.com/avatar",
    );

    fireEvent.error(avatar);

    expect(document.querySelector("img")).toBeNull();
  });

  it("opens the profile modal from the account menu", () => {
    render(
      <LocaleProvider>
        <SidebarUserMenu
          collapsed={false}
          onLogout={vi.fn()}
          onUpdateProfile={vi.fn()}
          user={{
            id: "user-1",
            email: "user@example.com",
            name: "Profile User",
            avatarUrl: null,
            role: "USER",
          }}
        />
      </LocaleProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Profile User" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Profile" }));

    expect(
      screen.getByRole("heading", { name: "Edit profile" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });
});
