/**
 * Zamanlanmış senkron: bağlı entegrasyonları saatlik senkronlar.
 * Yalnızca yönetilen zamanlayıcı çağırabilir (authenticateCronRequest).
 * 3 ardışık hata veren entegrasyonun senkronu duraklatılır (runSync içinde).
 */
import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { runSync } from "@/server/integrations/core";

export const Route = createFileRoute("/api/public/jobs/sync-integrations")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const now = new Date().toISOString();
        const { data: due } = await supabaseAdmin
          .from("integrations")
          .select("id, provider, config, last_sync_at, next_sync_at")
          .eq("status", "bagli")
          .or(`next_sync_at.is.null,next_sync_at.lte.${now}`);

        const results: { id: string; ok: boolean }[] = [];
        for (const integration of due ?? []) {
          // Sıklık kontrolü: config.frequency'e göre henüz vakti gelmediyse atla
          const frequency = (integration.config as Record<string, unknown>)?.["frequency"] ?? "gunluk";
          const intervalMs = frequency === "saatlik" ? 3600000 : frequency === "haftalik" ? 7 * 86400000 : 86400000;
          if (integration.last_sync_at && Date.now() - new Date(integration.last_sync_at).getTime() < intervalMs) continue;
          try {
            await runSync(integration.id);
            results.push({ id: integration.id, ok: true });
          } catch (e) {
            console.error(`Senkron hatası (${integration.provider}):`, e);
            results.push({ id: integration.id, ok: false });
          }
        }
        return Response.json({ success: true, synced: results.length, results });
      },
    },
  },
});
