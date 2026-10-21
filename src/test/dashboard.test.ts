import { describe, expect, it, beforeEach } from "vitest";
import { buildDashboardMetrics, dashboardBounds, dashboardDepartment, dashboardGreeting, metricIsImproving } from "@/lib/dashboard";
import { dashboardObservations, dashboardUpdatedAt, dashboardTasks } from "@/mocks/dashboard";
import { convertDashboardAction, getDashboardWidget } from "@/services/dashboard";
import type { RawDepartmentPulse } from "@/types";

describe("Dashboard kuralları", () => {
  beforeEach(() => { window.history.replaceState({}, "", "/"); });
  it("7, 30 ve 90 günlük aralıkları ve önceki dönemleri hesaplar", () => {
    for (const period of [7, 30, 90] as const) {
      const bounds = dashboardBounds(period, dashboardUpdatedAt);
      expect(bounds.to - bounds.from).toBe(period * 86400000);
      expect(bounds.from - bounds.previousFrom).toBe(period * 86400000);
    }
  });
  it("dönem değiştiğinde KPI hesaplaması değişir", () => {
    const seven = buildDashboardMetrics(dashboardObservations, 7, dashboardUpdatedAt);
    const ninety = buildDashboardMetrics(dashboardObservations, 90, dashboardUpdatedAt);
    expect(seven).toHaveLength(6);
    expect(seven[0]?.series).toHaveLength(7);
    expect(ninety[0]?.series).toHaveLength(90);
    expect(seven.find((m) => m.id === "burnout")?.value).not.toBe(ninety.find((m) => m.id === "burnout")?.value);
  });
  it("tükenmişlikte artış kötü, azalış iyidir", () => {
    expect(metricIsImproving("burnout", 3)).toBe(false);
    expect(metricIsImproving("burnout", -3)).toBe(true);
  });
  it("mutluluk ve müşteri memnuniyetinde artış iyidir", () => {
    expect(metricIsImproving("happiness", 3)).toBe(true);
    expect(metricIsImproving("customers", -3)).toBe(false);
  });
  it("5 kişiden küçük grupların skoru ve riski dışarı verilmez", () => {
    const raw: RawDepartmentPulse = { departmentId: "d5", respondents: 4, topics: { mesai: 10, yonetici: 20, maas: 30, belirsizlik: 40, denge: 50 }, trend: [10], risk: "yuksek", riskReasons: [], themes: [], quotes: [] };
    expect(dashboardDepartment(raw, "Hukuk", 0)).toEqual({ id: "d5", name: "Hukuk", suppressed: true });
    expect(dashboardDepartment({ ...raw, respondents: 5 }, "Hukuk", 0)).toMatchObject({ suppressed: false, score: 30 });
  });
  it("saat dilimine göre karşılama seçilir", () => {
    expect(dashboardGreeting(9)).toBe("Günaydın");
    expect(dashboardGreeting(13)).toBe("İyi günler");
    expect(dashboardGreeting(20)).toBe("İyi akşamlar");
  });
  it("demo kapalıyken hiçbir widget örnek veri döndürmez", async () => {
    for (const id of ["overview", "priorities", "departments", "trend", "topics", "alerts", "onboarding", "dates"] as const) {
      expect(await getDashboardWidget(id, 30, false)).toBeNull();
    }
  });
  it("grafik 12 haftalık ekseni korur ve dönem dışını boş bırakır", async () => {
    const trend = await getDashboardWidget("trend", 7, true);
    expect(trend).toHaveLength(12);
    expect(trend?.filter((p) => p.employee !== null)).toHaveLength(1);
  });
  it("yaklaşan tarihler örnek olarak 5 kayıt içerir", async () => {
    expect(await getDashboardWidget("dates", 30, true)).toHaveLength(5);
  });
  it("bir widget hatası diğer widget verisini engellemez", async () => {
    window.history.replaceState({}, "", "/?durum=hata&widget=topics");
    await expect(getDashboardWidget("topics", 30, true)).rejects.toThrow();
    expect(await getDashboardWidget("dates", 30, true)).toHaveLength(5);
  });
  it("aynı aksiyondan bir kez görev oluşturur", async () => {
    dashboardTasks.length = 0;
    const first = await convertDashboardAction("a2");
    const second = await convertDashboardAction("a2");
    expect(second.id).toBe(first.id);
    expect(dashboardTasks).toHaveLength(1);
  });
});