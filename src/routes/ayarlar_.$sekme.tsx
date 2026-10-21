import { createFileRoute, notFound } from "@tanstack/react-router";
import { SettingsPage, settingsTabs } from "@/components/common/SettingsPage";
export const Route = createFileRoute("/ayarlar_/$sekme")({
  loader: ({ params }) => { const tab = settingsTabs.find(t => t.slug === params.sekme); if (!tab) throw notFound(); return { label: tab.label }; },
  head: ({ loaderData }) => { const label = loaderData?.label ?? "Ayarlar"; return { meta: [ { title: `${label} · [ÜRÜN ADI]` }, { name: "description", content: `${label} tercihlerini ve şirket ayarlarını yönet.` }, { property: "og:title", content: `${label} · [ÜRÜN ADI]` }, { property: "og:description", content: `${label} tercihlerini ve şirket ayarlarını yönet.` }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" } ] }; },
  component: Page,
});
function Page() { const { sekme } = Route.useParams(); return <SettingsPage tab={sekme} />; }
