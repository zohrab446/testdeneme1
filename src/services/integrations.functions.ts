/**
 * Entegrasyon sunucu fonksiyonları (gerçek backend modu).
 * Tümü oturum gerektirir; yetki şirket üyeliği + rol üzerinden doğrulanır.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { IntegrationError } from "@/server/integrations/errors";
import {
  audit,
  connectTrendyol,
  disconnectIntegrationById,
  requireManagerRole,
  resolveCompany,
  runSync,
} from "@/server/integrations/core";
import { parseCsv } from "@/server/integrations/csv";
import { listSlackChannels, slackAuthorizeUrl } from "@/server/integrations/slack";
import { hashAuthor, maskPii } from "@/server/integrations/pii";
import type { IntegrationConnection, IntegrationSync } from "@/types/integrations";

const POLICY_VERSION = "v1";

/** Statik katalog meta verisi (görünüm bilgileri; gizli veri içermez). */
const PROVIDER_META: Record<string, { name: string; monogram: string; category: IntegrationConnection["category"]; description: string; permissions: string[] }> = {
  slack: { name: "Slack", monogram: "S", category: "iletisim", description: "Seçili kanallardan ekip nabzı ve anonim konu analizi.", permissions: ["Seçilen herkese açık kanalların mesaj metinleri", "Kanal adı ve mesaj tarihleri"] },
  teams: { name: "Microsoft Teams", monogram: "T", category: "iletisim", description: "Ekip kanallarındaki gönderilerden çalışan eğilimleri.", permissions: ["Seçilen kanalların mesaj metinleri", "Kanal adı ve mesaj tarihleri"] },
  trendyol: { name: "Trendyol", monogram: "TY", category: "musteri", description: "Mağaza yorumları, ürün puanları ve müşteri geri bildirimleri.", permissions: ["Yorum metinleri, puanlar ve yayın tarihleri", "Kaynak ve konu bilgileri; kişisel veriler maskelenir"] },
  hepsiburada: { name: "Hepsiburada", monogram: "HB", category: "musteri", description: "Ürün yorumlarını ve memnuniyet eğilimlerini takip edin.", permissions: ["Yorum metinleri, puanlar ve yayın tarihleri"] },
  sikayetvar: { name: "Şikayetvar", monogram: "Ş", category: "musteri", description: "Şikâyet konularını ve çözüm beklentilerini bir araya getirin.", permissions: ["Şikâyet metinleri ve tarihleri"] },
  google: { name: "Google Yorumları", monogram: "G", category: "musteri", description: "İşletme yorumları ve yerel müşteri memnuniyeti.", permissions: ["Yorum metinleri ve puanlar"] },
  appstore: { name: "App Store", monogram: "A", category: "musteri", description: "iOS uygulama yorumları ve sürüm bazlı geri bildirimler.", permissions: ["Yorum metinleri ve puanlar"] },
  playstore: { name: "Play Store", monogram: "P", category: "musteri", description: "Android uygulama puanları ve yorum konu analizi.", permissions: ["Yorum metinleri ve puanlar"] },
  sgk: { name: "e-SGK hazırlık çıktısı", monogram: "SGK", category: "ik", description: "İşe giriş verilerini resmî bildirim öncesinde hazırlayın.", permissions: ["İşe giriş hazırlığı için gerekli çalışan alanları"] },
  bordro: { name: "Bordro yazılımı", monogram: "B", category: "ik", description: "Personel, maaş ve banka bilgilerini bordroya hazırlayın.", permissions: ["Seçilen personel alanları"] },
  email: { name: "E-posta", monogram: "@", category: "ik", description: "Çalışan davetleri ve süreç bildirimlerinin gönderimi.", permissions: ["Davet ve bildirim e-postalarının gönderim durumu"] },
  dosya: { name: "CSV / Excel yükleme", monogram: "XLS", category: "veri", description: "Dosya aktarımıyla anket ve müşteri geri bildirimlerini alın.", permissions: ["Yüklenen dosyadaki seçilen sütunlar"] },
};

/** Gerçek bağlantısı uygulanmış sağlayıcılar; diğerleri "yakında". */
const LIVE_PROVIDERS = new Set(["trendyol", "slack", "dosya"]);

interface DbIntegration {
  id: string;
  provider: string;
  status: string;
  config: Record<string, unknown>;
  last_sync_at: string | null;
  error_message: string | null;
}

