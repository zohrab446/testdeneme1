import { createFileRoute } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { PageScaffold } from "@/components/common/PageScaffold";
import { getOnboardingInvites } from "@/services";

export const Route = createFileRoute("/onboarding/")({
  head: () => ({
    meta: [
      { title: "Onboarding · [ÜRÜN ADI]" },
      { name: "description", content: "Yeni çalışan davetleri ve ilerleme durumu." },
      { property: "og:title", content: "Onboarding · [ÜRÜN ADI]" },
      { property: "og:description", content: "Yeni çalışan davetleri ve ilerleme durumu." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageScaffold
      title="Onboarding"
      description="Yeni çalışan davetleri ve ilerleme durumu."
      icon={UserPlus}
      queryKey={["invites"]}
      queryFn={getOnboardingInvites}
      emptyTitle="Henüz davet gönderilmedi"
    />
  );
}
