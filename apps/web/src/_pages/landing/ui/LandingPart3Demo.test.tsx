import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { LandingPart3Demo } from "./LandingPart3Demo";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    <span aria-label={alt} data-src={src} role="img" />
  ),
}));

vi.mock("@/shared/ui/AudioPlayer", () => ({
  AudioPlayer: ({ src }: { src: string }) => (
    <audio data-testid="landing-part3-audio" src={src} />
  ),
}));

function renderPart3Demo() {
  return render(
    <LocaleProvider>
      <LandingPart3Demo />
    </LocaleProvider>,
  );
}

async function completeDemo(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Journalists/ }));
  await user.click(screen.getByRole("button", { name: /Site D/ }));
  await user.click(screen.getByRole("button", { name: /Work opportunities/ }));
}

describe("LandingPart3Demo", () => {
  beforeEach(() => {
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 0;
    });
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("keeps the transcript hidden until every question is answered", async () => {
    const user = userEvent.setup();

    renderPart3Demo();

    expect(screen.getByText("Part 3")).toBeInTheDocument();
    expect(screen.getByText("ETS 2024 · Test 1 · Q68–70")).toBeInTheDocument();
    expect(screen.getByText(/Who most likely are the speakers/)).toBeInTheDocument();
    expect(screen.queryByText("Transcript")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Try again" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Journalists/ }));
    await user.click(screen.getByRole("button", { name: /Site D/ }));

    expect(screen.queryByText("Transcript")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Work opportunities/ })).toBeInTheDocument();
  });

  it("reveals grading, transcript, and translations after the last answer", async () => {
    const user = userEvent.setup();

    renderPart3Demo();
    await completeDemo(user);

    expect(screen.getByText("Transcript")).toBeInTheDocument();
    expect(
      screen.getByText(/I'm glad we were assigned to cover the press conference/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Những người nói có khả năng nhất là ai?"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Các nhà báo/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Journalists/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("resets the demo and scrolls back to the section", async () => {
    const user = userEvent.setup();

    renderPart3Demo();
    await completeDemo(user);
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.queryByText("Transcript")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Journalists/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Try again" }),
    ).not.toBeInTheDocument();
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });
});
