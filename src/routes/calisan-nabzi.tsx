import { createFileRoute } from "@tanstack/react-router";
import { HeartPulse } from "lucide-react";
import { PageScaffold } from "@/components/common/PageScaffold";
import { getSentimentSeries } from "@/services";

export const Route = createFileRoute("/calisan-nabzi")({
  head: () => ({
    meta: [
      { title: "Çalışan Nabzı · [ÜRÜN ADI]" },
      { name: "description", content: "Çalışan memnuniyeti ve bağlılık eğilimleri." },
      { property: "og:title", content: "Çalışan Nabzı · [ÜRÜN ADI]" },
      { property: "og:description", content: "Çalışan memnuniyeti ve bağlılık eğilimleri." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageScaffold
      title="Çalışan Nabzı"
      description="Çalışan memnuniyeti ve bağlılık eğilimleri."
      icon={HeartPulse}
      queryKey={["sentiment"]}
      queryFn={getSentimentSeries}
      emptyTitle="Henüz nabız verisi yok"
    />
  );
}
