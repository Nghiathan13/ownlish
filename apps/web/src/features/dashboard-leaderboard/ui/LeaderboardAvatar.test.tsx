import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LeaderboardAvatar } from "./LeaderboardAvatar";

describe("LeaderboardAvatar", () => {
  it("renders the learner icon when no avatar URL is available", () => {
    render(<LeaderboardAvatar avatarUrl={null} />);

    expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
  });

  it("falls back to the learner icon when its remote image fails", () => {
    render(<LeaderboardAvatar avatarUrl="https://assets.example/avatar.png" />);

    const image = screen.getByRole("presentation");
    fireEvent.error(image);

    expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
  });
});
