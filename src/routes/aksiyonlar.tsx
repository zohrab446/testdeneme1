import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DndContext, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { Sparkles, ArrowRight, Check, Clock, GripVertical, FilterX, ChevronDown } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { EmptyState, StatusBadge } from "@/components/common";
import { PageScaffold } from "@/components/common/PageScaffold";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { getActionCards, updateActionStatus, snoozeAction, markActionDone } from "@/services";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdvisorAction, ActionStatus, ActionUrgency, Severity } from "@/types";

export const Route = createFileRoute("/aksiyonlar")({
  validateSearch: z.object({ kart: z.string().optional(), durum: z.string().optional() }),
  head: () => ({ meta: [ { title: "Aksiyon Danışmanı · [ÜRÜN ADI]" }, { name: "description", content: "Çalışan ve müşteri bulgularından uygulanabilir öneriler ve aksiyon takibi." }, { property: "og:title", content: "Aksiyon Danışmanı · [ÜRÜN ADI]" }, { property: "og:description", content: "Önerileri önceliklendir, göreve çevir ve ilerlemeyi takip et." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" } ] }),
  component: Page,
});
const urgencyTone: Record<ActionUrgency, Severity> = { Düşük: "notr", Orta: "bilgi", Yüksek: "uyari", Kritik: "kritik" };
const columns: { id: ActionStatus; label: string }[] = [{ id: "Yapılacak", label: "Yapılacak" }, { id: "DevamEdiyor", label: "Devam Ediyor" }, { id: "Tamamlandı", label: "Tamamlandı" }];
function Filter({ label, value, onChange, items }: { label: string; value: string; onChange: (v: string) => void; items: string[] }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger className="w-full sm:w-48" aria-label={label}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tüm {label.toLocaleLowerCase("tr")}</SelectItem>{items.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select>;
}
function Page() { const { kart } = Route.useSearch(); return <PageScaffold title="Aksiyon Danışmanı" description="Bulgudan uygulamaya, ekibin için net adımlar." icon={Sparkles} queryKey={["actions"]} queryFn={getActionCards} emptyTitle="Henüz aksiyon önerisi yok" emptyDescription="Yeni geri bildirimlerle öneriler burada görünecek.">{cards => <Advisor cards={cards} selected={kart} />}</PageScaffold>; }
function Advisor({ cards, selected }: { cards: AdvisorAction[]; selected?: string | undefined }) {
  const qc = useQueryClient();
  const [urgency, setUrgency] = useState("all"), [source, setSource] = useState("all"), [department, setDepartment] = useState("all");
  const [tab, setTab] = useState("suggestions");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));
  const mutation = useMutation({ mutationFn: ({ id, status, days }: { id: string; status?: ActionStatus; days?: number }) => days ? snoozeAction(id, days) : status === "Tamamlandı" ? markActionDone(id) : updateActionStatus(id, status ?? "Yapılacak"), onSuccess: (card) => { qc.setQueryData<AdvisorAction[]>(["actions"], old => old?.map(c => c.id === card.id ? card : c)); toast.success(card.durum === "Yapılacak" ? "Aksiyon göreve çevrildi." : card.durum === "Ertelendi" ? "Aksiyon ertelendi." : card.durum === "Tamamlandı" ? "Aksiyon tamamlandı." : "Aksiyon durumu güncellendi."); void qc.invalidateQueries({ queryKey: ["dashboard"] }); }, onError: (e) => toast.error(e.message) });
  const filtered = cards.filter(c => (urgency === "all" || c.aciliyet === urgency) && (source === "all" || c.kaynak === source) && (department === "all" || c.departman === department));
  const suggestions = filtered.filter(c => c.durum === "Öneri" && c.id !== selected);
  const focused = cards.find(c => c.id === selected);
  function drop(e: DragEndEvent) { if (!e.over || mutation.isPending) return; const target = String(e.over.id) as ActionStatus; const card = cards.find(c => c.id === e.active.id); if (card && columns.some(c => c.id === target) && card.durum !== target) mutation.mutate({ id: card.id, status: target }); }
  const act = (id: string, status?: ActionStatus, days?: number) => mutation.mutate({ id, status, days });
  return <Tabs value={tab} onValueChange={setTab} className="space-y-6">
    <TabsList><TabsTrigger value="suggestions">Öneriler <span className="ml-2 text-xs text-muted-foreground">{cards.filter(c => c.durum === "Öneri").length}</span></TabsTrigger><TabsTrigger value="tracking">Aksiyon Takibi</TabsTrigger></TabsList>
    <TabsContent value="suggestions" className="space-y-5">
      <div className="flex flex-wrap items-center gap-2"><Filter label="Aciliyetler" value={urgency} onChange={setUrgency} items={["Düşük", "Orta", "Yüksek", "Kritik"]} /><Filter label="Kaynaklar" value={source} onChange={setSource} items={["Çalışan", "Müşteri"]} /><Filter label="Departmanlar" value={department} onChange={setDepartment} items={[...new Set(cards.map(c => c.departman))]} /><Button variant="ghost" onClick={() => { setUrgency("all"); setSource("all"); setDepartment("all"); }}><FilterX className="size-4" />Temizle</Button></div>
      {focused && <Recommendation card={focused} highlighted act={act} pending={mutation.isPending} />}
      <div className="grid gap-4 xl:grid-cols-2">{suggestions.map(card => <Recommendation key={card.id} card={card} act={act} pending={mutation.isPending} />)}</div>
      {suggestions.length === 0 && !focused && <EmptyState title="Bu filtreye uyan öneri yok" description="Filtreleri değiştirerek diğer önerileri görebilirsin." />}
    </TabsContent>
    <TabsContent value="tracking" className="space-y-6">
      <DndContext sensors={sensors} onDragEnd={drop}><div className="flex gap-4 overflow-x-auto pb-4" data-testid="kanban">{columns.map(column => <KanbanColumn key={column.id} column={column} cards={cards.filter(c => c.durum === column.id)} pending={mutation.isPending} move={act} />)}</div></DndContext>
      <section className="border-t pt-5"><h2 className="mb-3 flex items-center gap-2 font-semibold"><Clock className="size-4" />Ertelenenler <span className="text-muted-foreground">({cards.filter(c => c.durum === "Ertelendi").length})</span></h2><div className="divide-y">{cards.filter(c => c.durum === "Ertelendi").map(c => <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium">{c.title}</p><p className="mt-1 text-xs text-muted-foreground">{c.departman} · Dönüş: {c.ertelemeTarihi ? formatDate(c.ertelemeTarihi) : "Tarih belirtilmedi"}</p></div><Button variant="outline" size="sm" disabled={mutation.isPending} onClick={() => act(c.id, "Öneri")}>Önerilere al</Button></div>)}{!cards.some(c => c.durum === "Ertelendi") && <p className="text-sm text-muted-foreground">Ertelenmiş aksiyon yok.</p>}</div></section>
    </TabsContent>
  </Tabs>;
}
function Recommendation({ card, highlighted, act, pending }: { card: AdvisorAction; highlighted?: boolean; act: (id: string, status?: ActionStatus, days?: number) => void; pending: boolean }) {
  return <article id={`kart-${card.id}`} className={cn("rounded-lg border bg-card p-5 shadow-card", highlighted && "border-primary ring-2 ring-primary/15")}>
    {highlighted && <p className="mb-3 text-xs font-medium text-primary">Seçilen öneri · {card.durum === "DevamEdiyor" ? "Devam Ediyor" : card.durum}</p>}
    <div className="flex items-start justify-between gap-3"><h2 className="font-semibold">{card.title}</h2><StatusBadge tone={urgencyTone[card.aciliyet]}>{card.aciliyet}</StatusBadge></div>
    <p className="mt-2 text-xs text-muted-foreground">{card.kaynak} · {card.departman} · {formatDate(card.olusturmaTarihi)}</p>
    <div className="mt-5 space-y-4 text-sm"><div><h3 className="mb-1 text-xs font-semibold text-muted-foreground">BULGU</h3><p>{card.bulgu}</p></div><div><h3 className="mb-1 text-xs font-semibold text-muted-foreground">NEDEN</h3><p>{card.neden}</p></div><ol className="space-y-2">{card.aksiyonlar.map((action, i) => <li key={action} className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span><span className="pt-0.5">{action}</span></li>)}</ol><div className="border-l-2 border-success pl-3"><h3 className="mb-1 text-xs font-semibold text-success">BEKLENEN ETKİ</h3><p>{card.beklenenEtki}</p></div></div>
    <details className="mt-4 border-t pt-3 text-xs"><summary className="cursor-pointer text-muted-foreground">Bu öneri nasıl üretildi?</summary><p className="mt-2 leading-relaxed">{card.nasilUretildi.aciklama} · {formatNumber(card.nasilUretildi.veriNoktasiSayisi)} veri noktası</p></details>
    <div className="mt-5 flex flex-wrap gap-2"><Button size="sm" disabled={pending || card.durum !== "Öneri"} onClick={() => act(card.id, "Yapılacak")}><ArrowRight className="size-4" />Göreve Çevir</Button><DropdownMenu><DropdownMenuTrigger asChild><Button size="sm" variant="outline" disabled={pending || card.durum === "Tamamlandı"}><Clock className="size-4" />Ertele<ChevronDown className="size-3" /></Button></DropdownMenuTrigger><DropdownMenuContent>{[[1, "1 gün"], [3, "3 gün"], [7, "1 hafta"]].map(([days, label]) => <DropdownMenuItem key={days} onSelect={() => act(card.id, undefined, Number(days))}>{label}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu><Button variant="ghost" size="sm" disabled={pending || card.durum === "Tamamlandı"} onClick={() => act(card.id, "Tamamlandı")}><Check className="size-4" />Uygulandı</Button></div>
  </article>;
}
function KanbanColumn({ column, cards, pending, move }: { column: { id: ActionStatus; label: string }; cards: AdvisorAction[]; pending: boolean; move: (id: string, status?: ActionStatus) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return <section ref={setNodeRef} data-column={column.id} className={cn("min-h-80 min-w-72 flex-1 rounded-lg border bg-muted/40 p-3", isOver && "border-primary bg-primary/5")} aria-label={column.label}><h2 className="mb-4 flex items-center justify-between text-sm font-semibold">{column.label}<span className="text-muted-foreground">{cards.length}</span></h2><div className="space-y-3">{cards.map(card => <TaskCard key={card.id} card={card} pending={pending} move={move} />)}{!cards.length && <p className="py-12 text-center text-sm text-muted-foreground">Buraya sürükleyin</p>}</div></section>;
}
function TaskCard({ card, pending, move }: { card: AdvisorAction; pending: boolean; move: (id: string, status?: ActionStatus) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id, disabled: pending });
  const overdue = card.durum !== "Tamamlandı" && card.vadeTarihi && new Date(card.vadeTarihi).getTime() < new Date().setHours(0, 0, 0, 0);
  return <article ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform) }} className={cn("relative rounded-lg border bg-card p-3 shadow-card", isDragging && "z-20 opacity-80")} data-task={card.id}><div className="flex items-start gap-2"><Button variant="ghost" size="icon" className="size-7 shrink-0 touch-none cursor-grab" aria-label={`${card.title} kartını taşı`} {...attributes} {...listeners}><GripVertical className="size-4" /></Button><h3 className="pt-1 text-sm font-medium">{card.title}</h3></div><div className="mt-3 flex flex-wrap items-center gap-2"><StatusBadge tone={urgencyTone[card.aciliyet]}>{card.aciliyet}</StatusBadge><span className="text-xs text-muted-foreground">{card.departman}</span></div><p className={cn("mt-3 text-xs", overdue ? "text-destructive" : "text-muted-foreground")}>{card.vadeTarihi ? `Vade: ${formatDate(card.vadeTarihi)}${overdue ? " · Gecikti" : ""}` : "Vade belirtilmedi"}</p><Select value={card.durum} onValueChange={v => move(card.id, v as ActionStatus)} disabled={pending}><SelectTrigger className="mt-3 h-8 text-xs" aria-label={`${card.title} durumu`}><SelectValue /></SelectTrigger><SelectContent>{columns.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent></Select></article>;
}
