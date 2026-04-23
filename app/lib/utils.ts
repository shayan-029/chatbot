// =============================================
// Utility helpers
// =============================================

/** Generate a random unique ID for messages */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Format a timestamp to a readable time string, e.g. "14:32" */
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/** Trim and collapse whitespace in a string */
export function sanitize(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
