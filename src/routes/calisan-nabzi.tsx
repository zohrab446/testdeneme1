import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowRight,
  EyeOff,
  FileSpreadsheet,
  HeartPulse,
  Inbox,
  Lock,
  MessageSquare,
  MessagesSquare,
  Quote,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, ErrorState, PageHeader, SkeletonCard, StatusBadge } from "@/components/common";
import { ConsentDialog } from "@/components/pulse/ConsentDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { connectPulseSource, getPulseOverview, getPulseSources } from "@/services";
import { PRIVACY_MESSAGE, PULSE_TOPICS, riskMeta, scoreLevel } from "@/lib/pulse";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DepartmentPulse, PulseSource } from "@/types";

export const Route = createFileRoute("/calisan-nabzi")({
  head: () => ({
    meta: [
      { title: "Çalışan Nabzı · [ÜRÜN ADI]" },
      { name: "description", content: "Departman bazında anonim çalışan duygu analizi, ısı haritası ve istifa risk radarı." },
      { property: "og:title", content: "Çalışan Nabzı · [ÜRÜN ADI]" },
      { property: "og:description", content: "Departman bazında anonim çalışan duygu analizi ve istifa risk radarı." },
    ],
  }),
  component: PulsePage,
});

type Visible = Extract<DepartmentPulse, { suppressed: false }>;

const sourceIcons: Record<PulseSource["id"], LucideIcon> = {
  slack: MessageSquare,
  teams: MessagesSquare,
  oneri: Inbox,
  csv: FileSpreadsheet,
};
const sourceStatus = {
  bagli: { label: "Bağlı", tone: "basari" },
  bagli_degil: { label: "Bağlı Değil", tone: "notr" },
  hata: { label: "Hata", tone: "kritik" },
} as const;

const cellCls = {
  kritik: "bg-destructive/80 text-destructive-foreground",
  uyari: "bg-warning/70 text-warning-foreground",
  iyi: "bg-success/75 text-success-foreground",
};

function PrivacyCard({ name, compact }: { name: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-lg border border-dashed bg-muted/40 text-sm text-muted-foreground", compact ? "p-2.5" : "p-4")}>
      <EyeOff className="h-4 w-4 shrink-0" aria-hidden />
      <span>
        <span className="font-medium text-foreground">{name}:</span> {PRIVACY_MESSAGE}
      </span>
    </div>
  );
}

