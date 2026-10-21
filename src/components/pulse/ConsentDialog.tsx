import { useState } from "react";
import { Check, Loader2, ShieldCheck, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { PulseSource } from "@/types";

const READS: Record<PulseSource["id"], { reads: string[]; never: string[] }> = {
  slack: {
    reads: ["Herkese açık kanallardaki mesaj metinleri", "Mesaj tarihleri ve kanal adı"],
    never: ["Özel mesajlar (DM) ve grup DM'leri", "Gizli (private) kanallar", "Dosya ve görsel içerikleri"],
  },
  teams: {
    reads: ["Ekip kanallarındaki gönderi metinleri", "Gönderi tarihleri ve kanal adı"],
    never: ["Bire bir ve grup sohbetleri", "Toplantı kayıtları ve dökümleri", "Dosya içerikleri"],
  },
  oneri: {
    reads: ["Öneri kutusuna yazılan metinler", "Gönderim tarihi ve seçilen departman"],
    never: ["Gönderenin kimliği, IP adresi veya cihaz bilgisi"],
  },
  csv: {
    reads: ["Yüklediğiniz dosyadaki anket yanıtları ve departman sütunu"],
    never: ["Ad, e-posta veya çalışan numarası sütunları (yükleme sırasında atılır)"],
  },
};

export function ConsentDialog({
  source,
  pending,
  onOpenChange,
  onConfirm,
}: {
  source: PulseSource | null;
  pending: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: () => void;
}) {
  const [consent, setConsent] = useState(false);
  const info = source ? READS[source.id] : null;

  return (
    <Dialog
      open={!!source}
      onOpenChange={(o) => {
        if (!o) setConsent(false);
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </div>
          <DialogTitle>{source?.name} bağlantısı için KVKK onayı</DialogTitle>
          <DialogDescription>Bağlanmadan önce hangi verilerin nasıl işleneceğini inceleyin.</DialogDescription>
        </DialogHeader>
        {info && (
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="mb-1.5 font-medium">Okunacak veriler</h3>
              <ul className="space-y-1">
                {info.reads.map((r) => (
                  <li key={r} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />{r}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="mb-1.5 font-medium">Asla okunmayacak veriler</h3>
              <ul className="space-y-1">
                {info.never.map((r) => (
                  <li key={r} className="flex gap-2"><X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />{r}</li>
                ))}
              </ul>
            </section>
            <section className="rounded-lg bg-muted/60 p-3 text-muted-foreground">
              <p><span className="font-medium text-foreground">Saklama süresi:</span> Ham metinler analizden sonra 30 gün içinde silinir; yalnızca anonim, toplulaştırılmış skorlar 24 ay saklanır.</p>
              <p className="mt-2">Sonuçlar en az 5 kişilik gruplar halinde gösterilir; bireysel isimler hiçbir ekranda yer almaz.</p>
              <a href="#kvkk-aydinlatma" className="mt-2 inline-block font-medium text-primary underline underline-offset-2">
                KVKK aydınlatma metnini oku
              </a>
            </section>
            <div className="flex items-start gap-3">
              <Checkbox id="pulse-consent" className="mt-0.5 size-5" checked={consent} onCheckedChange={(c) => setConsent(c === true)} />
              <Label htmlFor="pulse-consent" className="block text-sm font-normal leading-relaxed">
                Çalışanlarımızın bu kapsamda bilgilendirildiğini ve gerekli açık rızaların alındığını onaylıyorum.
              </Label>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Vazgeç</Button>
          <Button disabled={!consent || pending} onClick={onConfirm}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Onayla ve bağla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
