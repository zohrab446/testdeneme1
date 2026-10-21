import type { DashboardMetricId, DashboardObservation, DashboardPeriod, RawDepartmentPulse, DashboardDepartment } from "@/types";
import { MIN_GROUP_SIZE } from "@/lib/pulse";

const DAY = 86400000;
export function dashboardBounds(period: DashboardPeriod, end: string) {
  const to = new Date(end).getTime();
  return { from: to - period * DAY, to, previousFrom: to - period * 2 * DAY };
}
export function withinDashboardRange(at: string, from: number, to: number) {
  const t = new Date(at).getTime();
  return t > from && t <= to;
}
export function metricIsImproving(id: DashboardMetricId, delta: number) {
  return ["happiness", "customers"].includes(id) ? delta > 0 : delta < 0;
}
export function buildDashboardMetrics(rows: DashboardObservation[], period: DashboardPeriod, end: string) {
  const { from, to, previousFrom } = dashboardBounds(period, end);
  const current = rows.filter((r) => withinDashboardRange(r.at, from, to));
  const previous = rows.filter((r) => withinDashboardRange(r.at, previousFrom, from));
  const ids: DashboardMetricId[] = ["happiness", "burnout", "customers", "critical", "onboarding", "actions"];
  if (!current.length) return [];
  const average = (items: DashboardObservation[], id: DashboardMetricId) => items.length ? Math.round(items.reduce((sum, r) => sum + r[id], 0) / items.length) : 0;
  return ids.map((id) => {
    const value = average(current, id);
    return { id, value, delta: value - average(previous, id), series: current.map((r) => r[id]) };
  });
}
export function dashboardDepartment(raw: RawDepartmentPulse, name: string, adjustment: number): DashboardDepartment {
  if (raw.respondents < MIN_GROUP_SIZE) return { id: raw.departmentId, name, suppressed: true };
  const values = Object.values(raw.topics);
  return { id: raw.departmentId, name, suppressed: false, risk: raw.risk, score: Math.max(0, Math.min(100, Math.round(values.reduce((a, v) => a + v, 0) / values.length + adjustment))) };
}
export function dashboardGreeting(hour: number) {
  return hour < 12 ? "Günaydın" : hour < 18 ? "İyi günler" : "İyi akşamlar";
}