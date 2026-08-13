export interface OpeningShift {
  day: string;
  start: string;
  end: string;
}

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function formatTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, hours, minutes));
}

export function getTodayOpeningHours(openings?: OpeningShift[]) {
  if (!openings) return null;
  const today = DAY_KEYS[new Date().getDay()];
  const shifts = openings.filter((shift) => shift.day.toLowerCase() === today);
  if (shifts.length === 0) return "Closed today";
  return `Today ${shifts.map((shift) => `${formatTime(shift.start)}–${formatTime(shift.end)}`).join(", ")}`;
}
