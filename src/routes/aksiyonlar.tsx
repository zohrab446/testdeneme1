import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { z } from "zod";
import { EmptyState, StatusBadge } from "@/components/common";
import { PageScaffold } from "@/components/common/PageScaffold";
import { getActionCards } from "@/services";

export const Route = createFileRoute("/aksiyonlar")({
  validateSearch: z.object({ kart: z.string().optional() }),
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

const toneLabel = { kritik: "Kritik", uyari: "Uyarı", basari: "Olumlu", bilgi: "Bilgi", notr: "Nötr" } as const;

function Page() {
  const { kart } = Route.useSearch();
  return (
    <PageScaffold
      title="Aksiyon Danışmanı"
      description="Yapay zekâ destekli, önceliklendirilmiş aksiyon önerileri."
      icon={Sparkles}
      queryKey={["actions"]}
      queryFn={getActionCards}
      emptyTitle="Henüz aksiyon önerisi yok"
    >
      {(cards) => {
        const card = kart ? cards.find((c) => c.id === kart) : undefined;
        return (
          <div className="space-y-4">
            {card && (
              <div className="rounded-xl border-2 border-primary/40 bg-card p-4 shadow-card">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold">{card.title}</h2>
                  <StatusBadge tone={card.severity}>{toneLabel[card.severity]}</StatusBadge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{card.summary}</p>
              </div>
            )}
            <EmptyState icon={Sparkles} title="Aksiyon listesi yakında" description="Tüm aksiyon kartları bu sayfada listelenecek." />
          </div>
        );
      }}
    </PageScaffold>
  );
}
