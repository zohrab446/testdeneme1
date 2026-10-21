import { createFileRoute } from "@tanstack/react-router";
import { PartyPopper } from "lucide-react";
import { PageScaffold } from "@/components/common/PageScaffold";
import { getInviteByToken } from "@/services";

export const Route = createFileRoute("/karsilama/$token")({
  head: () => ({
    meta: [
      { title: "Aramıza hoş geldin! · [ÜRÜN ADI]" },
      { name: "description", content: "İlk gününe hazırlanmak için onboarding adımlarını tamamla." },
      { property: "og:title", content: "Aramıza hoş geldin!" },
      { property: "og:description", content: "İlk gününe hazırlanmak için onboarding adımlarını tamamla." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  const { token } = Route.useParams();
  return (
    <PageScaffold
      title="Aramıza hoş geldin!"
      description="İlk gününe hazırlanmak için birkaç adım kaldı."
      icon={PartyPopper}
      queryKey={["welcome", token]}
      queryFn={() => getInviteByToken(token)}
      emptyTitle="Davet bağlantısı geçersiz"
      emptyDescription="Bağlantının süresi dolmuş olabilir. İK ekibinle iletişime geç."
    />
  );
}
