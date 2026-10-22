import { useState } from "react";
import { Check, Loader2, RefreshCw, RotateCw, Save, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/common";
import { integrationStatuses, syncFrequencies } from "@/lib/integrations";
import { formatDateTime, formatNumber } from "@/lib/format";
import { saveIntegrationSettings, syncIntegration } from "@/services/integrations";
import type { IntegrationConnection, SyncFrequency } from "@/types/integrations";
import { ChannelSelection } from "./ChannelSelection";

export function ManageSheet({ source, onClose, onReconnect, onDisconnect }: {
  source: IntegrationConnection; onClose: () => void; onReconnect: () => void; onDisconnect: () => void;
}) {
  const [frequency, setFrequency] = useState<SyncFrequency>(source.frequency);
  const [selected, setSelected] = useState(source.selectedChannels);
  const client = useQueryClient();
  const save = useMutation({ mutationFn: () => saveIntegrationSettings(source.id, frequency, selected),
    onSuccess: () => {
      toast.success("Senkron ayarları kaydedildi.");
      void client.invalidateQueries({ queryKey: ["integration-catalog"] });
    },
  });
  const sync = useMutation({ mutationFn: () => syncIntegration(source.id),
    onSuccess: result => { toast.success(`Senkron tamamlandı: ${formatNumber(result.fetched)} kayıt alındı.`); void client.invalidateQueries({ queryKey: ["integration-catalog"] }); },
    onError: error => toast.error(error.message),
  });
  const status = integrationStatuses[source.status];
  return <Sheet open onOpenChange={open => { if (!open && !save.isPending) onClose(); }}>
    <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
      <SheetHeader className="pr-6"><SheetTitle>{source.name} · Yönet</SheetTitle><SheetDescription>Örnek bağlantı ayarları ve senkron geçmişi.</SheetDescription></SheetHeader>
      <div className="mt-6 space-y-6">
        <div className="flex items-center justify-between gap-3"><StatusBadge tone={status.tone}>{status.label}</StatusBadge><span className="text-xs text-muted-foreground">Son senkron: {source.lastSync ? formatDateTime(source.lastSync) : "—"}</span></div>
        {source.error && <section className="rounded-md border border-destructive/30 bg-destructive/5 p-4"><h3 className="text-sm font-medium text-destructive">Hata detayı</h3><p className="mt-2 break-words text-sm">{source.error}</p><Button className="mt-3" variant="outline" onClick={onReconnect}><RotateCw className="size-4" />Bağlantıyı yeniden test et</Button></section>}
        <section className="space-y-3"><Label htmlFor="sync-frequency">Senkron sıklığı</Label><Select value={frequency} onValueChange={value => { if (value === "saatlik" || value === "gunluk" || value === "haftalik") setFrequency(value); }}><SelectTrigger id="sync-frequency"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(syncFrequencies).map(([id, label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}</SelectContent></Select></section>
        <ChannelSelection source={source} selected={selected} onChange={setSelected} disabled={save.isPending} />
        {save.isError && <p role="alert" className="text-sm text-destructive">{save.error.message}</p>}
        <div className="flex flex-wrap gap-2"><Button disabled={save.isPending || !source.consent || (source.channels.length > 0 && !selected.length)} onClick={() => save.mutate()}>{save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Ayarları kaydet</Button><Button variant="outline" disabled={sync.isPending} onClick={() => sync.mutate()}>{sync.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}Şimdi senkronla</Button><Button variant="ghost" className="text-destructive" onClick={onDisconnect}>Bağlantıyı Kes</Button></div>
        <section className="border-t pt-6"><h3 className="mb-4 font-medium">Son 10 senkron kaydı</h3>{!source.logs.length ? <p className="py-6 text-sm text-muted-foreground">Henüz senkron kaydı yok.</p> : <ol className="divide-y">{source.logs.map(log => <li key={log.id} className="flex gap-3 py-3">{log.success ? <Check className="mt-1 size-4 shrink-0 text-success" /> : <X className="mt-1 size-4 shrink-0 text-destructive" />}<div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-1 text-sm"><time dateTime={log.at}>{formatDateTime(log.at)}</time><span className="text-muted-foreground">{log.success ? `${formatNumber(log.count)} kayıt` : "Başarısız"}</span></div>{log.detail && <p className="mt-1 break-words text-xs text-destructive">{log.detail}</p>}</div></li>)}</ol>}</section>
      </div>
    </SheetContent>
  </Sheet>;
}