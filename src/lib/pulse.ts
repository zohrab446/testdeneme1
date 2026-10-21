import type { DepartmentPulse, PulseTopicId, RawDepartmentPulse, RiskLevel, Severity } from "@/types";

/** Bu sayının altındaki gruplarda sonuç gösterilmez. */
export const MIN_GROUP_SIZE = 5;
export const PRIVACY_MESSAGE = "Gizlilik nedeniyle gösterilmiyor (en az 5 kişi gerekir)";

export const PULSE_TOPICS: { id: PulseTopicId; label: string }[] = [
  { id: "mesai", label: "Aşırı mesai" },
  { id: "yonetici", label: "Yönetici memnuniyeti" },
  { id: "maas", label: "Maaş / yan haklar" },
  { id: "belirsizlik", label: "Görev belirsizliği" },
  { id: "denge", label: "İş-yaşam dengesi" },
];

export const riskMeta: Record<RiskLevel, { label: string; tone: Severity }> = {
  dusuk: { label: "Düşük", tone: "basari" },
  orta: { label: "Orta", tone: "uyari" },
  yuksek: { label: "Yüksek", tone: "kritik" },
};

/** Küçük grupların verisini tamamen çıkarır; yalnızca isim ve "gizli" bayrağı kalır. */
export function applyPrivacy(raw: RawDepartmentPulse, departmentName: string): DepartmentPulse {
  if (raw.respondents < MIN_GROUP_SIZE) return { departmentId: raw.departmentId, departmentName, suppressed: true };
  const { respondents: _r, ...rest } = raw;
  return { ...rest, departmentName, suppressed: false };
}

/** 0-100 skor → ısı haritası seviyesi. */
export function scoreLevel(score: number): "kritik" | "uyari" | "iyi" {
  if (score < 40) return "kritik";
  if (score < 60) return "uyari";
  return "iyi";
}
