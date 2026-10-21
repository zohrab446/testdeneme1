import type { IntegrationCategory, IntegrationConnection, IntegrationStatus } from "@/types/integrations";

function source(id: string, name: string, monogram: string, category: IntegrationCategory, description: string, status: IntegrationStatus): IntegrationConnection {
  const channels = category === "iletisim" ? [
    { id: "genel", name: "genel" }, { id: "duyurular", name: "duyurular" },
    { id: "operasyon", name: "operasyon" }, { id: "satis", name: "satış" },
  ] : [];
  const active = status === "bagli" || status === "hata";
  const logs = active ? Array.from({ length: 10 }, (_, i) => ({
    id: `${id}-${i}`, at: new Date(Date.UTC(2026, 9, 21, 10 - i)).toISOString(),
    success: !(status === "hata" && i === 0), count: status === "hata" && i === 0 ? 0 : 24 + i * 7,
    detail: status === "hata" && i === 0 ? "Yetki süresi doldu. Bağlantıyı yeniden test edin." : undefined,
  })) : [];
  return { id, name, monogram, category, description, status, channels,
    permissions: category === "iletisim" ? ["Seçilen herkese açık kanalların mesaj metinleri", "Kanal adı ve mesaj tarihleri"] :
      category === "musteri" ? ["Yorum metinleri, puanlar ve yayın tarihleri", "Kaynak ve konu bilgileri; kişisel veriler maskelenir"] :
      id === "sgk" ? ["İşe giriş hazırlığı için gerekli çalışan alanları", "Yalnızca hazırlık çıktısı; resmî bildirim yapılmaz"] :
      id === "email" ? ["Davet ve bildirim e-postalarının gönderim durumu", "Alıcı e-posta adresi; gelen kutusu okunmaz"] :
      ["Seçilen personel veya dosya alanları", "Aktarım ve işlem tarihleri"],
    selectedChannels: active ? channels.slice(0, 2).map(c => c.id) : [], frequency: "gunluk", logs,
    consent: active, deletionDays: 30,
    lastSync: active ? logs.find(log => log.success)?.at : undefined,
    error: status === "hata" ? "Yetki süresi doldu. Bağlantıyı yeniden test edin." : undefined,
  };
}
export const integrationCatalog: IntegrationConnection[] = [
  source("slack", "Slack", "S", "iletisim", "Seçili kanallardan ekip nabzı ve anonim konu analizi.", "bagli"),
  source("teams", "Microsoft Teams", "T", "iletisim", "Ekip kanallarındaki gönderilerden çalışan eğilimleri.", "hata"),
  source("trendyol", "Trendyol", "TY", "musteri", "Mağaza yorumları, ürün puanları ve müşteri geri bildirimleri.", "bagli"),
  source("hepsiburada", "Hepsiburada", "HB", "musteri", "Ürün yorumlarını ve memnuniyet eğilimlerini takip edin.", "bagli_degil"),
  source("sikayetvar", "Şikayetvar", "Ş", "musteri", "Şikâyet konularını ve çözüm beklentilerini bir araya getirin.", "yakinda"),
  source("google", "Google Yorumları", "G", "musteri", "İşletme yorumları ve yerel müşteri memnuniyeti.", "bagli_degil"),
  source("appstore", "App Store", "A", "musteri", "iOS uygulama yorumları ve sürüm bazlı geri bildirimler.", "yakinda"),
  source("playstore", "Play Store", "P", "musteri", "Android uygulama puanları ve yorum konu analizi.", "bagli_degil"),
  source("sgk", "e-SGK hazırlık çıktısı", "SGK", "ik", "İşe giriş verilerini resmî bildirim öncesinde hazırlayın.", "bagli_degil"),
  source("bordro", "Bordro yazılımı", "B", "ik", "Personel, maaş ve banka bilgilerini bordroya hazırlayın.", "yakinda"),
  source("email", "E-posta", "@", "ik", "Çalışan davetleri ve süreç bildirimlerinin gönderimi.", "bagli_degil"),
  source("dosya", "CSV / Excel yükleme", "XLS", "veri", "Dosya aktarımıyla anket ve müşteri geri bildirimlerini alın.", "bagli_degil"),
];