import { useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  FileText,
  ImageIcon,
  Loader2,
  PenLine,
  UserX,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  SensitiveField,
  SkeletonCard,
  StatusBadge,
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CorrectionDialog } from "@/components/onboarding/CorrectionDialog";
import { TransferPanel } from "@/components/onboarding/TransferPanel";
import {
  approveOnboarding,
  getDepartments,
  getOnboardingInvite,
  requestCorrection,
  setDocumentStatus,
} from "@/services";
import { inviteStatusMeta, reviewStatusMeta } from "@/lib/onboarding";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import type { OnboardingInvite, ReviewStatus } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding/$id")({
  head: () => ({
    meta: [
      { title: "Onboarding Kaydı · [ÜRÜN ADI]" },
      { name: "description", content: "Yeni çalışanın bilgilerini, belgelerini ve onay sürecini inceleyin." },
      { property: "og:title", content: "Onboarding Kaydı · [ÜRÜN ADI]" },
      { property: "og:description", content: "Yeni çalışanın bilgilerini, belgelerini ve onay sürecini inceleyin." },
    ],
  }),
  component: Detail,
});

const SECTIONS = ["Kişisel", "İletişim", "Eğitim/Çalışma", "Banka", "Acil Durum"];

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-2 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

function Section({ title, flagged, children }: { title: string; flagged: boolean; children: ReactNode }) {
  return (
    <section className={cn("rounded-xl border bg-card p-4 shadow-card", flagged && "border-destructive/40")}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        {flagged && <StatusBadge tone="kritik">Düzeltme istendi</StatusBadge>}
      </div>
      <dl className="divide-y">{children}</dl>
    </section>
  );
}

