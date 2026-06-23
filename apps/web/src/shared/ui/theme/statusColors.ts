export const statusColorClasses = {
  success: {
    text: "text-emerald-700 dark:text-emerald-400",
    background: "bg-emerald-200/30 dark:bg-emerald-900/30",
    border: "border-emerald-700/30 dark:border-emerald-400/30",
    backgroundHover: "hover:bg-emerald-200/30 dark:hover:bg-emerald-900/30",
  },
  danger: {
    text: "text-red-700 dark:text-red-400",
    background: "bg-red-200/30 dark:bg-red-900/30",
    border: "border-red-700/30 dark:border-red-400/30",
    backgroundHover: "hover:bg-red-200/30 dark:hover:bg-red-900/30",
  },
  amber: {
    text: "text-amber-900 dark:text-amber-200",
    background: "bg-amber-200/60 dark:bg-amber-900/60",
    border: "border-amber-900 dark:border-amber-200",
    backgroundHover: "hover:bg-amber-200/60 dark:hover:bg-amber-900/60",
  },
  skyblue: {
    text: "text-sky-600 dark:text-sky-500",
    background: "bg-sky-200/30 dark:bg-sky-900/30",
    border: "border-sky-600 dark:border-sky-500",
    backgroundHover: "hover:bg-sky-200/30 dark:hover:bg-sky-900/30",
  },
} as const;
