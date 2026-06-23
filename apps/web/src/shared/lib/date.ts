export function formatDisplayDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatCreatedLabel(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return formatDisplayDate(value);
}
