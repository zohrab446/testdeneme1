import { Link } from "@tanstack/react-router";
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Heart, Info, ListChecks, Smile, UserRoundPlus } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatNumber } from "@/lib/format";
import { metricIsImproving } from "@/lib/dashboard";
import { cn } from "@/lib/utils";
import type { DashboardMetric, DashboardMetricId } from "@/types";

const meta = {
  happiness: { label: "Çalışan Mutluluk Skoru", icon: Smile, to: "/calisan-nabzi", suffix: "/100", explanation: "Anonim çalışan yanıtlarının beş konu üzerinden ortalaması; 0–100. En az 5 kişilik gruplar değerlendirilir." },
  burnout: { label: "Tükenmişlik Riski", icon: Activity, to: "/calisan-nabzi", suffix: "%", explanation: "Aşırı mesai ve iş-yaşam dengesi göstergelerinden türetilen anonim risk oranı. Artması olumsuzdur." },
  customers: { label: "Müşteri Memnuniyeti", icon: Heart, to: "/musteri-sesi", suffix: "/100", explanation: "Yorumların duygu ve puanlarından türetilen 0–100 memnuniyet göstergesi. Veriler örnektir." },
  critical: { label: "Kritik Uyarı", icon: AlertTriangle, to: "/aksiyonlar", suffix: "", explanation: "" },
  onboarding: { label: "Bekleyen Onboarding", icon: UserRoundPlus, to: "/onboarding", suffix: "", explanation: "" },
  actions: { label: "Açık Aksiyon", icon: ListChecks, to: "/aksiyonlar", suffix: "", explanation: "" },
} satisfies Record<DashboardMetricId, { label: string; icon: typeof Smile; to: "/calisan-nabzi" | "/musteri-sesi" | "/aksiyonlar" | "/onboarding"; suffix: string; explanation: string }>;

export function DashboardKpis({ metrics }: { metrics: DashboardMetric[] }) {
  return <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
    {metrics.map((metric) => {
      const item = meta[metric.id];
      const improving = metricIsImproving(metric.id, metric.delta);
      const tone = metric.delta === 0 ? "text-muted-foreground" : improving ? "text-success" : "text-destructive";
      return <article key={metric.id} className="relative min-w-0 rounded-lg border bg-card p-4 shadow-card transition-colors hover:border-primary/40">
        <div className="flex min-h-6 items-center gap-2 text-sm text-muted-foreground"><item.icon className="size-4 shrink-0" /><Link to={item.to} className="font-medium after:absolute after:inset-0 after:rounded-lg">{item.label}</Link>
          {item.explanation && <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="relative z-10 ml-auto size-7" aria-label={`${item.label} nasıl hesaplanır?`}><Info /></Button></TooltipTrigger><TooltipContent className="max-w-64">{item.explanation}</TooltipContent></Tooltip>}
        </div>
        <div className="mt-3 flex items-end justify-between gap-3"><div><div className="text-3xl font-semibold tabular-nums">{formatNumber(metric.value)}<span className="ml-1 text-sm font-normal text-muted-foreground">{item.suffix}</span></div>
          <div className={cn("mt-2 flex items-center gap-1 text-xs font-medium", tone)}>{metric.delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}{metric.delta > 0 ? "+" : ""}{formatNumber(metric.delta)}{item.suffix ? " puan" : " adet"}<span className="text-muted-foreground">önceki döneme göre</span></div>
        </div><div className={cn("h-11 w-24 shrink-0", tone)} aria-hidden="true"><ResponsiveContainer width="100%" height="100%"><LineChart data={metric.series.map((value) => ({ value }))}><Line dataKey="value" stroke="currentColor" strokeWidth={2} dot={false} isAnimationActive={false} /></LineChart></ResponsiveContainer></div></div>
      </article>;
    })}
  </div>;
}