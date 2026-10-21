import * as db from "@/mocks/data";
import { applyPrivacy } from "@/lib/pulse";
import type { PulseOverview, PulseSource } from "@/types";
import { delay, mockResponse } from "./http";

export const getPulseSources = (): Promise<PulseSource[]> => mockResponse(db.pulseSources, []);

/** Gizlilik eşiği burada (veri kaynağında) uygulanır; küçük grupların verisi istemciye hiç gönderilmez. */
export async function getPulseOverview(): Promise<PulseOverview | null> {
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
