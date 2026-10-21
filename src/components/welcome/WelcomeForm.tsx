import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, History, Loader2, Pencil, Send, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SensitiveField } from "@/components/common";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { formatIban, maskTRPhone } from "@/lib/validators";
import { submitOnboardingForm } from "@/services";
import type { CompanyProfile, OnboardingDocument, OnboardingInvite } from "@/types";
import { DocumentUpload } from "./DocumentUpload";
import {
  DOC_SLOTS,
  STEPS,
  draftKey,
  emptyValues,
  fromDetails,
  toDetails,
  welcomeSchema,
  type DocSlotId,
  type StepId,
  type WelcomeDraft,
  type WelcomeValues,
} from "./schema";
import { ThankYouScreen } from "./StatusScreens";

type Docs = Partial<Record<DocSlotId, OnboardingDocument>>;

const controlCls =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-base shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-[invalid=true]:border-destructive disabled:opacity-60 md:text-sm";

function F({
  name,
  label,
  hint,
  className,
  error,
  children,
}: {
  name: keyof WelcomeValues;
  label: string;
  hint?: string;
  className?: string;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={`f-${name}`}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p id={`f-${name}-err`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function NativeSelect({
  options,
  reg,
  a11y,
}: {
  options: string[];
  reg: { value: string; onChange: (v: string) => void; onBlur: () => void };
  a11y: Record<string, unknown>;
}) {
  return (
    <select
      {...a11y}
      value={reg.value}
      onChange={(e) => reg.onChange(e.target.value)}
      onBlur={reg.onBlur}
      className={controlCls}
    >
      <option value="">Seç</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function WelcomeForm({ invite, company }: { invite: OnboardingInvite; company: CompanyProfile }) {
  const qc = useQueryClient();
  const isCorrection = invite.status === "duzeltme_istendi";
  const targets = useMemo(() => new Set(invite.correction?.targets ?? []), [invite.correction]);

  // Düzeltme modunda yalnızca İK'nın işaretlediği bölümler / belgeler düzenlenebilir.
  const flaggedDocSlots = useMemo(() => {
    const s = new Set<DocSlotId>();
    invite.documents.forEach((d) => {
      if (targets.has(d.name)) s.add(d.id as DocSlotId);
    });
    return s;
  }, [invite.documents, targets]);

  const editable = useMemo(() => {
    const set = new Set<StepId>();
    STEPS.forEach((s) => {
      if (s.id === "ozet") return;
      if (!isCorrection) set.add(s.id);
      else if (s.hrLabel && targets.has(s.hrLabel)) set.add(s.id);
      else if (s.id === "belgeler" && flaggedDocSlots.size > 0) set.add(s.id);
    });
    return set;
  }, [isCorrection, targets, flaggedDocSlots]);

  const steps = useMemo(() => STEPS.filter((s) => s.id === "ozet" || editable.has(s.id)), [editable]);

  const initialDocs = useMemo<Docs>(() => {
    if (!isCorrection) return {};
    const out: Docs = {};
    invite.documents.forEach((d) => {
      if (!flaggedDocSlots.has(d.id as DocSlotId)) out[d.id as DocSlotId] = d;
    });
    return out;
  }, [isCorrection, invite.documents, flaggedDocSlots]);

  const base = emptyValues(invite.employeeName, invite.email);
  const form = useForm<WelcomeValues>({
    resolver: zodResolver(welcomeSchema),
    mode: "onTouched",
    defaultValues: invite.details ? fromDetails(invite.details, base) : base,
  });
  const { register, formState, getValues, setValue, watch, trigger } = form;
  const errors = formState.errors;

  const [stepIndex, setStepIndex] = useState(0);
  const [docs, setDocs] = useState<Docs>(initialDocs);
  const [previews, setPreviews] = useState<Partial<Record<DocSlotId, string>>>({});
  const [docErrors, setDocErrors] = useState<Partial<Record<DocSlotId, string>>>({});
  const [resumed, setResumed] = useState(false);
  const [kvkkOpen, setKvkkOpen] = useState(false);
  const [done, setDone] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const step = steps[stepIndex] ?? steps[0]!;
  const gender = watch("gender");

  // Taslağı yükle
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey(invite.token));
      if (!raw) return;
      const draft = JSON.parse(raw) as WelcomeDraft;
      form.reset({ ...form.getValues(), ...draft.values, kvkk: false });
      setDocs((d) => ({ ...d, ...draft.docs }));
      setStepIndex(Math.min(draft.stepIndex, steps.length - 1));
      setResumed(true);
    } catch {
      /* bozuk taslak yok sayılır */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invite.token]);

  // Adım değişiminde başlığa odaklan (ekran okuyucular için)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stepIndex]);

  const saveDraft = (nextIndex: number, nextDocs = docs) => {
    const { kvkk: _k, ...values } = getValues();
    const draft: WelcomeDraft = { values: { ...values, kvkk: false }, stepIndex: nextIndex, docs: nextDocs };
    localStorage.setItem(draftKey(invite.token), JSON.stringify(draft));
  };

  const goTo = (i: number) => {
    saveDraft(i);
    setStepIndex(i);
  };

  const validateDocs = () => {
    const errs: Partial<Record<DocSlotId, string>> = {};
    DOC_SLOTS.forEach((s) => {
      if (!docs[s.id]) errs[s.id] = "Bu belge zorunlu";
    });
    setDocErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = async () => {
    console.log("NEXT start", step.id);
    const ok = step.id === "belgeler" ? validateDocs() : await trigger(step.fields, { shouldFocus: true });
    console.log("NEXT", ok, Object.keys(form.formState.errors).join(","));
    if (ok) goTo(stepIndex + 1);
  };

  const submit = useMutation({
    mutationFn: () =>
      submitOnboardingForm(invite.token, {
        details: toDetails(getValues(), invite.details),
        documents: Object.values(docs).filter((d): d is OnboardingDocument => !!d),
      }),
    onSuccess: () => {
      localStorage.removeItem(draftKey(invite.token));
      void qc.invalidateQueries({ queryKey: ["onboarding"] });
      setDone(true);
      window.scrollTo({ top: 0 });
    },
    onError: (e) => toast.error(e.message),
  });

  const onSubmit = async () => {
    for (const s of steps) {
      if (s.id === "ozet") continue;
      const ok = s.id === "belgeler" ? validateDocs() : await trigger(s.fields);
      if (!ok) {
        toast.error(`"${s.title}" adımında eksik veya hatalı bilgi var.`);
        goTo(steps.indexOf(s));
        return;
      }
    }
    if (!getValues("kvkk")) {
      form.setError("kvkk", { message: "Devam etmek için aydınlatma metnini onaylaman gerekiyor" });
      return;
    }
    submit.mutate();
  };

  if (done) return <ThankYouScreen name={invite.employeeName.split(" ")[0] ?? ""} />;

  const field = (name: keyof WelcomeValues) => ({
    id: `f-${name}`,
    "aria-invalid": !!errors[name],
    "aria-describedby": errors[name] ? `f-${name}-err` : undefined,
    "aria-required": name !== "military" ? true : undefined,
  });

  const sel = (name: keyof WelcomeValues) => ({
    value: (watch(name) as string | undefined) ?? "",
    onChange: (val: string) => setValue(name, val, { shouldValidate: !!errors[name], shouldDirty: true }),
    onBlur: () => void (errors[name] && trigger(name)),
  });

  const phoneReg = (name: "phone" | "emergencyPhone") => {
    const r = register(name);
    return {
      ...r,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        e.target.value = maskTRPhone(e.target.value);
        return r.onChange(e);
      },
    };
  };

  const v = watch();

  return (
    <div className="space-y-5">
      {isCorrection && invite.correction && (
        <div role="note" className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
          <div>
            <div className="font-medium">İK ekibi bazı düzeltmeler istedi</div>
            <p className="mt-1 text-muted-foreground">“{invite.correction.note}”</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Yalnızca işaretlenen bölümleri düzenleyebilirsin: {invite.correction.targets.join(", ")}
            </p>
          </div>
        </div>
      )}
      {resumed && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
          <History className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          Kaldığın yerden devam ediyorsun.
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Adım {stepIndex + 1} / {steps.length}
          </span>
          <span>%{Math.round(((stepIndex + 1) / steps.length) * 100)}</span>
        </div>
        <Progress
          value={((stepIndex + 1) / steps.length) * 100}
          className="h-2"
          aria-label={`İlerleme: adım ${stepIndex + 1} / ${steps.length}`}
        />
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (step.id === "ozet") void onSubmit();
          else void next();
        }}
        className="rounded-2xl border bg-card p-4 shadow-card sm:p-6"
      >
        <h2 ref={headingRef} tabIndex={-1} className="mb-5 text-lg font-semibold outline-none">
          {step.title}
        </h2>

        {step.id === "kisisel" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <F name="fullName" error={errors.fullName?.message} label="Ad soyad" className="sm:col-span-2">
              <Input className="h-11 text-base md:text-sm" autoComplete="name" {...field("fullName")} {...register("fullName")} />
            </F>
            <F name="tckn" error={errors.tckn?.message} label="TC kimlik no">
              <Input className="h-11 text-base md:text-sm" inputMode="numeric" maxLength={11} autoComplete="off" {...field("tckn")} {...register("tckn")} />
            </F>
            <F name="birthDate" error={errors.birthDate?.message} label="Doğum tarihi">
              <Input type="date" className="h-11 text-base md:text-sm" autoComplete="bday" {...field("birthDate")} {...register("birthDate")} />
            </F>
            <F name="birthPlace" error={errors.birthPlace?.message} label="Doğum yeri">
              <Input className="h-11 text-base md:text-sm" {...field("birthPlace")} {...register("birthPlace")} />
            </F>
            <F name="nationality" error={errors.nationality?.message} label="Uyruk">
              <Input className="h-11 text-base md:text-sm" {...field("nationality")} {...register("nationality")} />
            </F>
            <F name="motherName" error={errors.motherName?.message} label="Anne adı">
              <Input className="h-11 text-base md:text-sm" {...field("motherName")} {...register("motherName")} />
            </F>
            <F name="fatherName" error={errors.fatherName?.message} label="Baba adı">
              <Input className="h-11 text-base md:text-sm" {...field("fatherName")} {...register("fatherName")} />
            </F>
            <F name="maritalStatus" error={errors.maritalStatus?.message} label="Medeni hal">
              <NativeSelect a11y={field("maritalStatus")} options={["Bekâr", "Evli", "Boşanmış", "Dul"]} reg={sel("maritalStatus")} />
            </F>
            <F name="gender" error={errors.gender?.message} label="Cinsiyet">
              <NativeSelect a11y={field("gender")} options={["Kadın", "Erkek", "Belirtmek istemiyorum"]} reg={sel("gender")} />
            </F>
          </div>
        )}

        {step.id === "iletisim" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <F name="phone" error={errors.phone?.message} label="Cep telefonu">
              <Input type="tel" inputMode="tel" autoComplete="tel" placeholder="+90 5XX XXX XX XX" className="h-11 text-base md:text-sm" {...field("phone")} {...phoneReg("phone")} />
            </F>
            <F name="email" error={errors.email?.message} label="E-posta">
              <Input type="email" autoComplete="email" className="h-11 text-base md:text-sm" {...field("email")} {...register("email")} />
            </F>
            <F name="city" error={errors.city?.message} label="İl">
              <Input autoComplete="address-level1" className="h-11 text-base md:text-sm" {...field("city")} {...register("city")} />
            </F>
            <F name="district" error={errors.district?.message} label="İlçe">
              <Input autoComplete="address-level2" className="h-11 text-base md:text-sm" {...field("district")} {...register("district")} />
            </F>
            <F name="neighborhood" error={errors.neighborhood?.message} label="Mahalle" className="sm:col-span-2">
              <Input className="h-11 text-base md:text-sm" {...field("neighborhood")} {...register("neighborhood")} />
            </F>
            <F name="address" error={errors.address?.message} label="Açık adres" className="sm:col-span-2">
              <textarea rows={3} autoComplete="street-address" className={cn(controlCls, "h-auto py-2")} {...field("address")} {...register("address")} />
            </F>
          </div>
        )}

        {step.id === "egitim" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <F name="educationLevel" error={errors.educationLevel?.message} label="Öğrenim durumu">
              <NativeSelect a11y={field("educationLevel")} options={["İlkokul", "Ortaokul", "Lise", "Ön lisans", "Lisans", "Yüksek lisans", "Doktora"]} reg={sel("educationLevel")} />
            </F>
            <F name="graduationYear" error={errors.graduationYear?.message} label="Mezuniyet yılı">
              <Input inputMode="numeric" maxLength={4} className="h-11 text-base md:text-sm" {...field("graduationYear")} {...register("graduationYear")} />
            </F>
            <F name="school" error={errors.school?.message} label="Okul / bölüm" className="sm:col-span-2">
              <Input className="h-11 text-base md:text-sm" {...field("school")} {...register("school")} />
            </F>
            <F name="previouslyInsured" error={errors.previouslyInsured?.message} label="Daha önce sigortalı (SGK) çalıştın mı?" className="sm:col-span-2">
              <NativeSelect a11y={field("previouslyInsured")} options={["Evet", "Hayır"]} reg={sel("previouslyInsured")} />
            </F>
            {gender === "Erkek" && (
              <F name="military" error={errors.military?.message} label="Askerlik durumu" className="sm:col-span-2">
                <NativeSelect a11y={field("military")} options={["Yapıldı", "Tecilli", "Muaf"]} reg={sel("military")} />
              </F>
            )}
          </div>
        )}

        {step.id === "banka" && (
          <F name="iban" error={errors.iban?.message} label="IBAN" hint="Maaşının yatırılacağı, adına kayıtlı hesabın IBAN'ı.">
            <Input
              autoComplete="off"
              placeholder="TR00 0000 0000 0000 0000 0000 00"
              className="h-11 font-mono text-base uppercase md:text-sm"
              maxLength={32}
              {...field("iban")}
              {...register("iban", {
                onBlur: (e: React.FocusEvent<HTMLInputElement>) =>
                  setValue("iban", formatIban(e.target.value), { shouldValidate: true }),
              })}
            />
          </F>
        )}

        {step.id === "acil" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <F name="emergencyName" error={errors.emergencyName?.message} label="Ad soyad" className="sm:col-span-2">
              <Input className="h-11 text-base md:text-sm" {...field("emergencyName")} {...register("emergencyName")} />
            </F>
            <F name="emergencyRelation" error={errors.emergencyRelation?.message} label="Yakınlık">
              <Input placeholder="Örn. Anne, Eş" className="h-11 text-base md:text-sm" {...field("emergencyRelation")} {...register("emergencyRelation")} />
            </F>
            <F name="emergencyPhone" error={errors.emergencyPhone?.message} label="Telefon">
              <Input type="tel" inputMode="tel" placeholder="+90 5XX XXX XX XX" className="h-11 text-base md:text-sm" {...field("emergencyPhone")} {...phoneReg("emergencyPhone")} />
            </F>
          </div>
        )}

        {step.id === "belgeler" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {DOC_SLOTS.map((s) => (
              <DocumentUpload
                key={s.id}
                slotId={s.id}
                label={s.label}
                value={docs[s.id]}
                preview={previews[s.id]}
                flagged={flaggedDocSlots.has(s.id)}
                locked={isCorrection && !flaggedDocSlots.has(s.id)}
                error={docErrors[s.id]}
                onChange={(doc, url) => {
                  const nextDocs = { ...docs, [s.id]: doc };
                  setDocs(nextDocs);
                  setPreviews((p) => ({ ...p, [s.id]: url }));
                  setDocErrors((e) => ({ ...e, [s.id]: undefined }));
                  saveDraft(stepIndex, nextDocs);
                }}
              />
            ))}
          </div>
        )}

        {step.id === "ozet" && (
          <div className="space-y-4">
            {(
              [
                ["kisisel", [
                  ["Ad soyad", v.fullName], ["TC kimlik no", <SensitiveField key="t" value={v.tckn} />],
                  ["Doğum tarihi", v.birthDate ? formatDate(v.birthDate) : "—"], ["Doğum yeri", v.birthPlace],
                  ["Anne / baba adı", `${v.motherName} / ${v.fatherName}`], ["Medeni hal", v.maritalStatus],
                  ["Cinsiyet", v.gender], ["Uyruk", v.nationality],
                ]],
                ["iletisim", [
                  ["Telefon", v.phone], ["E-posta", v.email],
                  ["Adres", `${v.neighborhood} Mah., ${v.address}, ${v.district} / ${v.city}`],
                ]],
                ["egitim", [
                  ["Öğrenim", v.educationLevel], ["Okul / bölüm", v.school], ["Mezuniyet", v.graduationYear],
                  ["Önceki SGK", v.previouslyInsured],
                  ...(v.gender === "Erkek" ? [["Askerlik", v.military ?? "—"] as [string, ReactNode]] : []),
                ]],
                ["banka", [["IBAN", <SensitiveField key="i" value={formatIban(v.iban)} />]]],
                ["acil", [["Ad soyad", v.emergencyName], ["Yakınlık", v.emergencyRelation], ["Telefon", v.emergencyPhone]]],
                ["belgeler", DOC_SLOTS.map((s) => [s.label, docs[s.id]?.name ?? "Yüklenmedi"])],
              ] as [StepId, [string, ReactNode][]][]
            ).map(([id, rows]) => {
              const meta = STEPS.find((s) => s.id === id)!;
              const idx = steps.findIndex((s) => s.id === id);
              return (
                <section key={id} className="rounded-xl border p-3" aria-labelledby={`sum-${id}`}>
                  <div className="mb-1 flex items-center justify-between">
                    <h3 id={`sum-${id}`} className="text-sm font-medium">{meta.title}</h3>
                    {idx >= 0 && (
                      <Button type="button" variant="ghost" size="sm" className="min-h-11" onClick={() => goTo(idx)} aria-label={`${meta.title} bölümünü düzenle`}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden /> Düzenle
                      </Button>
                    )}
                  </div>
                  <dl className="divide-y text-sm">
                    {rows.map(([k, val]) => (
                      <div key={k} className="grid grid-cols-[7.5rem_1fr] gap-2 py-1.5">
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="min-w-0 break-words">{val || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              );
            })}

            <div className="space-y-1.5 rounded-xl bg-muted/50 p-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="f-kvkk"
                  className="mt-0.5 size-5"
                  checked={v.kvkk}
                  aria-invalid={!!errors.kvkk}
                  aria-describedby={errors.kvkk ? "f-kvkk-err" : undefined}
                  aria-required
                  onCheckedChange={(c) => {
                    setValue("kvkk", c === true);
                    if (c) form.clearErrors("kvkk");
                  }}
                />
                <Label htmlFor="f-kvkk" className="block text-sm font-normal leading-relaxed">
                  <button type="button" className="font-medium text-primary underline underline-offset-2" onClick={() => setKvkkOpen(true)}>
                    KVKK aydınlatma metnini
                  </button>{" "}
                  okudum; kişisel verilerimin işe giriş süreci kapsamında işlenmesini onaylıyorum.
                </Label>
              </div>
              {errors.kvkk && (
                <p id="f-kvkk-err" role="alert" className="pl-8 text-xs text-destructive">
                  {errors.kvkk.message}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1"
            disabled={stepIndex === 0}
            onClick={() => goTo(stepIndex - 1)}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Geri
          </Button>
          {step.id === "ozet" ? (
            <Button type="submit" className="h-11 flex-1" disabled={submit.isPending}>
              {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
              Gönder
            </Button>
          ) : (
            <Button type="submit" className="h-11 flex-1">
              İleri <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          )}
        </div>
      </form>

      <Dialog open={kvkkOpen} onOpenChange={setKvkkOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KVKK Aydınlatma Metni</DialogTitle>
            <DialogDescription>{company.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca, {company.name} olarak veri sorumlusu
              sıfatıyla; kimlik, iletişim, eğitim, banka ve acil durum bilgilerin ile yüklediğin belgeleri iş
              sözleşmesinin kurulması, SGK işe giriş bildirgesi, bordro ve özlük dosyası süreçlerinin yürütülmesi
              amacıyla işliyoruz.
            </p>
            <p>
              Verilerin yalnızca yasal yükümlülükler kapsamında yetkili kamu kurumlarıyla ve hizmet aldığımız
              tedarikçilerle paylaşılır. Kanun'un 11. maddesindeki haklarını kullanmak için {company.kvkkContact}{" "}
              adresine başvurabilirsin.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