function toConnection(provider: string, row: DbIntegration | undefined, channels: { id: string; name: string }[], logs: IntegrationSync[]): IntegrationConnection {
  const meta = PROVIDER_META[provider]!;
  const status = (row?.status ?? (LIVE_PROVIDERS.has(provider) ? "bagli_degil" : "yakinda")) as IntegrationConnection["status"];
  return {
    id: provider,
    name: meta.name,
    monogram: meta.monogram,
    description: meta.description,
    category: meta.category,
    status,
    permissions: meta.permissions,
    channels,
    selectedChannels: (row?.config["channels"] as string[] | undefined) ?? [],
    frequency: (row?.config["frequency"] as IntegrationConnection["frequency"] | undefined) ?? "gunluk",
    logs,
    lastSync: row?.last_sync_at ?? undefined,
    error: row?.error_message ?? undefined,
    consent: status === "bagli" || status === "hata",
    deletionDays: 30,
    deleteAt: row?.config["delete_after"] as string | undefined,
  };
}

export const listIntegrationCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<IntegrationConnection[]> => {
    const { supabase, userId } = context;
    const ctx = await resolveCompany(supabase, userId);
    const { data: rows } = await supabase.from("integrations").select("id, provider, status, config, last_sync_at, error_message").eq("company_id", ctx.companyId);
    const byProvider = new Map((rows ?? []).map((r) => [r.provider, r as unknown as DbIntegration]));
    const { data: runs } = await supabase.from("sync_runs").select("id, integration_id, started_at, status, records_fetched, error").order("started_at", { ascending: false }).limit(50);
    const logsByIntegration = new Map<string, IntegrationSync[]>();
    for (const run of runs ?? []) {
      const list = logsByIntegration.get(run.integration_id) ?? [];
      if (list.length < 10) list.push({ id: run.id, at: run.started_at, success: run.status === "basarili", count: run.records_fetched, detail: run.error ?? undefined });
      logsByIntegration.set(run.integration_id, list);
    }
    // Slack bağlıysa kanal listesi config'ten gelir (OAuth callback yazar)
    return Object.keys(PROVIDER_META).map((provider) => {
      const row = byProvider.get(provider);
      const channels = ((row?.config["available_channels"] as { id: string; name: string }[] | undefined) ?? []);
      return toConnection(provider, row, channels, row ? (logsByIntegration.get(row.id) ?? []) : []);
    });
  });

export const connectTrendyolFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sellerId: string; apiKey: string; apiSecret: string; consent: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const ctx = await resolveCompany(supabase, userId);
    requireManagerRole(ctx);
    if (!data.sellerId.trim() || !data.apiKey.trim() || !data.apiSecret.trim()) throw new IntegrationError("CSV_INVALID");
    await connectTrendyol(supabase, ctx, userId, { sellerId: data.sellerId.trim(), apiKey: data.apiKey.trim(), apiSecret: data.apiSecret.trim() }, data.consent);
    // İlk senkronu arka planda başlat (son 90 gün, 14 günlük parçalar)
    const { data: row } = await supabase.from("integrations").select("id").eq("company_id", ctx.companyId).eq("provider", "trendyol").single();
    if (row) void runSync(row.id).catch((e) => console.error("İlk Trendyol senkronu hatası:", e));
    return { ok: true };
  });

export const startSlackOAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { consent: boolean; origin: string }) => input)
  .handler(async ({ data, context }): Promise<{ url: string | null; connected: boolean }> => {
    const { supabase, userId } = context;
    const ctx = await resolveCompany(supabase, userId);
    requireManagerRole(ctx);
    if (!data.consent) throw new IntegrationError("CONSENT_REQUIRED");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Tercih 1: Lovable Slack bağlantısı (gateway) — OAuth uygulaması gerekmez
    if (process.env["SLACK_API_KEY"]) {
      const channels = await listSlackChannelsGateway();
      if (!channels.length) throw new Error("Slack çalışma alanında herkese açık kanal bulunamadı.");
      await supabaseAdmin.from("integrations").upsert(
        {
          company_id: ctx.companyId,
          provider: "slack",
          status: "bagli",
          auth_type: "connector",
          scopes: ["channels:read", "channels:history"],
          config: JSON.parse(JSON.stringify({ available_channels: channels, channels: channels.map((c) => c.id) })),
          error_code: null,
          error_message: null,
          consecutive_failures: 0,
        },
        { onConflict: "company_id,provider" },
      );
      await supabase.from("consents").upsert(
        { company_id: ctx.companyId, user_id: userId, provider: "slack", policy_version: POLICY_VERSION },
        { onConflict: "company_id,user_id,provider" },
      );
      await audit(ctx.companyId, userId, "integration_connected", { provider: "slack", via: "connector" });
      return { url: null, connected: true };
    }

    // Tercih 2: özel Slack uygulaması ile OAuth v2
    const clientId = process.env["SLACK_CLIENT_ID"];
    if (!clientId) throw new Error("Slack bağlantısı henüz yapılandırılmadı.");
    const state = crypto.randomUUID();
    await supabaseAdmin.from("integrations").upsert(
      { company_id: ctx.companyId, provider: "slack", status: "bagli_degil", auth_type: "oauth", scopes: ["channels:read", "channels:history"], config: { oauth_state: state } },
      { onConflict: "company_id,provider" },
    );
    await supabase.from("consents").upsert(
      { company_id: ctx.companyId, user_id: userId, provider: "slack", policy_version: POLICY_VERSION },
      { onConflict: "company_id,user_id,provider" },
    );
    const redirectUri = `${data.origin}/api/public/integrations/slack/callback`;
    return { url: slackAuthorizeUrl(clientId, redirectUri, state), connected: false };
  });

