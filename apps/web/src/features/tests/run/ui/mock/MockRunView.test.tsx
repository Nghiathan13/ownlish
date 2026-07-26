import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ToeicQuestionGroup } from "@/features/tests/shared/api/types";
import { MockRunView } from "@/features/tests/run/ui/mock/MockRunView";
import { LocaleProvider } from "@/shared/providers/LocaleProvider";

const mocks = vi.hoisted(() => ({
  registerExit: vi.fn(),
  registerFinish: vi.fn(),
  useMockTestRun: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/features/tests/run/model/mock/useMockTestRun", () => ({
  useMockTestRun: mocks.useMockTestRun,
}));

vi.mock("@/features/shell/providers/ImmersiveToolbarProvider", () => ({
  useImmersiveBilingual: () => null,
  useRegisterImmersiveExit: mocks.registerExit,
  useRegisterImmersiveFinish: mocks.registerFinish,
}));

const group: ToeicQuestionGroup = {
  id: 11,
  partNumber: 1,
  questionStart: 1,
  questionEnd: 1,
  groupStatus: null,
  groupType: null,
  accent: null,
  content: null,
  contentVi: null,
  audioUrl: "https://example.com/audio.mp3",
  audioUrlExpiresAt: null,
  imageUrl: "https://example.com/image.png",
  imageUrlExpiresAt: null,
  questions: [
    {
      id: 101,
      questionNumber: 1,
      sessionQuestionNumber: 1,
      question: null,
      questionVi: "Bản dịch câu hỏi",
      options: {
        A: "Alpha",
        B: "Beta",
        C: null,
        D: null,
        A_vi: null,
        B_vi: null,
        C_vi: null,
        D_vi: null,
      },
      optionCount: 2,
      answerKey: "B",
      selectedKey: "A",
      status: "selected",
      isCorrect: null,
    },
  ],
};

function createMockRunState(isFinishAccepted: boolean) {
  return {
    closeFinishFailure: vi.fn(),
    closeResult: vi.fn(),
    correctCount: 0,
    finishError: null,
    finishRun: vi.fn(),
    groups: [group],
    hasPendingAnswers: false,
    hasSyncFailures: false,
    isFinishAccepted,
    isFinishFailureOpen: false,
    isFinished: false,
    isTimerExpired: false,
    isFinishing: false,
    isLoading: false,
    isQuestionPending: () => false,
    isResultOpen: false,
    loadError: null,
    retryFailedAnswers: vi.fn(),
    selectAnswer: vi.fn(),
    series: "ets_26",
    testNumber: 1,
    totalQuestions: 1,
    timerLabel: "00:10:00",
    wrongCount: 1,
    year: 2024,
  };
}

describe("MockRunView", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mocks.registerExit.mockClear();
    mocks.registerFinish.mockClear();
    mocks.useMockTestRun.mockReset();
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  });

  it("enters review immediately after Finish is accepted without remounting media", () => {
    mocks.useMockTestRun.mockReturnValue(createMockRunState(false));
    const { container, rerender } = render(
      <LocaleProvider>
        <MockRunView sessionId="mock-1" />
      </LocaleProvider>,
    );
    const image = screen.getByRole("img", { name: "Question 1" });

    expect(container.querySelector("audio")).toHaveAttribute(
      "src",
      "https://example.com/audio.mp3",
    );
    expect(screen.getByRole("button", { name: /^A\b/i })).toBeEnabled();

    mocks.useMockTestRun.mockReturnValue(createMockRunState(true));
    rerender(
      <LocaleProvider>
        <MockRunView sessionId="mock-1" />
      </LocaleProvider>,
    );

    expect(container.querySelector("audio")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Question 1" })).toBe(image);
    expect(screen.queryByRole("button", { name: /^A\b/i })).not.toBeInTheDocument();
    expect(mocks.registerFinish).toHaveBeenLastCalledWith(null, null, {
      disabled: false,
      isPending: false,
      timerLabel: null,
    });
    expect(mocks.registerExit).toHaveBeenLastCalledWith(
      expect.any(Function),
      "ETS 2024 · Test 1",
      expect.any(String),
      { showBilingualAction: true },
    );
  });
});
