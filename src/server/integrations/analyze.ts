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

const RESULT_SCHEMA = {
  type: "json_schema",
  name: "sentiment_analysis",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["results"],
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["sentiment", "topics"],
          properties: {
            sentiment: { type: "string", enum: ["pozitif", "notr", "negatif"] },
            topics: { type: "array", items: { type: "string" }, maxItems: 3 },
          },
        },
      },
    },
  },
} as const;

/** SSE akışından birikmiş çıktı metnini toplar. */
async function readStreamedText(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) throw new Error("Analiz servisi akışı okunamadı.");
  const decoder = new TextDecoder();
  let buffer = "";
  let output = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const event of events) {
      for (const line of event.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const parsed = JSON.parse(payload) as { type?: string; delta?: string; error?: { message?: string } };
          if (parsed.type === "response.output_text.delta" && parsed.delta) output += parsed.delta;
          if (parsed.type === "response.failed" || parsed.error) throw new Error(parsed.error?.message ?? "Analiz isteği başarısız.");
        } catch (e) {
          if (e instanceof SyntaxError) continue;
          throw e;
        }
      }
    }
  }
  return output;
}

/** Toplu analiz: her çağrıda en fazla 20 metin. */
export async function analyzeTexts(texts: string[]): Promise<AnalysisResult[]> {
  if (!texts.length) return [];
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("LOVABLE_API_KEY tanımlı değil.");
  const masked = texts.map(maskPii);
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      store: false,
      stream: true,
      reasoning: { effort: "low", summary: "auto" },
      instructions:
        "Türkçe müşteri/çalışan geri bildirimlerini analiz eden bir asistansın. Her metin için duygu (pozitif, notr, negatif) ve en fazla 3 kısa konu etiketi (örn: kargo, fiyat, kalite, uygulama, mesai, yönetim, maaş, iletişim) üret. Sonuçları gönderilen JSON şemasına uygun döndür; sıra, girdi sırasıyla birebir aynı olsun.",
      input: [{ role: "user", content: [{ type: "input_text", text: JSON.stringify(masked) }] }],
      text: { format: RESULT_SCHEMA },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Analiz servisi hatası [${res.status}]: ${body.slice(0, 300)}`);
  }
  const output = await readStreamedText(res);
  const parsed = JSON.parse(output) as { results?: { sentiment?: string; topics?: string[] }[] };
  const results = parsed.results ?? [];
  return masked.map((_, i) => {
    const item = results[i];
    const sentiment = item?.sentiment && VALID_SENTIMENTS.has(item.sentiment) ? (item.sentiment as AnalysisResult["sentiment"]) : "notr";
    const topics = Array.isArray(item?.topics) ? item.topics.slice(0, 3).map(String) : [];
    return { sentiment, topics };
  });
}
