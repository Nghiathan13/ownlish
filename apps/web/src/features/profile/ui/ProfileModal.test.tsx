import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@/entities/auth/types";

const updateProfileMock = vi.fn();

import { ProfileModal } from "./ProfileModal";

const user: AuthUser = {
  id: "user-id",
  email: "user@example.com",
  name: "Original User",
  avatarUrl: null,
  role: "USER",
};

describe("ProfileModal", () => {
  beforeEach(() => {
    updateProfileMock.mockReset();
  });

  it("saves the changed display name without a header close button", async () => {
    const onClose = vi.fn();
    updateProfileMock.mockResolvedValue(undefined);

    const { container } = render(
      <ProfileModal
        onClose={onClose}
        onSave={updateProfileMock}
        user={user}
      />,
    );

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByText("Email")).toBeNull();
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Updated User" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await vi.waitFor(() => {
      expect(updateProfileMock).toHaveBeenCalledWith({
        name: "Updated User",
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
