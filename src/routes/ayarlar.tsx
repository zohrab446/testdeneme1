import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/common/SettingsPage";
export const Route = createFileRoute("/ayarlar")({
  head: () => ({ meta: [ { title: "Şirket Ayarları · [ÜRÜN ADI]" }, { name: "description", content: "Şirket profili, departmanlar, kullanıcılar ve uygulama tercihleri." }, { property: "og:title", content: "Şirket Ayarları · [ÜRÜN ADI]" }, { property: "og:description", content: "Şirket, gizlilik, bildirim ve görünüm tercihlerini yönet." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" } ] }),
  component: Page,
});
function Page() { return <SettingsPage />; }
