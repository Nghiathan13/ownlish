import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { LandingPage } from "./LandingPage";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  useAuthSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

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

vi.mock("@/entities/session", () => ({
  isAuthenticatedStatus: (status: string) => status === "authenticated",
  isLoadingStatus: (status: string) => status === "loading",
  useAuthSession: mocks.useAuthSession,
}));

vi.mock("@/shared/skeletons", () => ({
  SessionLoadingSkeleton: () => <div data-testid="session-loading" />,
}));

function mockMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function renderLandingPage() {
  return render(
    <LocaleProvider>
      <LandingPage />
    </LocaleProvider>,
  );
}

describe("landing page", () => {
  beforeEach(() => {
    mockMatchMedia();
    mocks.replace.mockReset();
    mocks.useAuthSession.mockReset();
  });

  it("shows a loading spinner while the session is restoring", () => {
    mocks.useAuthSession.mockReturnValue({ status: "loading" });

    renderLandingPage();

    expect(screen.getByTestId("session-loading")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Grow your vocabulary/i }),
    ).not.toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("redirects authenticated users to my activity", async () => {
    mocks.useAuthSession.mockReturnValue({ status: "authenticated" });

    renderLandingPage();

    expect(screen.getByTestId("session-loading")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Grow your vocabulary/i }),
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith("/dashboard/my-activity");
    });
  });

  it("renders the guest landing sections and login CTAs", () => {
    mocks.useAuthSession.mockReturnValue({ status: "guest" });

    renderLandingPage();

    expect(
      screen.getByRole("heading", { name: /Grow your vocabulary/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Build vocabulary that sticks." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Try a real Part 3 conversation.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Organize your vocabulary" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("landing-part3-audio")).toHaveAttribute(
      "src",
      "/landing/part3-sample.mp3",
    );
    expect(
      screen.getByRole("img", {
        name: "Part 3 graphic for questions 68 to 70",
      }),
    ).toHaveAttribute("data-src", "/landing/part3-sample.avif");
    expect(
      screen.getByRole("img", {
        name: "Ownlish collections page with vocabulary table",
      }),
    ).toHaveAttribute("data-src", "/collection_page.png");

    const getStartedLinks = screen.getAllByRole("link", { name: "Get started" });
    expect(getStartedLinks.length).toBeGreaterThanOrEqual(2);
    for (const link of getStartedLinks) {
      expect(link).toHaveAttribute("href", "/login");
    }

    expect(screen.getByRole("link", { name: "TikTok" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Facebook" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "YouTube" })).toBeInTheDocument();
    expect(screen.getByText(`© ${new Date().getFullYear()} Ownlish`)).toBeInTheDocument();
    expect(screen.queryByTestId("session-loading")).not.toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