export const saveIntegrationSettingsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { provider: string; frequency: string; channels: string[] }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const ctx = await resolveCompany(supabase, userId);
    requireManagerRole(ctx);
    if (!["saatlik", "gunluk", "haftalik"].includes(data.frequency)) throw new Error("Geçerli bir senkron sıklığı seçin.");
    const { data: row } = await supabase.from("integrations").select("id, config").eq("company_id", ctx.companyId).eq("provider", data.provider).maybeSingle();
    if (!row) throw new IntegrationError("NOT_CONNECTED");
    const config = (row.config ?? {}) as Record<string, unknown>;
    const available = (config["available_channels"] as { id: string }[] | undefined) ?? [];
    if (available.length && data.channels.some((c) => !available.some((a) => a.id === c))) throw new Error("Yalnızca izin verilen kanallar seçilebilir.");
    if (available.length && !data.channels.length) throw new Error("En az bir kanal seçin.");
    await supabase.from("integrations").update({ config: { ...config, frequency: data.frequency, channels: data.channels } }).eq("id", row.id);
    await audit(ctx.companyId, userId, "integration_settings_saved", { provider: data.provider });
    return { ok: true };
  });

export const disconnectIntegrationFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { provider: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const ctx = await resolveCompany(supabase, userId);
    requireManagerRole(ctx);
    const { data: row } = await supabase.from("integrations").select("id").eq("company_id", ctx.companyId).eq("provider", data.provider).maybeSingle();
    if (!row) throw new IntegrationError("NOT_FOUND");
    await disconnectIntegrationById(row.id, userId);
    return { ok: true };
  });

export const syncIntegrationNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { provider: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const ctx = await resolveCompany(supabase, userId);
    requireManagerRole(ctx);
    const { data: row } = await supabase.from("integrations").select("id").eq("company_id", ctx.companyId).eq("provider", data.provider).maybeSingle();
    if (!row) throw new IntegrationError("NOT_CONNECTED");
    return runSync(row.id);
  });

export const importCsvFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { content: string; mapping: { text: string; date?: string; author?: string }; source: string; consent: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const ctx = await resolveCompany(supabase, userId);
    requireManagerRole(ctx);
    if (!data.consent) throw new IntegrationError("CONSENT_REQUIRED");
    let result;
    try {
      result = parseCsv(data.content, data.mapping);
    } catch (e) {
      throw new IntegrationError(e instanceof Error ? e.message : "CSV_INVALID");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: integration } = await supabaseAdmin.from("integrations").upsert(
      { company_id: ctx.companyId, provider: "dosya", status: "bagli", auth_type: "manuel", config: {} },
      { onConflict: "company_id,provider" },
    ).select("id").single();
    const { data: run } = await supabaseAdmin.from("sync_runs").insert({ integration_id: integration!.id }).select("id").single();
    let inserted = 0;
    for (const row of result.rows) {
      const { error } = await supabaseAdmin.from("raw_items").upsert(
        {
          company_id: ctx.companyId,
          source: data.source || "csv",
          external_id: row.externalId,
          author_hash: row.author ? await hashAuthor(row.author) : null,
          text: maskPii(row.text),
          created_at: row.createdAt,
        },
        { onConflict: "company_id,source,external_id", ignoreDuplicates: true },
      );
      if (!error) inserted++;
    }
    await supabaseAdmin.from("sync_runs").update({ finished_at: new Date().toISOString(), status: "basarili", records_fetched: inserted }).eq("id", run!.id);
    await supabase.from("consents").upsert(
      { company_id: ctx.companyId, user_id: userId, provider: "dosya", policy_version: POLICY_VERSION },
      { onConflict: "company_id,user_id,provider" },
    );
    await audit(ctx.companyId, userId, "csv_imported", { inserted, errors: result.errors.length });
    return { inserted, errors: result.errors };
  });

/** Slack callback'inden sonra kanal listesini config'e yazmak için kullanılır. */
export async function saveSlackChannels(integrationId: string, channels: { id: string; name: string }[]): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin.from("integrations").select("config").eq("id", integrationId).single();
  await supabaseAdmin.from("integrations").update({ config: { ...((row?.config ?? {}) as Record<string, unknown>), available_channels: channels, channels: channels.map((c) => c.id) } }).eq("id", integrationId);
}

export { listSlackChannels };