function Detail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["onboarding", id], queryFn: () => getOnboardingInvite(id), retry: false });
  const depts = useQuery({ queryKey: ["departments"], queryFn: getDepartments });
  const [approveOpen, setApproveOpen] = useState(false);
  const [corrOpen, setCorrOpen] = useState(false);

  const update = (rec: OnboardingInvite) => {
    qc.setQueryData(["onboarding", id], rec);
    void qc.invalidateQueries({ queryKey: ["onboarding"], exact: true });
  };

  const approve = useMutation({
    mutationFn: () => approveOnboarding(id),
    onSuccess: (r) => {
      update(r);
      toast.success("Kayıt onaylandı");
    },
    onError: (e) => toast.error(e.message),
  });
  const correction = useMutation({
    mutationFn: (v: { targets: string[]; note: string }) => requestCorrection(id, v),
    onSuccess: (r) => {
      update(r);
      setCorrOpen(false);
      toast.success("Düzeltme talebi çalışana iletildi");
    },
    onError: (e) => toast.error(e.message),
  });
  const docMut = useMutation({
    mutationFn: (v: { docId: string; status: ReviewStatus }) => setDocumentStatus(id, v.docId, v.status),
    onSuccess: update,
    onError: (e) => toast.error(e.message),
  });

  const back = (
    <Link to="/onboarding" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" /> Onboarding
    </Link>
  );

  if (q.isPending)
    return (
      <div>
        {back}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2"><SkeletonCard lines={5} /><SkeletonCard lines={4} /></div>
          <SkeletonCard lines={6} />
        </div>
      </div>
    );
  if (q.isError) return <div>{back}<ErrorState message={q.error.message} onRetry={() => void q.refetch()} /></div>;
  const r = q.data;
  if (!r)
    return (
      <div>
        {back}
        <EmptyState icon={UserX} title="Kayıt bulunamadı" description="Bu davet iptal edilmiş veya silinmiş olabilir." />
      </div>
    );

  const meta = inviteStatusMeta[r.status];
  const d = r.details;
  const flagged = new Set(r.correction?.targets ?? []);
  const done = r.status === "tamamlandi";
  const canReview = !!d && !done;
  const deptName = depts.data?.find((x) => x.id === r.departmentId)?.name ?? "—";

  return (
    <div className="space-y-6">
      <div>
        {back}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{r.employeeName}</h1>
              <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {r.title} · {deptName} · Başlangıç {formatDate(r.startDate)}
            </p>
            <div className="mt-3 flex max-w-xs items-center gap-2">
              <Progress value={r.progress} className="h-1.5" />
              <span className="text-xs tabular-nums text-muted-foreground">%{r.progress}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={!canReview} onClick={() => setCorrOpen(true)}>
              <PenLine className="h-4 w-4" /> Düzeltme İste
            </Button>
            <Button disabled={!canReview || approve.isPending} onClick={() => setApproveOpen(true)}>
              {approve.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Onayla
            </Button>
          </div>
        </div>
        {r.correction && r.status === "duzeltme_istendi" && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <span className="font-medium">Düzeltme notu:</span> {r.correction.note}
          </div>
        )}
      </div>

      {done && r.transfers && (
        <TransferPanel recordId={r.id} slug={r.employeeName.toLocaleLowerCase("tr-TR").replace(/\s+/g, "-")} items={r.transfers} />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {!d ? (
            <EmptyState title="Form henüz doldurulmadı" description="Çalışan formu gönderdiğinde bilgiler burada görünecek." />
          ) : (
            <>
              <Section title="Kişisel" flagged={flagged.has("Kişisel")}>
                <Row label="Ad soyad">{r.employeeName}</Row>
                <Row label="TC kimlik no"><SensitiveField value={d.personal.tckn} /></Row>
                <Row label="Doğum tarihi">{formatDate(d.personal.birthDate)}</Row>
                <Row label="Doğum yeri">{d.personal.birthPlace}</Row>
                <Row label="Cinsiyet">{d.personal.gender}</Row>
                <Row label="Medeni durum">{d.personal.maritalStatus}</Row>
                <Row label="Anne / baba adı">{d.personal.motherName ?? "—"} / {d.personal.fatherName ?? "—"}</Row>
                <Row label="Uyruk">{d.personal.nationality ?? "—"}</Row>
              </Section>
              <Section title="İletişim" flagged={flagged.has("İletişim")}>
                <Row label="Telefon">{d.contact.phone}</Row>
                <Row label="E-posta">{d.contact.email}</Row>
                <Row label="Adres">{d.contact.address}</Row>
                <Row label="İl / ilçe">{d.contact.city}{d.contact.district ? ` / ${d.contact.district}` : ""}</Row>
                {d.contact.neighborhood && <Row label="Mahalle">{d.contact.neighborhood}</Row>}
              </Section>
              <Section title="Eğitim / Çalışma" flagged={flagged.has("Eğitim/Çalışma")}>
                <Row label="Okul">{d.education.school}</Row>
                <Row label="Bölüm / derece">{d.education.degree}</Row>
                <Row label="Mezuniyet">{d.education.graduationYear}</Row>
                {d.education.previousEmployer && <Row label="Önceki işveren">{d.education.previousEmployer}</Row>}
                {d.education.previouslyInsured && <Row label="Önceki SGK">{d.education.previouslyInsured}</Row>}
                {d.education.military && <Row label="Askerlik">{d.education.military}</Row>}
              </Section>
              <Section title="Banka" flagged={flagged.has("Banka")}>
                {d.bank.bankName && <Row label="Banka">{d.bank.bankName}</Row>}
                <Row label="IBAN"><SensitiveField value={d.bank.iban} /></Row>
              </Section>
              <Section title="Acil Durum" flagged={flagged.has("Acil Durum")}>
                <Row label="Kişi">{d.emergency.name}</Row>
                <Row label="Yakınlık">{d.emergency.relation}</Row>
                <Row label="Telefon">{d.emergency.phone}</Row>
              </Section>
            </>
          )}
        </div>

        <aside className="space-y-3">
          <h2 className="font-medium">Belgeler</h2>
          {r.documents.length === 0 ? (
            <EmptyState icon={FileText} title="Belge yüklenmedi" />
          ) : (
            r.documents.map((doc) => {
              const dm = reviewStatusMeta[doc.status];
              const Icon = doc.kind === "pdf" ? FileText : ImageIcon;
              const busy = docMut.isPending && docMut.variables?.docId === doc.id;
              return (
                <div key={doc.id} className={cn("overflow-hidden rounded-xl border bg-card shadow-card", flagged.has(doc.name) && "border-destructive/40")}>
                  <div className="flex h-24 items-center justify-center bg-muted">
                    <Icon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{doc.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {doc.kind === "pdf" ? "PDF" : "Görsel"} · {formatNumber(doc.sizeKb)} KB
                        </div>
                      </div>
                      <StatusBadge tone={dm.tone}>{dm.label}</StatusBadge>
                    </div>
                    {!done && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          disabled={busy || doc.status === "onaylandi"}
                          onClick={() => docMut.mutate({ docId: doc.id, status: "onaylandi" })}
                        >
                          <Check className="h-3.5 w-3.5" /> Onayla
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          disabled={busy || doc.status === "reddedildi"}
                          onClick={() => docMut.mutate({ docId: doc.id, status: "reddedildi" })}
                        >
                          <X className="h-3.5 w-3.5" /> Reddet
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </aside>
      </div>

      <section className="rounded-xl border bg-card p-4 shadow-card md:p-5">
        <h2 className="mb-4 font-medium">Aktivite geçmişi</h2>
        <ol className="relative ml-2 space-y-5 border-l pl-5">
          {[...r.activity].reverse().map((a) => (
            <li key={a.id} className="relative">
              <span
                className={cn(
                  "absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full border-2 border-card bg-muted-foreground",
                  a.type === "onaylandi" && "bg-success",
                  a.type === "duzeltme_istendi" && "bg-destructive",
                  a.type === "belge_reddedildi" && "bg-destructive",
                  a.type === "davet_gonderildi" && "bg-primary",
                )}
              />
              <div className="text-sm font-medium">{a.label}</div>
              <div className="text-xs text-muted-foreground">{formatDateTime(a.at)}</div>
              {a.note && <p className="mt-1 text-sm text-muted-foreground">“{a.note}”</p>}
            </li>
          ))}
        </ol>
      </section>

      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Kaydı onayla"
        description="Tüm belgeler onaylanacak ve veriler SGK, bordro ve özlük süreçleri için hazırlanacak."
        confirmLabel="Onayla"
        onConfirm={() => approve.mutate()}
      />
      <CorrectionDialog
        open={corrOpen}
        onOpenChange={setCorrOpen}
        sections={SECTIONS}
        documents={r.documents.map((x) => x.name)}
        pending={correction.isPending}
        onSubmit={(v) => correction.mutate(v)}
      />
    </div>
  );
}
