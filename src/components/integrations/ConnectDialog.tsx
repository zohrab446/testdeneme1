import { useEffect, useState } from "react";
import { Check, CircleCheck, Loader2, PlugZap, RotateCw, ShieldCheck, Upload } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  connectTrendyolIntegration,
  importCsvIntegration,
  listSlackWorkspaceChannels,
  startSlackConnection,
  testIntegrationConnection,
  USE_MOCKS,
} from "@/services/integrations";
import type { IntegrationConnection } from "@/types/integrations";
import { ChannelSelection } from "./ChannelSelection";
import { cn } from "@/lib/utils";

const steps = ["İzinler", "KVKK onayı", "Bağlantı testi", "Tamamlandı"];

export function ConnectDialog({ source, onClose }: { source: IntegrationConnection; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [consent, setConsent] = useState(false);
  const [selected, setSelected] = useState(source.selectedChannels);
  const [sellerId, setSellerId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [csvText, setCsvText] = useState("");
  const [csvTextColumn, setCsvTextColumn] = useState("yorum");
  const [csvDateColumn, setCsvDateColumn] = useState("tarih");
  const [csvResult, setCsvResult] = useState<{ inserted: number; errors: { line: number; reason: string }[] } | null>(null);
  const client = useQueryClient();

  const real = !USE_MOCKS;
  const isTrendyol = source.id === "trendyol";
  const isSlack = source.id === "slack";
  const isDosya = source.id === "dosya";

  // Gerçek Slack bağlantısında, bağlanmadan önce çalışma alanının kanallarını getir
  const [workspaceChannels, setWorkspaceChannels] = useState<{ id: string; name: string }[]>(source.channels);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelsError, setChannelsError] = useState<string | null>(null);
  useEffect(() => {
    if (!real || !isSlack || source.channels.length) return;
    let cancelled = false;
    setChannelsLoading(true);
    listSlackWorkspaceChannels()
      .then((list) => { if (!cancelled) { setWorkspaceChannels(list); setSelected(list.map((c) => c.id)); } })
      .catch((e: unknown) => { if (!cancelled) setChannelsError(e instanceof Error ? e.message : "Kanallar alınamadı."); })
      .finally(() => { if (!cancelled) setChannelsLoading(false); });
    return () => { cancelled = true; };
  }, [real, isSlack, source.channels.length]);

  const channelSource = real && isSlack ? { ...source, channels: workspaceChannels } : source;

  const test = useMutation({
    mutationFn: async () => {
      if (!real) return testIntegrationConnection(source.id, consent, selected);
      if (isTrendyol) return connectTrendyolIntegration({ sellerId, apiKey, apiSecret, consent });
      if (isSlack) {
        const result = await startSlackConnection(consent, selected);
        if (result.url) {
          window.location.href = result.url; // Slack yetkilendirme sayfasına yönlendir
          return new Promise(() => {}); // yönlendirme bitene kadar bekle
        }
        return result; // Gateway bağlantısı: doğrudan bağlandı
      }
      if (isDosya) {
        const result = await importCsvIntegration({ content: csvText, mapping: { text: csvTextColumn, date: csvDateColumn }, source: "csv", consent });
        setCsvResult(result);
        return result;
      }
      throw new Error("Bu kaynak için gerçek bağlantı henüz desteklenmiyor.");
    },
    onSuccess: () => setStep(3),
    onSettled: () => void client.invalidateQueries({ queryKey: ["integration-catalog"] }),
  });
  const startTest = () => { setStep(2); test.mutate(); };

  const step0Ready = real && isTrendyol ? !!(sellerId.trim() && apiKey.trim() && apiSecret.trim())
    : real && isDosya ? !!(csvText && csvTextColumn.trim())
    : real && isSlack ? !channelsLoading && !channelsError && selected.length > 0
    : !(source.channels.length > 0 && !selected.length);

  return <Dialog open onOpenChange={open => { if (!open && !test.isPending) onClose(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{source.name} bağlantısı</DialogTitle>
        <DialogDescription>{real ? "Gerçek bağlantı" : "Örnek bağlantı"} · {step + 1} / 4</DialogDescription>
      </DialogHeader>
      <ol className="grid grid-cols-4 gap-2" aria-label="Bağlantı adımları">
        {steps.map((label, i) => <li key={label} aria-current={i === step ? "step" : undefined} className={cn("space-y-2 text-center text-xs", i <= step ? "text-primary" : "text-muted-foreground")}>
          <span className={cn("mx-auto flex size-7 items-center justify-center rounded-full border", i <= step && "border-primary bg-primary/10")}>{i < step ? <Check className="size-4" /> : i + 1}</span>{label}
        </li>)}
      </ol>
      <Progress value={(step + 1) * 25} className="h-1" aria-label="Bağlantı ilerlemesi" />
      <div className="min-h-52 space-y-5 py-2" aria-live="polite">
        {step === 0 && <>
          <section><h3 className="mb-3 font-medium">İstenen izinler</h3><ul className="space-y-2 text-sm">{source.permissions.map(permission => <li key={permission} className="flex gap-2"><Check className="size-4 shrink-0 text-success" />{permission}</li>)}</ul></section>
          {real && isTrendyol && <section className="space-y-3">
            <h3 className="font-medium">Trendyol API bilgileri</h3>
            <p className="text-xs text-muted-foreground">Satıcı Paneli → Entegrasyon → API Bilgileri bölümünden alın. Anahtarlar şifreli saklanır; istemcide tutulmaz.</p>
            <div className="space-y-2"><Label htmlFor="seller-id">Satıcı ID</Label><Input id="seller-id" inputMode="numeric" value={sellerId} onChange={e => setSellerId(e.target.value)} placeholder="örn. 123456" /></div>
            <div className="space-y-2"><Label htmlFor="api-key">API Anahtarı</Label><Input id="api-key" value={apiKey} onChange={e => setApiKey(e.target.value)} autoComplete="off" /></div>
            <div className="space-y-2"><Label htmlFor="api-secret">API Gizli Anahtarı</Label><Input id="api-secret" type="password" value={apiSecret} onChange={e => setApiSecret(e.target.value)} autoComplete="off" /></div>
          </section>}
          {real && isDosya && <section className="space-y-3">
            <h3 className="font-medium">CSV dosyası yükle</h3>
            <p className="text-xs text-muted-foreground">En fazla 2 MB ve 5.000 satır. İlk satır sütun başlıkları olmalı.</p>
            <div className="space-y-2"><Label htmlFor="csv-file">Dosya</Label><Input id="csv-file" type="file" accept=".csv,text/csv" onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 2 * 1024 * 1024) { setCsvText(""); return; }
              void file.text().then(setCsvText);
            }} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="csv-text-col">Metin sütunu</Label><Input id="csv-text-col" value={csvTextColumn} onChange={e => setCsvTextColumn(e.target.value)} placeholder="yorum" /></div>
              <div className="space-y-2"><Label htmlFor="csv-date-col">Tarih sütunu</Label><Input id="csv-date-col" value={csvDateColumn} onChange={e => setCsvDateColumn(e.target.value)} placeholder="tarih" /></div>
            </div>
          </section>}
          {real && isSlack && channelsLoading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Slack çalışma alanınızdaki kanallar getiriliyor…</p>}
          {real && isSlack && channelsError && <p role="alert" className="text-sm text-destructive">{channelsError}</p>}
          {!isDosya && <ChannelSelection source={channelSource} selected={selected} onChange={setSelected} />}
          {channelSource.channels.length > 0 && selected.length === 0 && !(real && isTrendyol) && <p className="text-sm text-muted-foreground">Devam etmek için en az bir kanal seçin.</p>}
          {source.id === "sgk" && <p className="text-sm text-muted-foreground">Resmî SGK bildirimi e-SGK üzerinden yapılır; bu adım veriyi hazırlar.</p>}
        </>}
        {step === 1 && <>
          <div className="flex gap-3"><ShieldCheck className="size-6 shrink-0 text-success" /><div><h3 className="font-medium">Veri işleme ve açık rıza</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Yalnızca izin verilen veriler analiz edilir. Kişisel bilgiler maskelenir; çalışan sonuçları en az 5 kişilik gruplarda gösterilir.</p></div></div>
          <details className="rounded-md border p-3"><summary className="cursor-pointer text-sm font-medium text-primary">KVKK aydınlatma metnini oku</summary><div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground"><p>Bu metin örnek aydınlatma metnidir. Veri sorumlusu şirketinizdir. Seçili kaynak verileri çalışan ve müşteri eğilimlerini analiz etmek amacıyla işlenir.</p><p>Ham metinler analizden sonra 30 gün içinde silinir. Anonim toplulaştırılmış sonuçlar 24 ay saklanır. Bağlantı kesildiğinde bu kaynaktan gelen veriler {source.deletionDays} gün içinde silinmek üzere işaretlenir.</p><p>Slack ve Teams özel mesajları, bire bir ve grup sohbetleri asla okunmaz. Veriler üçüncü taraflara pazarlama amacıyla aktarılmaz. Erişim, düzeltme ve silme talepleri şirketinizin KVKK sorumlusuna iletilebilir.</p></div></details>
          <Label htmlFor="integration-consent" className="flex cursor-pointer items-start gap-3 text-sm font-normal leading-relaxed"><Checkbox id="integration-consent" checked={consent} onCheckedChange={value => setConsent(value === true)} className="mt-1" />Çalışan ve müşterilerin bilgilendirildiğini, gerekli açık rızaların alındığını ve bu kapsamda veri işlenmesini onaylıyorum.</Label>
        </>}
        {step === 2 && <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
          {test.isPending ? <><Loader2 className="size-9 animate-spin text-primary" /><h3 className="font-medium">{real && isSlack ? "Slack'e yönlendiriliyorsunuz" : real && isDosya ? "Dosya içe aktarılıyor" : "Bağlantı test ediliyor"}</h3><p className="text-sm text-muted-foreground">{real && isSlack ? "Slack yetkilendirme sayfası açılıyor…" : "İzinler ve kaynak erişimi kontrol ediliyor…"}</p></> : <><PlugZap className="size-9 text-destructive" /><h3 className="font-medium">Bağlantı kurulamadı</h3><p role="alert" className="max-w-sm text-sm text-destructive">{test.error?.message}</p><Button variant="outline" onClick={startTest}><RotateCw className="size-4" />Tekrar dene</Button></>}
        </div>}
        {step === 3 && <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center"><CircleCheck className="size-10 text-success" /><h3 className="font-medium">{source.name} bağlandı</h3>
          {csvResult ? <p className="text-sm text-muted-foreground">{csvResult.inserted} kayıt içe aktarıldı{csvResult.errors.length ? `, ${csvResult.errors.length} satır atlandı` : ""}.</p> : <p className="text-sm text-muted-foreground">{real && isTrendyol ? "Bağlantı başarılı. Son 90 günün verisi arka planda aktarılıyor." : "Bağlantı testi başarılı. Senkron ayarlarını Yönet panelinden değiştirebilirsiniz."}</p>}
          {csvResult?.errors.length ? <ul className="max-h-32 w-full overflow-y-auto rounded-md border p-3 text-left text-xs text-muted-foreground">{csvResult.errors.slice(0, 20).map(e => <li key={e.line}>Satır {e.line}: {e.reason}</li>)}</ul> : null}
        </div>}
      </div>
      <DialogFooter className="gap-2">
        {step === 0 && <><Button variant="ghost" onClick={onClose}>Vazgeç</Button><Button disabled={!step0Ready} onClick={() => setStep(1)}>İleri</Button></>}
        {step === 1 && <><Button variant="outline" onClick={() => setStep(0)}>Geri</Button><Button disabled={!consent} onClick={startTest}>{real && isDosya ? <Upload className="size-4" /> : null}Onayla ve {real && isDosya ? "içe aktar" : "test et"}</Button></>}
        {step === 2 && !test.isPending && <Button variant="ghost" onClick={() => setStep(0)}>İzinlere dön</Button>}
        {step === 3 && <Button onClick={onClose}>Tamam</Button>}
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
