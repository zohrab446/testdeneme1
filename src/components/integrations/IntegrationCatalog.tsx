import { useState } from "react";
import { Bell, Check, Link2, Loader2, Search, Settings2, Unplug } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog, EmptyState, StatusBadge } from "@/components/common";
import { formatDate, formatDateTime } from "@/lib/format";
import { integrationCategories, integrationStatuses } from "@/lib/integrations";
import { disconnectIntegration, requestIntegrationNotification } from "@/services/integrations";
import type { IntegrationCategory, IntegrationConnection } from "@/types/integrations";
import { ConnectDialog } from "./ConnectDialog";
import { ManageSheet } from "./ManageSheet";

export function IntegrationCatalog({ sources }: { sources: IntegrationConnection[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [connecting, setConnecting] = useState<IntegrationConnection | null>(null);
  const [managedId, setManagedId] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<IntegrationConnection | null>(null);
  const [notify, setNotify] = useState<IntegrationConnection | null>(null);
  const [email, setEmail] = useState("");
  const client = useQueryClient();
  const invalidate = () => void client.invalidateQueries({ queryKey: ["integration-catalog"] });
  const disconnect = useMutation({ mutationFn: (id: string) => disconnectIntegration(id),
    onSuccess: () => { setDisconnecting(null); setManagedId(null); invalidate(); toast.success("Bağlantı kesildi. Veriler silinmek üzere işaretlendi."); },
    onError: error => toast.error(error.message),
  });
  const notification = useMutation({ mutationFn: ({ id, email }: { id: string; email: string }) => requestIntegrationNotification(id, email),
    onSuccess: () => invalidate(),
  });
  const managed = sources.find(source => source.id === managedId);
  const filtered = sources.filter(source => (category === "all" || source.category === category) &&
    `${source.name} ${source.description}`.toLocaleLowerCase("tr-TR").includes(search.toLocaleLowerCase("tr-TR")));
  const connectedCount = sources.filter(source => source.status === "bagli").length;
  return <>
    <div className="mb-6 flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-center">
      <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label="Entegrasyon ara" placeholder="Kaynak veya entegrasyon ara…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
      <Select value={category} onValueChange={setCategory}><SelectTrigger aria-label="Kategori filtresi" className="sm:w-52"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tüm kategoriler</SelectItem>{Object.entries(integrationCategories).map(([id, label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}</SelectContent></Select>
      <span className="shrink-0 text-xs text-muted-foreground">{connectedCount} bağlı · {sources.length} kaynak</span>
    </div>
    {disconnect.isPending && <p role="status" className="mb-4 text-sm text-muted-foreground">Bağlantı kesiliyor…</p>}
    {!filtered.length && <EmptyState icon={Search} title="Sonuç bulunamadı" description="Başka bir kaynak adı veya kategori deneyin." action={<Button variant="outline" onClick={() => { setSearch(""); setCategory("all"); }}>Filtreleri temizle</Button>} />}
    <div className="space-y-8">
      {(Object.entries(integrationCategories) as [IntegrationCategory, string][]).map(([id, label]) => {
        const items = filtered.filter(source => source.category === id);
        if (!items.length) return null;
        return <section key={id} aria-labelledby={`category-${id}`}>
          <div className="mb-4 flex items-center gap-3"><span className="h-4 w-0.5 bg-highlight" /><h2 id={`category-${id}`} className="text-base font-semibold">{label}</h2><span className="text-xs text-muted-foreground">{items.length}</span></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map(source => {
            const status = integrationStatuses[source.status];
            const active = source.status === "bagli" || source.status === "hata";
            return <article key={source.id} aria-label={source.name} className="flex min-w-0 flex-col rounded-lg border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-2"><div aria-label={`${source.name} logo yer tutucusu`} className="flex size-11 shrink-0 items-center justify-center rounded-md border bg-accent font-mono text-sm font-semibold text-accent-foreground">{source.monogram}</div><StatusBadge tone={status.tone}>{status.label}</StatusBadge></div>
              <h3 className="mt-4 font-semibold">{source.name}</h3><p className="mt-1 min-h-10 text-sm leading-relaxed text-muted-foreground">{source.description}</p>
              <p className="mt-4 text-xs text-muted-foreground">Son senkron: {source.lastSync ? formatDateTime(source.lastSync) : "—"}</p>
              {source.deleteAt && <p className="mt-2 text-xs text-muted-foreground">Silinme tarihi: {formatDate(source.deleteAt)} (örnek)</p>}
              <div className="mt-auto flex flex-wrap items-center gap-2 border-t pt-4 mt-4">
                {source.status === "yakinda" ? <Button variant="outline" className="w-full" onClick={() => { setNotify(source); setEmail(source.notificationEmail ?? ""); notification.reset(); }}><Bell className="size-4" />{source.notificationEmail ? "Bildirim kaydı alındı" : "Haberdar et"}</Button> : <>
                  {!active && <Button variant="outline" className="flex-1" onClick={() => setConnecting(source)}><Link2 className="size-4" />Bağla</Button>}
                  {active && <><Button variant="outline" className="flex-1" onClick={() => setManagedId(source.id)}><Settings2 className="size-4" />Yönet</Button><Button variant="ghost" size="icon" title="Bağlantıyı Kes" aria-label={`${source.name} bağlantısını kes`} disabled={disconnect.isPending} onClick={() => setDisconnecting(source)}><Unplug className="size-4" /></Button></>}
                </>}
              </div>
            </article>;
          })}</div>
        </section>;
      })}
    </div>
    {connecting && <ConnectDialog key={connecting.id} source={connecting} onClose={() => setConnecting(null)} />}
    {managed && <ManageSheet key={managed.id} source={managed} onClose={() => setManagedId(null)} onReconnect={() => { setManagedId(null); setConnecting(managed); }} onDisconnect={() => setDisconnecting(managed)} />}
    <ConfirmDialog open={!!disconnecting} onOpenChange={open => { if (!open) setDisconnecting(null); }} title={`${disconnecting?.name ?? "Kaynak"} bağlantısı kesilsin mi?`} description={`Bu kaynaktan gelen veriler ${disconnecting?.deletionDays ?? 30} gün içinde silinecek. Yeni veriler alınmayacak. Bu işlem şu an örnek veriler üzerinde uygulanır.`} destructive confirmLabel="Bağlantıyı Kes" onConfirm={() => { if (disconnecting) disconnect.mutate(disconnecting.id); }} />
    <Dialog open={!!notify} onOpenChange={open => { if (!open && !notification.isPending) setNotify(null); }}><DialogContent><DialogHeader><DialogTitle>{notify?.name} · Haberdar et</DialogTitle><DialogDescription>Bu kaynak kullanıma açıldığında bildirim almak için e-posta adresinizi bırakın. Kayıt şimdilik örnektir; e-posta gönderilmez.</DialogDescription></DialogHeader>
      {notification.isSuccess ? <div role="status" className="space-y-4"><p className="flex items-center gap-2 text-sm"><Check className="size-5 text-success" />Bildirim kaydınız alındı.</p><Button className="w-full" onClick={() => setNotify(null)}>Tamam</Button></div> : <form className="space-y-4" onSubmit={e => { e.preventDefault(); if (notify) notification.mutate({ id: notify.id, email }); }}><div className="space-y-2"><Label htmlFor="notification-email">E-posta</Label><Input id="notification-email" type="email" autoComplete="email" placeholder="ad@şirket.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={notification.isPending} /></div>{notification.isError && <p role="alert" className="text-sm text-destructive">{notification.error.message}</p>}<Button className="w-full" disabled={notification.isPending}>{notification.isPending ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}Haberdar et</Button></form>}
    </DialogContent></Dialog>
  </>;
}