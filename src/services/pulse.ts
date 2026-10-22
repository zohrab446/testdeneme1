import * as db from "@/mocks/data";
import { applyPrivacy } from "@/lib/pulse";
import type { PulseOverview, PulseSource } from "@/types";
import { delay, mockResponse } from "./http";
import { USE_MOCKS } from "./mode";
import { getCompanyInsights } from "./insights.functions";

export const getPulseSources = (): Promise<PulseSource[]> => mockResponse(db.pulseSources, []);

/** Gerçek mod: raw_items toplulaştırması; <5 kişilik gruplar sunucuda bastırılır. */
async function getPulseOverviewReal(): Promise<PulseOverview | null> {
  const insights = await getCompanyInsights();
  const weekly = insights.weekly.slice(-12);
  const weeks = weekly.map((w) => w.weekStart);
  const companyTrend = weekly.map((w) => (w.total ? Math.round(((w.pozitif * 100 + w.notr * 50) / w.total)) : 0));
  return {
    weeks,
    companyTrend,
    departments: insights.departments.map((d) =>
      d.suppressed
        ? { departmentId: d.departmentId, departmentName: "Departman", suppressed: true as const }
        : { departmentId: d.departmentId, departmentName: "Departman", suppressed: false as const, topics: { mesai: d.score, yonetici: d.score, maas: d.score, belirsizlik: d.score, denge: d.score }, trend: companyTrend, risk: d.score < 40 ? ("yuksek" as const) : d.score < 65 ? ("orta" as const) : ("dusuk" as const), riskReasons: [], themes: [], quotes: [], actionCardId: undefined },
    ),
  };
}

/** Gizlilik eşiği burada (veri kaynağında) uygulanır; küçük grupların verisi istemciye hiç gönderilmez. */
export async function getPulseOverview(): Promise<PulseOverview | null> {
  if (!USE_MOCKS) return getPulseOverviewReal();
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const d = new Date("2026-10-19T00:00:00");
    d.setDate(d.getDate() - (11 - i) * 7);
    return d.toISOString();
  });
  const departments = db.pulseDepartments.map((p) =>
    applyPrivacy(p, db.departments.find((d) => d.id === p.departmentId)?.name ?? "—"),
  );
  const visible = db.pulseDepartments.filter((p) => p.respondents >= 5);
  const total = visible.reduce((a, p) => a + p.respondents, 0);
  const companyTrend = weeks.map((_, i) =>
    Math.round(visible.reduce((a, p) => a + (p.trend[i] ?? 0) * p.respondents, 0) / total),
  );
  return mockResponse<PulseOverview | null>({ weeks, companyTrend, departments }, null);
}

export async function connectPulseSource(id: PulseSource["id"], consent: boolean): Promise<PulseSource> {
  if (!consent) throw new Error("Açık rıza onayı olmadan bağlantı kurulamaz.");
  await delay(600, 900);
  const src = db.pulseSources.find((s) => s.id === id);
  if (!src) throw new Error("Kaynak bulunamadı.");
  src.status = "bagli";
  src.errorMessage = undefined;
  src.lastSync = new Date().toISOString();
  return structuredClone(src);
}
