/**
 * Slack entegrasyonu: iki yol desteklenir.
 * 1) Lovable Slack bağlantısı (tercih edilen): connector gateway üzerinden,
 *    LOVABLE_API_KEY + SLACK_API_KEY ile. Kullanıcının uygulama oluşturması gerekmez.
 * 2) Özel Slack uygulaması (OAuth v2): SLACK_CLIENT_ID/SECRET tanımlıysa.
 * Yalnızca herkese açık kanallar: özel mesajlar ve özel kanallar kapsam dışı.
 */

const GATEWAY_URL = "https://connector-gateway.lovable.dev/slack/api";

/** Gateway üzerinden Slack API çağrısı (sunucu tarafı). */
async function slackGatewayFetch(method: string, query: string, attempt = 0): Promise<Record<string, unknown>> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["SLACK_API_KEY"];
  if (!lovableKey || !connectionKey) throw new Error("SLACK_NOT_LINKED");
  const res = await fetch(`${GATEWAY_URL}/${method}${query ? `?${query}` : ""}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": connectionKey },
  });
  if (res.status === 429 && attempt < 4) {
    const retryAfter = Number(res.headers.get("Retry-After") ?? "2");
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return slackGatewayFetch(method, query, attempt + 1);
  }
  const data = (await res.json()) as Record<string, unknown> & { ok: boolean; error?: string };
  if (!data.ok) throw new Error(`SLACK:${data.error ?? "unknown"}`);
  return data;
}

/** Bağlı Slack çalışma alanının herkese açık kanallarını gateway üzerinden listeler. */
export async function listSlackChannelsGateway(): Promise<SlackChannel[]> {
  const channels: SlackChannel[] = [];
  let cursor = "";
  do {
    const data = await slackGatewayFetch("conversations.list", `limit=200&types=public_channel${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
    for (const c of (data["channels"] as { id: string; name: string }[] | undefined) ?? []) {
      channels.push({ id: c.id, name: c.name });
    }
    cursor = (data["response_metadata"] as { next_cursor?: string } | undefined)?.next_cursor ?? "";
  } while (cursor);
  return channels;
}

/** Seçili kanallardan gateway üzerinden artımlı mesaj çeker. */
export async function fetchSlackMessagesGateway(channelIds: string[], sinceTs?: string): Promise<{ channel: string; messages: SlackMessage[] }[]> {
  const out: { channel: string; messages: SlackMessage[] }[] = [];
  for (const channel of channelIds) {
    const messages: SlackMessage[] = [];
    let cursor = "";
    do {
      const params = new URLSearchParams({ channel, limit: "200" });
      if (sinceTs) params.set("oldest", sinceTs);
      if (cursor) params.set("cursor", cursor);
      const data = await slackGatewayFetch("conversations.history", params.toString());
      for (const m of (data["messages"] as (SlackMessage & { subtype?: string; bot_id?: string })[] | undefined) ?? []) {
        if (m.bot_id) continue;
        if (m.subtype === "channel_join" || m.subtype === "channel_leave") continue;
        if (!m.text?.trim()) continue;
        messages.push({ ts: m.ts, text: m.text, user: m.user });
      }
      cursor = (data["response_metadata"] as { next_cursor?: string } | undefined)?.next_cursor ?? "";
    } while (cursor);
    out.push({ channel, messages });
  }
  return out;
}

export const SLACK_SCOPES = ["channels:read", "channels:history"] as const;

export function slackAuthorizeUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    scope: SLACK_SCOPES.join(","),
    redirect_uri: redirectUri,
    state,
  });
  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

export async function exchangeSlackCode(clientId: string, clientSecret: string, code: string, redirectUri: string): Promise<string> {
  const res = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }),
  });
  const data = (await res.json()) as { ok: boolean; access_token?: string; error?: string };
  if (!data.ok || !data.access_token) throw new Error(`SLACK_INVALID_CODE:${data.error ?? "unknown"}`);
  return data.access_token;
}

export interface SlackChannel {
  id: string;
  name: string;
}

async function slackFetch(token: string, method: string, query: string, attempt = 0): Promise<Record<string, unknown>> {
  const res = await fetch(`https://slack.com/api/${method}?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 429 && attempt < 4) {
    // Retry-After başlığını dikkate al
    const retryAfter = Number(res.headers.get("Retry-After") ?? "2");
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return slackFetch(token, method, query, attempt + 1);
  }
  const data = (await res.json()) as Record<string, unknown> & { ok: boolean; error?: string };
  if (!data.ok) {
    if (data.error === "ratelimited" && attempt < 4) {
      await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
      return slackFetch(token, method, query, attempt + 1);
    }
    throw new Error(`SLACK:${data.error ?? "unknown"}`);
  }
  return data;
}

/** Yalnızca herkese açık kanalları listeler (özel kanallar ve DM'ler hariç). */
export async function listSlackChannels(token: string): Promise<SlackChannel[]> {
  const channels: SlackChannel[] = [];
  let cursor = "";
  do {
    const data = await slackFetch(token, "conversations.list", `limit=200&types=public_channel${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
    for (const c of (data["channels"] as { id: string; name: string }[] | undefined) ?? []) {
      channels.push({ id: c.id, name: c.name });
    }
    cursor = (data["response_metadata"] as { next_cursor?: string } | undefined)?.next_cursor ?? "";
  } while (cursor);
  return channels;
}

export interface SlackMessage {
  ts: string;
  text: string;
  user?: string | undefined;
}

/** Seçili kanallardan artımlı mesaj çeker; bot ve katılım/ayrılma olaylarını atlar. */
export async function fetchSlackMessages(token: string, channelIds: string[], sinceTs?: string): Promise<{ channel: string; messages: SlackMessage[] }[]> {
  const out: { channel: string; messages: SlackMessage[] }[] = [];
  for (const channel of channelIds) {
    const messages: SlackMessage[] = [];
    let cursor = "";
    do {
      const params = new URLSearchParams({ channel, limit: "200" });
      if (sinceTs) params.set("oldest", sinceTs);
      if (cursor) params.set("cursor", cursor);
      const data = await slackFetch(token, "conversations.history", params.toString());
      for (const m of (data["messages"] as (SlackMessage & { subtype?: string; bot_id?: string })[] | undefined) ?? []) {
        if (m.bot_id) continue; // bot mesajlarını atla
        if (m.subtype === "channel_join" || m.subtype === "channel_leave") continue; // katılım/ayrılma olaylarını atla
        if (!m.text?.trim()) continue;
        messages.push({ ts: m.ts, text: m.text, user: m.user });
      }
      cursor = (data["response_metadata"] as { next_cursor?: string } | undefined)?.next_cursor ?? "";
    } while (cursor);
    out.push({ channel, messages });
  }
  return out;
}
