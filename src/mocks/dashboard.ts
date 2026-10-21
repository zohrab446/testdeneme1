import type { DashboardAlert, DashboardDate, DashboardObservation, DashboardTask } from "@/types";

export const dashboardUpdatedAt = "2026-10-21T10:35:00Z";
export const dashboardObservations: DashboardObservation[] = Array.from({ length: 180 }, (_, i) => {
  const at = new Date(Date.UTC(2026, 3, 25 + i, 10));
  return {
    at: at.toISOString(),
    happiness: Math.round(63 + i * 0.055 + Math.sin(i / 11) * 4),
    burnout: Math.round(36 - i * 0.06 + Math.sin(i / 8) * 5),
    customers: Math.round(66 + i * 0.03 + Math.cos(i / 13) * 7),
    critical: i > 140 ? 2 : i > 100 ? 3 : 4,
    onboarding: i > 170 ? 3 : i > 140 ? 4 : 5,
    actions: i > 165 ? 5 : i > 135 ? 7 : 9,
  };
}).filter((d) => d.at <= dashboardUpdatedAt);

export const dashboardAlerts: DashboardAlert[] = [
  { id: "da1", title: "Operasyonda tükenmişlik riski yükseldi", source: "calisan", severity: "kritik", at: "2026-10-21T08:40:00Z", actionId: "a2" },
  { id: "da2", title: "Kargo gecikmesi şikâyetleri artıyor", source: "musteri", severity: "kritik", at: "2026-10-21T06:40:00Z", actionId: "a1" },
  { id: "da3", title: "Satış ekibinde prim belirsizliği", source: "calisan", severity: "uyari", at: "2026-10-19T09:15:00Z", actionId: "a3" },
  { id: "da4", title: "Müşteri hizmetlerinde rol tanımları", source: "karma", severity: "uyari", at: "2026-10-10T11:00:00Z", actionId: "a4" },
  { id: "da5", title: "Esnek çalışma memnuniyeti arttı", source: "calisan", severity: "basari", at: "2026-09-15T13:00:00Z", actionId: "a5" },
];
export const dashboardDates: DashboardDate[] = [
  { id: "dd1", title: "Can Öztürk · işe başlangıç", kind: "baslangic", at: "2026-10-28T09:00:00", onboardingId: "o4" },
  { id: "dd2", title: "Zeynep Demir · işe başlangıç", kind: "baslangic", at: "2026-11-02T09:00:00", onboardingId: "o1" },
  { id: "dd3", title: "Prim sistemi aksiyonunu yeniden değerlendir", kind: "aksiyon", at: "2026-10-24T09:00:00", actionId: "a3" },
  { id: "dd4", title: "Esnek çalışma aksiyonunun dönüş tarihi", kind: "aksiyon", at: "2026-10-30T09:00:00", actionId: "a5" },
  { id: "dd5", title: "Anonim anket verilerinin saklama süresi doluyor", kind: "kvkk", at: "2026-10-26T09:00:00" },
];
export const dashboardTasks: DashboardTask[] = [];