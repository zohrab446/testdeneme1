import { createFileRoute } from "@tanstack/react-router";
import { Plug } from "lucide-react";
import { PageScaffold } from "@/components/common/PageScaffold";
import { getIntegrations } from "@/services";

export const Route = createFileRoute("/entegrasyonlar")({
  head: () => ({
    meta: [
      { title: "Entegrasyonlar · [ÜRÜN ADI]" },
      { name: "description", content: "Veri kaynaklarınızı bağlayın." },
      { property: "og:title", content: "Entegrasyonlar · [ÜRÜN ADI]" },
      { property: "og:description", content: "Veri kaynaklarınızı bağlayın." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageScaffold
      title="Entegrasyonlar"
      description="Veri kaynaklarınızı bağlayın."
      icon={Plug}
      queryKey={["integrations"]}
      queryFn={getIntegrations}
      emptyTitle="Henüz entegrasyon yok"
    />
  );
}
