import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { PageScaffold } from "@/components/common/PageScaffold";
import { getSettings } from "@/services";

export const Route = createFileRoute("/ayarlar")({
  head: () => ({
    meta: [
      { title: "Ayarlar · [ÜRÜN ADI]" },
      { name: "description", content: "Şirket, kullanıcı ve bildirim tercihleri." },
      { property: "og:title", content: "Ayarlar · [ÜRÜN ADI]" },
      { property: "og:description", content: "Şirket, kullanıcı ve bildirim tercihleri." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageScaffold
      title="Ayarlar"
      description="Şirket, kullanıcı ve bildirim tercihleri."
      icon={Settings}
      queryKey={["settings"]}
      queryFn={getSettings}
      emptyTitle="Ayarlar yakında"
    />
  );
}
