import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, MoreHorizontal, Search, Send, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  KpiCard,
  PageHeader,
  SkeletonCard,
  StatusBadge,
} from "@/components/common";
import { NewEmployeeSheet } from "@/components/onboarding/NewEmployeeSheet";
import { copyInviteLink } from "@/components/onboarding/ShareLinkActions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cancelInvite, getDepartments, getOnboardingInvites, resendInvite } from "@/services";
import { inviteStatusMeta } from "@/lib/onboarding";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import type { InviteStatus, OnboardingInvite } from "@/types";

export const Route = createFileRoute("/onboarding/")({
  head: () => ({
    meta: [
      { title: "Onboarding · [ÜRÜN ADI]" },
      { name: "description", content: "Yeni çalışan davetleri ve ilerleme durumu." },
      { property: "og:title", content: "Onboarding · [ÜRÜN ADI]" },
      { property: "og:description", content: "Yeni çalışan davetleri ve ilerleme durumu." },
    ],
  }),
  component: OnboardingList,
});

function OnboardingList() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["onboarding"], queryFn: getOnboardingInvites, retry: false });
  const depts = useQuery({ queryKey: ["departments"], queryFn: getDepartments });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"hepsi" | InviteStatus>("hepsi");
  const [dept, setDept] = useState("hepsi");
  const [toCancel, setToCancel] = useState<OnboardingInvite | null>(null);

  const deptName = (id: string) => depts.data?.find((d) => d.id === id)?.name ?? "—";

  const resend = useMutation({
    mutationFn: resendInvite,
    onSuccess: (inv) => {
      copyInviteLink(inv.token);
      toast.success(`${inv.employeeName} için yeni link oluşturuldu`);
      void qc.invalidateQueries({ queryKey: ["onboarding"] });
    },
  });
  const cancel = useMutation({
    mutationFn: cancelInvite,
    onSuccess: () => {
      toast.success("Davet iptal edildi");
      void qc.invalidateQueries({ queryKey: ["onboarding"] });
    },
  });

  const rows = useMemo(() => {
    const s = search.trim().toLocaleLowerCase("tr-TR");
    return (q.data ?? []).filter(
      (r) =>
        (status === "hepsi" || r.status === status) &&
        (dept === "hepsi" || r.departmentId === dept) &&
        (!s ||
          r.employeeName.toLocaleLowerCase("tr-TR").includes(s) ||
          r.title.toLocaleLowerCase("tr-TR").includes(s)),
    );
  }, [q.data, search, status, dept]);

  const all = q.data ?? [];
  const count = (...st: InviteStatus[]) => all.filter((r) => st.includes(r.status)).length;

  let body;
  if (q.isPending) {
    body = (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} lines={1} />)}
        </div>
        <SkeletonCard lines={6} />
      </div>
    );
  } else if (q.isError) {
    body = <ErrorState message={q.error.message} onRetry={() => void q.refetch()} />;
  } else if (all.length === 0) {
    body = (
      <EmptyState
        icon={UserPlus}
        title="Henüz yeni çalışan eklemediniz"
        description="İlk daveti gönderin; çalışan bilgilerini kendi doldursun, siz sadece onaylayın."
        action={<NewEmployeeSheet />}
      />
    );
  } else {
    body = (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Toplam süreç" value={formatNumber(all.length)} icon={Users} />
          <KpiCard
            label="Formda"
            value={formatNumber(count("davet_gonderildi", "form_dolduruluyor"))}
            icon={Send}
          />
          <KpiCard
            label="Aksiyon bekleyen"
            value={formatNumber(count("onay_bekliyor", "duzeltme_istendi"))}
            icon={Clock}
          />
          <KpiCard label="Tamamlanan" value={formatNumber(count("tamamlandi"))} icon={CheckCircle2} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Ad veya pozisyon ara"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hepsi">Tüm durumlar</SelectItem>
              {Object.entries(inviteStatusMeta).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hepsi">Tüm departmanlar</SelectItem>
              {depts.data?.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={Search} title="Sonuç bulunamadı" description="Filtreleri değiştirip tekrar deneyin." />
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad soyad</TableHead>
                  <TableHead>Pozisyon</TableHead>
                  <TableHead>Departman</TableHead>
                  <TableHead>Başlangıç</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="min-w-32">İlerleme</TableHead>
                  <TableHead>Son işlem</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const last = r.activity.at(-1);
                  const meta = inviteStatusMeta[r.status];
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        <Link to="/onboarding/$id" params={{ id: r.id }} className="hover:underline">
                          {r.employeeName}
                        </Link>
                        <div className="text-xs font-normal text-muted-foreground">{r.email}</div>
                      </TableCell>
                      <TableCell>{r.title}</TableCell>
                      <TableCell>{deptName(r.departmentId)}</TableCell>
                      <TableCell className="tabular-nums">{formatDate(r.startDate)}</TableCell>
                      <TableCell><StatusBadge tone={meta.tone}>{meta.label}</StatusBadge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={r.progress} className="h-1.5" />
                          <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
                            %{r.progress}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {last ? (
                          <>
                            <div className="text-foreground">{last.label}</div>
                            {formatDateTime(last.at)}
                          </>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="İşlemler">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to="/onboarding/$id" params={{ id: r.id }}>Detayı aç</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={r.status === "tamamlandi"}
                              onSelect={() => resend.mutate(r.id)}
                            >
                              Linki tekrar gönder
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              disabled={r.status === "tamamlandi"}
                              onSelect={() => setToCancel(r)}
                            >
                              Daveti iptal et
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Onboarding"
        description="Yeni çalışan davetlerini gönderin, formları inceleyin ve onaylayın."
        actions={all.length > 0 ? <NewEmployeeSheet /> : undefined}
      />
      {body}
      <ConfirmDialog
        open={!!toCancel}
        onOpenChange={(o) => !o && setToCancel(null)}
        title="Daveti iptal et"
        description={
          toCancel
            ? `${toCancel.employeeName} için gönderilen link geçersiz olacak ve kayıt listeden kaldırılacak.`
            : undefined
        }
        confirmLabel="İptal et"
        destructive
        onConfirm={() => {
          if (toCancel) cancel.mutate(toCancel.id);
          setToCancel(null);
        }}
      />
    </div>
  );
}
