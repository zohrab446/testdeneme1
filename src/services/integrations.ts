import { integrationCatalog } from "@/mocks/integrations";
import { validateIntegrationChannels, syncFrequencies } from "@/lib/integrations";
import type { IntegrationConnection, SyncFrequency } from "@/types/integrations";
import { delay, mockResponse } from "./http";
import { USE_MOCKS } from "./mode";
import {
  connectTrendyolFn,
  disconnectIntegrationFn,
  importCsvFn,
  listIntegrationCatalog,
  listSlackChannelsFn,
  saveIntegrationSettingsFn,
  startSlackOAuth,
  syncIntegrationNow,
} from "./integrations.functions";

/**
 * VITE_USE_MOCKS=true → eski mock davranışı (gecikmeli, in-memory).
 * VITE_USE_MOCKS=false → gerçek backend (sunucu fonksiyonları + veritabanı).
 * Bileşenler yalnızca bu dosyadaki fonksiyonları çağırır; mod burada seçilir.
 */
export { USE_MOCKS };

export function getIntegrationCatalog(): Promise<IntegrationConnection[]> {
  if (!USE_MOCKS) return listIntegrationCatalog();
  return mockResponse(integrationCatalog, []);
}

function find(id: string) {
  const source = integrationCatalog.find((item) => item.id === id);
  if (!source) throw new Error("Kaynak bulunamadı.");
  return source;
}

function record(source: IntegrationConnection, success: boolean, detail?: string) {
  const at = new Date().toISOString();
  source.logs = [{ id: crypto.randomUUID(), at, success, count: success ? 42 : 0, detail }, ...source.logs].slice(0, 10);
  if (success) source.lastSync = at;
}

/** Mock modda bağlantı testi; gerçek modda sağlayıcıya özel bağlan fonksiyonları kullanılır. */
export async function testIntegrationConnection(id: string, consent: boolean, channels: string[]) {
  if (!USE_MOCKS) throw new Error("Gerçek modda sağlayıcıya özel bağlan akışı kullanılır.");
  const source = find(id);
  if (source.status === "yakinda") throw new Error("Bu kaynak henüz kullanıma açılmadı.");
  if (!consent) throw new Error("KVKK onayı olmadan bağlantı kurulamaz.");
  const selected = validateIntegrationChannels(source, channels);
  await delay(700, 800);
  if (Math.random() < 0.35) {
    source.status = "hata";
    source.error = "Bağlantı testi zaman aşımına uğradı. İzinleri kontrol edip tekrar deneyin.";
    record(source, false, source.error);
    throw new Error(source.error);
  }
  source.status = "bagli";
  source.error = undefined;
  source.consent = true;
  source.selectedChannels = selected;
  source.deleteAt = undefined;
  record(source, true);
  return structuredClone(source);
}

/** Trendyol gerçek bağlantısı (yalnızca gerçek mod). */
export function connectTrendyolIntegration(input: { sellerId: string; apiKey: string; apiSecret: string; consent: boolean }) {
  return connectTrendyolFn({ data: input });
}

/** Bağlanmadan önce Slack çalışma alanındaki herkese açık kanalları listeler (yalnızca gerçek mod). */
export function listSlackWorkspaceChannels(): Promise<{ id: string; name: string }[]> {
  return listSlackChannelsFn();
}

/** Slack bağlantısı: gateway bağlantısı varsa doğrudan bağlanır, yoksa OAuth URL'si döner (yalnızca gerçek mod). */
export async function startSlackConnection(consent: boolean, channels?: string[]): Promise<{ url: string | null; connected: boolean }> {
  return startSlackOAuth({ data: { consent, origin: window.location.origin, ...(channels ? { channels } : {}) } });
}

/** CSV içe aktarım (yalnızca gerçek mod). */
export function importCsvIntegration(input: { content: string; mapping: { text: string; date?: string; author?: string }; source: string; consent: boolean }) {
  return importCsvFn({ data: input });
}

export async function saveIntegrationSettings(id: string, frequency: SyncFrequency, channels: string[]) {
  if (!USE_MOCKS) {
    await saveIntegrationSettingsFn({ data: { provider: id, frequency, channels } });
    return;
  }
  const source = find(id);
  if (source.status !== "bagli" && source.status !== "hata") throw new Error("Önce kaynağı bağlayın.");
  if (!source.consent) throw new Error("Önce KVKK onayıyla bağlantıyı tamamlayın.");
  if (!(frequency in syncFrequencies)) throw new Error("Geçerli bir senkron sıklığı seçin.");
  const selected = validateIntegrationChannels(source, channels);
  await delay();
  source.frequency = frequency;
  source.selectedChannels = selected;
  return structuredClone(source);
}

export async function disconnectIntegration(id: string) {
  if (!USE_MOCKS) {
    await disconnectIntegrationFn({ data: { provider: id } });
    return;
  }
  const source = find(id);
  await delay();
  source.status = "bagli_degil";
  source.consent = false;
  source.selectedChannels = [];
  source.error = undefined;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + source.deletionDays);
  source.deleteAt = expiry.toISOString();
  return structuredClone(source);
}

/** "Şimdi senkronla": gerçek modda senkronu tetikler, mock modda örnek kayıt üretir. */
export async function syncIntegration(id: string) {
  if (!USE_MOCKS) return syncIntegrationNow({ data: { provider: id } });
  const source = find(id);
  if (source.status !== "bagli" && source.status !== "hata") throw new Error("Önce kaynağı bağlayın.");
  await delay(700, 900);
  source.status = "bagli";
  source.error = undefined;
  record(source, true);
  return { fetched: 42 };
}

export async function requestIntegrationNotification(id: string, email: string) {
  const source = find(id);
  if (source.status !== "yakinda") throw new Error("Bu kaynak zaten kullanıma açık.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Geçerli bir e-posta adresi girin.");
  await delay();
  source.notificationEmail = email.trim();
  return structuredClone(source);
}
