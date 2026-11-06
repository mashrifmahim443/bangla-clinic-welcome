/** Six-month targets from the product brief. */
export const TARGETS = { doctors: 50, patients: 2000, conversion: 15, checkinRate: 60, completionRate: 85 } as const;

export function pct(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 100) : null;
}

type Appt = { slot_start: string; status: string };
/** Completion rate = completed / (past appointments not cancelled). */
export function completionRate(appts: Appt[], now = Date.now()) {
  const past = appts.filter((a) => new Date(a.slot_start).getTime() < now && a.status !== "cancelled");
  return pct(past.filter((a) => a.status === "completed").length, past.length);
}

/** Check-in response rate = answered links / sent links (expired or answered). */
export function checkinRate(links: { used_at: string | null; expires_at: string }[], now = Date.now()) {
  const closed = links.filter((l) => l.used_at || new Date(l.expires_at).getTime() < now);
  return pct(closed.filter((l) => l.used_at).length, closed.length);
}
