export type ApptLite = { status: string; slot_start: string; patient_id: string };
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0);
/** Cancel % = cancelled / all bookings. Success % = completed / finished (completed + cancelled + no_show). */
export function doctorStats(list: ApptLite[]) {
  const c = (s: string) => list.filter(a => a.status === s).length;
  const total = list.length, completed = c("completed"), cancelled = c("cancelled"), noShow = c("no_show");
  return {
    total, completed, cancelled, noShow, pending: c("pending"), confirmed: c("confirmed"),
    patients: new Set(list.map(a => a.patient_id)).size,
    cancelRate: pct(cancelled, total),
    noShowRate: pct(noShow, total),
    successRate: pct(completed, completed + cancelled + noShow),
  };
}
