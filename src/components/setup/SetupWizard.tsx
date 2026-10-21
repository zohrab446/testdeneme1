import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { CompanySetup } from "@/types";

export const SETUP_STORAGE_KEY = "kurulum:v1";

const SECTORS = ["E-ticaret", "Yazılım / SaaS", "Perakende", "Üretim", "Hizmet", "Sağlık", "Eğitim", "Diğer"];
const RANGES = ["1-10", "11-50", "51-200", "201-500", "500+"];
const SOURCES = [
  { id: "slack", label: "Slack", desc: "Çalışan nabız anketleri" },
  { id: "google", label: "Google Yorumları", desc: "Müşteri değerlendirmeleri" },
  { id: "trendyol", label: "Trendyol / Hepsiburada", desc: "Pazaryeri yorumları" },
  { id: "sikayetvar", label: "Şikayetvar", desc: "Marka şikâyetleri" },
  { id: "ik", label: "İK Yazılımı", desc: "Çalışan kayıtları" },
  { id: "anket", label: "Anket / Form", desc: "Kendi anketleriniz" },
];
const GOALS = [
  "Çalışan bağlılığını artırmak",
  "Çalışan devir hızını azaltmak",
  "Müşteri memnuniyetini artırmak",
  "Şikâyetleri hızlı çözmek",
  "Onboarding sürecini hızlandırmak",
  "Veriye dayalı karar almak",
];

const schema = z.object({
  companyName: z.string().trim().min(2, "Şirket adı en az 2 karakter olmalı").max(100),
  sector: z.string().min(1, "Sektör seçin"),
  employeeRange: z.string().min(1, "Çalışan sayısı seçin"),
  sources: z.array(z.string()),
  goals: z.array(z.string()).min(1, "En az bir hedef seçin"),
});
type FormValues = z.infer<typeof schema>;

const STEPS = ["Şirket bilgisi", "Kaynaklar", "Hedefler"];

function ToggleCard({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative rounded-lg border p-3 text-left text-sm transition-colors hover:bg-accent",
        active && "border-primary bg-primary/5 ring-1 ring-primary",
      )}
    >
      <div className="pr-6 font-medium">{title}</div>
      {desc && <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>}
      {active && (
        <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" />
        </span>
      )}
    </button>
  );
}

export function SetupWizard() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(SETUP_STORAGE_KEY)) setOpen(true);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { companyName: "", sector: "", employeeRange: "", sources: [], goals: [] },
  });
  const { register, control, formState, trigger, watch, setValue, handleSubmit } = form;

  const toggle = (field: "sources" | "goals", v: string) => {
    const cur = watch(field);
    setValue(field, cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v], {
      shouldValidate: formState.isSubmitted,
    });
  };

  const next = async () => {
    const ok = step === 0 ? await trigger(["companyName", "sector", "employeeRange"]) : true;
    if (ok) setStep((s) => s + 1);
  };

  const onSubmit = (v: FormValues) => {
    const data: CompanySetup = { ...v, completedAt: new Date().toISOString() };
    localStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(data));
    setOpen(false);
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mb-2 flex gap-1.5">
            {STEPS.map((s, i) => (
              <div key={s} className={cn("h-1 flex-1 rounded-full bg-muted", i <= step && "bg-primary")} />
            ))}
          </div>
          <DialogTitle>
            Adım {step + 1}/3 · {STEPS[step]}
          </DialogTitle>
          <DialogDescription>
            {step === 0 && "Sizi tanıyalım; öneriler şirketinize göre şekillensin."}
            {step === 1 && "Hangi kaynaklardan veri toplamak istersiniz? Sonradan değiştirebilirsiniz."}
            {step === 2 && "Öncelikli hedeflerinizi seçin."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="companyName">Şirket adı</Label>
                <Input id="companyName" placeholder="Örn. Anadolu Teknoloji A.Ş." {...register("companyName")} />
                {formState.errors.companyName && (
                  <p className="text-xs text-destructive">{formState.errors.companyName.message}</p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Sektör</Label>
                  <Controller
                    control={control}
                    name="sector"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                        <SelectContent>
                          {SECTORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {formState.errors.sector && <p className="text-xs text-destructive">{formState.errors.sector.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Çalışan sayısı</Label>
                  <Controller
                    control={control}
                    name="employeeRange"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                        <SelectContent>
                          {RANGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {formState.errors.employeeRange && (
                    <p className="text-xs text-destructive">{formState.errors.employeeRange.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {SOURCES.map((s) => (
                <ToggleCard
                  key={s.id}
                  title={s.label}
                  desc={s.desc}
                  active={watch("sources").includes(s.id)}
                  onClick={() => toggle("sources", s.id)}
                />
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                {GOALS.map((g) => (
                  <ToggleCard key={g} title={g} active={watch("goals").includes(g)} onClick={() => toggle("goals", g)} />
                ))}
              </div>
              {formState.errors.goals && <p className="text-xs text-destructive">{formState.errors.goals.message}</p>}
            </div>
          )}

          <div className="flex justify-between gap-2">
            <Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              Geri
            </Button>
            {step < 2 ? (
              <Button type="button" onClick={next}>Devam</Button>
            ) : (
              <Button type="submit">Kurulumu tamamla</Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
