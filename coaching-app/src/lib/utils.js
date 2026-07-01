export const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
export const DAY_LABELS = {
  Mo: "Montag", Di: "Dienstag", Mi: "Mittwoch", Do: "Donnerstag",
  Fr: "Freitag", Sa: "Samstag", So: "Sonntag",
};
export const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function todayKey() {
  return DAYS[(new Date().getDay() + 6) % 7];
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function fmtDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}`;
}

// Gibt den Montag der Woche zurück, die `offset` Wochen vom heutigen Montag entfernt ist
export function weekStartISO(offset = 0) {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // 0=Mo
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day + offset * 7);
  return d.toISOString().slice(0, 10);
}

// Montag + 6 Tage = Sonntag
export function weekEndISO(weekStart) {
  const d = new Date(weekStart + "T00:00:00");
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
}

export function fmtWeek(weekStart) {
  const end = weekEndISO(weekStart);
  return `${fmtDate(weekStart)} – ${fmtDate(end)}`;
}

export function isoWeekNumber(weekStart) {
  const d = new Date(weekStart + "T00:00:00");
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d - startOfYear) / 86400000);
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

export function parseTimeToSeconds(str) {
  if (!str) return 0;
  const s = String(str).trim().toLowerCase().replace("s", "");
  if (s.includes(":")) {
    const [m, sec] = s.split(":").map(Number);
    return (m || 0) * 60 + (sec || 0);
  }
  return parseFloat(s) || 0;
}
