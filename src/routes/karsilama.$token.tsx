import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ErrorState, SkeletonCard } from "@/components/common";
import { WelcomeForm } from "@/components/welcome/WelcomeForm";
import { AlreadyDoneScreen, ExpiredLinkScreen, InvalidLinkScreen } from "@/components/welcome/StatusScreens";
import { getCompanyProfile, getInviteByToken, openInviteForm } from "@/services";

export const Route = createFileRoute("/karsilama/$token")({
  head: () => ({
    meta: [
      { title: "Aramıza hoş geldin! · [ÜRÜN ADI]" },
      { name: "description", content: "İşe başlangıç bilgilerini birkaç adımda doldur." },
      { property: "og:title", content: "Aramıza hoş geldin!" },
      { property: "og:description", content: "İşe başlangıç bilgilerini birkaç adımda doldur." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  const { token } = Route.useParams();
  const invite = useQuery({ queryKey: ["welcome", token], queryFn: () => getInviteByToken(token), retry: false });
  const company = useQuery({ queryKey: ["company"], queryFn: getCompanyProfile, retry: false });

  const rec = invite.data;
  const expired = !!rec && new Date(rec.expiresAt).getTime() < Date.now();
  const canFill =
    !!rec && (rec.status === "duzeltme_istendi" || ((rec.status === "davet_gonderildi" || rec.status === "form_dolduruluyor") && !expired));

  useEffect(() => {
    if (canFill && rec?.status === "davet_gonderildi") void openInviteForm(token);
  }, [canFill, rec?.status, token]);

  if (invite.isPending || company.isPending)
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Yükleniyor">
        <SkeletonCard lines={1} />
        <SkeletonCard lines={6} />
      </div>
    );
  if (invite.isError || company.isError)
    return (
      <ErrorState
        message="Bilgiler yüklenemedi. İnternet bağlantını kontrol edip tekrar dene."
        onRetry={() => {
          void invite.refetch();
          void company.refetch();
        }}
      />
    );
  if (!rec) return <InvalidLinkScreen />;
  if (rec.status === "tamamlandi" || rec.status === "onay_bekliyor")
    return <AlreadyDoneScreen approved={rec.status === "tamamlandi"} />;
  if (!canFill) return <ExpiredLinkScreen />;

  const firstName = rec.employeeName.split(" ")[0];
  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-medium text-muted-foreground">{company.data.name}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Hoş geldin, {firstName}!</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          İlk gününe hazırlanmak için bilgilerini doldur. Yaklaşık 10 dakika sürer; istediğin zaman ara verebilirsin.
        </p>
      </header>
      <WelcomeForm invite={rec} company={company.data} />
    </div>
  );
}
