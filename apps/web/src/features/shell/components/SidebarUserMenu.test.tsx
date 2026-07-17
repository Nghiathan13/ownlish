import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SidebarUserMenu } from "./SidebarUserMenu";

describe("SidebarUserMenu", () => {
  it("shows a Google avatar and falls back to the account icon when it fails", () => {
    render(
      <SidebarUserMenu
        collapsed={false}
        onLogout={vi.fn()}
        user={{
          id: "user-1",
          email: "user@example.com",
          name: "Google User",
          avatarUrl: "https://lh3.googleusercontent.com/avatar",
          role: "USER",
        }}
      />,
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
});
