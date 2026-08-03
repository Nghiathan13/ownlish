"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { type LearningActivityCalendar } from "@/entities/learning-activity";
import {
  getCurrentLearningStreak,
  getLearningActivityPeriod,
  getLearningActivityPeriods,
  getLearningActivitySecondsByDate,
  getVietnamDateKey,
} from "@/features/home/lib/learningActivityCalendar";
import { classNames } from "@/shared/lib/classNames";
import { useLocale } from "@/shared/providers/LocaleProvider";
import { Tooltip } from "@/shared/ui/Tooltip";
import { FireIcon } from "@/shared/ui/icons/FireIcon";
import { ExperienceIcon } from "@/shared/ui/icons/ExperienceIcon";
import { ScheduleIcon } from "@/shared/ui/icons/ScheduleIcon";
import { TrophyIcon } from "@/shared/ui/icons/TrophyIcon";

const weekdayAxisLabels = {
  en: ["Mon", "Wed", "Fri"],
  vi: ["Thứ 2", "Thứ 4", "Thứ 6"],
} as const;

const activityLegend = [
  { label: "dashboard.activityNone", maxSeconds: 0 },
  { label: "dashboard.activity1To15", maxSeconds: 15 * 60 },
  { label: "dashboard.activity16To30", maxSeconds: 30 * 60 },
  { label: "dashboard.activity31To60", maxSeconds: 60 * 60 },
  { label: "dashboard.activityOver60", maxSeconds: Number.POSITIVE_INFINITY },
] as const;

const periodButtonClassName =
  "inline-flex shrink-0 items-center justify-center rounded-lg px-3 py-1.5 text-[15px] leading-[20px] font-normal";

function getPeriodButtonClassName(isActive: boolean) {
  return classNames(
    periodButtonClassName,
    isActive
      ? "bg-foreground text-background hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]"
      : "bg-[#f0f0f0] text-foreground hover:[box-shadow:inset_0_0_0_9999px_rgba(0,0,0,0.06)] dark:bg-surface dark:hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]",
  );
}

function getIntensityStyle(seconds: number) {
  if (seconds === 0) {
    return {
      backgroundColor:
        "color-mix(in srgb, var(--foreground) 12%, var(--background))",
    };
  }

  if (seconds <= 15 * 60) {
    return {
      backgroundColor:
        "color-mix(in srgb, var(--primary) 20%, var(--surface))",
    };
  }

  if (seconds <= 30 * 60) {
    return {
      backgroundColor:
        "color-mix(in srgb, var(--primary) 40%, var(--surface))",
    };
  }

  if (seconds <= 60 * 60) {
    return {
      backgroundColor:
        "color-mix(in srgb, var(--primary) 65%, var(--surface))",
    };
  }

  return { backgroundColor: "var(--primary)" };
}

type CalendarDay = {
  day: number;
  isInPeriod: boolean;
  month: number;
  year: number;
};

type DayTooltip = {
  anchor: HTMLSpanElement;
  dateLabel: string;
  durations: Array<{ label: string; value: string }>;
};

function getPeriodWeeks(period: string) {
  const [year, periodNumber] = period.split("-").map(Number);
  const firstMonthIndex = periodNumber === 1 ? 0 : 6;
  const start = new Date(Date.UTC(year, firstMonthIndex, 1));
  const end = new Date(Date.UTC(year, firstMonthIndex + 6, 0));
  const firstSunday = new Date(start);
  firstSunday.setUTCDate(firstSunday.getUTCDate() - firstSunday.getUTCDay());
  const lastSaturday = new Date(end);
  lastSaturday.setUTCDate(
    lastSaturday.getUTCDate() + (6 - lastSaturday.getUTCDay()),
  );
  const weeks: CalendarDay[][] = [];

  for (
    const weekStart = new Date(firstSunday);
    weekStart <= lastSaturday;
    weekStart.setUTCDate(weekStart.getUTCDate() + 7)
  ) {
    weeks.push(
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(weekStart);
        date.setUTCDate(date.getUTCDate() + index);

        return {
          day: date.getUTCDate(),
          isInPeriod: date >= start && date <= end,
          month: date.getUTCMonth() + 1,
          year: date.getUTCFullYear(),
        };
      }),
    );
  }

  return weeks;
}

