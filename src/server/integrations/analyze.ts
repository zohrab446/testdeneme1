/**
 * Metin analizi: duygu (pozitif/nötr/negatif) + konu etiketleri.
 * Lovable AI Gateway kullanır (ek anahtar gerekmez). Metinler analize
 * gönderilmeden ÖNCE maskelenir (telefon, TC, e-posta).
 */
import { maskPii } from "./pii";

export interface AnalysisResult {
  sentiment: "pozitif" | "notr" | "negatif";
  topics: string[];
}

const VALID_SENTIMENTS = new Set(["pozitif", "notr", "negatif"]);

/** Toplu analiz: her seferinde en fazla 20 metin. */
export async function analyzeTexts(texts: string[]): Promise<AnalysisResult[]> {
  if (!texts.length) return [];
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("LOVABLE_API_KEY tanımlı değil.");
  const masked = texts.map(maskPii);
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-lite",
      messages: [
        {
          role: "system",
          content:
            "Türkçe müşteri/çalışan geri bildirimlerini analiz eden bir asistansın. Her metin için duygu (pozitif, notr, negatif) ve en fazla 3 kısa konu etiketi (örn: kargo, fiyat, kalite, uygulama, mesai, yönetim, maaş, iletişim) üret. Yalnızca JSON dizisi döndür: [{\"sentiment\":\"...\",\"topics\":[\"...\"]}]. Açıklama yazma.",
        },
        { role: "user", content: JSON.stringify(masked) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Analiz servisi hatası: ${res.status}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content ?? "[]";
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  const parsed = jsonMatch ? (JSON.parse(jsonMatch[0]) as { sentiment?: string; topics?: string[] }[]) : [];
  return masked.map((_, i) => {
    const item = parsed[i];
    const sentiment = item?.sentiment && VALID_SENTIMENTS.has(item.sentiment) ? (item.sentiment as AnalysisResult["sentiment"]) : "notr";
    const topics = Array.isArray(item?.topics) ? item.topics.slice(0, 3).map(String) : [];
    return { sentiment, topics };
  });
}
