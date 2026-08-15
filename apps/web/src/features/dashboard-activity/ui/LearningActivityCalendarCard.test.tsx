import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LEARNING_ACTIVITY_TYPES } from "@/entities/learning-activity";
import { setLocalePreference } from "@/shared/i18n";
import { LocaleProvider } from "@/shared/lib/providers";
import { LearningActivityCalendarCard } from "./LearningActivityCalendarCard";

vi.mock("../lib/learningActivityCalendar", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../lib/learningActivityCalendar")>();
  return {
    ...actual,
    // Freeze "today" so streak/minutes assertions stay stable.
    getVietnamDateKey: () => "2026-07-15",
    getNavigableLearningActivityPeriods: () => ["2026-1", "2026-2"],
  };
});

const sampleDays = [
  {
    activityType: LEARNING_ACTIVITY_TYPES.TEST_PRACTICE,
    learnedOn: "2026-07-15",
    seconds: 125,
  },
  {
    activityType: LEARNING_ACTIVITY_TYPES.VOCABULARY_REVIEW,
    learnedOn: "2026-07-15",
    seconds: 300,
  },
  {
    activityType: LEARNING_ACTIVITY_TYPES.DICTATION,
    learnedOn: "2026-07-14",
    seconds: 60,
  },
];

function renderCard(
  props: Partial<React.ComponentProps<typeof LearningActivityCalendarCard>> = {},
) {
  return render(
    <LocaleProvider>
      <LearningActivityCalendarCard
        calendar={{ days: sampleDays }}
        isLoading={false}
        {...props}
      />
    </LocaleProvider>,
  );
}

describe("LearningActivityCalendarCard", () => {
  beforeEach(() => {
    setLocalePreference("en");
  });

  afterEach(() => {
    setLocalePreference("en");
  });

  it("renders overview metrics for loaded calendar data", () => {
    renderCard();

    expect(screen.getByText("Learning overview")).toBeInTheDocument();
    expect(screen.getByText("Study activity")).toBeInTheDocument();
    expect(screen.getByText("Current streak")).toBeInTheDocument();
    expect(screen.getByText("Study time")).toBeInTheDocument();
    expect(screen.getByText("minutes")).toBeInTheDocument();
    // 125 + 300 seconds on 2026-07-15 → 7 minutes
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("Experience")).toBeInTheDocument();
    expect(screen.getByText("Ranking")).toBeInTheDocument();
  });

  it("shows the calendar loading skeleton", () => {
    renderCard({ calendar: null, isLoading: true });

    expect(
      screen.getByLabelText("Loading study activity"),
    ).toBeInTheDocument();
    expect(screen.getByText("Current streak").parentElement).toHaveTextContent(
      "0",
    );
  });

  it("renders intensity legend labels", () => {
    renderCard();

    expect(screen.getByText("Less")).toBeInTheDocument();
    expect(screen.getByText("More")).toBeInTheDocument();
    expect(screen.getByLabelText("No study activity")).toBeInTheDocument();
    expect(screen.getByLabelText("1–15 minutes")).toBeInTheDocument();
    expect(screen.getByLabelText("16–30 minutes")).toBeInTheDocument();
    expect(screen.getByLabelText("31–60 minutes")).toBeInTheDocument();
    expect(screen.getByLabelText("Over 60 minutes")).toBeInTheDocument();
  });

  it("navigates between periods when available", async () => {
    const user = userEvent.setup();
    renderCard();

    const previous = screen.getByRole("button", { name: "Previous period" });
    expect(previous).toBeEnabled();
    await user.click(previous);

    expect(screen.getByRole("button", { name: "Next period" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Next period" }));
    expect(
      screen.getByRole("button", { name: "Previous period" }),
    ).toBeInTheDocument();
  });

  it("shows a day tooltip with total and largest mode on hover", async () => {
    renderCard();

    const activeDay = screen.getByRole("img", {
      name: /Wednesday, Jul 15, 7 minutes/i,
    });
    fireEvent.pointerEnter(activeDay);

    // Portal tooltip on document.body
    expect(await screen.findByText("All")).toBeInTheDocument();
    // 125 + 300 = 425s → 7 minutes total; review mode 300s → 5 minutes is largest
    expect(screen.getByText("7 minutes")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
    expect(screen.getByText("5 minutes")).toBeInTheDocument();

    fireEvent.pointerLeave(activeDay);
    expect(screen.queryByText("All")).not.toBeInTheDocument();
  });

  it("does not open a tooltip for out-of-period day cells", () => {
    renderCard();

    const hiddenDays = document.querySelectorAll('[aria-hidden="true"].size-4');
    expect(hiddenDays.length).toBeGreaterThan(0);

    fireEvent.pointerEnter(hiddenDays[0]!);
    expect(screen.queryByText("All")).not.toBeInTheDocument();
  });

  it("repositions the day tooltip on resize and scroll", async () => {
    renderCard();

    const activeDay = screen.getByRole("img", {
      name: /Wednesday, Jul 15, 7 minutes/i,
    });
    fireEvent.pointerEnter(activeDay);
    await screen.findByText("All");

    fireEvent(window, new Event("resize"));
    fireEvent(window, new Event("scroll", { bubbles: true }));

    expect(screen.getByText("All")).toBeInTheDocument();
  });

  it("covers intensity bands through legend swatches", () => {
    renderCard();

    const legendItems = [
      "No study activity",
      "1–15 minutes",
      "16–30 minutes",
      "31–60 minutes",
      "Over 60 minutes",
    ];

    for (const label of legendItems) {
      const swatch = screen.getByLabelText(label);
      const fill = swatch.querySelector("[aria-hidden='true']");
      expect(fill).not.toBeNull();
      expect(fill).toHaveAttribute("style");
      expect(fill?.getAttribute("style")).toMatch(/background/i);
    }
  });

  it("formats Vietnamese day labels and durations", async () => {
    setLocalePreference("vi");
    renderCard();

    // Vietnamese weekday axis labels
    expect(screen.getByText("Thứ 2")).toBeInTheDocument();
    expect(screen.getByText("Thứ 4")).toBeInTheDocument();
    expect(screen.getByText("Thứ 6")).toBeInTheDocument();

    const activeDay = screen.getByRole("img", {
      name: /15 thg 7/i,
    });
    fireEvent.pointerEnter(activeDay);

    expect(await screen.findByText("Tất cả")).toBeInTheDocument();
    expect(screen.getByText("7 phút")).toBeInTheDocument();
    expect(screen.getByText("Ôn từ vựng")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Kỳ học trước" }),
    ).toBeInTheDocument();
  });

  it("renders period range title for the current half-year", () => {
    renderCard();

    // 2026-2 → Jul to Dec 2026
    expect(screen.getByText(/Jul to Dec 2026/i)).toBeInTheDocument();
  });

  it("shows month labels for weeks that start a month", () => {
    renderCard();

    // July start of second half-year period
    expect(screen.getByText("Jul")).toBeInTheDocument();
  });
});
