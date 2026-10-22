/** Entegrasyon hata kodlarını Türkçe kullanıcı mesajlarına çevirir. */
export const integrationErrorMessages: Record<string, string> = {
  TRENDYOL_UNAUTHORIZED: "API anahtarı veya gizli anahtar hatalı. Trendyol Satıcı Paneli'nden kontrol edin.",
  TRENDYOL_FORBIDDEN: "Bu satıcı hesabı için API erişim izni yok. Trendyol'dan entegrasyon iznini açtırın.",
  TRENDYOL_RATE_LIMITED: "Trendyol istek sınırına ulaşıldı. Birkaç dakika sonra tekrar deneyin.",
  TRENDYOL_NOT_FOUND: "Satıcı bulunamadı. Satıcı ID'sini kontrol edin.",
  SLACK_INVALID_CODE: "Slack yetkilendirme kodu geçersiz veya süresi dolmuş. Bağlantıyı yeniden başlatın.",
  SLACK_STATE_MISMATCH: "Güvenlik doğrulaması başarısız. Bağlantıyı yeniden başlatın.",
  SLACK_RATE_LIMITED: "Slack istek sınırına ulaşıldı. Senkron biraz sonra kendiliğinden devam edecek.",
  SLACK_TOKEN_REVOKED: "Slack yetkisi iptal edilmiş. Bağlantıyı yeniden kurun.",
  CSV_TOO_LARGE: "Dosya çok büyük. En fazla 2 MB yükleyebilirsiniz.",
  CSV_TOO_MANY_ROWS: "Dosyada çok fazla satır var. En fazla 5.000 satır içe aktarılabilir.",
  CSV_INVALID: "CSV dosyası okunamadı. Sütun eşlemesini ve dosya biçimini kontrol edin.",
  NOT_FOUND: "Entegrasyon kaydı bulunamadı.",
  FORBIDDEN: "Bu işlem için yetkiniz yok.",
  NOT_CONNECTED: "Önce entegrasyonu bağlayın.",
  CONSENT_REQUIRED: "KVKK açık rıza onayı olmadan bağlantı kurulamaz.",
  UNSUPPORTED: "Bu kaynak için gerçek bağlantı henüz desteklenmiyor.",
  UNKNOWN: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
};

export class IntegrationError extends Error {
  constructor(public code: keyof typeof integrationErrorMessages | string) {
    super(integrationErrorMessages[code] ?? integrationErrorMessages["UNKNOWN"]);
    this.name = "IntegrationError";
  }
}

export function toTurkishMessage(error: unknown): string {
  if (error instanceof IntegrationError) return error.message;
  if (error instanceof Error) return error.message;
  return integrationErrorMessages["UNKNOWN"]!;
}
