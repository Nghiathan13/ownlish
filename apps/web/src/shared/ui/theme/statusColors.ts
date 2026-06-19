export const statusColorClasses = {
  success: {
    text: "text-emerald-700 dark:text-emerald-400",
    background: "bg-emerald-200/30 dark:bg-emerald-900/30",
    border: "border-emerald-700 dark:border-emerald-400",
    surface:
      "border-emerald-700 bg-emerald-200/30 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-900/20 dark:text-emerald-400",
  },
  danger: {
    text: "text-red-700 dark:text-red-400",
    background: "bg-red-200/30 dark:bg-red-900/30",
    border: "border-red-700 dark:border-red-400",
    surface:
      "border-red-700 bg-red-200/30 text-red-700 dark:border-red-400 dark:bg-red-900/20 dark:text-red-400",
  },
} as const;
