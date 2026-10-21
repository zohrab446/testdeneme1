import { useState } from "react";
import { Check, CircleCheck, Loader2, PlugZap, RotateCw, ShieldCheck } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { testIntegrationConnection } from "@/services/integrations";
import type { IntegrationConnection } from "@/types/integrations";
import { ChannelSelection } from "./ChannelSelection";
import { cn } from "@/lib/utils";

const steps = ["İzinler", "KVKK onayı", "Bağlantı testi", "Tamamlandı"];
export function ConnectDialog({ source, onClose }: { source: IntegrationConnection; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [consent, setConsent] = useState(false);
  const [selected, setSelected] = useState(source.selectedChannels);
  const client = useQueryClient();
  const test = useMutation({
    mutationFn: () => testIntegrationConnection(source.id, consent, selected),
    onSuccess: () => setStep(3),
    onSettled: () => void client.invalidateQueries({ queryKey: ["integration-catalog"] }),
  });
  const startTest = () => { setStep(2); test.mutate(); };
  return <Dialog open onOpenChange={open => { if (!open && !test.isPending) onClose(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{source.name} bağlantısı</DialogTitle>
        <DialogDescription>Örnek bağlantı · {step + 1} / 4</DialogDescription>
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
          <ChannelSelection source={source} selected={selected} onChange={setSelected} />
          {source.channels.length > 0 && selected.length === 0 && <p className="text-sm text-muted-foreground">Devam etmek için en az bir kanal seçin.</p>}
          {source.id === "sgk" && <p className="text-sm text-muted-foreground">Resmî SGK bildirimi e-SGK üzerinden yapılır; bu adım veriyi hazırlar.</p>}
        </>}
        {step === 1 && <>
          <div className="flex gap-3"><ShieldCheck className="size-6 shrink-0 text-success" /><div><h3 className="font-medium">Veri işleme ve açık rıza</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Yalnızca izin verilen veriler analiz edilir. Kişisel bilgiler maskelenir; çalışan sonuçları en az 5 kişilik gruplarda gösterilir.</p></div></div>
          <details className="rounded-md border p-3"><summary className="cursor-pointer text-sm font-medium text-primary">KVKK aydınlatma metnini oku</summary><div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground"><p>Bu metin örnek aydınlatma metnidir. Veri sorumlusu şirketinizdir. Seçili kaynak verileri çalışan ve müşteri eğilimlerini analiz etmek amacıyla işlenir.</p><p>Ham metinler analizden sonra 30 gün içinde silinir. Anonim toplulaştırılmış sonuçlar 24 ay saklanır. Bağlantı kesildiğinde bu kaynaktan gelen veriler {source.deletionDays} gün içinde silinmek üzere işaretlenir.</p><p>Slack ve Teams özel mesajları, bire bir ve grup sohbetleri asla okunmaz. Veriler üçüncü taraflara pazarlama amacıyla aktarılmaz. Erişim, düzeltme ve silme talepleri şirketinizin KVKK sorumlusuna iletilebilir.</p></div></details>
          <Label htmlFor="integration-consent" className="flex cursor-pointer items-start gap-3 text-sm font-normal leading-relaxed"><Checkbox id="integration-consent" checked={consent} onCheckedChange={value => setConsent(value === true)} className="mt-1" />Çalışan ve müşterilerin bilgilendirildiğini, gerekli açık rızaların alındığını ve bu kapsamda veri işlenmesini onaylıyorum.</Label>
        </>}
        {step === 2 && <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
          {test.isPending ? <><Loader2 className="size-9 animate-spin text-primary" /><h3 className="font-medium">Bağlantı test ediliyor</h3><p className="text-sm text-muted-foreground">İzinler ve kaynak erişimi kontrol ediliyor…</p></> : <><PlugZap className="size-9 text-destructive" /><h3 className="font-medium">Bağlantı kurulamadı</h3><p role="alert" className="max-w-sm text-sm text-destructive">{test.error?.message}</p><Button variant="outline" onClick={startTest}><RotateCw className="size-4" />Tekrar dene</Button></>}
        </div>}
        {step === 3 && <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center"><CircleCheck className="size-10 text-success" /><h3 className="font-medium">{source.name} bağlandı</h3><p className="text-sm text-muted-foreground">Bağlantı testi başarılı. Senkron ayarlarını Yönet panelinden değiştirebilirsiniz.</p></div>}
      </div>
      <DialogFooter className="gap-2">
        {step === 0 && <><Button variant="ghost" onClick={onClose}>Vazgeç</Button><Button disabled={source.channels.length > 0 && !selected.length} onClick={() => setStep(1)}>İleri</Button></>}
        {step === 1 && <><Button variant="outline" onClick={() => setStep(0)}>Geri</Button><Button disabled={!consent} onClick={startTest}>Onayla ve test et</Button></>}
        {step === 2 && !test.isPending && <Button variant="ghost" onClick={() => setStep(0)}>İzinlere dön</Button>}
        {step === 3 && <Button onClick={onClose}>Tamam</Button>}
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}