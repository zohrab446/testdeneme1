import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FileDown, FileSpreadsheet, MapPin, MessageSquareQuote, Search, ShoppingBag, ShoppingCart, Smartphone, Sparkles, Star, Upload, Megaphone, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, ErrorState, PageHeader, SkeletonCard, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addActionFromInsight, askVoc, connectVocSource, getVocData, getVocSources } from "@/services";
import { reviewsToCsv, SAMPLE_QUESTIONS, SENTIMENT_META, topicLabel, VOC_TOPICS } from "@/lib/voc";
import { formatDate, formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { VocAskResult, VocFilter, VocSentiment, VocSource, VocSourceId, VocTopic } from "@/types";

export const Route = createFileRoute("/musteri-sesi")({
  head: () => ({
    meta: [
      { title: "Müşteri Sesi · [ÜRÜN ADI]" },
      { name: "description", content: "Pazaryeri, şikâyet ve uygulama yorumlarını tek yerde analiz edin; AI ile soru sorun." },
      { property: "og:title", content: "Müşteri Sesi · [ÜRÜN ADI]" },
      { property: "og:description", content: "Müşteri yorumlarında duygu analizi, şikâyet konuları ve AI destekli özet raporlar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VocPage,
});

const sourceIcons: Record<VocSourceId, LucideIcon> = { trendyol: ShoppingBag, sikayetvar: Megaphone, google: MapPin, hepsiburada: ShoppingCart, appstore: Smartphone, csv: Upload };
const SOURCE_NAMES: Record<VocSourceId, string> = { trendyol: "Trendyol", sikayetvar: "Şikayetvar", google: "Google", hepsiburada: "Hepsiburada", appstore: "App/Play Store", csv: "CSV" };
const statusMeta = { bagli: { label: "Bağlı", tone: "basari" }, bagli_degil: { label: "Bağlı Değil", tone: "notr" }, hata: { label: "Hata", tone: "kritik" } } as const;
const SENT_COLORS: Record<VocSentiment, string> = { olumlu: "var(--success)", notr: "var(--muted-foreground)", olumsuz: "var(--destructive)" };
const TOPIC_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--destructive)"];
const REF_END = "2026-10-20T23:59:59";
const RANGES = [{ v: "2", l: "Son 2 hafta" }, { v: "4", l: "Son 4 hafta" }, { v: "8", l: "Son 8 hafta" }, { v: "12", l: "Son 12 hafta" }];
const PAGE_SIZE = 10;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${n} / 5 puan`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={cn("h-3.5 w-3.5", i <= n ? "fill-accent-foreground/0 text-warning" : "text-muted-foreground/30")} fill={i <= n ? "currentColor" : "none"} aria-hidden />)}
    </span>
  );
}

function VocPage() {
  const qc = useQueryClient();
  const [range, setRange] = useState("12");
  const [srcFilter, setSrcFilter] = useState<"hepsi" | VocSourceId>("hepsi");
  const filter: VocFilter = useMemo(() => {
    const to = new Date(REF_END);
    const from = new Date(to.getTime() - Number(range) * 7 * 864e5);
    return { from: from.toISOString(), to: to.toISOString(), sources: srcFilter === "hepsi" ? [] : [srcFilter] };
  }, [range, srcFilter]);

  const sources = useQuery({ queryKey: ["voc", "sources"], queryFn: getVocSources, retry: false });
  const data = useQuery({ queryKey: ["voc", "data", filter], queryFn: () => getVocData(filter), retry: false, placeholderData: keepPreviousData });
  const fileRef = useRef<HTMLInputElement>(null);

  const connect = useMutation({
    mutationFn: (s: VocSource) => connectVocSource(s.id),
    onSuccess: (s) => { toast.success(`${s.name} bağlandı`); void qc.invalidateQueries({ queryKey: ["voc", "sources"] }); },
    onError: (e) => toast.error(e.message),
  });

  const a = data.data?.analytics;
  const donut = a ? (Object.keys(SENTIMENT_META) as VocSentiment[]).map((k) => ({ key: k, name: SENTIMENT_META[k].label, value: a.sentiment[k] })) : [];
  const bars = a ? a.complaints.filter((c) => c.count > 0).map((c) => ({ name: topicLabel(c.topic), count: c.count })) : [];
  const trend = a ? a.weeks.map((w, i) => ({ week: formatDate(w).slice(0, 5), ...Object.fromEntries(VOC_TOPICS.map((t) => [t.id, a.topicTrend[t.id][i]])) })) : [];

  const exportCsv = () => {
    const rows = data.data?.reviews ?? [];
    if (!rows.length) { toast.error("İndirilecek yorum yok."); return; }
    downloadBlob(new Blob([reviewsToCsv(rows, (id) => SOURCE_NAMES[id as VocSourceId], formatDate)], { type: "text/csv;charset=utf-8" }), `musteri-sesi-${formatDate(new Date()).replace(/\./g, "-")}.csv`);
    toast.success(`${formatNumber(rows.length)} yorum indirildi`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Müşteri Sesi"
        description="Pazaryeri, şikâyet ve uygulama yorumlarını tek yerde analiz edin."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => toast("Yakında", { description: "PDF rapor indirme çok yakında geliyor." })}><FileDown className="h-4 w-4" />PDF indir</Button>
            <Button variant="outline" size="sm" onClick={exportCsv}><FileSpreadsheet className="h-4 w-4" />Excel indir</Button>
          </div>
        }
      />

      <section aria-labelledby="voc-src-h">
        <h2 id="voc-src-h" className="sr-only">Veri kaynakları</h2>
        {sources.isPending ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} lines={2} />)}</div>
        ) : sources.isError ? (
          <ErrorState message={sources.error.message} onRetry={() => void sources.refetch()} />
        ) : sources.data.length === 0 ? (
          <EmptyState title="Bağlanabilecek kaynak bulunamadı" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {sources.data.map((s) => {
              const Icon = sourceIcons[s.id];
              const st = statusMeta[s.status];
              const busy = connect.isPending && connect.variables?.id === s.id;
              return (
                <div key={s.id} className="flex flex-col rounded-xl border bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground"><Icon className="h-4 w-4" aria-hidden /></div>
                    <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
                  </div>
                  <div className="mt-3 text-sm font-medium">{s.name}</div>
                  <p className="text-xs text-muted-foreground">{s.status === "bagli" ? `${formatNumber(s.reviewCount)} yorum` : s.description}</p>
                  <p className={cn("mt-1 min-h-4 text-xs", s.status === "hata" ? "text-destructive" : "text-muted-foreground")}>
                    {s.status === "hata" ? s.errorMessage : s.lastSync ? `Son: ${formatDateTime(s.lastSync)}` : ""}
                  </p>
                  <Button className="mt-auto pt-0" size="sm" variant={s.status === "bagli" ? "outline" : "default"} disabled={busy || (s.status === "bagli" && s.id !== "csv")}
                    onClick={() => (s.id === "csv" && s.status === "bagli" ? fileRef.current?.click() : connect.mutate(s))}>
                    {busy ? "Bağlanıyor…" : s.status === "bagli" ? (s.id === "csv" ? "Dosya yükle" : "Bağlı") : s.status === "hata" ? "Yeniden bağla" : "Bağla"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" tabIndex={-1} aria-hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) toast.success(`"${f.name}" alındı; yorumlar analiz için sıraya eklendi.`); e.target.value = ""; }} />
      </section>

      <AskBox />

      <section className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-3 shadow-card" aria-label="Filtreler">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" id="range-l">Tarih aralığı</label>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-40" aria-labelledby="range-l"><SelectValue /></SelectTrigger>
            <SelectContent>{RANGES.map((r) => <SelectItem key={r.v} value={r.v}>{r.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" id="src-l">Kaynak</label>
          <Select value={srcFilter} onValueChange={(v) => setSrcFilter(v as typeof srcFilter)}>
            <SelectTrigger className="w-44" aria-labelledby="src-l"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hepsi">Tüm kaynaklar</SelectItem>
              {(Object.keys(SOURCE_NAMES) as VocSourceId[]).map((id) => <SelectItem key={id} value={id}>{SOURCE_NAMES[id]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <p className="ml-auto text-xs text-muted-foreground">
          {formatDate(filter.from)} – {formatDate(filter.to)}{a ? ` · ${formatNumber(a.total)} yorum` : ""}{data.isFetching && !data.isPending ? " · güncelleniyor…" : ""}
        </p>
      </section>

      {data.isPending ? (
        <div className="grid gap-4 lg:grid-cols-3"><SkeletonCard lines={6} /><SkeletonCard lines={6} /><SkeletonCard lines={6} /></div>
      ) : data.isError ? (
        <ErrorState message={data.error.message} onRetry={() => void data.refetch()} />
      ) : !a || a.total === 0 ? (
        <EmptyState icon={MessageSquareQuote} title="Bu aralıkta yorum yok" description="Tarih aralığını genişletin veya başka bir kaynak seçin." />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <section className="rounded-xl border bg-card p-4 shadow-card" aria-labelledby="donut-h">
              <h2 id="donut-h" className="font-semibold">Duygu dağılımı</h2>
              <div className="relative h-56">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={donut} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={2} stroke="var(--card)">
                      {donut.map((d) => <Cell key={d.key} fill={SENT_COLORS[d.key]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${formatNumber(v)} (${formatPercent(v / a.total)})`, ""]} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-semibold">{formatNumber(a.total)}</span>
                  <span className="text-xs text-muted-foreground">yorum</span>
                </div>
              </div>
              <ul className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                {donut.map((d) => (
                  <li key={d.key}><span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: SENT_COLORS[d.key] }} />{d.name}<div className="font-medium">{formatPercent(d.value / a.total)}</div></li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border bg-card p-4 shadow-card lg:col-span-2" aria-labelledby="bar-h">
              <h2 id="bar-h" className="font-semibold">En çok şikâyet edilen konular</h2>
              <p className="text-xs text-muted-foreground">Olumsuz yorum sayısı</p>
              {bars.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">Bu aralıkta şikâyet yok 🎉</p> : (
                <div className="h-64">
                  <ResponsiveContainer>
                    <BarChart data={bars} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                      <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12, fill: "var(--foreground)" }} />
                      <Tooltip cursor={{ fill: "var(--muted)" }} formatter={(v: number) => [formatNumber(v), "Şikâyet"]} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                      <Bar dataKey="count" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>

          <section className="rounded-xl border bg-card p-4 shadow-card" aria-labelledby="trend-h">
            <h2 id="trend-h" className="font-semibold">12 haftalık konu trendi</h2>
            <p className="text-xs text-muted-foreground">Haftalık yorum sayısı, konu bazında</p>
            <div className="mt-2 h-72">
              <ResponsiveContainer>
                <LineChart data={trend} margin={{ right: 12 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <YAxis allowDecimals={false} width={28} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {VOC_TOPICS.map((t, i) => <Line key={t.id} type="monotone" dataKey={t.id} name={t.label} stroke={TOPIC_COLORS[i]} strokeWidth={2} dot={false} />)}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <ReviewList reviews={data.data.reviews} />
        </>
      )}
    </div>
  );
}