function PulsePage() {
  const qc = useQueryClient();
  const sources = useQuery({ queryKey: ["pulse", "sources"], queryFn: getPulseSources, retry: false });
  const overview = useQuery({ queryKey: ["pulse", "overview"], queryFn: getPulseOverview, retry: false });
  const [consentFor, setConsentFor] = useState<PulseSource | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [trendDept, setTrendDept] = useState("sirket");
  const fileRef = useRef<HTMLInputElement>(null);

  const connect = useMutation({
    mutationFn: (s: PulseSource) => connectPulseSource(s.id, true),
    onSuccess: (s) => {
      toast.success(`${s.name} bağlandı`);
      setConsentFor(null);
      void qc.invalidateQueries({ queryKey: ["pulse", "sources"] });
      if (s.id === "csv") fileRef.current?.click();
    },
    onError: (e) => toast.error(e.message),
  });

  const data = overview.data;
  const visible = useMemo(() => (data?.departments.filter((d): d is Visible => !d.suppressed) ?? []), [data]);
  const sel = data?.departments.find((d) => d.departmentId === selected) ?? null;

  const chartData = useMemo(() => {
    if (!data) return [];
    const series = trendDept === "sirket" ? data.companyTrend : visible.find((d) => d.departmentId === trendDept)?.trend ?? [];
    return data.weeks.map((w, i) => ({ week: formatDate(w).slice(0, 5), skor: series[i] }));
  }, [data, trendDept, visible]);

  return (
    <div className="space-y-6">
      <PageHeader title="Çalışan Nabzı" description="Ekiplerinizin duygu durumunu anonim ve toplulaştırılmış olarak izleyin." />

      <div role="note" className="flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <p>
          <span className="font-medium">Gizlilik önce gelir:</span> Bireysel isimler hiçbir yerde gösterilmez. 5 kişiden küçük gruplarda sonuçlar gizlenir; örnek ifadeler anonimleştirilip kısaltılır.
        </p>
      </div>

      <section aria-labelledby="sources-h">
        <h2 id="sources-h" className="sr-only">Veri kaynakları</h2>
        {sources.isPending ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <SkeletonCard key={i} lines={2} />)}</div>
        ) : sources.isError ? (
          <ErrorState message={sources.error.message} onRetry={() => void sources.refetch()} />
        ) : sources.data.length === 0 ? (
          <EmptyState title="Bağlanabilecek kaynak bulunamadı" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sources.data.map((s) => {
              const Icon = sourceIcons[s.id];
              const st = sourceStatus[s.status];
              return (
                <div key={s.id} className="flex flex-col rounded-xl border bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
                      <Icon className="h-4 w-4" aria-hidden />
                    </div>
                    <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
                  </div>
                  <div className="mt-3 font-medium">{s.name}</div>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                  <p className={cn("mt-1 text-xs", s.status === "hata" ? "text-destructive" : "text-muted-foreground")}>
                    {s.status === "hata" ? s.errorMessage : s.lastSync ? `Son eşitleme: ${formatDateTime(s.lastSync)}` : " "}
                  </p>
                  <Button
                    className="mt-3"
                    size="sm"
                    variant={s.status === "bagli" ? "outline" : "default"}
                    onClick={() => (s.status === "bagli" && s.id === "csv" ? fileRef.current?.click() : setConsentFor(s))}
                    disabled={s.status === "bagli" && s.id !== "csv"}
                  >
                    {s.status === "bagli" ? (s.id === "csv" ? "Yeni anket yükle" : "Bağlı") : s.status === "hata" ? "Yeniden bağla" : "Bağla"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) toast.success(`"${f.name}" alındı; analiz edilmek üzere sıraya eklendi.`);
            e.target.value = "";
          }}
        />
      </section>

      {overview.isPending ? (
        <div className="grid gap-4 lg:grid-cols-3"><div className="lg:col-span-2"><SkeletonCard lines={6} /></div><SkeletonCard lines={6} /></div>
      ) : overview.isError ? (
        <ErrorState message={overview.error.message} onRetry={() => void overview.refetch()} />
      ) : !data || data.departments.length === 0 ? (
        <EmptyState icon={HeartPulse} title="Henüz nabız verisi yok" description="Bir kaynak bağladığınızda ilk sonuçlar birkaç gün içinde burada görünür." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="min-w-0 space-y-6 lg:col-span-2">
            {/* Isı haritası */}
            <section className="rounded-xl border bg-card p-4 shadow-card" aria-labelledby="heat-h">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 id="heat-h" className="font-semibold">Departman × konu ısı haritası</h2>
                  <p className="text-xs text-muted-foreground">Duygu skoru 0-100 · yüksek değer olumlu</p>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground" aria-hidden>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-destructive/80" />&lt;40</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-warning/70" />40-59</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-success/75" />60+</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-separate border-spacing-1 text-sm">
                  <thead>
                    <tr>
                      <th scope="col" className="text-left text-xs font-medium text-muted-foreground">Departman</th>
                      {PULSE_TOPICS.map((t) => (
                        <th key={t.id} scope="col" className="px-1 text-center text-xs font-medium text-muted-foreground">{t.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.departments.map((d) => (
                      <tr key={d.departmentId}>
                        <th scope="row" className="pr-2 text-left font-medium">
                          <button
                            type="button"
                            onClick={() => setSelected(d.departmentId)}
                            aria-pressed={selected === d.departmentId}
                            className={cn("rounded px-1.5 py-1 text-left hover:bg-accent", selected === d.departmentId && "bg-accent")}
                          >
                            {d.departmentName}
                          </button>
                        </th>
                        {d.suppressed ? (
                          <td colSpan={PULSE_TOPICS.length}><PrivacyCard name={d.departmentName} compact /></td>
                        ) : (
                          PULSE_TOPICS.map((t) => {
                            const v = d.topics[t.id];
                            return (
                              <td key={t.id} className="p-0">
                                <button
                                  type="button"
                                  onClick={() => setSelected(d.departmentId)}
                                  aria-label={`${d.departmentName}, ${t.label}: ${v}`}
                                  className={cn("h-10 w-full rounded-md text-center text-sm font-medium tabular-nums transition-opacity hover:opacity-90", cellCls[scoreLevel(v)])}
                                >
                                  {v}
                                </button>
                              </td>
                            );
                          })
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Trend */}
            <section className="rounded-xl border bg-card p-4 shadow-card" aria-labelledby="trend-h">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 id="trend-h" className="font-semibold">12 haftalık duygu trendi</h2>
                <Select value={trendDept} onValueChange={setTrendDept}>
                  <SelectTrigger className="w-48" aria-label="Departman seç"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sirket">Tüm şirket</SelectItem>
                    {visible.map((d) => <SelectItem key={d.departmentId} value={d.departmentId}>{d.departmentName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ left: -16, right: 8, top: 8 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--popover-foreground)" }}
                      formatter={(v: number) => [v, "Duygu skoru"]}
                      labelFormatter={(l: string) => `Hafta: ${l}`}
                    />
                    <Line type="monotone" dataKey="skor" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Risk radarı */}
            <section className="rounded-xl border bg-card p-4 shadow-card" aria-labelledby="risk-h">
              <h2 id="risk-h" className="mb-3 font-semibold">İstifa Risk Radarı</h2>
              <ul className="divide-y">
                {data.departments.map((d) => (
                  <li key={d.departmentId} className="py-3 first:pt-0 last:pb-0">
                    {d.suppressed ? (
                      <PrivacyCard name={d.departmentName} compact />
                    ) : (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <button type="button" onClick={() => setSelected(d.departmentId)} className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{d.departmentName}</span>
                            <StatusBadge tone={riskMeta[d.risk].tone}>{riskMeta[d.risk].label} risk</StatusBadge>
                          </div>
                          <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                            {d.riskReasons.map((r) => <li key={r}>{r}</li>)}
                          </ul>
                        </button>
                        {d.actionCardId && (
                          <Button asChild variant="ghost" size="sm" className="shrink-0 self-start">
                            <Link to="/aksiyonlar" search={{ kart: d.actionCardId }}>
                              Aksiyon kartı <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                            </Link>
                          </Button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Detay paneli */}
          <aside className="lg:sticky lg:top-6 lg:self-start" aria-live="polite" aria-labelledby="detail-h">
            <div className="rounded-xl border bg-card p-4 shadow-card">
              {!sel ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <HeartPulse className="mx-auto mb-2 h-6 w-6" aria-hidden />
                  <h2 id="detail-h" className="font-medium text-foreground">Departman detayı</h2>
                  Isı haritasından veya radardan bir departman seçin.
                </div>
              ) : sel.suppressed ? (
                <div className="space-y-3">
                  <h2 id="detail-h" className="font-semibold">{sel.departmentName}</h2>
                  <div className="flex flex-col items-center rounded-lg border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                    <Lock className="mb-2 h-6 w-6" aria-hidden />
                    {PRIVACY_MESSAGE}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 id="detail-h" className="font-semibold">{sel.departmentName}</h2>
                    <StatusBadge tone={riskMeta[sel.risk].tone}>{riskMeta[sel.risk].label} risk</StatusBadge>
                  </div>
                  <div>
                    <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Öne çıkan temalar</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {sel.themes.map((t) => <span key={t} className="rounded-full bg-accent px-2.5 py-1 text-xs text-accent-foreground">{t}</span>)}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Örnek ifadeler (anonim)</h3>
                    <ul className="space-y-2">
                      {sel.quotes.map((q) => (
                        <li key={q} className="flex gap-2 rounded-lg bg-muted/50 p-2.5 text-sm">
                          <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {sel.actionCardId && (
                    <Button asChild className="w-full">
                      <Link to="/aksiyonlar" search={{ kart: sel.actionCardId }}>
                        İlgili aksiyon kartını aç <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      <ConsentDialog
        source={consentFor}
        pending={connect.isPending}
        onOpenChange={(o) => !o && setConsentFor(null)}
        onConfirm={() => consentFor && connect.mutate(consentFor)}
      />
    </div>
  );
}
