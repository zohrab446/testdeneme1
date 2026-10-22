/**
 * Entegrasyon çekirdeği: şirket çözümleme, senkron çalıştırma, analiz tetikleme.
 * Yalnızca sunucuda çalışır; istemci bu modülü import etmez.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { IntegrationError } from "./errors";
import { fetchTrendyolQuestions, testTrendyolConnection, TrendyolApiError, type TrendyolCredentials } from "./trendyol";
import { fetchSlackMessages, fetchSlackMessagesGateway } from "./slack";
import { analyzeTexts } from "./analyze";
import { hashAuthor, maskPii } from "./pii";
import { deleteSecrets, readSecret, storeSecret } from "./secrets";

export interface CompanyContext {
  companyId: string;
  role: string;
}

/** Kullanıcının şirket üyeliğini bulur; yoksa ilk şirketi kurar (bootstrap). */
export async function resolveCompany(supabase: SupabaseClient, userId: string): Promise<CompanyContext> {
  const { data: membership } = await supabase
    .from("memberships")
    .select("company_id, role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (membership) return { companyId: membership.company_id, role: membership.role };

  // İlk giriş: şirket + sahip üyeliği oluştur
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({ name: "Şirketim" })
    .select("id")
    .single();
  if (companyError || !company) throw new Error(`Şirket oluşturulamadı: ${companyError?.message}`);
  const { error: memberError } = await supabase
    .from("memberships")
    .insert({ company_id: company.id, user_id: userId, role: "sahip" });
  if (memberError) throw new Error(`Üyelik oluşturulamadı: ${memberError.message}`);
  return { companyId: company.id, role: "sahip" };
}

export function requireManagerRole(ctx: CompanyContext): void {
  if (ctx.role !== "sahip" && ctx.role !== "ik") throw new IntegrationError("FORBIDDEN");
}

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function audit(companyId: string, actorId: string | null, action: string, detail: Record<string, unknown> = {}) {
  const admin = await getAdmin();
  await admin.from("audit_log").insert({ company_id: companyId, actor_id: actorId, action, detail: JSON.parse(JSON.stringify(detail)) });
}

function mapTrendyolError(error: unknown): IntegrationError {
  if (error instanceof TrendyolApiError) {
    if (error.status === 401) return new IntegrationError("TRENDYOL_UNAUTHORIZED");
    if (error.status === 403) return new IntegrationError("TRENDYOL_FORBIDDEN");
    if (error.status === 404) return new IntegrationError("TRENDYOL_NOT_FOUND");
    if (error.status === 429) return new IntegrationError("TRENDYOL_RATE_LIMITED");
  }
  return new IntegrationError("UNKNOWN");
}

/** Trendyol bağlantısı: test et, secret'ları şifreli sakla, kaydı oluştur. */
export async function connectTrendyol(
  supabase: SupabaseClient,
  ctx: CompanyContext,
  userId: string,
  creds: TrendyolCredentials,
  consent: boolean,
): Promise<void> {
  if (!consent) throw new IntegrationError("CONSENT_REQUIRED");
  try {
    await testTrendyolConnection(creds);
  } catch (e) {
    throw mapTrendyolError(e);
  }
  const admin = await getAdmin();
  const { data: integration, error } = await admin
    .from("integrations")
    .upsert(
      {
        company_id: ctx.companyId,
        provider: "trendyol",
        status: "bagli",
        auth_type: "api_key",
        scopes: ["musteri_sorulari"],
        config: { seller_id: creds.sellerId },
        error_code: null,
        error_message: null,
        consecutive_failures: 0,
      },
      { onConflict: "company_id,provider" },
    )
    .select("id")
    .single();
  if (error || !integration) throw new Error(`Entegrasyon kaydedilemedi: ${error?.message}`);
  await storeSecret(admin, integration.id, "api_key", creds.apiKey);
  await storeSecret(admin, integration.id, "api_secret", creds.apiSecret);
  await supabase.from("consents").upsert(
    { company_id: ctx.companyId, user_id: userId, provider: "trendyol", policy_version: "v1" },
    { onConflict: "company_id,user_id,provider" },
  );
  await audit(ctx.companyId, userId, "integration_connected", { provider: "trendyol" });
}

interface IntegrationRow {
  id: string;
  company_id: string;
  provider: string;
  status: string;
  config: Record<string, unknown>;
  last_sync_at: string | null;
  consecutive_failures: number;
}

/** Yeni ham kayıtları yazar ve analiz hattını çalıştırır. */
async function ingestRawItems(
  admin: SupabaseClient,
  companyId: string,
  source: string,
  items: { externalId: string; text: string; createdAt: string; author?: string | undefined }[],
): Promise<number> {
  let inserted = 0;
  for (const item of items) {
    const row = {
      company_id: companyId,
      source,
      external_id: item.externalId,
      author_hash: item.author ? await hashAuthor(item.author) : null,
      text: maskPii(item.text),
      created_at: item.createdAt,
    };
    const { error } = await admin.from("raw_items").upsert(row, { onConflict: "company_id,source,external_id", ignoreDuplicates: true });
    if (!error) inserted++;
  }
  // Analiz hattı: henüz analiz edilmemiş kayıtları toplu işle
  const { data: pending } = await admin
    .from("raw_items")
    .select("id, text")
    .eq("company_id", companyId)
    .is("analyzed_at", null)
    .limit(20);
  if (pending?.length) {
    try {
      const results = await analyzeTexts(pending.map((p) => p.text));
      for (let i = 0; i < pending.length; i++) {
        await admin
          .from("raw_items")
          .update({ sentiment: results[i]!.sentiment, topics: results[i]!.topics, analyzed_at: new Date().toISOString() })
          .eq("id", pending[i]!.id);
      }
    } catch (e) {
      console.error("Analiz hattı hatası:", e); // analiz hatası senkronu düşürmez
    }
  }
  return inserted;
}

/** Bir entegrasyon için senkron çalıştırır; sync_runs'a ilerlemeyi yazar. */
export async function runSync(integrationId: string): Promise<{ fetched: number }> {
  const admin = await getAdmin();
  const { data: integration } = await admin.from("integrations").select("*").eq("id", integrationId).single();
  if (!integration) throw new IntegrationError("NOT_FOUND");
  const row = integration as unknown as IntegrationRow;
  if (row.status !== "bagli" && row.status !== "hata") throw new IntegrationError("NOT_CONNECTED");

  const { data: run } = await admin.from("sync_runs").insert({ integration_id: row.id }).select("id").single();
  const finish = async (status: "basarili" | "hata", fetched: number, error?: string) => {
    if (run) await admin.from("sync_runs").update({ finished_at: new Date().toISOString(), status, records_fetched: fetched, error: error ?? null }).eq("id", run.id);
    const failures = status === "hata" ? row.consecutive_failures + 1 : 0;
    await admin
      .from("integrations")
      .update({
        last_sync_at: status === "basarili" ? new Date().toISOString() : row.last_sync_at,
        next_sync_at: failures >= 3 ? null : new Date(Date.now() + 3600000).toISOString(),
        status: failures >= 3 ? "hata" : status === "hata" ? row.status : "bagli",
        consecutive_failures: failures,
        error_message: error ?? null,
        error_code: error ? "SYNC" : null,
      })
      .eq("id", row.id);
  };

  try {
    let fetched = 0;
    if (row.provider === "trendyol") {
      const creds: TrendyolCredentials = {
        sellerId: String(row.config["seller_id"] ?? ""),
        apiKey: (await readSecret(admin, row.id, "api_key")) ?? "",
        apiSecret: (await readSecret(admin, row.id, "api_secret")) ?? "",
      };
      // İlk bağlanmada son 90 gün; sonrasında son senkrondan itibaren
      const from = row.last_sync_at ? new Date(row.last_sync_at).getTime() : Date.now() - 90 * 86400000;
      const questions = await fetchTrendyolQuestions(creds, from, Date.now(), async (n) => {
        if (run) await admin.from("sync_runs").update({ records_fetched: n }).eq("id", run.id);
      });
      fetched = await ingestRawItems(
        admin,
        row.company_id,
        "trendyol",
        questions.map((q) => ({
          externalId: String(q.id),
          text: q.text,
          createdAt: q.creationDate ? new Date(q.creationDate).toISOString() : new Date().toISOString(),
          author: q.customerId ? `musteri-${q.customerId}` : undefined,
        })),
      );
    } else if (row.provider === "slack") {
      const token = await readSecret(admin, row.id, "access_token");
      if (!token) throw new IntegrationError("SLACK_TOKEN_REVOKED");
      const channels = (row.config["channels"] as string[] | undefined) ?? [];
      if (!channels.length) throw new IntegrationError("NOT_CONNECTED");
      const since = row.last_sync_at ? String(new Date(row.last_sync_at).getTime() / 1000) : undefined;
      const byChannel = await fetchSlackMessages(token, channels, since);
      const items = byChannel.flatMap(({ channel, messages }) =>
        messages.map((m) => ({
          externalId: `${channel}-${m.ts}`,
          text: m.text,
          createdAt: new Date(Number(m.ts) * 1000).toISOString(),
          author: m.user,
        })),
      );
      fetched = await ingestRawItems(admin, row.company_id, "slack", items);
    } else {
      throw new IntegrationError("UNSUPPORTED");
    }
    await finish("basarili", fetched);
    return { fetched };
  } catch (e) {
    const mapped = e instanceof IntegrationError ? e : mapTrendyolError(e);
    await finish("hata", 0, mapped.message);
    throw mapped;
  }
}

/** Bağlantıyı keser: secret'ları siler, veri silmeyi planlar, denetim kaydı yazar. */
export async function disconnectIntegrationById(integrationId: string, actorId: string, deletionDays = 30): Promise<void> {
  const admin = await getAdmin();
  const { data: integration } = await admin.from("integrations").select("id, company_id, provider").eq("id", integrationId).single();
  if (!integration) throw new IntegrationError("NOT_FOUND");
  await deleteSecrets(admin, integrationId);
  const deleteAfter = new Date(Date.now() + deletionDays * 86400000).toISOString();
  await admin
    .from("integrations")
    .update({ status: "bagli_degil", config: { delete_after: deleteAfter }, next_sync_at: null, consecutive_failures: 0 })
    .eq("id", integrationId);
  await audit(integration.company_id, actorId, "integration_disconnected", { provider: integration.provider, delete_after: deleteAfter });
}
