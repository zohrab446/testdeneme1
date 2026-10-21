import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { PageScaffold } from "@/components/common/PageScaffold";
import { getDashboardSummary } from "@/services";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · [ÜRÜN ADI]" },
      { name: "description", content: "Ekibinizin ve müşterilerinizin nabzına tek bakışta göz atın." },
      { property: "og:title", content: "Dashboard · [ÜRÜN ADI]" },
      { property: "og:description", content: "Ekibinizin ve müşterilerinizin nabzına tek bakışta göz atın." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageScaffold
      title="Dashboard"
      description="Ekibinizin ve müşterilerinizin nabzına tek bakışta göz atın."
      icon={LayoutDashboard}
      queryKey={["dashboard"]}
      queryFn={getDashboardSummary}
      emptyTitle="Dashboard henüz hazır değil"
    />
  );
}
