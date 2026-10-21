import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Clock, LinkIcon, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

function Screen({
  icon: Icon,
  tone,
  title,
  children,
}: {
  icon: LucideIcon;
  tone: "success" | "warning" | "destructive" | "primary";
  title: string;
  children: React.ReactNode;
}) {
  const toneCls = {
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground dark:text-warning",
    destructive: "bg-destructive/10 text-destructive",
    primary: "bg-primary/10 text-primary",
  }[tone];
  return (
    <div className="rounded-2xl border bg-card px-6 py-12 text-center shadow-card" role="status">
      <div className={cn("mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full", toneCls)}>
        <Icon className="h-7 w-7" aria-hidden />
      </div>
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <div className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

export const InvalidLinkScreen = () => (
  <Screen icon={LinkIcon} tone="destructive" title="Bu link geçersiz">
    Bağlantı hatalı ya da iptal edilmiş olabilir. Doğru linki almak için İK ekibinle iletişime geç.
  </Screen>
);

export const ExpiredLinkScreen = () => (
  <Screen icon={Clock} tone="warning" title="Bu linkin süresi dolmuş">
    Güvenliğin için davet linkleri 7 gün geçerlidir. İK ekibinden yeni bir link göndermesini isteyebilirsin.
  </Screen>
);

export const AlreadyDoneScreen = ({ approved }: { approved: boolean }) => (
  <Screen icon={CheckCircle2} tone="success" title={approved ? "Kaydın tamamlandı" : "Formunu zaten gönderdin"}>
    {approved
      ? "Bilgilerin İK ekibi tarafından onaylandı. Seni aramızda görmek için sabırsızlanıyoruz!"
      : "Bilgilerin İK ekibinde inceleniyor. Bir düzeltme gerekirse sana haber verecekler."}
  </Screen>
);

export const ThankYouScreen = ({ name }: { name: string }) => (
  <Screen icon={PartyPopper} tone="success" title={`Teşekkürler, ${name}!`}>
    Bilgilerin İK ekibine iletildi. İnceleme tamamlandığında sana haber verilecek.
  </Screen>
);
