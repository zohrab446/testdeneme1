import type { CustomerReview, VocSource, VocSourceId, VocTopic } from "@/types";

export const vocSources: VocSource[] = [
  { id: "trendyol", name: "Trendyol", description: "Ürün değerlendirmeleri", status: "bagli", reviewCount: 0, lastSync: "2026-10-21T07:40:00" },
  { id: "sikayetvar", name: "Şikayetvar", description: "Marka şikâyetleri", status: "bagli", reviewCount: 0, lastSync: "2026-10-21T06:10:00" },
  { id: "google", name: "Google Yorumları", description: "İşletme profili yorumları", status: "hata", reviewCount: 0, errorMessage: "Yetki süresi doldu, yeniden bağlayın." },
  { id: "hepsiburada", name: "Hepsiburada", description: "Ürün yorumları", status: "bagli", reviewCount: 0, lastSync: "2026-10-20T22:15:00" },
  { id: "appstore", name: "App Store / Play Store", description: "Mobil uygulama yorumları", status: "bagli_degil", reviewCount: 0 },
  { id: "csv", name: "Manuel Yükleme (CSV)", description: "Kendi yorum dosyanız", status: "bagli", reviewCount: 0, lastSync: "2026-10-12T10:00:00" },
];

const texts: Record<VocTopic, { olumsuz: string[]; notr: string[]; olumlu: string[] }> = {
  kargo: {
    olumsuz: ["Sipariş 9 gün sonra geldi, kargo takibi hiç güncellenmedi.", "Kargo çok geç geldi, kutu ezilmişti.", "Teslimat tarihi üç kez ertelendi, çok yorucu oldu.", "Siparişim hâlâ dağıtım merkezinde bekliyor."],
    notr: ["Kargo ortalama sürede geldi.", "Teslimat normaldi, paketleme idare eder."],
    olumlu: ["Ertesi gün elimdeydi, çok hızlı kargo!", "Paketleme özenliydi, zamanında teslim edildi."],
  },
  fiyat: {
    olumsuz: ["Geçen aya göre fiyat neredeyse %30 artmış.", "Bu fiyata bu kalite olmamalı.", "Sepette indirim görünüp ödemede kayboldu."],
    notr: ["Fiyatı piyasa ortalamasında.", "İndirim dönemini beklemek mantıklı."],
    olumlu: ["Fiyat/performans olarak çok iyi.", "Kampanyada çok uygun fiyata aldım."],
  },
  kalite: {
    olumsuz: ["İki haftada dikiş yerleri söküldü.", "Fotoğraftaki renkle aynı değil, malzeme ince."],
    notr: ["Beklediğim gibi, ne iyi ne kötü.", "Kalitesi fiyatına göre makul."],
    olumlu: ["Malzeme kalitesi beklentimin üstünde.", "Çok sağlam, ikinci kez aldım."],
  },
  musteri_hizmetleri: {
    olumsuz: ["Müşteri hizmetlerine 40 dakika bekleyip ulaşamadım.", "Canlı destek sorumu anlamadan sohbeti kapattı.", "Üç kez aradım, her seferinde başka bilgi verildi."],
    notr: ["Destek ekibi yanıt verdi ama çözüm uzun sürdü."],
    olumlu: ["Temsilci çok ilgiliydi, sorunumu hemen çözdü.", "Destek ekibi kibar ve hızlıydı."],
  },
  uygulama: {
    olumsuz: ["Uygulama ödeme adımında sürekli çöküyor.", "Güncellemeden sonra giriş yapamıyorum.", "Sepete ekle butonu bazen çalışmıyor."],
    notr: ["Uygulama işini görüyor ama biraz yavaş."],
    olumlu: ["Yeni arayüz çok kullanışlı olmuş.", "Uygulama hızlı ve sade."],
  },
  iade: {
    olumsuz: ["İade ettiğim ürünün parası 3 haftadır yatmadı.", "İade kodu oluşturulamıyor, hata veriyor."],
    notr: ["İade süreci standart ilerledi."],
    olumlu: ["İadem 2 günde onaylandı, teşekkürler.", "Değişim süreci çok kolaydı."],
  },
};

const names = ["Ayşe Yılmaz", "Mehmet Kaya", "Zeynep Demir", "Burak Şahin", "Elif Çelik", "Emre Aydın", "Selin Arslan", "Can Öztürk", "Deniz Koç", "Merve Kurt"];
const phones = ["0532 418 22 91", "+90 545 301 77 12", "0555 920 14 63"];

// Deterministik sözde rastgele üretici: her yenilemede aynı demo veri.
let seed = 42;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)]!;

const topicWeights: [VocTopic, number][] = [["kargo", 30], ["fiyat", 16], ["kalite", 14], ["musteri_hizmetleri", 18], ["uygulama", 12], ["iade", 10]];
const sourceIds: VocSourceId[] = ["trendyol", "sikayetvar", "google", "hepsiburada", "appstore", "csv"];

function weightedTopic(): VocTopic {
  let r = rnd() * 100;
  for (const [t, w] of topicWeights) if ((r -= w) <= 0) return t;
  return "kargo";
}

const END = new Date("2026-10-19T12:00:00");

export const customerReviews: CustomerReview[] = Array.from({ length: 260 }, (_, i) => {
  const daysAgo = Math.floor(rnd() * 84);
  const d = new Date(END);
  d.setDate(d.getDate() - daysAgo);
  let topic = weightedTopic();
  const source = topic === "uygulama" ? pick(["appstore", "trendyol", "csv"] as const) : pick(sourceIds.filter((s) => s !== "appstore"));
  // Kargo şikâyetleri son haftalarda artıyor
  const negBias = topic === "kargo" ? 0.45 + (84 - daysAgo) / 84 * 0.3 : source === "sikayetvar" ? 0.85 : 0.4;
  const r = rnd();
  const sentiment = r < negBias ? "olumsuz" : r < negBias + 0.2 ? "notr" : "olumlu";
  if (source === "appstore" && topic !== "uygulama" && rnd() < 0.5) topic = "uygulama";
  let text = pick(texts[topic][sentiment]);
  if (i % 17 === 0) text += ` Bana ${pick(phones)} numarasından dönün.`;
  if (i % 23 === 0) text += ` Temsilci ${pick(names)} ile görüştüm.`;
  const rating = sentiment === "olumsuz" ? pick([1, 1, 2, 2, 3]) : sentiment === "notr" ? 3 : pick([4, 5, 5]);
  return { id: `r${i + 1}`, source, author: pick(names), rating, text, topic, sentiment, createdAt: d.toISOString() };
}).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

for (const s of vocSources) s.reviewCount = customerReviews.filter((r) => r.source === s.id).length;
