import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { PageScaffold } from "@/components/common/PageScaffold";
import { getActionCards } from "@/services";

export const Route = createFileRoute("/aksiyonlar")({
  head: () => ({
    meta: [
      { title: "Aksiyon Danışmanı · [ÜRÜN ADI]" },
      { name: "description", content: "Yapay zekâ destekli, önceliklendirilmiş aksiyon önerileri." },
      { property: "og:title", content: "Aksiyon Danışmanı · [ÜRÜN ADI]" },
      { property: "og:description", content: "Yapay zekâ destekli, önceliklendirilmiş aksiyon önerileri." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageScaffold
      title="Aksiyon Danışmanı"
      description="Yapay zekâ destekli, önceliklendirilmiş aksiyon önerileri."
      icon={Sparkles}
      queryKey={["actions"]}
      queryFn={getActionCards}
      emptyTitle="Henüz aksiyon önerisi yok"
    />
  );
}