function formatMonth(month: number, locale: "en" | "vi") {
  if (locale === "vi") {
    return `Thg ${month}`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2026, month - 1, 1)));
}

function formatPeriod(period: string, locale: "en" | "vi") {
  const [year, periodNumber] = period.split("-");

  return locale === "vi"
    ? `Kỳ ${periodNumber} - ${year}`
    : `Term ${periodNumber} - ${year}`;
}

function LearningActivityDayTooltip({ tooltip }: { tooltip: DayTooltip | null }) {
  const [tooltipElement, setTooltipElement] = useState<HTMLSpanElement | null>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!tooltip || !tooltipElement) return;
    const activeAnchor = tooltip.anchor;
    const activeTooltipElement = tooltipElement;

    function updatePosition() {
      const anchorRect = activeAnchor.getBoundingClientRect();
      const tooltipRect = activeTooltipElement.getBoundingClientRect();
      const viewportPadding = 8;
      const belowTop = anchorRect.bottom + 8;
      const top =
        belowTop + tooltipRect.height <= window.innerHeight - viewportPadding
          ? belowTop
          : Math.max(viewportPadding, anchorRect.top - tooltipRect.height - 8);
      const left = Math.min(
        Math.max(
          viewportPadding,
          anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2,
        ),
        window.innerWidth - tooltipRect.width - viewportPadding,
      );

      setPosition({ left, top });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [tooltip, tooltipElement]);

  if (!tooltip || typeof document === "undefined") return null;

  return createPortal(
    <span
      aria-hidden
      className="pointer-events-none fixed z-50 w-max rounded-md bg-foreground px-2 py-1 text-center text-xs text-background"
      ref={setTooltipElement}
      style={position ? { left: position.left, top: position.top } : { left: 0, top: 0, visibility: "hidden" }}
    >
      <span className="block font-normal text-background/65">{tooltip.dateLabel}</span>
      <span className="mt-1 grid gap-0.5 text-left">
        {tooltip.durations.map(({ label, value }) => (
          <span className="flex gap-3" key={label}>
            <span className="text-background/65">{label}</span>
            <span className="ml-auto font-semibold text-background">{value}</span>
          </span>
        ))}
      </span>
    </span>,
    document.body,
  );
}

