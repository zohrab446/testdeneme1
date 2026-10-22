/**
 * Slack OAuth v2 callback (herkese açık rota).
 * state parametresi ile CSRF koruması yapılır; token şifreli saklanır.
 */
import { createFileRoute } from "@tanstack/react-router";
import { exchangeSlackCode, listSlackChannels } from "@/server/integrations/slack";
import { storeSecret } from "@/server/integrations/secrets";

export const Route = createFileRoute("/api/public/integrations/slack/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const errorParam = url.searchParams.get("error");
        const origin = url.origin;
        if (errorParam) return Response.redirect(`${origin}/entegrasyonlar?slack=hata`, 302);
        if (!code || !state) return Response.redirect(`${origin}/entegrasyonlar?slack=hata`, 302);

        const clientId = process.env["SLACK_CLIENT_ID"];
        const clientSecret = process.env["SLACK_CLIENT_SECRET"];
        if (!clientId || !clientSecret) return Response.redirect(`${origin}/entegrasyonlar?slack=yapilandirma`, 302);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        // state doğrulaması: yalnızca bu state ile başlatılmış kayıt kabul edilir
        const { data: integration } = await supabaseAdmin
          .from("integrations")
          .select("id, company_id, config")
          .eq("provider", "slack")
          .eq("config->>oauth_state", state)
          .maybeSingle();
        if (!integration) return Response.redirect(`${origin}/entegrasyonlar?slack=hata`, 302);

        try {
          const redirectUri = `${origin}/api/public/integrations/slack/callback`;
          const token = await exchangeSlackCode(clientId, clientSecret, code, redirectUri);
          await storeSecret(supabaseAdmin, integration.id, "access_token", token);
          const channels = await listSlackChannels(token);
          await supabaseAdmin
            .from("integrations")
            .update({
              status: "bagli",
              error_code: null,
              error_message: null,
              consecutive_failures: 0,
              config: JSON.parse(JSON.stringify({ available_channels: channels, channels: channels.map((c) => c.id) })),
            })
            .eq("id", integration.id);
          await supabaseAdmin.from("audit_log").insert({ company_id: integration.company_id, action: "integration_connected", detail: { provider: "slack" } });
          return Response.redirect(`${origin}/entegrasyonlar?slack=baglandi`, 302);
        } catch (e) {
          console.error("Slack OAuth hatası:", e);
          return Response.redirect(`${origin}/entegrasyonlar?slack=hata`, 302);
        }
      },
    },
  },
});
