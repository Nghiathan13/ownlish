export const statusColorClasses = {
  success: {
    text: "text-emerald-700 dark:text-emerald-400",
    background: "bg-emerald-200/20 dark:bg-emerald-900/20",
    border: "border-emerald-600 dark:border-emerald-500",
    surface:
      "border-emerald-600 bg-emerald-200/20 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-400",
  },
  danger: {
    text: "text-red-700 dark:text-red-400",
    background: "bg-red-200/20 dark:bg-red-900/20",
    border: "border-red-600 dark:border-red-500",
    surface:
      "border-red-600 bg-red-200/20 text-red-700 dark:border-red-500 dark:bg-red-900/20 dark:text-red-400",
  },
} as const;
