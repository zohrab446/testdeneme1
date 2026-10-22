import * as db from "@/mocks/data";
import { dashboardAlerts, dashboardDates, dashboardObservations, dashboardTasks, dashboardUpdatedAt } from "@/mocks/dashboard";
import { buildDashboardMetrics, dashboardBounds, dashboardDepartment, withinDashboardRange } from "@/lib/dashboard";
import type { DashboardWidgets, DashboardPeriod, DashboardTask, VocSentiment } from "@/types";
import { delay, mockResponse } from "./http";
import { USE_MOCKS } from "./mode";
import { getCompanyInsights } from "./insights.functions";

/** Gerçek mod: raw_items toplulaştırmasından dashboard widget verisi üretir. */
async function loadWidgetReal<K extends keyof DashboardWidgets>(widget: K, period: DashboardPeriod): Promise<DashboardWidgets[K] | null> {
  const insights = await getCompanyInsights();
  const now = Date.now();
  const from = now - period * 86400000;
  const inRange = insights.reviews.filter((r) => new Date(r.createdAt).getTime() >= from);
  const score = (list: typeof inRange) => {
    const rated = list.filter((r) => r.sentiment);
    return rated.length ? Math.round(rated.reduce((s, r) => s + (r.sentiment === "pozitif" ? 100 : r.sentiment === "negatif" ? 0 : 50), 0) / rated.length) : 0;
  };
  const weekly = insights.weekly.slice(-12);
  const data: DashboardWidgets = {
    overview: {
      metrics: [
        { id: "happiness", value: score(inRange), delta: 0, series: weekly.map((w) => (w.total ? Math.round((w.pozitif * 100 + w.notr * 50) / w.total) : 0)) },
        { id: "burnout", value: 100 - score(inRange), delta: 0, series: weekly.map((w) => (w.total ? 100 - Math.round((w.pozitif * 100 + w.notr * 50) / w.total) : 0)) },
        { id: "customers", value: score(inRange), delta: 0, series: [] },
        { id: "critical", value: inRange.filter((r) => r.sentiment === "negatif").length, delta: 0, series: [] },
        { id: "onboarding", value: 0, delta: 0, series: [] },
        { id: "actions", value: 0, delta: 0, series: [] },
      ],
      updatedAt: new Date().toISOString(),
      critical: inRange.filter((r) => r.sentiment === "negatif").length,
      pending: 0,
    },
    priorities: [],
    departments: insights.departments.map((d) =>
      d.suppressed ? { id: d.departmentId, name: "Departman", suppressed: true as const } : { id: d.departmentId, name: "Departman", suppressed: false as const, score: d.score, risk: d.score < 40 ? ("yuksek" as const) : d.score < 65 ? ("orta" as const) : ("dusuk" as const) },
    ),
    trend: weekly.map((w) => ({ date: w.weekStart, employee: w.total ? Math.round((w.pozitif * 100 + w.notr * 50) / w.total) : null, customer: w.total ? Math.round((w.pozitif * 100 + w.notr * 50) / w.total) : null })),
    topics: Object.entries(inRange.reduce<Record<string, number>>((acc, r) => { for (const t of r.topics) acc[t] = (acc[t] ?? 0) + 1; return acc; }, {}))
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([topic, count]) => ({ topic: topic as never, count, sentiment: "notr" as const })),
    alerts: [],
    onboarding: [],
    dates: [],
  };
  return data[widget];
}

export async function getDashboardWidget<K extends keyof DashboardWidgets>(widget: K, period: DashboardPeriod, demo: boolean): Promise<DashboardWidgets[K] | null> {
  if (!USE_MOCKS) return loadWidgetReal(widget, period);
  if (!demo) return mockResponse(null, null);
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    if (params.get("widget") === widget && params.get("durum") === "hata") {
      await delay();
      throw new Error("Bu bölümün verileri yüklenemedi.");
    }
    if (params.has("widget") && params.get("durum") === "hata") return loadWidget(widget, period);
  }
  return mockResponse(loadWidget(widget, period), null);
}