function AskBox() {
  const [q, setQ] = useState("");
  const ask = useMutation({ mutationFn: askVoc });
  const submit = (text: string) => { const t = text.trim(); if (!t) return; setQ(t); ask.mutate(t); };
  return (
    <section className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4 shadow-card" aria-labelledby="ask-h">
      <h2 id="ask-h" className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-accent-foreground" aria-hidden />Müşterilerinize soru sorun</h2>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); submit(q); }}>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Örn. Müşteriler en çok neden şikâyet ediyor?" className="h-11 pl-9" aria-label="Sorunuz" />
        </div>
        <Button type="submit" className="h-11" disabled={ask.isPending || !q.trim()}>Sor</Button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {SAMPLE_QUESTIONS.map((s) => (
          <button key={s} type="button" onClick={() => submit(s)} disabled={ask.isPending}
            className="rounded-full border bg-background px-3 py-1.5 text-xs transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50">{s}</button>
        ))}
      </div>
      <div aria-live="polite">
        {ask.isPending && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            <span className="flex gap-1" aria-hidden>{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${i * 150}ms` }} />)}</span>
            Yorumlar analiz ediliyor…
          </div>
        )}
        {ask.isError && <div className="mt-4"><ErrorState message={ask.error.message} onRetry={() => submit(q)} /></div>}
        {ask.data && !ask.isPending && <AnswerCard result={ask.data} onPick={submit} />}
      </div>
    </section>
  );
}

function AnswerCard({ result, onPick }: { result: VocAskResult; onPick: (q: string) => void }) {
  const [added, setAdded] = useState<string | null>(null);
  const add = useMutation({ mutationFn: addActionFromInsight, onSuccess: (c) => { setAdded(c.id); toast.success("Aksiyon Danışmanı'na eklendi"); } });
  useEffect(() => setAdded(null), [result]);
  if (!result.matched) {
    return (
      <div className="mt-4 rounded-lg border bg-card p-4 text-sm">
        <p>Bu soruyu henüz yanıtlayamıyorum, şu örnekleri deneyin:</p>
        <div className="mt-2 flex flex-wrap gap-2">{result.suggestions.map((s) => <Button key={s} size="sm" variant="secondary" onClick={() => onPick(s)}>{s}</Button>)}</div>
      </div>
    );
  }
  return (
    <article className="mt-4 space-y-4 rounded-lg border bg-card p-4">
      <div>
        <p className="text-xs text-muted-foreground">“{result.question}”</p>
        <h3 className="mt-1 font-semibold">{result.finding}</h3>
      </div>
      <dl className="grid grid-cols-3 gap-2">
        {result.stats.map((s) => <div key={s.label} className="rounded-md bg-muted/50 p-2.5"><dt className="text-xs text-muted-foreground">{s.label}</dt><dd className="text-lg font-semibold">{s.value}</dd></div>)}
      </dl>
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Örnek yorumlar</h4>
        {result.samples.map((r) => (
          <blockquote key={r.id} className="rounded-md border-l-2 border-accent-foreground/60 bg-muted/30 px-3 py-2 text-sm">
            {r.text}<footer className="mt-1 text-xs text-muted-foreground">{r.author} · {SOURCE_NAMES[r.source]} · {formatDate(r.createdAt)}</footer>
          </blockquote>
        ))}
      </div>
      <div className="flex flex-col gap-3 rounded-md border border-dashed p-3 sm:flex-row sm:items-center">
        <div className="flex-1"><p className="text-xs text-muted-foreground">Önerilen aksiyon</p><p className="font-medium">{result.action.title}</p><p className="text-sm text-muted-foreground">{result.action.summary}</p></div>
        {added ? (
          <Button asChild variant="outline"><Link to="/aksiyonlar" search={{ kart: added } as never}>Aksiyonu görüntüle</Link></Button>
        ) : (
          <Button onClick={() => add.mutate(result.action)} disabled={add.isPending}>{add.isPending ? "Ekleniyor…" : "Aksiyon Danışmanı'na ekle"}</Button>
        )}
      </div>
    </article>
  );
}

function ReviewList({ reviews }: { reviews: import("@/types").CustomerReview[] }) {
  const [topic, setTopic] = useState<"hepsi" | VocTopic>("hepsi");
  const [sent, setSent] = useState<"hepsi" | VocSentiment>("hepsi");
  const [page, setPage] = useState(1);
  const rows = useMemo(() => reviews.filter((r) => (topic === "hepsi" || r.topic === topic) && (sent === "hepsi" || r.sentiment === sent)), [reviews, topic, sent]);
  useEffect(() => setPage(1), [reviews, topic, sent]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const slice = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return (
    <section className="rounded-xl border bg-card shadow-card" aria-labelledby="list-h">
      <div className="flex flex-wrap items-end gap-3 border-b p-4">
        <div className="mr-auto"><h2 id="list-h" className="font-semibold">Yorumlar</h2><p className="flex items-center gap-1 text-xs text-muted-foreground"><ShieldCheck className="h-3 w-3" aria-hidden />İsim ve telefon gibi kişisel veriler maskelenir</p></div>
        <Select value={topic} onValueChange={(v) => setTopic(v as typeof topic)}>
          <SelectTrigger className="w-44" aria-label="Konu filtresi"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="hepsi">Tüm konular</SelectItem>{VOC_TOPICS.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sent} onValueChange={(v) => setSent(v as typeof sent)}>
          <SelectTrigger className="w-36" aria-label="Duygu filtresi"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="hepsi">Tüm duygular</SelectItem>{(Object.keys(SENTIMENT_META) as VocSentiment[]).map((k) => <SelectItem key={k} value={k}>{SENTIMENT_META[k].label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {slice.length === 0 ? (
        <div className="p-4"><EmptyState title="Filtreye uyan yorum yok" description="Konu veya duygu filtresini değiştirin." /></div>
      ) : (
        <ul className="divide-y">
          {slice.map((r) => (
            <li key={r.id} className="space-y-1.5 p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{SOURCE_NAMES[r.source]}</span>
                <span>{formatDate(r.createdAt)}</span>
                <Stars n={r.rating} />
                <span>{r.author}</span>
                <span className="ml-auto flex gap-1.5">
                  <StatusBadge tone="bilgi">{topicLabel(r.topic)}</StatusBadge>
                  <StatusBadge tone={SENTIMENT_META[r.sentiment].tone}>{SENTIMENT_META[r.sentiment].label}</StatusBadge>
                </span>
              </div>
              <p className="text-sm">{r.text}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between border-t p-3 text-sm">
        <span className="text-muted-foreground">{formatNumber(rows.length)} yorum · Sayfa {page}/{pages}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Önceki</Button>
          <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Sonraki</Button>
        </div>
      </div>
    </section>
  );
}
