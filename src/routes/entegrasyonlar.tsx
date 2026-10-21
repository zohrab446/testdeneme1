import { createFileRoute } from "@tanstack/react-router";
import { Plug } from "lucide-react";
import { PageScaffold } from "@/components/common/PageScaffold";
import { IntegrationCatalog } from "@/components/integrations/IntegrationCatalog";
import { getIntegrationCatalog } from "@/services/integrations";

export const Route = createFileRoute("/entegrasyonlar")({
  head: () => ({
    meta: [
      { title: "Entegrasyonlar · [ÜRÜN ADI]" },
      { name: "description", content: "Veri kaynaklarınızı bağlayın." },
      { property: "og:title", content: "Entegrasyonlar · [ÜRÜN ADI]" },
      { property: "og:description", content: "Veri kaynaklarınızı bağlayın." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageScaffold
      title="Entegrasyonlar"
      description="Çalışan ve müşteri kaynaklarınız, tek çalışma alanında. Örnek bağlantılar; değişiklikler yenilemede sıfırlanır."
      icon={Plug}
      queryKey={["integration-catalog"]}
      queryFn={getIntegrationCatalog}
      emptyTitle="Henüz entegrasyon yok"
      emptyDescription="Kullanılabilir kaynaklar burada listelenecek."
    >
      {sources => <IntegrationCatalog sources={sources} />}
    </PageScaffold>
  );
}
