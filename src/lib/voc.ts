import type { CustomerReview, VocAnalytics, VocFilter, VocSentiment, VocTopic } from "@/types";

export const VOC_TOPICS: { id: VocTopic; label: string }[] = [
  { id: "kargo", label: "Kargo / Teslimat" },
  { id: "fiyat", label: "Fiyat" },
  { id: "kalite", label: "Ürün Kalitesi" },
  { id: "musteri_hizmetleri", label: "Müşteri Hizmetleri" },
  { id: "uygulama", label: "Mobil Uygulama" },
  { id: "iade", label: "İade / Değişim" },
];
export const topicLabel = (t: VocTopic) => VOC_TOPICS.find((x) => x.id === t)?.label ?? t;

export const SENTIMENT_META: Record<VocSentiment, { label: string; tone: "basari" | "notr" | "kritik" }> = {
  olumlu: { label: "Pozitif", tone: "basari" },
  notr: { label: "Nötr", tone: "notr" },
  olumsuz: { label: "Negatif", tone: "kritik" },
};

/** İsim ve telefon gibi kişisel verileri maskeler. */
export function maskPii(text: string): string {
  return text
    .replace(/(\+90\s?|0)?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g, (m) => m.replace(/\d(?=(?:\D*\d){2})/g, "*"))
    .replace(/\b(Temsilci|temsilci|Sayın|sayın)\s+([A-ZÇĞİÖŞÜ][a-zçğıöşü]+)(\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+)?/g, (_m, t: string, a: string, b?: string) =>
      `${t} ${a[0]}***${b ? ` ${b.trim()[0]}.` : ""}`,
    );
}

export function maskName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p, i) => (i === 0 ? `${p[0]}***` : `${p[0]}.`))
    .join(" ");
}

export function filterReviews(all: CustomerReview[], f: VocFilter) {
  const from = new Date(f.from).getTime();
  const to = new Date(f.to).getTime();
  return all.filter((r) => {
    const t = new Date(r.createdAt).getTime();
    return t >= from && t <= to && (f.sources.length === 0 || f.sources.includes(r.source));
  });
}

export function computeAnalytics(reviews: CustomerReview[], f: VocFilter): VocAnalytics {
  const sentiment = { olumlu: 0, notr: 0, olumsuz: 0 };
  const complaintMap = new Map<VocTopic, number>();
  for (const r of reviews) {
    sentiment[r.sentiment]++;
    if (r.sentiment === "olumsuz") complaintMap.set(r.topic, (complaintMap.get(r.topic) ?? 0) + 1);
  }
  const complaints = VOC_TOPICS.map((t) => ({ topic: t.id, count: complaintMap.get(t.id) ?? 0 })).sort((a, b) => b.count - a.count);

  const end = new Date(f.to).getTime();
  const weekMs = 7 * 864e5;
  const weeks = Array.from({ length: 12 }, (_, i) => new Date(end - (11 - i) * weekMs).toISOString());
  const topicTrend = Object.fromEntries(VOC_TOPICS.map((t) => [t.id, Array(12).fill(0)])) as Record<VocTopic, number[]>;
  for (const r of reviews) {
    const idx = 11 - Math.floor((end - new Date(r.createdAt).getTime()) / weekMs);
    if (idx >= 0 && idx < 12) topicTrend[r.topic][idx]!++;
  }
  return { total: reviews.length, sentiment, complaints, weeks, topicTrend };
}

const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
export function reviewsToCsv(rows: CustomerReview[], sourceName: (id: string) => string, date: (s: string) => string) {
  const head = ["Kaynak", "Tarih", "Puan", "Konu", "Duygu", "Yazar", "Yorum"];
  const body = rows.map((r) => [sourceName(r.source), date(r.createdAt), r.rating, topicLabel(r.topic), SENTIMENT_META[r.sentiment].label, r.author, r.text].map(csvCell).join(";"));
  return "\uFEFF" + [head.map(csvCell).join(";"), ...body].join("\r\n");
}

const norm = (s: string) => s.toLocaleLowerCase("tr-TR");
export type QuestionKey = "sikayet" | "kargo" | "uygulama" | "olumlu";
export function matchQuestion(q: string): QuestionKey | null {
  const s = norm(q);
  if (/kargo|teslimat|geç gel/.test(s)) return "kargo";
  if (/uygulama|mobil|app|çök/.test(s)) return "uygulama";
  if (/sev|beğen|olumlu|memnun/.test(s)) return "olumlu";
  if (/şikayet|şikâyet|sorun|özellik/.test(s)) return "sikayet";
  return null;
}

export const SAMPLE_QUESTIONS = [
  "Müşteriler en çok hangi özelliğimizden şikayetçi?",
  "Kargo gecikmesi şikâyetleri artıyor mu?",
  "Mobil uygulamamızla ilgili sorunlar neler?",
  "Müşteriler en çok neyimizi seviyor?",
];