function loadWidget<K extends keyof DashboardWidgets>(widget: K, period: DashboardPeriod): DashboardWidgets[K] {
  const { from, to } = dashboardBounds(period, dashboardUpdatedAt);
  const inRange = (at: string) => withinDashboardRange(at, from, to);
  const metrics = buildDashboardMetrics(dashboardObservations, period, dashboardUpdatedAt);
  const adjustment = (metrics.find((m) => m.id === "happiness")?.value ?? 72) - 72;
  const reviews = db.customerReviews.filter((r) => inRange(r.createdAt));
  const topics = [...new Set(reviews.map((r) => r.topic))].map((topic) => {
    const rows = reviews.filter((r) => r.topic === topic);
    const counts: Record<VocSentiment, number> = { olumlu: 0, notr: 0, olumsuz: 0 };
    rows.forEach((r) => counts[r.sentiment]++);
    const sentiment = (Object.keys(counts) as VocSentiment[]).sort((a, b) => counts[b] - counts[a])[0] ?? "notr";
    return { topic, count: rows.length, sentiment };
  }).sort((a, b) => b.count - a.count).slice(0, 5);
  const priorities = db.actionCards.filter((a) => inRange(a.createdAt) && a.status !== "tamamlandi" && a.status !== "ertelendi").sort((a, b) => ({ kritik: 0, uyari: 1, bilgi: 2, notr: 3, basari: 4 }[a.severity] - { kritik: 0, uyari: 1, bilgi: 2, notr: 3, basari: 4 }[b.severity])).slice(0, 3);
  const month = dashboardUpdatedAt.slice(0, 7);
  const dates = dashboardDates.filter((d) => withinDashboardRange(d.at, to, to + period * 86400000)).sort((a, b) => a.at.localeCompare(b.at));
  const data: DashboardWidgets = {
    overview: { metrics, updatedAt: dashboardUpdatedAt, critical: dashboardAlerts.filter((a) => a.severity === "kritik" && withinDashboardRange(a.at, to - 7 * 86400000, to)).length, pending: dashboardObservations.at(-1)?.onboarding ?? 0 },
    priorities,
    departments: db.pulseDepartments.map((d) => dashboardDepartment(d, db.departments.find((dep) => dep.id === d.departmentId)?.name ?? "—", adjustment)).sort((a, b) => (b.suppressed ? -1 : b.score) - (a.suppressed ? -1 : a.score)),
    trend: Array.from({ length: 12 }, (_, i) => {
      const end = to - (11 - i) * 7 * 86400000;
      const rows = dashboardObservations.filter((r) => withinDashboardRange(r.at, Math.max(from, end - 7 * 86400000), end));
      const mean = (key: "happiness" | "customers") => rows.length ? Math.round(rows.reduce((s, r) => s + r[key], 0) / rows.length) : null;
      return { date: new Date(end).toISOString(), employee: mean("happiness"), customer: mean("customers") };
    }),
    topics,
    alerts: dashboardAlerts.filter((a) => inRange(a.at)),
    onboarding: db.onboardingInvites.filter((inv) => inv.startDate.startsWith(month) && (inRange(inv.createdAt) || new Date(inv.createdAt).getTime() > to)),
    dates,
  };
  return data[widget];
}

export async function convertDashboardAction(actionId: string): Promise<DashboardTask> {
  await delay();
  const existing = dashboardTasks.find((t) => t.actionId === actionId);
  if (existing) return structuredClone(existing);
  const action = db.actionCards.find((a) => a.id === actionId);
  if (!action) throw new Error("Aksiyon bulunamadı.");
  const task = { id: `task-${actionId}`, actionId, title: action.title, createdAt: new Date().toISOString() };
  dashboardTasks.push(task);
  action.status = "devam";
  return structuredClone(task);
}