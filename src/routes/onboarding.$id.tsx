import { createFileRoute } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { PageScaffold } from "@/components/common/PageScaffold";
import { getOnboardingInvite } from "@/services";

export const Route = createFileRoute("/onboarding/$id")({
  head: () => ({
    meta: [
      { title: "Onboarding Detayı · [ÜRÜN ADI]" },
      { name: "description", content: "Yeni çalışanın onboarding adımları ve ilerlemesi." },
      { property: "og:title", content: "Onboarding Detayı · [ÜRÜN ADI]" },
      { property: "og:description", content: "Yeni çalışanın onboarding adımları ve ilerlemesi." },
    ],
  }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  return (
    <PageScaffold
      title="Onboarding Detayı"
      description={`Davet #${id}`}
      icon={UserPlus}
      queryKey={["invite", id]}
      queryFn={() => getOnboardingInvite(id)}
      emptyTitle="Davet bulunamadı"
    />
  );
}
