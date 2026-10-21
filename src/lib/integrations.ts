import type { IntegrationCategory, IntegrationConnection, IntegrationStatus, SyncFrequency } from "@/types/integrations";

export const integrationCategories: Record<IntegrationCategory, string> = {
  iletisim: "İletişim", musteri: "Müşteri Kaynakları", ik: "İK ve Resmî", veri: "Veri",
};
export const integrationStatuses: Record<IntegrationStatus, { label: string; tone: "basari" | "notr" | "kritik" | "uyari" }> = {
  bagli: { label: "Bağlı", tone: "basari" }, bagli_degil: { label: "Bağlı Değil", tone: "notr" },
  hata: { label: "Hata", tone: "kritik" }, yakinda: { label: "Yakında", tone: "uyari" },
};
export const syncFrequencies: Record<SyncFrequency, string> = { saatlik: "Her saat", gunluk: "Her gün", haftalik: "Her hafta" };

export function validateIntegrationChannels(source: IntegrationConnection, ids: string[]) {
  if (source.channels.length && ids.length === 0) throw new Error("En az bir kanal seçin.");
  if (ids.some(id => !source.channels.some(channel => channel.id === id))) throw new Error("Yalnızca izin verilen kanallar seçilebilir.");
  return [...new Set(ids)];
}