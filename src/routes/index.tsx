import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, ArrowRight, CalendarDays, Check, CheckCircle2, Circle, Clock3, ListChecks, Loader2, MessageSquare, Plus, ShieldCheck, Sparkles, UserRoundPlus, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/common";
import { NewEmployeeSheet } from "@/components/onboarding/NewEmployeeSheet";
import { DashboardWidget } from "@/components/dashboard/DashboardWidget";
import { DashboardKpis } from "@/components/dashboard/DashboardKpis";
import { DepartmentComparison, EmployeeCustomerTrend } from "@/components/dashboard/DashboardCharts";
import { convertDashboardAction, getDashboardWidget } from "@/services/dashboard";
import { dashboardGreeting } from "@/lib/dashboard";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { inviteStatusMeta } from "@/lib/onboarding";
import { SENTIMENT_META, topicLabel } from "@/lib/voc";
import type { ActionCard, DashboardPeriod } from "@/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · [ÜRÜN ADI]" },
      { name: "description", content: "Ekibinizin ve müşterilerinizin nabzına tek bakışta göz atın." },
      { property: "og:title", content: "Dashboard · [ÜRÜN ADI]" },
      { property: "og:description", content: "Ekibinizin ve müşterilerinizin nabzına tek bakışta göz atın." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const [period, setPeriod] = useState<DashboardPeriod>(30);
  const [demo, setDemo] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [name, setName] = useState("Deniz");
  const [greeting, setGreeting] = useState("Merhaba");
  const [hasCompany, setHasCompany] = useState(false);
  useEffect(() => {
    setGreeting(dashboardGreeting(Number(new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", hour: "numeric", hourCycle: "h23" }).format(new Date()))));
    try {
      setDemo(localStorage.getItem("dashboard:demo") !== "false");
      setDismissed(sessionStorage.getItem("dashboard:setup-dismissed") === "true");
      const raw = localStorage.getItem("kurulum:v1");
      setHasCompany(Boolean(raw));
      if (raw) {
        const profile: unknown = JSON.parse(raw);
        if (profile && typeof profile === "object" && "firstName" in profile && typeof profile.firstName === "string") setName(profile.firstName);
      }
    } catch { /* Storage is optional. */ }
  }, []);
  const overview = useQuery({ queryKey: ["dashboard-widget", "overview", period, demo], queryFn: () => getDashboardWidget("overview", period, demo), retry: false });
  const setDemoData = (value: boolean) => { setDemo(value); try { localStorage.setItem("dashboard:demo", String(value)); } catch { /* Optional. */ } };
  const dismissSetup = () => { setDismissed(true); try { sessionStorage.setItem("dashboard:setup-dismissed", "true"); } catch { /* Optional. */ } };
  const steps = [
    { label: "Şirket bilgisi", to: "/ayarlar", done: hasCompany || demo },
    { label: "Bir çalışan kaynağı bağla", to: "/calisan-nabzi", done: demo },
    { label: "Bir müşteri kaynağı bağla", to: "/musteri-sesi", done: demo },
    { label: "İlk çalışanı ekle", to: "/onboarding", done: false },
    { label: "Ekip arkadaşı davet et", to: "/ayarlar", done: false },
  ] as const;
  const completed = steps.filter((s) => s.done).length;
  const common = { period, demo };
  return <TooltipProvider><div className="space-y-8">
    <header className="space-y-5">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div><div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground"><span className="h-px w-5 bg-highlight" />DASHBOARD</div><h1 className="text-2xl font-semibold">{greeting}, {name}</h1><p className="mt-2 text-sm text-muted-foreground">{!demo ? "Ekibinizin ilk verileri burada bir araya gelecek." : overview.data ? `Bu hafta ${formatNumber(overview.data.critical)} kritik uyarı ve ${formatNumber(overview.data.pending)} bekleyen onay var.` : overview.isError ? "Haftalık özet şu anda alınamıyor." : "Haftalık özet hazırlanıyor…"}</p></div>
        <div className="flex flex-col gap-2 lg:items-end"><Select value={String(period)} onValueChange={(value) => { if (value === "7" || value === "30" || value === "90") setPeriod(Number(value) as DashboardPeriod); }}><SelectTrigger aria-label="Tarih aralığı" className="w-40 bg-card"><CalendarDays className="size-4 text-muted-foreground" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7">Son 7 gün</SelectItem><SelectItem value="30">Son 30 gün</SelectItem><SelectItem value="90">Son 90 gün</SelectItem></SelectContent></Select><span className="text-xs text-muted-foreground">Son güncelleme: {overview.data ? formatDateTime(overview.data.updatedAt) : "—"}</span></div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4"><span className="text-xs text-muted-foreground">{demo ? "Demo Şirket A.Ş. · Örnek veriler" : "Çalışma alanınız"}</span><div className="flex items-center gap-2"><Label htmlFor="demo-data" className="text-xs text-muted-foreground">Demo verisi göster</Label><Switch id="demo-data" checked={demo} onCheckedChange={setDemoData} /></div></div>
      {!dismissed && completed < 5 && <section className="relative border-y border-primary/15 bg-primary/5 px-4 py-5" aria-label="Kurulum ilerlemesi"><div className="mb-4 flex items-center gap-2 pr-9"><CheckCircle2 className="size-4 text-primary" /><h2 className="text-sm font-semibold">Kurulumunu tamamla <span className="ml-1 font-normal text-muted-foreground">({completed}/5)</span></h2></div><Button variant="ghost" size="icon" className="absolute right-2 top-2" aria-label="Kurulum kartını kapat" onClick={dismissSetup}><X /></Button><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{steps.map((step) => <Button key={step.label} variant="link" asChild className="h-auto justify-start p-0 text-xs text-foreground"><Link to={step.to}>{step.done ? <CheckCircle2 className="text-success" /> : <Circle className="text-muted-foreground" />}<span>{step.label}</span>{!step.done && <ArrowRight className="ml-auto text-muted-foreground" />}</Link></Button>)}</div></section>}
    </header>

    {!demo && <section className="border-b pb-8"><div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><Sparkles className="size-5" /></div><h2 className="text-xl font-semibold">Ekibiniz için yeni bir başlangıç</h2><p className="mt-2 text-sm text-muted-foreground">Henüz çalışan, müşteri yorumu veya aksiyon verisi yok.</p><div className="mt-5 flex flex-wrap gap-3"><NewEmployeeSheet /><Button variant="outline" asChild><Link to="/entegrasyonlar"><Plus />Kaynak bağla</Link></Button></div></section>}

    <DashboardWidget id="overview" {...common}>{(data) => <DashboardKpis metrics={data.metrics} />}</DashboardWidget>

    <div className="grid gap-8 border-t pt-7 xl:grid-cols-[1.2fr_1fr]">
      <DashboardWidget id="priorities" title="Bu Haftanın Öncelikli 3 Aksiyonu" action={<Button variant="link" size="sm" asChild><Link to="/aksiyonlar">Tüm aksiyonlar<ArrowRight /></Link></Button>} {...common}>{(cards) => <div className="space-y-3">{cards.map((card, index) => <PriorityCard key={card.id} card={card} index={index} />)}</div>}</DashboardWidget>
      <DashboardWidget id="departments" title="Departman Karşılaştırması" {...common}>{(rows) => <DepartmentComparison rows={rows} />}</DashboardWidget>
    </div>

    <div className="grid gap-8 border-t pt-7 xl:grid-cols-[1.2fr_1fr]">
      <DashboardWidget id="trend" title="Çalışan vs Müşteri" {...common}>{(rows) => <EmployeeCustomerTrend rows={rows} />}</DashboardWidget>
      <DashboardWidget id="topics" title="Müşterilerin En Çok Bahsettiği 5 Konu" {...common}>{(topics) => <div className="divide-y">{topics.map((topic, i) => <div key={topic.topic} className="flex items-center gap-3 py-4"><span className="w-4 text-xs tabular-nums text-muted-foreground">{i + 1}</span><div className="min-w-0 flex-1"><Link to="/musteri-sesi" className="text-sm font-medium hover:text-primary">{topicLabel(topic.topic)}</Link><p className="mt-1 text-xs text-muted-foreground">{formatNumber(topic.count)} bahsedilme</p></div><StatusBadge tone={SENTIMENT_META[topic.sentiment].tone}>{SENTIMENT_META[topic.sentiment].label}</StatusBadge></div>)}</div>}</DashboardWidget>
    </div>

    <div className="grid gap-8 border-t pt-7 xl:grid-cols-2">
      <DashboardWidget id="alerts" title="Son Uyarılar" action={<Button variant="link" size="sm" asChild><Link to="/aksiyonlar">Tümünü gör<ArrowRight /></Link></Button>} {...common}>{(alerts) => <div className="divide-y">{alerts.map((alert) => { const Icon = alert.source === "calisan" ? Activity : alert.source === "musteri" ? MessageSquare : Sparkles; return <div key={alert.id} className="flex gap-3 py-4"><div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"><Icon className="size-4" /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium">{alert.title}</p><div className="mt-2 flex flex-wrap items-center gap-2"><StatusBadge tone={alert.severity}>{severityLabel[alert.severity]}</StatusBadge><time dateTime={alert.at} className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(alert.at), { addSuffix: true, locale: tr })}</time></div></div><Button variant="link" size="sm" asChild className="shrink-0 px-0"><Link to="/aksiyonlar" search={{ kart: alert.actionId }}>İncele</Link></Button></div>; })}</div>}</DashboardWidget>
      <DashboardWidget id="onboarding" title="Onboarding Durumu" action={<NewEmployeeSheet />} {...common}>{(invites) => <div><p className="mb-3 text-xs text-muted-foreground">Bu ay başlayan çalışanlar</p><div className="divide-y">{invites.map((inv) => <div key={inv.id} className="py-4"><div className="flex flex-wrap justify-between gap-2"><Link to="/onboarding/$id" params={{ id: inv.id }} className="text-sm font-medium hover:text-primary">{inv.employeeName}</Link><StatusBadge tone={inviteStatusMeta[inv.status].tone}>{inviteStatusMeta[inv.status].label}</StatusBadge></div><p className="mt-1 text-xs text-muted-foreground">{inv.title} · {formatDate(inv.startDate)}</p><div className="mt-3 flex items-center gap-3"><Progress value={inv.progress} className="h-1.5" aria-label={`${inv.employeeName} ilerleme`} /><span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">%{formatNumber(inv.progress)}</span></div></div>)}</div></div>}</DashboardWidget>
    </div>

    <div className="border-t pt-7"><DashboardWidget id="dates" title="Yaklaşan Tarihler" {...common}>{(dates) => <div className="grid gap-x-8 divide-y md:grid-cols-2">{dates.map((date) => { const Icon = date.kind === "baslangic" ? UserRoundPlus : date.kind === "kvkk" ? ShieldCheck : Clock3; return <div key={date.id} className="flex items-center gap-3 py-4"><Icon className="size-4 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="text-sm">{date.title}</p><p className="mt-1 text-xs text-muted-foreground">{date.kind === "baslangic" ? "İşe başlangıç" : date.kind === "aksiyon" ? "Ertelenen aksiyon" : "KVKK saklama süresi"}</p></div><div className="flex shrink-0 flex-col items-end gap-1"><time className="text-xs tabular-nums" dateTime={date.at}>{formatDate(date.at)}</time>{date.onboardingId ? <Button variant="link" size="sm" className="h-5 px-0 text-xs" asChild><Link to="/onboarding/$id" params={{ id: date.onboardingId }}>İncele</Link></Button> : date.actionId ? <Button variant="link" size="sm" className="h-5 px-0 text-xs" asChild><Link to="/aksiyonlar" search={{ kart: date.actionId }}>İncele</Link></Button> : <Button variant="link" size="sm" className="h-5 px-0 text-xs" asChild><Link to="/ayarlar">İncele</Link></Button>}</div></div>; })}</div>}</DashboardWidget></div>
    <footer className="flex flex-wrap justify-between gap-2 border-t pt-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5" />Çalışan analizleri anonimdir; 5 kişiden küçük gruplar gizlenir.</span>{demo && <span>Örnek veriler · Gerçek hesaplara bağlı değil</span>}</footer>
  </div></TooltipProvider>;
}

const severityLabel = { kritik: "Kritik", uyari: "Uyarı", basari: "Olumlu", bilgi: "Bilgi", notr: "Nötr" } as const;
function PriorityCard({ card, index }: { card: ActionCard; index: number }) {
  const qc = useQueryClient();
  const mutation = useMutation({ mutationFn: () => convertDashboardAction(card.id), onSuccess: () => { toast.success("Aksiyon göreve dönüştürüldü."); void qc.invalidateQueries({ queryKey: ["actions"] }); }, onError: (error) => toast.error(error.message) });
  const converted = mutation.isSuccess || card.status === "devam";
  return <article className="rounded-lg border bg-card p-4"><div className="flex items-start gap-3"><span className="mt-0.5 text-xs font-medium tabular-nums text-muted-foreground">0{index + 1}</span><div className="min-w-0 flex-1"><div className="mb-2 flex items-center gap-2"><StatusBadge tone={card.severity}>{severityLabel[card.severity]}</StatusBadge><span className="text-xs text-muted-foreground">{card.source === "calisan" ? "Çalışan" : card.source === "musteri" ? "Müşteri" : "Çalışan + müşteri"}</span></div><h3 className="text-sm font-semibold">{card.title}</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{card.summary}</p><div className="mt-3 flex gap-2"><Button size="sm" variant={converted ? "secondary" : "outline"} disabled={mutation.isPending || converted} onClick={() => mutation.mutate()}>{mutation.isPending ? <Loader2 className="motion-safe:animate-spin" /> : converted ? <Check /> : <ListChecks />}{converted ? "Görev oluşturuldu" : "Göreve Çevir"}</Button><Button size="sm" variant="ghost" asChild><Link to="/aksiyonlar" search={{ kart: card.id }}>Detay<ArrowRight /></Link></Button></div></div></div></article>;
}
