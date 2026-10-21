import * as db from "@/mocks/data";
import { computeAnalytics, filterReviews, maskName, maskPii, matchQuestion, SAMPLE_QUESTIONS, topicLabel } from "@/lib/voc";
import { formatNumber, formatPercent } from "@/lib/format";
import type { ActionCard, CustomerReview, VocAnalytics, VocAnswer, VocAskResult, VocFilter, VocSource } from "@/types";
import { delay, mockResponse } from "./http";

/** Kişisel veriler UI'a ulaşmadan burada maskelenir. */
const sanitize = (r: CustomerReview): CustomerReview => ({ ...r, author: maskName(r.author), text: maskPii(r.text) });

export const getVocSources = (): Promise<VocSource[]> => mockResponse(db.vocSources, []);

export async function getVocData(f: VocFilter): Promise<{ analytics: VocAnalytics; reviews: CustomerReview[] }> {
  const reviews = filterReviews(db.customerReviews, f).map(sanitize);
  return mockResponse({ analytics: computeAnalytics(reviews, f), reviews }, { analytics: computeAnalytics([], f), reviews: [] });
}

export const getCustomerReviews = (): Promise<CustomerReview[]> => mockResponse(db.customerReviews.map(sanitize), []);

export async function connectVocSource(id: VocSource["id"]): Promise<VocSource> {
  await delay(600, 900);
  const s = db.vocSources.find((x) => x.id === id);
  if (!s) throw new Error("Kaynak bulunamadı.");
  s.status = "bagli";
  s.errorMessage = undefined;
  s.lastSync = new Date().toISOString();
  return structuredClone(s);
}

export async function askVoc(question: string): Promise<VocAskResult> {
  await delay(2000, 3000);
  const key = matchQuestion(question);
  if (!key) return { matched: false, suggestions: SAMPLE_QUESTIONS };
  const all = db.customerReviews;
  const neg = all.filter((r) => r.sentiment === "olumsuz");
  const pct = (a: number, b: number) => formatPercent(b ? a / b : 0);
  const samples = (pred: (r: CustomerReview) => boolean) => all.filter(pred).slice(0, 3).map(sanitize);
  const base = { matched: true as const, question };
  let a: VocAnswer;
  if (key === "sikayet") {
    const counts = new Map<string, number>();
    neg.forEach((r) => counts.set(r.topic, (counts.get(r.topic) ?? 0) + 1));
    const [[top, n] = ["kargo", 0], [second, n2] = ["fiyat", 0]] = [...counts].sort((x, y) => y[1] - x[1]);
    a = { ...base,
      finding: `Şikâyetlerin en büyük kısmı "${topicLabel(top as never)}" ile ilgili; ardından "${topicLabel(second as never)}" geliyor.`,
      stats: [{ label: "Toplam olumsuz yorum", value: formatNumber(neg.length) }, { label: `${topicLabel(top as never)} payı`, value: pct(n, neg.length) }, { label: `${topicLabel(second as never)} payı`, value: pct(n2, neg.length) }],
      samples: samples((r) => r.sentiment === "olumsuz" && r.topic === top),
      action: { title: `${topicLabel(top as never)} şikâyetlerini azaltma planı`, summary: "Kök nedenleri belirleyip en sık şikâyet edilen sürece öncelikli iyileştirme uygula.", severity: "kritik" } };
  } else if (key === "kargo") {
    const k = all.filter((r) => r.topic === "kargo");
    const kn = k.filter((r) => r.sentiment === "olumsuz");
    const recent = kn.filter((r) => new Date("2026-10-20").getTime() - new Date(r.createdAt).getTime() < 28 * 864e5).length;
    a = { ...base, finding: "Evet. Kargo/teslimat kaynaklı olumsuz yorumlar son haftalarda belirgin şekilde artıyor.",
      stats: [{ label: "Kargo yorumları", value: formatNumber(k.length) }, { label: "Olumsuz oranı", value: pct(kn.length, k.length) }, { label: "Son 4 haftada olumsuz", value: formatNumber(recent) }],
      samples: samples((r) => r.topic === "kargo" && r.sentiment === "olumsuz"),
      action: { title: "Kargo firmasıyla SLA görüşmesi yap", summary: "Geciken teslimatlar için alternatif kargo ve proaktif bilgilendirme SMS'i planla.", severity: "kritik" } };
  } else if (key === "uygulama") {
    const u = all.filter((r) => r.topic === "uygulama");
    const un = u.filter((r) => r.sentiment === "olumsuz");
    a = { ...base, finding: "Uygulama şikâyetleri ödeme adımındaki çökmeler ve güncelleme sonrası giriş sorunlarında yoğunlaşıyor.",
      stats: [{ label: "Uygulama yorumları", value: formatNumber(u.length) }, { label: "Olumsuz oranı", value: pct(un.length, u.length) }, { label: "Ortalama puan", value: (u.reduce((s, r) => s + r.rating, 0) / (u.length || 1)).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) }],
      samples: samples((r) => r.topic === "uygulama" && r.sentiment === "olumsuz"),
      action: { title: "Ödeme adımındaki çökme hatasını önceliklendir", summary: "Hata kayıtlarını incele, düzeltme sürümünü hızlandır ve mağaza yorumlarına yanıt ver.", severity: "uyari" } };
  } else {
    const p = all.filter((r) => r.sentiment === "olumlu");
    const kal = p.filter((r) => r.topic === "kalite").length;
    a = { ...base, finding: "Müşteriler en çok ürün kalitesini ve ilgili müşteri temsilcilerini övüyor.",
      stats: [{ label: "Olumlu yorum", value: formatNumber(p.length) }, { label: "Olumlu oranı", value: pct(p.length, all.length) }, { label: "Kalite övgüsü payı", value: pct(kal, p.length) }],
      samples: samples((r) => r.sentiment === "olumlu"),
      action: { title: "Olumlu yorumları pazarlamada kullan", summary: "Öne çıkan övgüleri ürün sayfalarında ve kampanyalarda referans olarak değerlendir.", severity: "basari" } };
  }
  return a;
}

export async function addActionFromInsight(action: VocAnswer["action"]): Promise<ActionCard> {
  await delay();
  const card: ActionCard = { id: `a${Date.now()}`, title: action.title, summary: action.summary, source: "musteri", severity: action.severity, status: "yeni", createdAt: new Date().toISOString() };
  db.actionCards.unshift(card);
  return structuredClone(card);
}
