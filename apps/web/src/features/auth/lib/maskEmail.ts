export function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");

  if (!domain || !localPart) {
    return email;
  }

  return `${localPart.slice(0, 2)}${"•".repeat(
    Math.max(1, localPart.length - 2),
  )}@${domain}`;
}
