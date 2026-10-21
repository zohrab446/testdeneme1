/**
 * Mock taşıma katmanı. Gerçek backend'e geçerken yalnızca /src/services
 * altındaki dosyalar değişir; bileşenler aynı fonksiyonları çağırmaya devam eder.
 *
 * Geliştirme kolaylığı: URL'ye ?durum=hata veya ?durum=bos ekleyerek
 * hata ve boş durumlarını test edebilirsiniz.
 */
export type MockMode = "normal" | "hata" | "bos";

function currentMode(): MockMode {
  if (typeof window === "undefined") return "normal";
  const v = new URLSearchParams(window.location.search).get("durum");
  return v === "hata" || v === "bos" ? v : "normal";
}

export function delay(min = 300, max = 800) {
  const ms = Math.floor(min + Math.random() * (max - min));
  return new Promise<void>((r) => setTimeout(r, ms));
}

/** Yapay gecikmeyle mock veriyi döndürür; derin kopya ile mutasyonu engeller. */
export async function mockResponse<T>(data: T, empty?: T): Promise<T> {
  await delay();
  const mode = currentMode();
  if (mode === "hata") throw new Error("Sunucuya ulaşılamadı. Lütfen tekrar deneyin.");
  if (mode === "bos" && empty !== undefined) return empty;
  return structuredClone(data);
}
