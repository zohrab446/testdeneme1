/**
 * Trendyol Entegrasyon API istemcisi.
 * Not: Trendyol uzun tarih aralıklarını sessizce kısaltır; bu yüzden
 * aralıklar MUTLAKA en fazla 14 günlük parçalara bölünür (chunkDateRange).
 */

export interface DateChunk {
  start: number;
  end: number;
}

/** Tarih aralığını en fazla `maxDays` günlük parçalara böler. */
export function chunkDateRange(fromMs: number, toMs: number, maxDays = 14): DateChunk[] {
  if (toMs < fromMs) return [];
  const span = maxDays * 86400000;
  const chunks: DateChunk[] = [];
  let cursor = fromMs;
  while (cursor <= toMs) {
    const end = Math.min(cursor + span - 1, toMs);
    chunks.push({ start: cursor, end });
    cursor = end + 1;
  }
  return chunks;
}

export interface TrendyolCredentials {
  sellerId: string;
  apiKey: string;
  apiSecret: string;
}

const BASE = "https://apigw.trendyol.com/integration/order";

function authHeader(creds: TrendyolCredentials): string {
  return `Basic ${btoa(`${creds.apiKey}:${creds.apiSecret}`)}`;
}

export class TrendyolApiError extends Error {
  constructor(public status: number) {
    super(`Trendyol API hatası: ${status}`);
    this.name = "TrendyolApiError";
  }
}

async function trendyolFetch(creds: TrendyolCredentials, path: string, attempt = 0): Promise<Response> {
  const res = await fetch(`${BASE}/sellers/${creds.sellerId}${path}`, {
    headers: { Authorization: authHeader(creds), "User-Agent": "lovable-integration/1.0", Accept: "application/json" },
  });
  if (res.status === 429 && attempt < 4) {
    // Oran sınırı: üstel geri çekilme
    const wait = 2 ** attempt * 1000;
    await new Promise((r) => setTimeout(r, wait));
    return trendyolFetch(creds, path, attempt + 1);
  }
  if (!res.ok) throw new TrendyolApiError(res.status);
  return res;
}

/** Bağlantı testi: 1 günlük, tek kayıtlık hafif bir istek atar. */
export async function testTrendyolConnection(creds: TrendyolCredentials): Promise<void> {
  const now = Date.now();
  await trendyolFetch(creds, `/customer-questions?startDate=${now - 86400000}&endDate=${now}&page=0&size=1`);
}

export interface TrendyolQuestion {
  id: number;
  text: string;
  customerId?: number;
  creationDate?: number;
  productName?: string;
}

/** Müşteri sorularını 14 günlük parçalar + sayfalama ile çeker. */
export async function fetchTrendyolQuestions(
  creds: TrendyolCredentials,
  fromMs: number,
  toMs: number,
  onProgress?: (fetched: number) => Promise<void>,
): Promise<TrendyolQuestion[]> {
  const out: TrendyolQuestion[] = [];
  for (const chunk of chunkDateRange(fromMs, toMs, 14)) {
    let page = 0;
    for (;;) {
      const res = await trendyolFetch(
        creds,
        `/customer-questions?startDate=${chunk.start}&endDate=${chunk.end}&page=${page}&size=50`,
      );
      const body = (await res.json()) as { content?: TrendyolQuestion[]; totalPages?: number };
      const content = body.content ?? [];
      out.push(...content);
      await onProgress?.(out.length);
      const totalPages = body.totalPages ?? 1;
      page += 1;
      if (page >= totalPages || content.length === 0) break;
    }
  }
  return out;
}
