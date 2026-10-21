import { createFileRoute } from "@tanstack/react-router";
import { MessageSquareQuote } from "lucide-react";
import { PageScaffold } from "@/components/common/PageScaffold";
import { getCustomerReviews } from "@/services";

export const Route = createFileRoute("/musteri-sesi")({
  head: () => ({
    meta: [
      { title: "Müşteri Sesi · [ÜRÜN ADI]" },
      { name: "description", content: "Yorumlar, şikâyetler ve duygu analizi tek yerde." },
      { property: "og:title", content: "Müşteri Sesi · [ÜRÜN ADI]" },
      { property: "og:description", content: "Yorumlar, şikâyetler ve duygu analizi tek yerde." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageScaffold
      title="Müşteri Sesi"
      description="Yorumlar, şikâyetler ve duygu analizi tek yerde."
      icon={MessageSquareQuote}
      queryKey={["reviews"]}
      queryFn={getCustomerReviews}
      emptyTitle="Henüz müşteri yorumu yok"
    />
  );
}