export function LearningActivityCalendarCard({
  calendar,
  isLoading,
}: {
  calendar: LearningActivityCalendar | null;
  isLoading: boolean;
}) {
  const { locale, t } = useLocale();
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [dayTooltip, setDayTooltip] = useState<DayTooltip | null>(null);
  const activityDays = calendar?.days ?? [];
  const availablePeriods = getLearningActivityPeriods(activityDays);
  const period =
    selectedPeriod ??
    availablePeriods[0] ??
    getLearningActivityPeriod(getVietnamDateKey());
  const activityByDay = getLearningActivitySecondsByDate(activityDays);
  const activityByMode = [
    {
      label: t("dashboard.activityModePractice"),
      secondsByDay: getLearningActivitySecondsByDate(activityDays, "practice"),
    },
    {
      label: t("dashboard.activityModePartPractice"),
      secondsByDay: getLearningActivitySecondsByDate(activityDays, "part_practice"),
    },
    {
      label: t("dashboard.activityModeMock"),
      secondsByDay: getLearningActivitySecondsByDate(activityDays, "mock"),
    },
    {
      label: t("dashboard.activityModeDictation"),
      secondsByDay: getLearningActivitySecondsByDate(activityDays, "dictation"),
    },
    {
      label: t("dashboard.activityModeReview"),
      secondsByDay: getLearningActivitySecondsByDate(activityDays, "review"),
    },
  ];
  const weeks = getPeriodWeeks(period);
  const currentStreak = getCurrentLearningStreak(activityDays);
  const todayStudyMinutes = Math.floor(
    (activityByDay.get(getVietnamDateKey()) ?? 0) / 60,
  );
  const weekdayAxis = [
    "",
    weekdayAxisLabels[locale][0],
    "",
    weekdayAxisLabels[locale][1],
    "",
    weekdayAxisLabels[locale][2],
    "",
  ];

  return (
    <section>
      <div className="flex w-full flex-wrap items-stretch gap-3">
        <div className="grid min-w-[250px] shrink-0 grow grid-cols-2 gap-3 max-[419px]:grid-cols-1">
          <LearningActivityMetricCard
            icon={<FireIcon className="size-7" />}
            iconBackgroundClassName="bg-streak-background"
            iconClassName="text-streak"
            label={t("dashboard.currentStreak")}
            suffix={t("dashboard.days")}
            value={currentStreak}
          />
          <LearningActivityMetricCard
            icon={<ScheduleIcon className="size-7" />}
            iconBackgroundClassName="bg-information-background"
            iconClassName="text-primary"
            label={t("dashboard.studyTime")}
            suffix={t("dashboard.minutes")}
            value={todayStudyMinutes}
          />
          <LearningActivityMetricCard
            icon={<ExperienceIcon className="size-7" />}
            iconBackgroundClassName="bg-success-background"
            iconClassName="text-success"
            label={t("dashboard.experience")}
            suffix={t("dashboard.comingSoon")}
            value="—"
          />
          <LearningActivityMetricCard
            icon={<TrophyIcon className="size-7" />}
            iconBackgroundClassName="bg-warning-background"
            iconClassName="text-warning"
            label={t("dashboard.ranking")}
            suffix={t("dashboard.comingSoon")}
            value="—"
          />
        </div>

        <div className="ml-auto flex min-w-0 max-w-full shrink-0 items-stretch gap-3 max-[640px]:w-full max-[640px]:flex-col-reverse">
          <article className="min-w-0 w-fit max-w-full rounded-2xl border border-border bg-surface p-4 dark:bg-background max-[640px]:w-full">
            {isLoading ? (
              <CalendarSkeleton />
            ) : (
              <div className="overflow-x-auto pb-2">
                <div className="flex w-max gap-3">
                  <div className="grid grid-rows-7 gap-1 pt-6 text-xs font-medium leading-4 text-foreground">
                    {Array.from({ length: 7 }, (_, index) => (
                      <span key={index}>{weekdayAxis[index]}</span>
                    ))}
                  </div>
                  <div>
                    <div className="grid h-4 grid-flow-col auto-cols-[1rem] gap-1">
                      {weeks.map((week, index) => {
                        const monthStart = week.find(
                          (day) => day.isInPeriod && day.day === 1,
                        );

                        return (
                          <span className="relative" key={index}>
                            {monthStart ? (
                              <span className="absolute left-0 whitespace-nowrap text-xs font-medium text-foreground">
                                {formatMonth(monthStart.month, locale)}
                              </span>
                            ) : null}
                          </span>
                        );
                      })}
                    </div>
                    <div className="mt-2 grid grid-flow-col grid-rows-7 auto-cols-[1rem] gap-1">
                      {weeks.flatMap((week) =>
                        week.map((day) => {
                          const seconds = day.isInPeriod
                            ? (activityByDay.get(getCalendarDayKey(day)) ?? 0)
                            : 0;

                          return (
                            <span
                              aria-hidden={day.isInPeriod ? undefined : true}
                              aria-label={
                                day.isInPeriod
                                  ? `${formatDayLabel(day, locale)}, ${formatActivityDuration(seconds, locale)}`
                                  : undefined
                              }
                              className="size-4 rounded-sm"
                              key={`${day.month}-${day.day}`}
                              onPointerEnter={(event) => {
                                if (!day.isInPeriod) return;
                                const dayKey = getCalendarDayKey(day);
                                const largestMode = activityByMode.reduce<{
                                  label: string;
                                  seconds: number;
                                } | null>((current, { label, secondsByDay }) => {
                                  const modeSeconds = secondsByDay.get(dayKey) ?? 0;

                                  return modeSeconds > (current?.seconds ?? 0)
                                    ? { label, seconds: modeSeconds }
                                    : current;
                                }, null);

                                setDayTooltip({
                                  anchor: event.currentTarget,
                                  dateLabel: formatDayLabel(day, locale),
                                  durations: [
                                    {
                                      label: t("dashboard.activityModeAll"),
                                      value: formatActivityDuration(seconds, locale),
                                    },
                                    ...(largestMode
                                      ? [{
                                          label: largestMode.label,
                                          value: formatActivityDuration(
                                            largestMode.seconds,
                                            locale,
                                          ),
                                        }]
                                      : []),
                                  ],
                                });
                              }}
                              onPointerLeave={() => setDayTooltip(null)}
                              role={day.isInPeriod ? "img" : undefined}
                              style={
                                day.isInPeriod
                                  ? getIntensityStyle(seconds)
                                  : undefined
                              }
                            />
                          );
                        }),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-2 flex w-full items-center justify-end gap-2 text-xs text-muted-foreground">
              <span>{t("dashboard.activityLess")}</span>
              {activityLegend.map((entry) => (
                <span
                  aria-label={t(entry.label)}
                  className="group/icon-button relative block size-4 rounded-sm"
                  key={entry.label}
                  role="img"
                >
                  <span
                    aria-hidden="true"
                    className="block size-full rounded-sm"
                    style={getIntensityStyle(entry.maxSeconds)}
                  />
                  <Tooltip group="icon-button" placement="bottom">
                    {t(entry.label)}
                  </Tooltip>
                </span>
              ))}
              <span>{t("dashboard.activityMore")}</span>
            </div>
          </article>

          {availablePeriods.length ? (
            <div
              aria-label={t("dashboard.activityPeriod")}
              className="flex w-fit shrink-0 flex-col gap-3 max-[640px]:w-full max-[640px]:flex-row max-[640px]:flex-wrap"
            >
            {availablePeriods.map((value) => {
              const isActive = value === period;

              return (
                <button
                  aria-pressed={isActive}
                  className={getPeriodButtonClassName(isActive)}
                  key={value}
                  onClick={() => setSelectedPeriod(value)}
                  type="button"
                >
                  {formatPeriod(value, locale)}
                </button>
              );
            })}
            </div>
          ) : null}
        </div>
      </div>
      <LearningActivityDayTooltip tooltip={dayTooltip} />
    </section>
  );
}

function LearningActivityMetricCard({
  icon,
  iconBackgroundClassName = "bg-information-background",
  iconClassName = "text-primary",
  label,
  suffix,
  value,
}: {
  icon: ReactNode;
  iconBackgroundClassName?: string;
  iconClassName?: string;
  label: string;
  suffix?: string;
  value: number | string;
}) {
  return (
    <article className="flex min-h-24 flex-1 items-center gap-4 rounded-2xl border border-border bg-surface p-4 dark:bg-background">
      <span
        className={classNames(
          "inline-flex size-12 shrink-0 items-center justify-center rounded-xl",
          iconBackgroundClassName,
          iconClassName,
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl tracking-tight tabular-nums">
          <span className="font-mono font-semibold">{value}</span>
          {suffix ? <span className="ml-1 text-base">{suffix}</span> : null}
        </p>
      </div>
    </article>
  );
}

function CalendarSkeleton() {
  return (
    <div className="overflow-x-auto pb-2" aria-label="Loading study activity">
      <div className="grid w-max grid-flow-col grid-rows-7 auto-cols-[1rem] gap-1">
        {Array.from({ length: 189 }, (_, index) => (
          <span className="size-4 rounded-sm bg-muted" key={index} />
        ))}
      </div>
    </div>
  );
}

function formatDayLabel(
  day: Pick<CalendarDay, "day" | "month" | "year">,
  locale: "en" | "vi",
) {
  if (locale === "vi") {
    const weekday = [
      "Chủ nhật",
      "Thứ 2",
      "Thứ 3",
      "Thứ 4",
      "Thứ 5",
      "Thứ 6",
      "Thứ 7",
    ][new Date(Date.UTC(day.year, day.month - 1, day.day)).getUTCDay()];

    return `${weekday}, ${day.day} thg ${day.month}`;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    weekday: "long",
  }).format(new Date(Date.UTC(day.year, day.month - 1, day.day)));
}

function getCalendarDayKey(day: Pick<CalendarDay, "day" | "month" | "year">) {
  return `${day.year}-${String(day.month).padStart(2, "0")}-${String(day.day).padStart(2, "0")}`;
}

function formatActivityDuration(seconds: number, locale: "en" | "vi") {
  const minutes = Math.floor(seconds / 60);

  return locale === "vi" ? `${minutes} phút` : `${minutes} minutes`;
}
